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

NotificationSchema.post('save', async function (doc) {
  try {
    if (!doc.userId) return;
    const fcm = require('../utils/fcm');
    const getTitleForType = (type) => {
      switch (type) {
        case 'birthday':
          return '🎂 Birthday Alert!';
        case 'lead_status':
          return '📋 Lead Status Updated';
        case 'new_lead':
          return '🆕 New Lead Assigned';
        case 'task_assigned':
          return '📝 New Task Assigned';
        case 'attendance':
          return '⏰ Attendance Update';
        case 'booking':
          return '🏡 Plot Booking Request';
        default:
          return '🔔 New Notification';
      }
    };
    
    await fcm.sendPushToUser(doc.userId.toString(), {
      title: getTitleForType(doc.type),
      body: doc.message,
      data: {
        id: doc._id.toString(),
        type: doc.type,
        entityId: doc.entityId || '',
        entityType: doc.entityType || ''
      }
    });
  } catch (err) {
    console.error('Error sending push notification post-save:', err);
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);