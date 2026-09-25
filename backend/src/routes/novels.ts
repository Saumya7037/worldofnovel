import { Router } from 'express';
import { requireAuth, type AuthedUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { novelCreateSchema, novelUpdateSchema } from '../schemas/novelSchemas.js';
import {
  chapterCreateSchema,
  chapterReorderSchema,
  frontMatterUpdateSchema,
} from '../schemas/chapterSchemas.js';
import {
  createNovel,
  deleteNovel,
  getNovelDetail,
  listNovels,
  updateNovel,
  updateProgress,
} from '../services/novelService.js';
import {
  createChapter,
  listChapters,
  reorderChapters,
} from '../services/chapterService.js';
import {
  getFrontMatter,
  updateFrontMatter,
} from '../services/frontMatterService.js';

export const novelsRouter = Router();

novelsRouter.use(requireAuth);

novelsRouter.get('/', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ novels: await listNovels(user.id) });
  } catch (err) {
    next(err);
  }
});

novelsRouter.post('/', validate(novelCreateSchema), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    const novel = await createNovel(user.id, req.body);
    res.status(201).json({ novel });
  } catch (err) {
    next(err);
  }
});

novelsRouter.get('/:id', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ novel: await getNovelDetail(req.params.id, user.id) });
  } catch (err) {
    next(err);
  }
});

novelsRouter.put('/:id', validate(novelUpdateSchema), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ novel: await updateNovel(req.params.id, user.id, req.body) });
  } catch (err) {
    next(err);
  }
});

novelsRouter.delete('/:id', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    await deleteNovel(req.params.id, user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

novelsRouter.put('/:id/progress', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    const chapterId = typeof req.body?.chapterId === 'string' ? req.body.chapterId : null;
    await updateProgress(req.params.id, user.id, chapterId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

novelsRouter.get('/:id/chapters', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ chapters: await listChapters(req.params.id, user.id) });
  } catch (err) {
    next(err);
  }
});

novelsRouter.post(
  '/:id/chapters',
  validate(chapterCreateSchema),
  async (req, res, next) => {
    try {
      const user = req.user as AuthedUser;
      const chapter = await createChapter(req.params.id, user.id, req.body);
      res.status(201).json({ chapter });
    } catch (err) {
      next(err);
    }
  },
);

novelsRouter.post('/:id/reorder', validate(chapterReorderSchema), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    const chapters = await reorderChapters(req.params.id, user.id, req.body.orderedIds);
    res.json({ chapters });
  } catch (err) {
    next(err);
  }
});

novelsRouter.get('/:id/front-matter', async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ frontMatter: await getFrontMatter(req.params.id, user.id) });
  } catch (err) {
    next(err);
  }
});

novelsRouter.put('/:id/front-matter', validate(frontMatterUpdateSchema), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    res.json({ frontMatter: await updateFrontMatter(req.params.id, user.id, req.body.content) });
  } catch (err) {
    next(err);
  }
});