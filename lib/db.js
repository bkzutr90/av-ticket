import { MongoClient } from 'mongodb';

function dbName() {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;
  const m = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.exec(process.env.MONGODB_URI || '');
  return m ? decodeURIComponent(m[1]) : 'ticketbot';
}

// Satu koneksi per instance (dipakai ulang antar request & hot reload di dev)
const g = globalThis;
function connect() {
  if (!g.__mongo) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI belum diisi');
    g.__mongo = new MongoClient(uri, { maxPoolSize: 10 }).connect()
      .catch((err) => { g.__mongo = undefined; throw err; });
  }
  return g.__mongo;
}

export const getDb = async () => (await connect()).db(dbName());
export const col = async (name) => (await getDb()).collection(name);

// Sama dengan helper di bot: _id dibuang, kecuali tickets/categories yang _id-nya jadi `id`
export const strip = (d) => { if (!d) return d; const { _id, ...rest } = d; return rest; };
export const withId = (d) => { if (!d) return d; const { _id, ...rest } = d; return { id: _id, ...rest }; };
