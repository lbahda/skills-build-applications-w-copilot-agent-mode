import mongoose from 'mongoose';

const { Schema } = mongoose;

const leaderboardEntrySchema = new Schema(
  {
    period: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true, min: 0 },
    rank: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

leaderboardEntrySchema.index({ period: 1, user: 1 }, { unique: true });

export const LeaderboardEntry = mongoose.models.LeaderboardEntry ?? mongoose.model('LeaderboardEntry', leaderboardEntrySchema);