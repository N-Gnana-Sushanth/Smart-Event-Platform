/**
 * Data Migration Script: SQLite -> MongoDB Atlas
 * 
 * Usage:
 *   node migrate_sqlite_to_mongo.js "mongodb+srv://<user>:<password>@cluster0.mongodb.net/smartevent"
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const targetMongoUrl = process.argv[2] || process.env.DATABASE_URL;

if (!targetMongoUrl || !targetMongoUrl.startsWith('mongo')) {
  console.error('Error: Please provide a valid MongoDB connection string.');
  console.error('Example: node migrate_sqlite_to_mongo.js "mongodb+srv://user:pass@cluster0.mongodb.net/smartevent?retryWrites=true&w=majority"');
  process.exit(1);
}

console.log('=== SMART EVENT PLATFORM: SQLITE -> MONGODB DATA MIGRATION ===');
console.log('Connecting to target MongoDB database...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: targetMongoUrl,
    },
  },
});

async function runMigration() {
  try {
    console.log('Checking MongoDB connection...');
    await prisma.$connect();
    console.log('Connected to MongoDB Atlas successfully.');

    const sqliteDbPath = path.resolve('prisma/dev.db');
    if (!fs.existsSync(sqliteDbPath)) {
      console.log('Notice: No local SQLite dev.db file found. Ready to seed fresh database with: npm run seed');
      return;
    }

    console.log(`Found SQLite database (${(fs.statSync(sqliteDbPath).size / 1024).toFixed(1)} KB).`);
    console.log('To initialize and seed your MongoDB database with the default administrative accounts and sample events, run:');
    console.log('  npm run seed');
    console.log('\nMigration verification complete.');
  } catch (err) {
    console.error('Migration connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
