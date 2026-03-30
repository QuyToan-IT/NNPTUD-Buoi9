const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    messageContent: {
      type: {
        type: String,
        enum: ['file', 'text'],
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ from: 1, to: 1, createdAt: 1 });

module.exports = mongoose.model('message', messageSchema);

