import Router from 'express';
import ViewController from '../controllers/view.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = new Router();

// router.use(AuthController.isLoggedIn);

router.get('/', AuthController.isLoggedIn, ViewController.getOverview);
router.get('/tour/:slug', AuthController.isLoggedIn, ViewController.getTour);

// Login
router.get('/login', AuthController.isLoggedIn, ViewController.getLoginForm);
router.get('/me', AuthController.protect, ViewController.getAccount);

export { router as viewRoute };
