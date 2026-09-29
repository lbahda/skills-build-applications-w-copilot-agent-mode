import bcrypt from 'bcryptjs';
import { Router } from 'express';
import mongoose from 'mongoose';
import { Activity, activityTypes } from '../models/Activity.js';
import { LeaderboardEntry } from '../models/LeaderboardEntry.js';
import { Team } from '../models/Team.js';
import { User, fitnessLevels } from '../models/User.js';
import { Workout } from '../models/Workout.js';
import { getJwtSecret, issueToken, requireAuth } from '../middleware/auth.js';

const router = Router();

function bodyOf(request: { body: unknown }): Record<string, unknown> {
  return typeof request.body === 'object' && request.body !== null
    ? (request.body as Record<string, unknown>)
    : {};
}

function text(value: unknown): value is string {
  return typeof value === 'string';
}

function validFitnessLevel(value: unknown): value is (typeof fitnessLevels)[number] {
  return text(value) && fitnessLevels.includes(value as (typeof fitnessLevels)[number]);
}

function publicUser(user: {
  _id: mongoose.Types.ObjectId;
  username: string;
  displayName: string;
  fitnessLevel: string;
  goals: string[];
  points: number;
  team?: mongoose.Types.ObjectId | null;
}) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    fitnessLevel: user.fitnessLevel,
    goals: user.goals,
    points: user.points,
    team: user.team ?? null,
  };
}

router.post('/auth/register', async (request, response) => {
  const secret = getJwtSecret();
  if (!secret) {
    return response.status(503).json({ error: 'Configure JWT_SECRET with at least 32 characters' });
  }

  const body = bodyOf(request);
  const displayName = text(body.displayName) ? body.displayName.trim() : '';
  const username = text(body.username) ? body.username.trim().toLowerCase() : '';
  const email = text(body.email) ? body.email.trim().toLowerCase() : '';
  const password = text(body.password) ? body.password : '';

  if (displayName.length < 1 || displayName.length > 60) {
    return response.status(400).json({ error: 'displayName must be 1 to 60 characters' });
  }
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return response.status(400).json({ error: 'username must be 3 to 24 letters, numbers, or underscores' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ error: 'A valid email is required' });
  }
  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({ error: 'password must be 8 to 128 characters' });
  }

  const user = await User.create({
    displayName,
    username,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });

  return response.status(201).json({ token: issueToken(user.id, secret), user: publicUser(user) });
});

router.post('/auth/login', async (request, response) => {
  const secret = getJwtSecret();
  if (!secret) {
    return response.status(503).json({ error: 'Configure JWT_SECRET with at least 32 characters' });
  }

  const body = bodyOf(request);
  const email = text(body.email) ? body.email.trim().toLowerCase() : '';
  const password = text(body.password) ? body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Email or password is incorrect' });
  }

  return response.json({ token: issueToken(user.id, secret), user: publicUser(user) });
});

router.get('/users', requireAuth, async (_request, response) => {
  const users = await User.find()
    .select('username displayName fitnessLevel goals points team')
    .sort({ displayName: 1 })
    .limit(100)
    .lean();
  return response.json(users);
});

router.get('/users/me', requireAuth, async (request, response) => {
  const user = await User.findById(request.userId);
  if (!user) return response.status(404).json({ error: 'User not found' });
  return response.json(publicUser(user));
});

router.patch('/users/me', requireAuth, async (request, response) => {
  const body = bodyOf(request);
  const updates: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    if (!text(body.displayName) || body.displayName.trim().length < 1 || body.displayName.trim().length > 60) {
      return response.status(400).json({ error: 'displayName must be 1 to 60 characters' });
    }
    updates.displayName = body.displayName.trim();
  }
  if (body.fitnessLevel !== undefined) {
    if (!validFitnessLevel(body.fitnessLevel)) {
      return response.status(400).json({ error: 'fitnessLevel must be beginner, intermediate, or advanced' });
    }
    updates.fitnessLevel = body.fitnessLevel;
  }
  if (body.goals !== undefined) {
    if (!Array.isArray(body.goals) || body.goals.length > 10 || body.goals.some((goal) => !text(goal) || goal.length > 40)) {
      return response.status(400).json({ error: 'goals must be an array of up to 10 short strings' });
    }
    updates.goals = [...new Set(body.goals.map((goal) => (goal as string).trim()).filter(Boolean))];
  }

  const user = await User.findByIdAndUpdate(request.userId, updates, { new: true, runValidators: true });
  if (!user) return response.status(404).json({ error: 'User not found' });
  return response.json(publicUser(user));
});

router.get('/users/:userId', requireAuth, async (request, response) => {
  const userId = request.params.userId;
  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    return response.status(400).json({ error: 'Invalid user id' });
  }
  const user = await User.findById(userId).select('username displayName fitnessLevel goals points team');
  if (!user) return response.status(404).json({ error: 'User not found' });
  return response.json(publicUser(user));
});

router.get('/teams', requireAuth, async (_request, response) => {
  const teams = await Team.find()
    .select('name description captain members createdAt')
    .populate('captain', 'username displayName')
    .sort({ name: 1 })
    .lean();
  return response.json(teams.map((team) => ({ ...team, memberCount: team.members.length })));
});

router.post('/teams', requireAuth, async (request, response) => {
  const body = bodyOf(request);
  const name = text(body.name) ? body.name.trim() : '';
  const description = text(body.description) ? body.description.trim() : '';
  if (name.length < 2 || name.length > 40 || description.length > 500) {
    return response.status(400).json({ error: 'Team name must be 2 to 40 characters and description at most 500' });
  }

  const user = await User.findById(request.userId);
  if (!user) return response.status(404).json({ error: 'User not found' });
  const team = await Team.create({ name, description, captain: user._id, members: [user._id] });
  if (user.team) await Team.updateOne({ _id: user.team }, { $pull: { members: user._id } });
  user.team = team._id;
  await user.save();
  return response.status(201).json(team);
});

router.post('/teams/:teamId/join', requireAuth, async (request, response) => {
  const teamId = request.params.teamId;
  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    return response.status(400).json({ error: 'Invalid team id' });
  }
  const [user, team] = await Promise.all([
    User.findById(request.userId),
    Team.findById(teamId),
  ]);
  if (!user) return response.status(404).json({ error: 'User not found' });
  if (!team) return response.status(404).json({ error: 'Team not found' });

  if (user.team && !user.team.equals(team._id)) {
    await Team.updateOne({ _id: user.team }, { $pull: { members: user._id } });
  }
  await Team.updateOne({ _id: team._id }, { $addToSet: { members: user._id } });
  user.team = team._id;
  await user.save();
  return response.json({ message: 'Joined team', teamId: team._id });
});

router.get('/teams/:teamId', requireAuth, async (request, response) => {
  const teamId = request.params.teamId;
  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    return response.status(400).json({ error: 'Invalid team id' });
  }
  const team = await Team.findById(teamId)
    .populate('captain', 'username displayName')
    .populate('members', 'username displayName fitnessLevel points');
  if (!team) return response.status(404).json({ error: 'Team not found' });
  return response.json(team);
});

router.get('/activities', requireAuth, async (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
  const activities = await Activity.find({ user: request.userId })
    .populate('team', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return response.json(activities);
});

router.post('/activities', requireAuth, async (request, response) => {
  const body = bodyOf(request);
  const durationMinutes = Number(body.durationMinutes);
  const distanceKm = body.distanceKm === undefined ? undefined : Number(body.distanceKm);
  if (!text(body.type) || !activityTypes.includes(body.type as (typeof activityTypes)[number])) {
    return response.status(400).json({ error: 'type must be running, walking, strength, cycling, or other' });
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
    return response.status(400).json({ error: 'durationMinutes must be an integer from 1 to 600' });
  }
  if (distanceKm !== undefined && (!Number.isFinite(distanceKm) || distanceKm < 0)) {
    return response.status(400).json({ error: 'distanceKm must be a non-negative number' });
  }
  if (body.notes !== undefined && (!text(body.notes) || body.notes.length > 500)) {
    return response.status(400).json({ error: 'notes must be at most 500 characters' });
  }

  const user = await User.findById(request.userId);
  if (!user) return response.status(404).json({ error: 'User not found' });
  const teamId = user.team;
  const points = Math.max(1, Math.round(durationMinutes + (distanceKm ?? 0) * 5));
  const activity = await Activity.create({
    user: user._id,
    team: teamId,
    type: body.type,
    durationMinutes,
    ...(distanceKm === undefined ? {} : { distanceKm }),
    points,
    notes: text(body.notes) ? body.notes.trim() : '',
  });
  await User.updateOne({ _id: user._id }, { $inc: { points } });
  return response.status(201).json(activity);
});

router.get('/leaderboard', requireAuth, async (request, response) => {
  const now = new Date();
  const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const period = typeof request.query.period === 'string' ? request.query.period : currentPeriod;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return response.status(400).json({ error: 'period must use YYYY-MM format' });
  }

  const [year, month] = period.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; points: number }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$user', points: { $sum: '$points' } } },
    { $sort: { points: -1, _id: 1 } },
  ]);

  await LeaderboardEntry.deleteMany({ period, user: { $nin: totals.map(({ _id }) => _id) } });
  if (totals.length) {
    await LeaderboardEntry.bulkWrite(
      totals.map((entry, index) => ({
        updateOne: {
          filter: { period, user: entry._id },
          update: { $set: { points: entry.points, rank: index + 1 } },
          upsert: true,
        },
      })),
    );
  }

  const entries = await LeaderboardEntry.find({ period })
    .sort({ rank: 1 })
    .populate('user', 'username displayName')
    .lean();
  return response.json({ period, entries });
});

router.get('/workouts/suggestions', requireAuth, async (request, response) => {
  const user = await User.findById(request.userId).select('fitnessLevel goals');
  if (!user) return response.status(404).json({ error: 'User not found' });
  const workouts = await Workout.find({
    active: true,
    fitnessLevel: { $in: [user.fitnessLevel, 'all'] },
    $or: [{ goals: { $size: 0 } }, { goals: { $in: user.goals } }],
  }).sort({ durationMinutes: 1 });
  return response.json(workouts);
});

router.get('/workouts', requireAuth, async (_request, response) => {
  const workouts = await Workout.find({ active: true }).sort({ category: 1, title: 1 }).lean();
  return response.json(workouts);
});

export default router;