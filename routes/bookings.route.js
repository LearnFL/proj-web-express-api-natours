import express from 'express';
import BookingsController from '../controllers/bookings.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router({ mergeParams: true }); //to give access to params from Nested Tours Router

router.get(
  '/checkout-session/:tourId',
  AuthController.protect,
  BookingsController.getCheckoutSession
);

export { router as bookingsRoute };
