import AppError from '../utils/appError.js';
import TourServices from '../DAO/tour.DAO.js';
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
        success_url: `${req.protocol}://${req.get('host')}/`,
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
                  `https://www.natours.dev/img/tours/${tour.imageCover}.jpg`,
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
    } catch (err) {
      new AppError(err.message, 500);
    }
  }
}
