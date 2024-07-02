// src/MessageQueue.ts

import { Queue } from 'bullmq';

export class MessageQueue {
  private queue: Queue<any>;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, {
      connection: {
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: 24
      }
    });
  }

  async publish(jobName: string, data: string) {
    try {
      const parsedData = JSON.parse(data);
      await this.queue.add(jobName, parsedData);
      console.log(`Published for User'${' ' + parsedData.userId} Problem ${' ' + parsedData.problemId}'`);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  }

  async close() {
    await this.queue.close();
  }
}
