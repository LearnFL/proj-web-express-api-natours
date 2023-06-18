import ReviewServices from '../DAO/review.DAO.js';
import AppError from '../utils/appError.js';

export default class ReviewsController {
  static async getAllReviews(req, res, next) {
    try {
      // For nested route
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };

      const reviews = await ReviewServices.getAllReviews(filter);
      res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: reviews.length,
        data: { reviews: reviews },
      });
    } catch (err) {
      next(err);
    }
  }

  static async createReview(req, res, next) {
    try {
      // Allow nested routes
      if (!req.body.tour) req.body.tour = req.params.tourId;
      if (!req.body.user) req.body.user = req.user.id; // coming from protect middleware
      const newReview = await ReviewServices.createNewReview(req.body);
      res.status(201).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: { reviews: newReview },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReview(req, res, next) {
    try {
      const doc = await ReviewServices.findById(req.params.id);

      if (!doc) {
        return next(new AppError('No review found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteReview(req, res, next) {
    try {
      const doc = await ReviewServices.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError('No review found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateReview(req, res, next) {
    try {
      const doc = await ReviewServices.findByIdAndUpdate(req);

      if (!doc) {
        return next(new AppError('No review found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
