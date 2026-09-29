import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Activity } from '../models/Activity.js';
import { LeaderboardEntry } from '../models/LeaderboardEntry.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Workout } from '../models/Workout.js';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';
const demoPassword = 'OctofitDemo123!';

const demoUsers = [
  {
    username: 'maya_moves',
    displayName: 'Maya Rivera',
    email: 'maya@example.test',
    fitnessLevel: 'beginner',
    goals: ['endurance', 'healthy habits'],
  },
  {
    username: 'taylor_trains',
    displayName: 'Taylor Chen',
    email: 'taylor@example.test',
    fitnessLevel: 'intermediate',
    goals: ['strength'],
  },
  {
    username: 'casey_cycles',
    displayName: 'Casey Morgan',
    email: 'casey@example.test',
    fitnessLevel: 'beginner',
    goals: ['endurance'],
  },
] as const;

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase() {
  try {
    await mongoose.connect(connectionString);

    console.log('Connected to octofit_db');

    const starterWorkouts = [
      {
        title: 'Easy Interval Walk',
        description: 'Alternate a comfortable walk with short brisk intervals.',
        category: 'cardio',
        fitnessLevel: 'beginner',
        durationMinutes: 20,
        goals: ['endurance', 'healthy habits'],
        equipment: [],
      },
      {
        title: 'Bodyweight Strength Circuit',
        description: 'Complete controlled rounds of squats, wall push-ups, and glute bridges.',
        category: 'strength',
        fitnessLevel: 'all',
        durationMinutes: 18,
        goals: ['strength'],
        equipment: [],
      },
      {
        title: 'Full-Body Mobility Reset',
        description: 'Move gently through shoulder, hip, and ankle mobility exercises.',
        category: 'mobility',
        fitnessLevel: 'all',
        durationMinutes: 12,
        goals: [],
        equipment: [],
      },
    ];

    for (const workout of starterWorkouts) {
      await Workout.updateOne({ title: workout.title }, { $setOnInsert: workout }, { upsert: true });
    }

    const passwordHash = await bcrypt.hash(demoPassword, 12);
    const users = new Map();
    for (const demoUser of demoUsers) {
      const user = await User.findOneAndUpdate(
        { username: demoUser.username },
        {
          $set: {
            ...demoUser,
            passwordHash,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      users.set(demoUser.username, user);
    }

    const teamDefinitions = [
      {
        name: 'Trailblazers',
        description: 'Small steps, strong routines, and plenty of fresh air.',
        captain: 'maya_moves',
        members: ['maya_moves', 'casey_cycles'],
      },
      {
        name: 'Power Circuit',
        description: 'A team for building strength one session at a time.',
        captain: 'taylor_trains',
        members: ['taylor_trains'],
      },
    ] as const;
    const teams = new Map();
    for (const definition of teamDefinitions) {
      const team = await Team.findOneAndUpdate(
        { name: definition.name },
        {
          $set: {
            name: definition.name,
            description: definition.description,
            captain: users.get(definition.captain)._id,
            members: definition.members.map((username) => users.get(username)._id),
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      teams.set(definition.name, team);
    }

    const userTeams = new Map([
      ['maya_moves', 'Trailblazers'],
      ['casey_cycles', 'Trailblazers'],
      ['taylor_trains', 'Power Circuit'],
    ]);
    for (const [username, teamName] of userTeams) {
      await User.updateOne({ username }, { $set: { team: teams.get(teamName)._id } });
    }

    const activityDefinitions = [
      {
        username: 'maya_moves',
        team: 'Trailblazers',
        type: 'running',
        durationMinutes: 28,
        distanceKm: 3,
        points: 43,
        notes: 'Seed activity: Maya completed an easy neighborhood run.',
      },
      {
        username: 'taylor_trains',
        team: 'Power Circuit',
        type: 'strength',
        durationMinutes: 35,
        points: 35,
        notes: 'Seed activity: Taylor completed a bodyweight strength circuit.',
      },
      {
        username: 'casey_cycles',
        team: 'Trailblazers',
        type: 'walking',
        durationMinutes: 40,
        distanceKm: 2,
        points: 50,
        notes: 'Seed activity: Casey completed a brisk campus walk.',
      },
    ] as const;
    const seededAt = new Date();
    for (const definition of activityDefinitions) {
      const user = users.get(definition.username);
      await Activity.findOneAndUpdate(
        { user: user._id, notes: definition.notes },
        {
          $set: {
            user: user._id,
            team: teams.get(definition.team)._id,
            type: definition.type,
            durationMinutes: definition.durationMinutes,
            ...('distanceKm' in definition ? { distanceKm: definition.distanceKm } : {}),
            points: definition.points,
            notes: definition.notes,
            createdAt: seededAt,
          },
        },
        { new: true, upsert: true, runValidators: true, timestamps: false },
      );
    }

    const userIds = demoUsers.map((demoUser) => users.get(demoUser.username)._id);
    const lifetimeTotals = await Activity.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', points: { $sum: '$points' } } },
    ]);
    for (const total of lifetimeTotals) {
      await User.updateOne({ _id: total._id }, { $set: { points: total.points } });
    }

    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const monthlyTotals = await Activity.aggregate([
      { $match: { createdAt: { $gte: periodStart, $lt: periodEnd } } },
      { $group: { _id: '$user', points: { $sum: '$points' } } },
      { $sort: { points: -1, _id: 1 } },
    ]);

    await LeaderboardEntry.deleteMany({
      period,
      user: { $nin: monthlyTotals.map((entry) => entry._id) },
    });
    if (monthlyTotals.length) {
      await LeaderboardEntry.bulkWrite(
        monthlyTotals.map((entry, index) => ({
          updateOne: {
            filter: { period, user: entry._id },
            update: { $set: { points: entry.points, rank: index + 1 } },
            upsert: true,
          },
        })),
      );
    }

    console.log(
      `Database seeding complete: ${demoUsers.length} demo users, ${teamDefinitions.length} teams, ${activityDefinitions.length} activities, ${monthlyTotals.length} leaderboard entries, ${starterWorkouts.length} workouts. Demo password: ${demoPassword}`,
    );
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
