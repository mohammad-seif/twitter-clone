const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const AppError = require("../appError/appError");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new Error("Email format is not correct");
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(val) {
        if (val.length < 6) {
          throw new Error("Password is too short");
        }
      },
    },
    profilePic: {
      type: String,
      default: "/images/profilePic.jpeg",
    },
    coverPhoto: {
      type: String,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

UserSchema.statics.findByCredentials = async ({ usr, password }) => {
  const user = await User.findOne({
    $or: [{ username: usr }, { email: usr }],
  });

  if (!user) {
    throw new AppError("This user does not exist!", 200, 404, "login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Username or password is wrong", 200, 400, "login");
  }

  return user;
};

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
