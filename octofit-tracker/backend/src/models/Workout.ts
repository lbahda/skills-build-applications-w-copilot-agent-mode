import mongoose from 'mongoose';
import { fitnessLevels } from './User.js';

const { Schema } = mongoose;

const workoutSchema = new Schema(
  {
    title: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: ['cardio', 'strength', 'mobility', 'recovery'], required: true },
    fitnessLevel: { type: String, enum: ['all', ...fitnessLevels], default: 'all' },
    durationMinutes: { type: Number, required: true, min: 5, max: 240 },
    goals: { type: [String], default: [] },
    equipment: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Workout = mongoose.models.Workout ?? mongoose.model('Workout', workoutSchema);