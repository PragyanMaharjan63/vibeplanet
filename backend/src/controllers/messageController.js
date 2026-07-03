import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { PLANET_IDS, DEFAULT_PLANET } from '../constants/planets.js';

const RANDOM_COLORS = ['#7dd3fc', '#c4b5fd', '#f0abfc', '#86efac', '#fcd34d'];

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(400);
  res.json(messages);
});

// Admin-only view: same data, plus the author's email for accountability
// when deciding what to moderate.
export const getMessagesForAdmin = asyncHandler(async (req, res) => {
  const messages = await Message.find()
    .sort({ createdAt: -1 })
    .populate('author', 'email')
    .limit(400);
  res.json(messages);
});

export const createMessage = asyncHandler(async (req, res) => {
  const { name, text, planet } = req.body;

  if (!name || !text) {
    return res.status(400).json({ error: 'name and text are required' });
  }

  const destinationPlanet = PLANET_IDS.includes(planet) ? planet : DEFAULT_PLANET;
  const color = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

  const message = await Message.create({
    name: name.slice(0, 40),
    text: text.slice(0, 240),
    color,
    planet: destinationPlanet,
    author: req.user.id,
  });

  res.status(201).json(message);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid message id' });
  }

  const deleted = await Message.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.status(204).end();
});
