import mongoose from 'mongoose';

const { Schema } = mongoose;

export const activityTypes = ['running', 'walking', 'strength', 'cycling', 'other'] as const;

const activitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    type: { type: String, enum: activityTypes, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    distanceKm: { type: Number, min: 0 },
    points: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true },
);

export const Activity = mongoose.models.Activity ?? mongoose.model('Activity', activitySchema);