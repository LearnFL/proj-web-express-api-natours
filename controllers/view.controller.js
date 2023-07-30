import AppError from '../utils/appError.js';
import TourServices from '../DAO/tour.DAO.js';
import UserServices from '../DAO/user.DAO.js';
import BookingServices from '../DAO/booking.DAO.js';
import { async } from 'regenerator-runtime';
import BookingsController from './bookings.controller.js';

export default class ViewController {
  static async getOverview(req, res, next) {
    // Get tour data
    const tours = await TourServices.findAllTours(req);

    // Build templated
    // Render
    res.status(200).render('overview', { title: 'All tours', tours });
  }

  static async getTour(req, res, next) {
    const tour = await TourServices.getTour({ slug: req.params.slug });

    if (!tour) {
      return next(new AppError('There is no tour with that name.', 404));
    }

    res.status(200).render('tour', { title: `${tour.name}`, tour });
  }

  static async getLoginForm(req, res, next) {
    res.status(200).render('login', { title: 'Log into your account' });
  }

  static async getSignUpForm(req, res, next) {
    res.status(200).render('signup', { title: 'Sign Up' });
  }

  static getAccount(req, res) {
    res.status(200).render('account', { title: 'Your account' });
  }

  // USING FORM WITHOUT API
  static async submitUserData(req, res, next) {
    try {
      const updatedUser = await UserServices.findAndUpdate(
        req.user.id,
        ...[
          {
            name: req.body.name,
            email: req.body.email,
          },
          { new: true, runValidators: true },
        ]
      );

      res
        .status(200)
        .render('account', { title: 'Your account', user: updatedUser });
    } catch (err) {
      next();
    }
  }

  static async getResetPasswordForm(req, res, next) {
    res.status(200).render('resetPassword', { title: 'Reset your password' });
  }

  static async getMyTours(req, res, next) {
    // REMEMBER MAY USE VERTUAL POPULATE ON TOURS INSTEAD
    // 1) Find Bookings by user ID
    const bookings = await BookingServices.find({ user: req.user.id });

    // 2) Find tours with returned IDs
    const tourIDs = bookings.map((booking) => booking.tour);
    const tours = await TourServices.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', { title: 'My Tours', tours });
  }

  static alerts(req, res, next) {
    const { alert } = req.query;
    if (alert === 'booking')
      res.locals.alert =
        'Your booking has been successfull, please check your email. If your booking does not show up immediately, please check again later.';
    next();
  }
}
