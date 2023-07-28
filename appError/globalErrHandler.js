const AppError = require("./appError");

module.exports = (err, req, res, next) => {
  console.log(err);
  console.log("Spread ", { ...err });
  let error = err;

  if (err.name === "MongoError") {
    switch (err.code) {
      case 11000:
        const msg = Object.entries(err.keyValue)[0];
        error = new AppError(
          `${msg[0]} ${msg[1]} already exist!`,
          200,
          409,
          "register"
        );
        break;

      default:
        error = new AppError(err.message, 200, err.code);
        break;
    }
  }

  if (err._message === "User validation failed") {
    const msg = Object.values(err.errors);
    error = new AppError(msg[0].properties.message, 200, 400, "register");
  }

  if (err._message === "CastError") {
    error = new AppError("Bad request", 400, 400);
  }

  if (error.isOperational) {
    if (error.type === "json") {
      res.status(error.statusCode).send({
        status: error.status,
        errorMessage: error.message,
      });
    } else {
      const payload = {
        errorMessage: error.message,
      };

      res.status(error.statusCode).render(error.type, payload);
    }
  } else {
    //production
    // res.status(500).send({
    //   status: "error",
    //   message: "Unknown Error",
    // });
    // development
    res.status(500).send(err);
  }
};
