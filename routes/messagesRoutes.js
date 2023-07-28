const express = require("express");
const Chat = require("../schemas/ChatSchema");
const User = require("../schemas/UserSchema");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", (req, res, next) => {
  let payload = {
    pageTitle: "Inbox",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render("inboxPage", payload);
});

router.get("/new", (req, res, next) => {
  let payload = {
    pageTitle: "New message",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };
  res.status(200).render("newMessage", payload);
});

router.get("/:chatId", async (req, res, next) => {
  let userId = req.session.user._id;
  let chatId = req.params.chatId;
  const isValid = mongoose.isValidObjectId(chatId);

  let payload = {
    pageTitle: "Chat",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };

  if (!isValid) {
    payload.errorMessage = "Chat does not exist";

    return res.status(200).render("chatPage", payload);
  }

  let chat = await Chat.findOne({
    _id: chatId,
    users: {
      $elemMatch: {
        $eq: userId,
      },
    },
  }).populate("users");
  console.log(chat);
  if (!chat) {
    let userFound = await User.findById(chatId);
    console.log(userFound);

    if (userFound) {
      chat = await getChatByUserId(userFound._id, userId);
    }
  }

  console.log(chat);

  if (!chat) {
    payload.errorMessage = "Chat does not exist";
  } else {
    payload.chat = chat;
  }

  res.status(200).render("chatPage", payload);
});

function getChatByUserId(userLoggedInId, otherUserId) {
  return Chat.findOneAndUpdate(
    {
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          {
            $elemMatch: {
              $eq: mongoose.Types.ObjectId(userLoggedInId),
            },
          },
          {
            $elemMatch: {
              $eq: mongoose.Types.ObjectId(otherUserId),
            },
          },
        ],
      },
    },
    {
      $setOnInsert: {
        users: [userLoggedInId, otherUserId],
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).populate("users");
}

module.exports = router;
