import { afterAll, describe, expect, it } from 'vitest';
import { api, registerUser, cleanupDatabase } from './helpers.js';

afterAll(cleanupDatabase);

const DOC = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The quick brown fox jumps over the lazy dog.' }] }],
};

async function registerWithNovel() {
  const { agent, user } = await registerUser();
  const novel = await agent.post('/api/novels').send({ title: 'Novel A' });
  return { agent, user, novelId: novel.body.novel.id as string };
}

describe('Chapters API', () => {
  it('creates chapters with incremental ordering and word counts', async () => {
    const { agent, novelId } = await registerWithNovel();
    const c1 = await agent.post(`/api/novels/${novelId}/chapters`).send({
      title: 'First Light',
      content: DOC,
    });
    const c2 = await agent.post(`/api/novels/${novelId}/chapters`).send({
      title: 'Second Light',
      content: DOC,
    });
    expect(c1.status).toBe(201);
    expect(c2.status).toBe(201);
    expect(c1.body.chapter.chapterOrder).toBe(0);
    expect(c2.body.chapter.chapterOrder).toBe(1);
    expect(c1.body.chapter.wordCount).toBe(9);
  });

  it('lists chapters in order', async () => {
    const { agent, novelId } = await registerWithNovel();
    await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'Zed', content: DOC });
    await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'Able', content: DOC });
    const res = await agent.get(`/api/novels/${novelId}/chapters`);
    expect(res.status).toBe(200);
    expect(res.body.chapters[0].title).toBe('Zed');
    expect(res.body.chapters[1].title).toBe('Able');
  });

  it('updates chapter content and recomputes word count', async () => {
    const { agent, novelId } = await registerWithNovel();
    const c = await agent
      .post(`/api/novels/${novelId}/chapters`)
      .send({ title: 'C', content: DOC });
    const rename = await agent.put(`/api/chapters/${c.body.chapter.id}`).send({ title: 'Renamed' });
    expect(rename.body.chapter.title).toBe('Renamed');

    const shortDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    const edit = await agent.put(`/api/chapters/${c.body.chapter.id}`).send({ content: shortDoc });
    expect(edit.body.chapter.wordCount).toBe(0);
  });

  it('deletes a chapter', async () => {
    const { agent, novelId } = await registerWithNovel();
    const c = await agent
      .post(`/api/novels/${novelId}/chapters`)
      .send({ title: 'Doomed', content: DOC });
    const del = await agent.delete(`/api/chapters/${c.body.chapter.id}`);
    expect(del.status).toBe(200);
    const list = await agent.get(`/api/novels/${novelId}/chapters`);
    expect(list.body.chapters).toHaveLength(0);
  });

  it('reorders chapters', async () => {
    const { agent, novelId } = await registerWithNovel();
    const a = await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'A', content: DOC });
    const b = await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'B', content: DOC });
    const c = await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'C', content: DOC });
    const ids = [c.body.chapter.id, a.body.chapter.id, b.body.chapter.id];
    const res = await agent.post(`/api/novels/${novelId}/reorder`).send({ orderedIds: ids });
    expect(res.status).toBe(200);
    expect(res.body.chapters.map((ch: { title: string }) => ch.title)).toEqual(['C', 'A', 'B']);
  });

  it('rejects reorder when ids do not match novel chapters', async () => {
    const { agent, novelId } = await registerWithNovel();
    await agent.post(`/api/novels/${novelId}/chapters`).send({ title: 'A', content: DOC });
    const res = await agent
      .post(`/api/novels/${novelId}/reorder`)
      .send({ orderedIds: ['some-random-id'] });
    expect(res.status).toBe(400);
  });

  it('prevents user A from modifying user B chapter', async () => {
    const { agent, novelId } = await registerWithNovel();
    const c = await agent
      .post(`/api/novels/${novelId}/chapters`)
      .send({ title: 'Secret', content: DOC });
    const { agent: other } = await registerUser();
    const put = await other.put(`/api/chapters/${c.body.chapter.id}`).send({ title: 'Hacked' });
    expect(put.status).toBe(404);
    const del = await other.delete(`/api/chapters/${c.body.chapter.id}`);
    expect(del.status).toBe(404);
  });

  it('prevents creating chapters in another user novel', async () => {
    const { novelId } = await registerWithNovel();
    const { agent: other } = await registerUser();
    const res = await other.post(`/api/novels/${novelId}/chapters`).send({ title: 'Hack', content: DOC });
    expect(res.status).toBe(404);
  });
});

describe('Front Matter API', () => {
  it('returns an empty document by default', async () => {
    const { agent, novelId } = await registerWithNovel();
    const res = await agent.get(`/api/novels/${novelId}/front-matter`);
    expect(res.status).toBe(200);
    expect(res.body.frontMatter.content.type).toBe('doc');
  });

  it('updates front matter content', async () => {
    const { agent, novelId } = await registerWithNovel();
    const updated = await agent.put(`/api/novels/${novelId}/front-matter`).send({ content: DOC });
    expect(updated.status).toBe(200);
    const res = await agent.get(`/api/novels/${novelId}/front-matter`);
    expect(res.body.frontMatter.content).toEqual(DOC);
  });

  it('prevents user B from editing user A front matter', async () => {
    const { novelId } = await registerWithNovel();
    const { agent: other } = await registerUser();
    const res = await other.put(`/api/novels/${novelId}/front-matter`).send({ content: DOC });
    expect(res.status).toBe(404);
  });
});