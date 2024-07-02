// src/SubmissionProcessor.ts

import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export class SubmissionProcessor {
  private worker: Worker<any>;
  private redisPublisher;

  constructor(queueName: string) {
    this.worker = new Worker(
      queueName,
      this.processJob.bind(this),
      {
        connection: {
          host: '127.0.0.1',
          port: 6379
        }
      }
    );
    this.redisPublisher = new Redis({
        host: '127.0.0.1',
        port: 6379,
      });

    
  }

  private async processJob(job: Job<any>) {
    await this.evaluateSubmission(job);
  }

  private async evaluateSubmission(job: Job<any>): Promise<void> {
    // const message: string = job.data;
    // Simulate random evaluation results with a delay
    const results: string[] = ['SUCCESS', 'FAILURE', 'TLE'];
    const randomIndex = Math.floor(Math.random() * results.length);
    const result: string | undefined = results[randomIndex];
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay to simulate processing time
    console.log(`Evaluation result for User "${job.data.userId}": ${result}`);
//-----------------------------------------------------------------
    const channel = job.data.userId;
    const submissionRes = {
       userId: job.data.userId,
       problemId: job.data.problemId,
       result
    }
    await this.redisPublisher.publish(channel, JSON.stringify(submissionRes));
  }

  async close() {
    await this.worker.close();
  }
}
