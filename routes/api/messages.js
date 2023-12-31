const express = require('express');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');
const Notification = require('../../schemas/NotificationSchema');
const User = require('../../schemas/UserSchema');
const router = express.Router();

router.post('/', async (req, res, next) => {
  if (!req.body.content || !req.body.chatId) {
    console.log('Invalid data passed into request');
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.session.user._id,
    content: req.body.content,
    chat: req.body.chatId,
    readBy: [req.session.user],
  };

  Message.create(newMessage)
    .then(async (message) => {
      message = await message.populate('sender').execPopulate();
      message = await message.populate('chat').execPopulate();
      message = await User.populate(message, { path: 'chat.users' });

      var chat = await Chat.findByIdAndUpdate(req.body.chatId, {
        latestMessage: message,
      }).catch((error) => console.log(error));

      await insertNotifications(chat, message);

      res.status(201).send(message);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});

async function insertNotifications(chat, message) {
  await Promise.all(
    chat.users.map((userId) => {
      if (userId == message.sender._id.toString()) {
        return;
      }

      Notification.insertNotification(
        userId,
        message.sender._id,
        'newMessage',
        message.chat._id
      );
    })
  );
}
module.exports = router;
