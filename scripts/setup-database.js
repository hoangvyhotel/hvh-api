#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hvh_hotel';
const DATABASE_NAME = process.env.DATABASE_NAME || 'hvh_hotel';

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database-schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Setting up database schema...');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Parse and execute MongoDB commands
      const commands = parseMongoCommands(schemaContent);
      
      for (const command of commands) {
        try {
          await executeMongoCommand(db, command);
        } catch (error) {
          console.warn(`⚠️  Warning executing command: ${error.message}`);
        }
      }
      
      console.log('✅ Database schema setup completed');
    } else {
      console.log('⚠️  Schema file not found, skipping schema setup');
    }

    // Verify collections
    console.log('\n📊 Verifying database setup...');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log(`Database: ${DATABASE_NAME}`);
    console.log(`Connection: ${MONGODB_URI}`);

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

function parseMongoCommands(schemaContent) {
  const commands = [];
  const lines = schemaContent.split('\n');
  
  let currentCommand = '';
  let inMultiLine = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    // Check if this is a multi-line command
    if (trimmedLine.includes('db.createCollection') || 
        trimmedLine.includes('db.users.insertMany') ||
        trimmedLine.includes('db.rooms.insertMany')) {
      inMultiLine = true;
      currentCommand = trimmedLine;
    } else if (inMultiLine) {
      currentCommand += ' ' + trimmedLine;
      
      // Check if command ends
      if (trimmedLine.endsWith(');')) {
        commands.push(currentCommand);
        currentCommand = '';
        inMultiLine = false;
      }
    } else if (trimmedLine.startsWith('db.')) {
      commands.push(trimmedLine);
    }
  }
  
  return commands;
}

async function executeMongoCommand(db, command) {
  // Extract collection name and operation
  const match = command.match(/db\.(\w+)\.(\w+)/);
  if (!match) return;
  
  const [, collectionName, operation] = match;
  const collection = db.collection(collectionName);
  
  switch (operation) {
    case 'createIndex':
      // Parse index creation
      const indexMatch = command.match(/createIndex\(({[^}]+})/);
      if (indexMatch) {
        const indexSpec = eval(`(${indexMatch[1]})`);
        const optionsMatch = command.match(/,\s*({[^}]+})/);
        const options = optionsMatch ? eval(`(${optionsMatch[1]})`) : {};
        
        await collection.createIndex(indexSpec, options);
        console.log(`  ✅ Created index on ${collectionName}`);
      }
      break;
      
    case 'insertMany':
      // Parse insertMany operation
      const dataMatch = command.match(/insertMany\((\[[\s\S]*?\])/);
      if (dataMatch) {
        const data = eval(dataMatch[1]);
        await collection.insertMany(data);
        console.log(`  ✅ Inserted ${data.length} documents into ${collectionName}`);
      }
      break;
      
    default:
      console.log(`  ⚠️  Unknown operation: ${operation}`);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
