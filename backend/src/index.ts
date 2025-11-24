import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import kidsRouter from './routes/kids';
import tasksRouter from './routes/tasks';
import { startScheduler } from './services/scheduler';
import { initDatabase } from './database/db';
import { mqttService } from './services/mqtt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/kids', kidsRouter);
app.use('/api/tasks', tasksRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mqtt: mqttService.isEnabled() ? 'connected' : 'disabled'
  });
});

// Initialize database and start server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Initialize MQTT for Home Assistant integration
    await mqttService.initialize();

    // Start scheduler
    startScheduler();

    // Start server
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
