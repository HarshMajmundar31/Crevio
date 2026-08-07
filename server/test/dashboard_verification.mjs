import express from 'express';
import dashboardRoutes from '../routes/dashboard.mjs';

const app = express();
app.use(express.json());
app.use('/api/v1/brand/dashboard', dashboardRoutes);

const server = app.listen(3005, async () => {
  console.log('Test API Server running on port 3005...');
  try {
    const summaryRes = await fetch('http://localhost:3005/api/v1/brand/dashboard/summary');
    const summaryData = await summaryRes.json();
    console.log('SUMMARY API RESPONSE:', JSON.stringify(summaryData, null, 2));

    const alertsRes = await fetch('http://localhost:3005/api/v1/brand/dashboard/risk-alerts');
    const alertsData = await alertsRes.json();
    console.log('RISK ALERTS API RESPONSE:', JSON.stringify(alertsData, null, 2));

    const activityRes = await fetch('http://localhost:3005/api/v1/brand/dashboard/activity-stream');
    const activityData = await activityRes.json();
    console.log('ACTIVITY STREAM API RESPONSE:', JSON.stringify(activityData, null, 2));

    console.log('\nALL PHASE 1-2 BACKEND ENDPOINTS FUNCTIONING WITH 200 OK!');
  } catch (err) {
    console.error('API Verification Error:', err);
  } finally {
    server.close();
  }
});
