const express = require("express");
const User = require("../schemas/UserSchema");
const router = express.Router();
const catchAsync = require("../appError/catchAsync");

router.get("/", (req, res) => {
  res.status(200).render("register");
});
router.post(
  "/",
  catchAsync(async (req, res, next) => {
    const user = await User.create(req.body);

    req.session.user = user;

    res.redirect("/");
  })
);

module.exports = router;
