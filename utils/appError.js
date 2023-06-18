export default class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // use string template to convert to string
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Stack trace. Not show this contstructor in stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
