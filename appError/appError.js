class AppError extends Error {
  constructor(message, statusCode, status, path = null) {
    super(message);

    this.message = message;
    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = true;
    this.type = path ? path : "json";

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
