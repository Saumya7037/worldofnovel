import { Router } from 'express';
import { requireAuth, type AuthedUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chapterUpdateSchema } from '../schemas/chapterSchemas.js';
import { deleteChapter, updateChapter } from '../services/chapterService.js';

export const chaptersRouter = Router();

chaptersRouter.use(requireAuth);

chaptersRouter.put('/:id', validate(chapterUpdateSchema), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ chapter: await updateChapter(req.params.id, user.id, req.body) });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.delete('/:id', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    await deleteChapter(req.params.id, user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});