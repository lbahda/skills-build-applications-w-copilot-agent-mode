import mongoose from 'mongoose';

const { Schema } = mongoose;

export const fitnessLevels = ['beginner', 'intermediate', 'advanced'] as const;
export type FitnessLevel = (typeof fitnessLevels)[number];

const userSchema = new Schema(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-z0-9_]+$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fitnessLevel: { type: String, enum: fitnessLevels, default: 'beginner' },
    goals: { type: [String], default: [] },
    team: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    points: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);