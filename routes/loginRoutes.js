const express = require("express");
const catchAsync = require("../appError/catchAsync");
const User = require("../schemas/UserSchema");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).render("login");
});

router.post(
  "/",
  catchAsync(async (req, res, next) => {
    const user = await User.findByCredentials(req.body);

    req.session.user = user;

    res.redirect("/");
  })
);
module.exports = router;
