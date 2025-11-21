import { Router, Request, Response } from 'express';
import { KidModel } from '../models/Kid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const kids = await KidModel.findAll();
    res.json(kids);
  } catch (error) {
    console.error('Error fetching kids:', error);
    res.status(500).json({ error: 'Failed to fetch kids' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const kid = await KidModel.findById(parseInt(req.params.id));
    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }
    res.json(kid);
  } catch (error) {
    console.error('Error fetching kid:', error);
    res.status(500).json({ error: 'Failed to fetch kid' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const kid = await KidModel.create(name, color);
    res.status(201).json(kid);
  } catch (error) {
    console.error('Error creating kid:', error);
    res.status(500).json({ error: 'Failed to create kid' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const kid = await KidModel.update(parseInt(req.params.id), name, color);
    if (!kid) {
      return res.status(404).json({ error: 'Kid not found' });
    }
    res.json(kid);
  } catch (error) {
    console.error('Error updating kid:', error);
    res.status(500).json({ error: 'Failed to update kid' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await KidModel.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Kid not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting kid:', error);
    res.status(500).json({ error: 'Failed to delete kid' });
  }
});

export default router;
