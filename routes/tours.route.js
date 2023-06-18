import Router from 'express';
import AuthController from '../controllers/auth.controller.js';
import ToursController from '../controllers/tours.controller.js';
import { reviewsRoute } from './reviews.route.js';

const router = new Router();

// Nested Route
router.use('/:tourId/reviews', reviewsRoute);

// // SIMPLE NESTED ROUTE NOT IDEAL
// router.post(
//   '/:tourId/reviews',
//   AuthController.protect,
//   AuthController.restrictTo('user', 'admin'),
//   ReviewsController.createReview
// );

router.get('/', ToursController.getAllTours);

router.get(
  '/top-5-cheap',
  ToursController.aliasTopTours,
  ToursController.getAllTours
);

router.get('/tour-stats', ToursController.getTourStats); //should come before the route which has been passed with params

// GEOSPATIAL QUERIES
router.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  ToursController.getToursWithin
);

router.get('/distances/:latlng/unit/:unit', ToursController.getDistances);

router.post(
  '/',
  AuthController.protect,
  AuthController.restrictTo('admin', 'lead-guide'),
  ToursController.createOneTour
);

router.get(
  '/monthly-plan/:year',
  AuthController.protect,
  AuthController.restrictTo('admin', 'lead-guide', 'guide'),
  ToursController.getMonthlyPlan
); //should come before the route which has been passed with params

router.get('/:id', ToursController.getOneTour);

router.patch(
  '/:id',
  AuthController.protect,
  AuthController.restrictTo('admin', 'lead-guide'),
  ToursController.updateOneTour
);

router.delete(
  '/:id',
  AuthController.protect,
  AuthController.restrictTo('admin', 'lead-guide'),
  ToursController.deleteOneTour
);

export { router as toursRoute };
