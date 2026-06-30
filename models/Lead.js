const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Please add customer name'],
    },
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
    },
    email: {
      type: String,
      required: [true, 'Please add email'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    city: {
      type: String,
    },
    budgetMin: {
      type: Number,
    },
    budgetMax: {
      type: Number,
    },
    propertyInterest: {
      type: String,
    },
    notes: {
      type: String,
    },
    source: {
      type: String,
    },
    sourceType: {
      type: String,
      enum: ['Channel Partner', 'Staff', 'Direct', 'Walk-in', 'Phone Call', 'Instagram', 'Facebook', 'Website', 'Leads Portal', 'Own Client', 'Office Referral', 'Client Referral'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Open', 'Qualified', 'Unqualified', 'Customer'],
      default: 'Open',
    },
    dateAdded: {
      type: Date,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plot',
    },
    paymentStatus: {
      type: String,
      enum: ['Not Paid', 'Partially Paid', 'Fully Paid'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'LOAN'],
      default: 'CASH',
    },
    bank: {
      type: String,
    },
    dob: {
      type: String,
    },
    followUps: [
      {
        id: {
          type: String,
        },
        date: {
          type: String,
        },
        notes: {
          type: String,
        },
        outcome: {
          type: String,
        },
        nextAction: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ sourceType: 1 });
LeadSchema.index({ projectId: 1 });
LeadSchema.index({ phone: 1 });

module.exports = mongoose.model('Lead', LeadSchema);