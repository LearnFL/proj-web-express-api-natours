import express from 'express';
import BookingsController from '../controllers/bookings.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router({ mergeParams: true }); //to give access to params from Nested Tours Router

router.use(AuthController.protect);
router.get('/checkout-session/:tourId', BookingsController.getCheckoutSession);

router.use(AuthController.restrictTo('admin', 'lead-guide'));

router.get('/', BookingsController.find);
router.post('/', BookingsController.create);
router.get('/:id', BookingsController.find);
router.patch('/:id', BookingsController.updateOne);
router.delete('/:id', BookingsController.deleteOne);

export { router as bookingsRoute };
