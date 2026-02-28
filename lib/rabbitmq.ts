import amqplib from 'amqplib';
import { db } from './db';

const QUEUE_NAME = 'notifications';

export type NotificationPayload = {
  userId: string;
  type: 'QUERY_SUBMITTED' | 'QUERY_ANSWERED' | 'QUERY_REJECTED' | 'QUERY_PENDING_REVIEW';
  title: string;
  message: string;
  queryId?: string;
  serviceId?: string;
};

// Singleton connection/channel held for the lifetime of the process
let _channel: amqplib.Channel | null = null;

async function getChannel(): Promise<amqplib.Channel | null> {
  if (_channel) return _channel;

  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  try {
    const conn = await amqplib.connect(url);
    conn.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      _channel = null;
    });
    conn.on('close', () => {
      console.warn('[RabbitMQ] Connection closed');
      _channel = null;
    });

    const ch = await conn.createChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });
    _channel = ch;
    return ch;
  } catch (err) {
    console.error('[RabbitMQ] Failed to connect:', (err as Error).message);
    return null;
  }
}

/**
 * Publish a notification event to the RabbitMQ queue.
 * Falls back to direct DB insert if RabbitMQ is unavailable.
 */
export async function publishNotification(payload: NotificationPayload): Promise<void> {
  const ch = await getChannel();

  if (ch) {
    try {
      ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });
      return;
    } catch (err) {
      console.error('[RabbitMQ] Failed to publish, falling back to DB:', (err as Error).message);
      _channel = null;
    }
  }

  // Fallback: write directly to DB when RabbitMQ is unavailable
  await saveNotificationToDB(payload);
}

async function saveNotificationToDB(payload: NotificationPayload): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        queryId: payload.queryId,
        serviceId: payload.serviceId,
      },
    });
  } catch (err) {
    console.error('[Notification] Failed to save to DB:', err);
  }
}

/**
 * Start the consumer that reads from the queue and persists to DB.
 * Called once on server startup via instrumentation.ts.
 */
export async function startNotificationConsumer(): Promise<void> {
  const ch = await getChannel();
  if (!ch) {
    console.warn('[RabbitMQ] Consumer not started — RabbitMQ unavailable. Notifications will write directly to DB.');
    return;
  }

  ch.prefetch(5);
  await ch.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;
    try {
      const payload: NotificationPayload = JSON.parse(msg.content.toString());
      await saveNotificationToDB(payload);
      ch.ack(msg);
    } catch (err) {
      console.error('[RabbitMQ] Failed to process notification message:', err);
      ch.nack(msg, false, false); // discard — avoid infinite requeue
    }
  });

  console.log('[RabbitMQ] Notification consumer started on queue:', QUEUE_NAME);
}
