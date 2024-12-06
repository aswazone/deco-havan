const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Ensure each user has only one wallet
  },
  balance: {
    type: Number,
    default: 0, // Default balance is zero
  },
  transactions: [
    {
      transactionId: {
        type: String,
        unique: true,
        required: true,
      },
      type: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      description: {
        type: String,
        default: '',
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
