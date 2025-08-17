import { MongoClient } from 'mongodb';

export async function generateSchemaFromCollection(uri: string, dbName: string, collectionName: string) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Lấy mẫu 10 document từ collection
    const documents = await collection.find().limit(10).toArray();

    // Suy ra schema
    const schema: { [key: string]: string } = {};
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (!schema[key]) {
          const type = key === '_id' ? 'objectId' : typeof doc[key];
          schema[key] = type === 'object' && doc[key] instanceof Date ? 'date' : type;
        }
      });
    });

    console.log(`Schema for ${collectionName}:`, schema);
    return schema;
  } finally {
    await client.close();
  }
}