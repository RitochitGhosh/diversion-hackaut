export async function register() {
  // Only run in the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startNotificationConsumer } = await import('./lib/rabbitmq');
    await startNotificationConsumer();
  }
}
