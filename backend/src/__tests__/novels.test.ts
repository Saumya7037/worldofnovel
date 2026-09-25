import { afterAll, describe, expect, it } from 'vitest';
import { api, registerUser, cleanupDatabase } from './helpers.js';

afterAll(cleanupDatabase);

const DOC = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello world once again' }] }] };

async function createNovelAgent(title = 'The Last Kingdom') {
  const { agent, user } = await registerUser();
  const res = await agent.post('/api/novels').send({ title });
  expect(res.status).toBe(201);
  return { agent, user, novel: res.body.novel };
}

describe('Novels API', () => {
  it('requires authentication', async () => {
    const res = await api.get('/api/novels');
    expect(res.status).toBe(401);
  });

  it('creates a novel with an empty front matter', async () => {
    const { novel } = await createNovelAgent();
    expect(novel.title).toBe('The Last Kingdom');
    expect(novel.chapters).toEqual([]);
    expect(novel.frontMatter?.content.type).toBe('doc');
  });

  it('creates a novel with front matter content', async () => {
    const { agent } = await registerUser();
    const res = await agent
      .post('/api/novels')
      .send({ title: 'Ember', frontMatterContent: DOC });
    expect(res.status).toBe(201);
    expect(res.body.novel.frontMatter.content.content[0].content[0].text).toBe(
      'hello world once again',
    );
  });

  it('lists novels with aggregate counts', async () => {
    const { agent } = await registerUser();
    const created = await agent.post('/api/novels').send({ title: 'Book A' });
    const novelId = created.body.novel.id;
    await agent
      .post(`/api/novels/${novelId}/chapters`)
      .send({ title: 'Chapter 1', content: DOC });
    await agent
      .post(`/api/novels/${novelId}/chapters`)
      .send({ title: 'Chapter 2', content: DOC });

    const list = await agent.get('/api/novels');
    expect(list.status).toBe(200);
    const mine = list.body.novels.find((n: { id: string }) => n.id === novelId);
    expect(mine.chapterCount).toBe(2);
    expect(mine.wordCount).toBe(8);
  });

  it('updates a novel', async () => {
    const { agent, novel } = await createNovelAgent();
    const res = await agent
      .put(`/api/novels/${novel.id}`)
      .send({ title: 'Renamed', genre: 'Fantasy', description: 'A story.' });
    expect(res.status).toBe(200);
    expect(res.body.novel.title).toBe('Renamed');
    expect(res.body.novel.genre).toBe('Fantasy');
  });

  it('rejects invalid updates', async () => {
    const { agent, novel } = await createNovelAgent();
    const res = await agent.put(`/api/novels/${novel.id}`).send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('deletes a novel', async () => {
    const { agent, novel } = await createNovelAgent();
    const res = await agent.delete(`/api/novels/${novel.id}`);
    expect(res.status).toBe(200);
    const get = await agent.get(`/api/novels/${novel.id}`);
    expect(get.status).toBe(404);
  });

  it('tracks progress as last opened chapter', async () => {
    const { agent, novel } = await createNovelAgent();
    const chapter = await agent.post(`/api/novels/${novel.id}/chapters`).send({
      title: 'C1',
      content: DOC,
    });
    const progress = await agent
      .put(`/api/novels/${novel.id}/progress`)
      .send({ chapterId: chapter.body.chapter.id });
    expect(progress.status).toBe(200);
    const detail = await agent.get(`/api/novels/${novel.id}`);
    expect(detail.body.novel.lastOpenedChapterId).toBe(chapter.body.chapter.id);
    expect(detail.body.novel.lastOpenedAt).toBeTruthy();
  });

  it('prevents user A from reading user B novel', async () => {
    const { novel } = await createNovelAgent();
    const { agent: other } = await registerUser();
    const res = await other.get(`/api/novels/${novel.id}`);
    expect(res.status).toBe(404);
  });

  it('prevents user A from modifying user B novel', async () => {
    const { novel } = await createNovelAgent();
    const { agent: other } = await registerUser();
    const put = await other.put(`/api/novels/${novel.id}`).send({ title: 'Hacked' });
    expect(put.status).toBe(404);
    const del = await other.delete(`/api/novels/${novel.id}`);
    expect(del.status).toBe(404);
  });
});