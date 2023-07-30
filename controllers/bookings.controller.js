import AppError from '../utils/appError.js';
import TourServices from '../DAO/tour.DAO.js';
import UserServices from '../DAO/user.DAO.js';
import BookingServices from '../DAO/booking.DAO.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default class BookingsController {
  static async getCheckoutSession(req, res, next) {
    try {
      // 1) Get booked tour
      const tour = await TourServices.findOneTourById(req.params.tourId);

      if (!tour) {
        return next(new AppError('No tour found.', 404));
      }

      // 2) Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],

        // FIXME Temp solution, not secure, may call URL without checkout
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${
        //   req.params.tourId
        // }&user=${req.user.id}&price=${tour.price}`,

        // NOTE FIXED BUG DESCRIBED ABOVE
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, // to create booking in DB
        // details about product
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: tour.price * 100, // in cents
              product_data: {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [
                  `https://www.natours.dev/img/tours/${tour.imageCover}`,
                ], // must use live images hosted online
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
      });

      // 3) Create session as response
      res.status(200).json({ status: 'success', session });
      // res.redirect(303, session.url);
    } catch (err) {
      new AppError(err.message, 500);
    }
  }

  // static async createBookingCheckout(req, res, next) {
  //   try {
  //     // REMEMBER THIS IS TEMPORARY, UNSECURE, ONE CAN MAKE BOOKINGS WITHOUT PAYING. FIX WITH WEB HOOKS
  //     const { tour, user, price } = req.query;

  //     // NEXT() WILL LOAD HOME PAGE SO IT NEEDS TO BE CALLED FROM VIEWS ROUTE
  //     if (!tour && !user && !price) {
  //       return next();
  //     }

  //     await BookingServices.create({ tour, user, price });
  //     // next(); not ideal as it exposes a lot of datain query from temporary SUCCESS URL
  //     // or use `${req.protocol}://${req.get('host')}/?tour=${req.params.tourid}&user=${req.userId}&price=${tour.price}`
  //     res.redirect(req.originalUrl.split('?')[0]);
  //   } catch (err) {
  //     // new AppError(err.message, 500);
  //     console.error(err);
  //   }
  // }

  static async find(req, res, next) {
    try {
      let bookings;

      if (req.params.id) {
        bookings = await BookingServices.find({ _id: req.params.id });

        if (!bookings) {
          return next(new AppError('No Booking found with that ID', 404));
        }

        return res
          .status(200)
          .json({ status: 'success', data: { data: bookings } });
      }

      bookings = await BookingServices.find();
      res.status(200).json({ status: 'success', data: { data: bookings } });
    } catch (err) {
      new AppError(err.message, 500);
    }
  }

  static async create(req, res, next) {
    try {
      const booking = await BookingServices.create(req.body);

      return res
        .status(201)
        .json({ status: 'success', data: { data: booking } });
    } catch (err) {
      new AppError(err.message, 500);
    }
  }

  static async updateOne(req, res, next) {
    try {
      const booking = await BookingServices.findOneAndUpdate(
        req.params.id,
        req.body
      );

      if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
      }

      return res.status(200).json({
        status: 'success',
        data: {
          data: booking,
        },
      });
    } catch (err) {
      new AppError(err.message, 500);
    }
  }

  static async deleteOne(req, res, next) {
    try {
      const booking = await BookingServices.findByIdAndDelete(req.params.id);

      if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async webhookCheckout(req, res, next) {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === 'checkout.session.completed') {
        console.log(event.data.object);
        await this.createBookingCheckout(event.data.object);
      }
      res.status(200).json({ received: true });
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
  }

  // Not a middleware
  static async createBookingCheckout(session) {
    const tour = session.client_reference_id;
    const price = session.amount_total / 100;
    try {
      // return id
      const user = (
        await UserServices.findOneUser(session.customer_email, false)
      ).id;
      await BookingServices.create({ tour, user, price });
    } catch (err) {
      // console.error(err);
      return new AppError(err.message, 500);
    }
  }
}
