const express = require("express");
const Chat = require("../../schemas/ChatSchema");
const catchAsync = require("../../appError/catchAsync");
const User = require("../../schemas/UserSchema");
const Message = require("../../schemas/MessageSchema");
const router = express.Router();
const mongoose = require("mongoose");

router.post(
  "/",
  catchAsync(async (req, res, next) => {
    let users = JSON.parse(req.body.users);

    if (!req.body.users || users?.length < 2) {
      return res.status(400).send();
    }

    users.push(req.session.user);

    let chatData = {
      users,
      isGroupChat: true,
    };

    const chat = await Chat.create(chatData);

    res.status(200).send(chat);
  })
);

router.get(
  "/",
  catchAsync(async (req, res, next) => {
    let chats = await Chat.find({
      users: {
        $elemMatch: {
          $eq: req.session.user._id,
        },
      },
    })
      .populate("users")
      .populate({
        path: "latestMessage",
      })
      .sort({ updatedAt: -1 });

    // if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
    //   chats = chats.filter(
    //     (r) =>
    //       r.latestMessage &&
    //       !r.latestMessage.readBy.includes(req.session.user._id)
    //   );
    // }
    chats = await User.populate(chats, { path: "latestMessage.sender" });

    res.status(200).send(chats);
  })
);

router.get("/count", async (req, res, next) => {
  let userId = "60e2ebc0e0db5c265ce5ef1d";

  try {
    let countUnreadChats = await Chat.aggregate([
      {
        $match: {
          users: {
            $eq: mongoose.Types.ObjectId(userId),
          },
        },
      },
      {
        $lookup: {
          from: Message.collection.name,
          pipeline: [
            {
              $match: {
                readBy: {
                  $ne: mongoose.Types.ObjectId(userId),
                },
              },
            },
            {
              $count: "total",
            },
          ],
          as: "messages",
        },
      },
      // {
      //   $unwind: "$messages",
      // },
      {
        $group: {
          _id: "$messages",
        },
      },
    ]);

    res.send({ unreadMessagesCount: countUnreadChats });
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
});

router.get("/:chatId", async (req, res, next) => {
  const chat = await Chat.findOne({
    _id: req.params.chatId,
    users: { $elemMatch: { $eq: req.session.user._id } },
  }).populate("users");

  res.status(200).send(chat);
});

router.put("/:chatId", async (req, res, next) => {
  const chat = await Chat.findByIdAndUpdate(req.params.chatId, req.body);
  res.status(204).send(chat);
});

router.get("/:chatId/messages", async (req, res, next) => {
  Message.find({ chat: req.params.chatId })
    .populate("sender")
    .then((results) => res.status(200).send(results))
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});

router.put("/:chatId/messages/markAsRead", async (req, res, next) => {
  Message.updateMany(
    { chat: req.params.chatId },
    { $addToSet: { readBy: req.session.user._id } }
  )
    .then(() => res.sendStatus(204))
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});

module.exports = router;
