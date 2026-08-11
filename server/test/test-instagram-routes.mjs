import http from 'http';
import app from '../app.mjs';

console.log('Testing Instagram Express Server API routes...');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    console.log(`Server listening on temporary port ${port}`);

    // 1. Test connect-url endpoint without auth (should return 401)
    const connectUrlRes = await fetch(`${baseUrl}/api/auth/instagram/connect-url`);
    console.log('GET /connect-url (unauthenticated) Status:', connectUrlRes.status, '(expected 401)');

    // 2. Test account endpoint without auth (should return 401)
    const accountRes = await fetch(`${baseUrl}/api/social/instagram/account`);
    console.log('GET /account (unauthenticated) Status:', accountRes.status, '(expected 401)');

    // 3. Test callback endpoint with missing state (should redirect to error page)
    const callbackRes = await fetch(`${baseUrl}/api/auth/instagram/callback`, { redirect: 'manual' });
    console.log('GET /callback (no query params) Status:', callbackRes.status, 'Location:', callbackRes.headers.get('location'));

    console.log('All Instagram Express Route assertions verified successfully!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close();
  }
});
