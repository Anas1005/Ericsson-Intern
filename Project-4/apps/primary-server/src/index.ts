import express from 'express';
import { MessageQueue } from './MessageQueue';

const app = express();
app.use(express.json());

const messageQueue = new MessageQueue('submissionQueue');

let userIdCounter = 1;
let problemIdCounter = 1;

const generateRandomSubmission = () => {
  const userId = userIdCounter++;
  const problemId = problemIdCounter++;
  const code = `function solution() { return ${Math.floor(Math.random() * 100)}; }`; // Random code snippet

  return { userId, problemId, code };
};

const submitRandomProblem = async () => {
  try {
    const submission = generateRandomSubmission();
    await messageQueue.publish('submit-job', JSON.stringify(submission));
    // console.log(`Random problem submission added: ${JSON.stringify(submission)}`);
  } catch (error) {
    console.error('Error submitting problem:', error);
  }
};

// Generate and submit a random problem every 4 seconds
const intervalId = setInterval(submitRandomProblem, 4000);

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`Primary server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, shutting down gracefully...');
  clearInterval(intervalId);
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    messageQueue.close().then(() => {
      console.log('Message queue closed, server shutdown complete.');
      process.exit(0);
    }).catch(error => {
      console.error('Error closing message queue:', error);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
