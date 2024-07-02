import express from 'express';
import { SubmissionProcessor } from './SubmissionProcessor';

const app = express();
app.use(express.json());

const submissionProcessor = new SubmissionProcessor('submissionQueue');

// Simple endpoint to verify server is running
app.get('/', (req, res) => {
  res.send('Judge server is running');
});

const PORT = process.env.PORT || 3003;
const server = app.listen(PORT, () => {
  console.log(`Judge server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, shutting down gracefully...');
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    submissionProcessor.close().then(() => {
      console.log('Submission processor closed, server shutdown complete.');
      process.exit(0);
    }).catch(error => {
      console.error('Error closing submission processor:', error);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
