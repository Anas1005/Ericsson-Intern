// src/index.ts

import express from 'express';
import { Notifier } from './Notifier';

const app = express();
app.use(express.json());



let notifier : Notifier;

app.get('/', (req, res) => {
  // res.send('Notification server is running');
  const userId =  1 + Math.floor(Math.random() * 15) + 1;
  notifier = new Notifier(userId + '');

  return res.send({userId});

});

const PORT = process.env.PORT || 3004;
const server = app.listen(PORT, () => {
  console.log(`Notification server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, shutting down gracefully...');
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    notifier.quit().then(() => {
      console.log('Notification subscriber closed, server shutdown complete.');
      process.exit(0);
    }).catch(error => {
      console.error('Error closing notification subscriber:', error);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
