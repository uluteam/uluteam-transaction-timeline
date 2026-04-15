import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

const STORE_NAME = 'timelines';

export default async (req: Request, context: Context) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const url = new URL(req.url);
  const id = context.params?.id;

  // LIST all timelines
  if (req.method === 'GET' && !id) {
    const { blobs } = await store.list();
    const timelines = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: 'json' }) as any;
      if (data) {
        timelines.push({
          id: blob.key,
          property: data.property || 'Untitled',
          acceptanceDate: data.acceptanceDate || '',
          closingDate: data.closingDate || '',
          updatedAt: data.updatedAt || '',
          createdAt: data.createdAt || '',
          escrow: data.escrow || '',
          completedCount: data.completedCount || 0,
          totalCount: data.totalCount || 0,
        });
      }
    }
    timelines.sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return Response.json(timelines);
  }

  // GET a single timeline
  if (req.method === 'GET' && id) {
    const data = await store.get(id, { type: 'json' });
    if (!data) {
      return Response.json({ error: 'Timeline not found' }, { status: 404 });
    }
    return Response.json(data);
  }

  // CREATE or UPDATE a timeline
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = await req.json() as any;
    const timelineId = id || body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Check if existing
    const existing = await store.get(timelineId, { type: 'json' }) as any;

    const timeline = {
      ...body,
      id: timelineId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await store.setJSON(timelineId, timeline);
    return Response.json(timeline, { status: existing ? 200 : 201 });
  }

  // DELETE a timeline
  if (req.method === 'DELETE' && id) {
    await store.delete(id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config: Config = {
  path: ['/api/timelines', '/api/timelines/:id'],
};
