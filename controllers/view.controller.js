import AppError from '../utils/appError.js';
import TourServices from '../DAO/tour.DAO.js';
import UserServices from '../DAO/user.DAO.js';
import { async } from 'regenerator-runtime';

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
}
