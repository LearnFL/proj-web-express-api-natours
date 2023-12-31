import Router from 'express';

import AuthController from '../controllers/auth.controller.js';
import UsersController from '../controllers/users.controller.js';
import { upload } from '../controllers/users.controller.js';

const router = new Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/forgotPassword', AuthController.forgotPassword);
router.patch('/resetPassword/:token', AuthController.resetPassword);
router.get('/logout', AuthController.logout);

// FROM THIS POINT MUST BE AUTHENTICATED
router.use(AuthController.protect);

router.get(
  '/me',
  UsersController.getMe, // middleware to get user's ID as if it is coming from url
  UsersController.getUser
);

// upload single file from field callesd photo, it will put info about image on request req.file
router.patch(
  '/updateMe',
  upload.single('photo'),
  UsersController.resizeUserPhoto,
  UsersController.updateMe
);
router.patch('/updateMyPassword', AuthController.updatePassword);
router.delete('/deleteMe', UsersController.deleteMe);

// FROM THIS POINT MUST BE ADMIN
router.use(AuthController.restrictTo('admin'));
router.get('/', UsersController.getAllUsers);
// router.get('/', UsersController.createOneUser);
router.get('/:id', UsersController.getUser);
router.patch('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

export { router as usersRoute };
