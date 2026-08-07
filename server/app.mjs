import cors from 'cors';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';

import healthRoutes from './routes/health.mjs';
import authRoutes from './routes/auth.mjs';
import campaignRoutes from './routes/campaigns.mjs';
import contractRoutes from './routes/contracts.mjs';
import applicationRoutes from './routes/applications.mjs';
import decisionRoutes from './routes/decisions.mjs';
import notificationRoutes from './routes/notifications.mjs';
import userRoutes from './routes/users.mjs';
import workspaceRoutes from './routes/workspaces.mjs';
import dashboardRoutes from './routes/dashboard.mjs';
import paymentRoutes from './routes/payments.mjs';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const publishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const secretKey = process.env.CLERK_SECRET_KEY;

app.use((req, res, next) => {
  if (!publishableKey || !secretKey) {
    console.warn('[Clerk Warning] CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY is missing from environment variables.');
    return next();
  }
  return clerkMiddleware({ publishableKey, secretKey })(req, res, next);
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v1/brand/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

app.use((error, _req, res, _next) => {
  console.error('[API Error]', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error?.message || String(error),
  });
});

export default app;
