import { col, strip, withId } from '@/lib/db';

export const PAGE_SIZE = 25;

const sumIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const one = (arr, fallback) => (arr[0] ? strip(arr[0]) : fallback);

export async function getStats(guildId, since) {
  const [r] = await (await col('tickets')).aggregate([
    { $match: { guild_id: guildId, created_at: { $gte: since } } },
    {
      $facet: {
        totals: [{ $group: { _id: null, total: { $sum: 1 },
          open: sumIf({ $eq: ['$status', 'open'] }), closed: sumIf({ $eq: ['$status', 'closed'] }) } }],
        response: [
          { $match: { first_response_at: { $ne: null } } },
          { $group: { _id: null, avg_ms: { $avg: { $subtract: ['$first_response_at', '$created_at'] } } } },
        ],
        resolution: [
          { $match: { status: 'closed', closed_at: { $ne: null }, closed_by: { $nin: ['deleted', 'auto', null] } } },
          { $group: { _id: null, avg_ms: { $avg: { $subtract: ['$closed_at', '$created_at'] } } } },
        ],
        rating: [
          { $match: { rating: { $ne: null } } },
          { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
        ],
        categories: [
          { $group: { _id: { $ifNull: ['$category_name', 'Umum'] }, n: { $sum: 1 } } },
          { $sort: { n: -1, _id: 1 } }, { $limit: 8 },
          { $project: { _id: 0, name: '$_id', n: 1 } },
        ],
        staff: [
          { $addFields: { staff_id: { $ifNull: ['$claimed_by', '$first_responder'] } } },
          { $match: { staff_id: { $ne: null } } },
          { $group: {
            _id: '$staff_id', n: { $sum: 1 }, rating: { $avg: '$rating' },
            first_response: { $avg: { $cond: [{ $isNumber: '$first_response_at' },
              { $subtract: ['$first_response_at', '$created_at'] }, null] } },
          } },
          { $sort: { n: -1, _id: 1 } }, { $limit: 10 },
          { $project: { _id: 0, staff_id: '$_id', n: 1, rating: 1, first_response: 1 } },
        ],
      },
    },
  ]).toArray();

  return {
    totals: one(r.totals, { total: 0, open: 0, closed: 0 }),
    response: one(r.response, { avg_ms: null }),
    resolution: one(r.resolution, { avg_ms: null }),
    rating: one(r.rating, { avg: null, n: 0 }),
    categories: r.categories,
    staff: r.staff,
  };
}

// Tanpa kolom transcript (besar); cukup flag has_transcript
const LIST_FIELDS = {
  number: 1, user_id: 1, status: 1, category_name: 1, priority: 1, claimed_by: 1, first_responder: 1,
  rating: 1, created_at: 1, closed_at: 1, message_count: 1, has_transcript: 1,
};
const HAS_TRANSCRIPT = { $eq: [{ $type: '$transcript' }, 'string'] };

// Filter: q (nomor tiket atau ID user), status, kategori. Halaman dimulai dari 1.
export async function listTickets(guildId, { q, status, category, page = 1 }) {
  const filter = { guild_id: guildId };

  const term = (q || '').trim();
  if (/^\d{1,8}$/.test(term)) filter.number = Number(term);
  else if (/^\d{15,25}$/.test(term)) filter.$or = [{ user_id: term }, { claimed_by: term }, { first_responder: term }];
  if (status === 'open' || status === 'closed') filter.status = status;
  if (category) {
    // 'Umum' juga mencakup tiket tanpa category_name
    if (category === 'Umum') filter.$and = [{ $or: [{ category_name: 'Umum' }, { category_name: null }] }];
    else filter.category_name = category;
  }

  const tickets = await col('tickets');
  const [total, rows] = await Promise.all([
    tickets.countDocuments(filter),
    tickets.aggregate([
      { $match: filter },
      { $sort: { created_at: -1, _id: -1 } },
      { $skip: (page - 1) * PAGE_SIZE },
      { $limit: PAGE_SIZE },
      { $addFields: { has_transcript: HAS_TRANSCRIPT } },
      { $project: LIST_FIELDS },
    ]).toArray(),
  ]);
  return { rows: rows.map(withId), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const listCategoryNames = async (guildId) =>
  (await (await col('tickets')).aggregate([
    { $match: { guild_id: guildId } },
    { $group: { _id: { $ifNull: ['$category_name', 'Umum'] } } },
    { $sort: { _id: 1 } },
  ]).toArray()).map((r) => r._id);

export async function getTicket(guildId, number) {
  const [t] = await (await col('tickets')).aggregate([
    { $match: { guild_id: guildId, number } },
    { $limit: 1 },
    { $addFields: { has_transcript: HAS_TRANSCRIPT } },
    { $project: { transcript: 0 } },
  ]).toArray();
  return withId(t);
}

export const getTranscript = async (guildId, number) =>
  (await col('tickets')).findOne({ guild_id: guildId, number }, { projection: { transcript: 1 } });

export const getGuildCategories = async (guildId) =>
  (await (await col('categories')).find({ guild_id: guildId }).sort({ _id: 1 }).toArray()).map(withId);

export const getGuildBlacklist = async (guildId) =>
  (await (await col('blacklist')).find({ guild_id: guildId }).sort({ created_at: -1 }).limit(50).toArray()).map(strip);
