const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true
    },

    reservation: {
      type: mongoose.Types.ObjectId,
      ref: "reservation",
      required: true
    },

    method: {
      type: String,
      enum: ["cod", "bank_transfer", "momo"],
      required: true,
      default: "cod",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending"
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "VND"
    },

    transactionId: {
      type: String,
      default: ""
    },

    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: ""
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Payment", paymentSchema);