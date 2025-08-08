import express from 'express';

const router = express.Router();

const profiles = new Map();

router.post('/create', (req, res) => {
  const { name, age } = req.body;
  
  if (!name || !age) {
    return res.status(400).json({ error: 'Name and age are required' });
  }
  
  if (age < 5 || age > 40) {
    return res.status(400).json({ error: 'Age must be between 5 and 40' });
  }
  
  const profileId = `profile_${Date.now()}`;
  const profile = {
    id: profileId,
    name,
    age,
    createdAt: new Date(),
    progress: {
      level: 'beginner',
      completedExercises: [],
      totalPracticeTime: 0,
      achievements: []
    }
  };
  
  profiles.set(profileId, profile);
  
  res.json(profile);
});

router.get('/:id', (req, res) => {
  const profile = profiles.get(req.params.id);
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  res.json(profile);
});

router.put('/:id', (req, res) => {
  const profile = profiles.get(req.params.id);
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const updated = {
    ...profile,
    ...req.body,
    id: profile.id,
    createdAt: profile.createdAt
  };
  
  profiles.set(req.params.id, updated);
  res.json(updated);
});

router.get('/', (req, res) => {
  res.json(Array.from(profiles.values()));
});

export { router as profileRoutes };