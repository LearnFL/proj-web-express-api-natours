import Router from 'express';
import ViewController from '../controllers/view.controller.js';
import AuthController from '../controllers/auth.controller.js';
import BookingsController from '../controllers/bookings.controller.js';

const router = new Router();

// router.use(AuthController.isLoggedIn);

router.get(
  '/',
  AuthController.isLoggedIn,
  BookingsController.createBookingCheckout, //temporary untill site is deployed
  ViewController.getOverview
);
router.get('/tour/:slug', AuthController.isLoggedIn, ViewController.getTour);

// Login
router.get('/login', AuthController.isLoggedIn, ViewController.getLoginForm);
router.get('/signup', ViewController.getSignUpForm);
router.get('/me', AuthController.protect, ViewController.getAccount);
router.get('/my-tours', AuthController.protect, ViewController.getMyTours);

router.get('/resetPassword/', ViewController.getResetPasswordForm);

// WITHOUT API
router.post(
  '/submit-user-data',
  AuthController.protect,
  ViewController.submitUserData
);

export { router as viewRoute };
