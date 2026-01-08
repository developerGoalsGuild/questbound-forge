const { execSync } = require('child_process');

console.log('Running notification tests only...');

try {
  // Run only the notification tests
  const result = execSync('npx vitest run src/__tests__/notifications/QuestNotifications.test.tsx --reporter=verbose', {
    cwd: process.cwd(),
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('Notification tests completed successfully');
} catch (error) {
  console.error('Notification tests failed:', error.message);
  process.exit(1);
}
