const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['birthday', 'lead_status', 'new_lead', 'task_assigned', 'attendance', 'booking'],
      required: [true, 'Please add notification type'],
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
    },
    timeAgo: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isToday: {
      type: Boolean,
      default: false,
    },
    actorName: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    entityId: {
      type: String,
    },
    entityType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);