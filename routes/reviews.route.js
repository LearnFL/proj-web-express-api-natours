// import Router from 'express';
import express from 'express';
import ReviewsController from '../controllers/reviews.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router({ mergeParams: true }); //to give access to params from Nested Tours Router

router.use(AuthController.protect);

router.get('/', ReviewsController.getAllReviews);

router.post(
  '/',
  AuthController.restrictTo('user', 'admin'),
  ReviewsController.createReview
);

router.use(AuthController.restrictTo('user', 'admin'));

router.get('/:id', ReviewsController.getReview);
router.patch('/:id', ReviewsController.updateReview);
router.delete('/:id', ReviewsController.deleteReview);

export { router as reviewsRoute };
