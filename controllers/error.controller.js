import AppError from '../utils/appError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = function () {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = function () {
  return new AppError('Expired token. Please log in again.', 401);
};

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Rendered web site
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
      code: err.statusCode,
      status: err.status,
      title: 'Something went wrong',
      stack: err.stack,
      message: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error sent to client
  // isOperational from custom Error class
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        code: err.statusCode,
        status: err.status,
        title: 'Something went wrong',
        message: err.message,
      });
    }
    // Generic programming error, details are not leaked to client
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).json({
      title: 'Something went wrong!',
      message: 'Please try again later.',
    });
  } else {
    // Rendered web site
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message,
      });
    }

    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: 'Please try again later.',
    });
  }
};

export default function globalErrorHandler(err, req, res, next) {
  // stack trace
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message || ' ', name: err.name || ' ' }; // eslint-disable-line
    // bad id
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // duplicate fields
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    // validation error
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (
      error.message.includes('Password has recently change, please login again')
    )
      error = error; //eslint-disable-line

    sendErrorProd(error, req, res);
  }

  next();
}
