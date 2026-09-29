import mongoose from 'mongoose';

const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    captain: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export const Team = mongoose.models.Team ?? mongoose.model('Team', teamSchema);