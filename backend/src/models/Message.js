import mongoose from 'mongoose';
import { PLANET_IDS, DEFAULT_PLANET } from '../constants/planets.js';

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    planet: {
      type: String,
      enum: PLANET_IDS,
      default: DEFAULT_PLANET,
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
