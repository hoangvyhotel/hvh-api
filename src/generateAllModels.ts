import { MongoClient } from 'mongodb';
import { generateSchemaFromCollection } from './generateSchema';
import generateModelFile from './generateModel';
import dotenv from 'dotenv';

dotenv.config();

async function generateAllModels() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hvh_db';
  const dbName = 'hvh_db'; // Thay bằng tên database của bạn

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('No collections found in database:', dbName);
      return;
    }

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Processing collection: ${collectionName}`);
      const schema = await generateSchemaFromCollection(uri, dbName, collectionName);
      generateModelFile(collectionName, schema);
    }
  } catch (error) {
    console.error('Error generating models:', error);
  } finally {
    await client.close();
  }
}

generateAllModels().catch(console.error);