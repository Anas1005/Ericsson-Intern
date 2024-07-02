// src/NotificationSubscriber.ts

import { Redis } from 'ioredis';

export class Notifier {
  private redisSubscriber: Redis;
  private channel: string;

  constructor(channel: string) {
    this.channel = channel;
    this.redisSubscriber = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });

    this.subscribeToChannel();
    this.setupMessageHandler();
  }

  private subscribeToChannel() {
    this.redisSubscriber.subscribe(this.channel, (err, count) => {
      if (err) {
        console.error('Failed to subscribe: ', err.message);
      } else {
        console.log(`Subscribed successfully! This client is currently subscribed to  channel ${this.channel}.`);
      }
    });
  }

  private setupMessageHandler() {
    this.redisSubscriber.on('message', (channel, message) => {
      console.log(`Received message from ${channel}: ${message}`);
      this.processMessage(message);
    });
  }

  private processMessage(message: string) {
    // Process the message (e.g., send notification, log to database, etc.)
    console.log(`Notified to: ${message}`);
  }

  async quit() {
    await this.redisSubscriber.quit();
  }


}
