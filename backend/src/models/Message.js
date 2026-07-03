import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    color: {
      type: String,
      default: '#7dd3fc',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
