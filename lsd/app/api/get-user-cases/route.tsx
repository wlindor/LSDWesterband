import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

async function connectToDatabase(uri: string) {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);

  await client.connect();
  cachedClient = client;
  return client;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = req.query.user_id;

  if (typeof userId !== 'string') {
    res.status(400).json({ error: 'user_id is required and must be a string' });
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    res.status(500).json({ error: 'MongoDB URI is not set in environment variables' });
    return;
  }

  try {
    const client = await connectToDatabase(uri);
    const db = client.db('dbname'); // Use your actual database name here
    const cases = await db.collection('AllCases').find({ user_id: userId }).toArray();
    res.status(200).json(cases);
  } catch (error) {
    console.error('Error fetching user cases:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
