import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import './config/database.js';
import apiRouter from './routes/api.js';

const app = express();
const port = Number(process.env.PORT) || 8000;
const codespaceName = process.env.CODESPACE_NAME;
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(codespaceName ? [`https://${codespaceName}-5173.app.github.dev`] : []),
  ...(process.env.FRONTEND_ORIGIN?.split(',').map((origin) => origin.trim()) ?? []),
]);

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  }),
);
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
  });
});

app.use('/api', apiRouter);

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    response.status(400).json({ error: error.message });
    return;
  }

  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    response.status(409).json({ error: 'A record with that value already exists' });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`OctoFit API listening on port ${port}`);
});