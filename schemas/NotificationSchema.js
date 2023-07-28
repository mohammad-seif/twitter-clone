const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

NotificationSchema.statics.insertNotification = async (
  userTo,
  userFrom,
  notificationType,
  entityId
) => {
  var data = {
    userTo: userTo,
    userFrom: userFrom,
    notificationType: notificationType,
    entityId: entityId,
  };
  await Notification.deleteOne(data).catch((error) => console.log(error));
  return Notification.create(data).catch((error) => console.log(error));
};

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
