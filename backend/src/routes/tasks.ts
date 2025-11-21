import { Router, Request, Response } from 'express';
import { TaskModel, TaskStatus, RecurrenceType } from '../models/Task';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const kidId = req.query.kid_id;
    if (kidId) {
      const tasks = await TaskModel.findByKidId(parseInt(kidId as string));
      return res.json(tasks);
    }
    const tasks = await TaskModel.findAll();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await TaskModel.findById(parseInt(req.params.id));
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { kid_id, title, description, recurrence_type, recurrence_date } = req.body;
    if (!kid_id || !title) {
      return res.status(400).json({ error: 'kid_id and title are required' });
    }
    const task = await TaskModel.create(
      kid_id,
      title,
      description,
      recurrence_type || 'none',
      recurrence_date ? new Date(recurrence_date) : null
    );
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, recurrence_type, recurrence_date } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const task = await TaskModel.update(
      parseInt(req.params.id),
      title,
      description,
      recurrence_type || 'none',
      recurrence_date ? new Date(recurrence_date) : null
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const validStatuses: TaskStatus[] = ['zu_erledigen', 'mach_ich_gerade', 'erledigt'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const task = await TaskModel.updateStatus(parseInt(req.params.id), status);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await TaskModel.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
