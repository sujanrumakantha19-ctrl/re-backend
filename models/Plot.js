const mongoose = require('mongoose');

const PlotSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please add project ID'],
    },
    plotNumber: {
      type: String,
      required: [true, 'Please add plot number'],
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Registered', 'Canceled', 'Pending'],
      default: 'Available',
    },
    facing: {
      type: String,
    },
    size: {
      type: Number,
    },
    sizeUnit: {
      type: String,
      default: 'Sq Yards',
    },
    type: {
      type: String,
      enum: ['Residential', 'Commercial'],
    },
    price: {
      type: Number,
    },
    timeline: [
      {
        id: {
          type: String,
        },
        type: {
          type: String,
          enum: [
            'lead_added',
            'reserved',
            'qualified',
            'booking_confirmed',
            'booking_canceled',
            'new_booking',
          ],
        },
        label: {
          type: String,
        },
        actor: {
          type: String,
        },
        actorRole: {
          type: String,
        },
        date: {
          type: String,
        },
        details: {
          type: String,
        },
        color: {
          type: String,
          enum: ['green', 'blue', 'amber', 'red'],
        },
      },
    ],
    bookedBy: {
      name: { type: String },
      phone: { type: String },
      paymentStatus: { type: String, enum: ['Not Paid', 'Partially Paid', 'Fully Paid'] },
      type: { type: String, enum: ['customer', 'staff'] },
    },
    pendingApproval: {
      leadId: {
        type: String,
      },
      customerName: {
        type: String,
      },
      phone: {
        type: String,
      },
      requestedBy: {
        type: String,
      },
      requestedAt: {
        type: String,
      },
      paymentStatus: {
        type: String,
        enum: ['Not Paid', 'Partially Paid', 'Fully Paid'],
      },
      notes: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for projectId and plotNumber
PlotSchema.index({ projectId: 1, plotNumber: 1 }, { unique: true });
PlotSchema.index({ status: 1 });

module.exports = mongoose.model('Plot', PlotSchema);