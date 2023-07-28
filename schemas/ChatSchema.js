const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isGroupChat: { type: Boolean, default: false },
    users: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", username: String },
    ],
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;

// let countUnreadChats = await Chat.aggregate([
//   {
//     $match: {
//       users: {
//         $eq: mongoose.Types.ObjectId(userId),
//       },
//     },
//   },
//   {
//     $lookup: {
//       from: Message.collection.name,
//       localField: "_id",
//       foreignField: "chat",
//       as: "message",
//     },
//   },
//   {
//     $unwind: "$message",
//   },
// ]);
