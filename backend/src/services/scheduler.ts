import cron from 'node-cron';
import { TaskModel } from '../models/Task';
import { mqttService } from './mqtt';

export function startScheduler() {
  // Run every hour to check for tasks that need to be reset
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled task reset check...');
    try {
      const tasksToReset = await TaskModel.getTasksToReset();
      const affectedKidIds = new Set<number>();

      for (const task of tasksToReset) {
        await TaskModel.resetTask(task.id);
        affectedKidIds.add(task.kid_id);
        console.log(`Reset task ${task.id}: ${task.title}`);
      }

      // Publish MQTT state updates for affected kids
      for (const kidId of affectedKidIds) {
        await mqttService.publishKidState(kidId);
      }

      if (tasksToReset.length > 0) {
        console.log(`Reset ${tasksToReset.length} task(s)`);
      }
    } catch (error) {
      console.error('Error during scheduled task reset:', error);
    }
  });

  console.log('Scheduler started - checking for tasks to reset every hour');
}
