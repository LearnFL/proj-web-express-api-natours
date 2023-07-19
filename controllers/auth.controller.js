import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import UserServices from '../DAO/user.DAO.js';
import {} from 'dotenv/config';
import AppError from '../utils/appError.js';
import Email from '../utils/email.js';

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // date converted in miliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //send only via hhtps, activate in production only
    ...(process.env.NODE_ENV === 'production' && { secure: true }), //eslint-disable-line
    /* httpOnly: true, limit browsers access, browsers can't change this cookie
    TO implement logout functionally, we need to create a new cookie with the same name
    and without value  */
    httpOnly: true,
  };

  // Remove password from output
  user.password = undefined;

  // name and data
  res.cookie('jwt', token, cookieOptions);

  res
    .status(statusCode)
    .json({ status: 'success', token, data: { user: user } });
};

export default class AuthController {
  static async signup(req, res, next) {
    try {
      const newUser = await UserServices.createNewUser(req);
      //Create token: payload, secret, expiration (10d, 5h, 5m, 3s)

      const url = `${req.protocol}://${req.get('host')}/me`;
      await new Email(newUser, url).sendWelcome();
      createAndSendToken(newUser, 201, res);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    const { email, password } = req.body;
    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check if user exists and password correct
    const user = await UserServices.findOneUser(email);

    // If everything ok, send token back to client.
    if (!user || !(await user.checkPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    //Create token: payload, secret, expiration (10d, 5h, 5m, 3s)
    createAndSendToken(
      { _id: user._id, name: user.name, email: user.email },
      200,
      res
    );
  }

  static logout(req, res, next) {
    res.cookie('jwt', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
  }

  static async protect(req, res, next) {
    let token;
    // Send Token in the headers(Authorization = Bearer token)
    // 1) Get token and check if it exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in.', 401));
    }

    try {
      // 2) Validate token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await UserServices.findUserById(decoded.id);
      if (!currentUser) {
        return next(new AppError('The user is not authenticated', 401));
      }

      // 4) Check if user changed password after the Token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError('Password has recently change, please login again', 401)
        );
      }

      // 5) Allow Exccess
      req.user = currentUser;

      // 6) GIve template access to user
      res.locals.user = currentUser;
      next();
    } catch (err) {
      next(err);
    }
  }

  // only for rendered pages
  static async isLoggedIn(req, res, next) {
    if (req.cookies.jwt) {
      try {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        );

        // 2) Check if user still exists
        const currentUser = await UserServices.findUserById(decoded.id);

        if (!currentUser) {
          return next();
        }

        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }

        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  }

  static restrictTo(...roles) {
    return (req, res, next) => {
      // roles ['admin', 'lead-guide']
      if (!roles.includes(req.user.role)) {
        return next(new AppError('You do not have permission.', 403));
      }
      next();
    };
  }

  static async forgotPassword(req, res, next) {
    try {
      // 1) Get user based on email
      const user = await UserServices.findOneUser(req.body.email);
      if (!user) {
        return new AppError('There is no user with this email.', 404);
      }

      // 2) Generate random token
      const resetToken = user.createPasswordResetToken();

      // User data has been modified but now it needs saved
      await user.save({ validateBeforeSave: false });

      // 3) send it back as email API
      // const resetURL = `${req.protocol}://${req.get(
      //   'host'
      // )}/api/v1/users/resetPassword/${resetToken}`;

      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/resetPassword/#${resetToken}`;

      try {
        await new Email(user, resetURL).sendPasswordReset();
      } catch (err) {
        // For security reset data
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
          new AppError('There was an error sending email, try again later', 500)
        );
      }

      createAndSendToken(user, 200, res);

      //   res.status(200).json({
      //     status: 'success',
      //     message: 'Your password reset email has been sent.',
      //   });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    // 1)get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    try {
      const user = await UserServices.findUserByToken(hashedToken);

      // 2) set new password if token is not expired and there is user
      if (!user || !user.token === hashedToken) {
        next(new AppError('Could not validate token, try again later.', 400));
      }

      // 3) update changePasswordAt property for user
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // Update changedPasswordAt property of schema
      // 5) log in user in and send JWT token
      res.status(200).json({ status: 'success' });
    } catch (err) {
      next(err);
    }
  }

  static async updatePassword(req, res, next) {
    try {
      // 1) Get user from collection, req.user is set by protect middleware
      const user = await UserServices.findOneUserById(req.user.id);

      if (!user) {
        return new AppError('There is no user with this email.', 404);
      }

      // 2) Check if POSTed password is correct
      if (
        !(await user.checkPassword(req.body.passwordCurrent, user.password))
      ) {
        // At this point token will be mulformed since we are not sending it back and login is requiared
        return next(new AppError('Incorrect current password.', 401));
      }

      // 3) If so, update password
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;

      await user.save(); // must use save so all validation runs

      // 4) Log user in and send token
      createAndSendToken(user, 200, res);
    } catch (err) {
      next(err);
    }
  }
}
