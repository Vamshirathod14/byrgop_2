import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ATLAS_URI = 'mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0';
const BACKUP_DIR = path.resolve('backend/backups/atlas_pre_sync_20261001_142949');

async function backup() {
  console.log('Connecting to Atlas to export pre-sync backup...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const db = atlasConn.db;

  const collections = ['businesstypes', 'kycategories', 'knowyourselfquestions', 'domains', 'questions', 'categories', 'stages', 'resultcontents'];

  for (const colName of collections) {
    const docs = await db.collection(colName).find({}).toArray();
    const filePath = path.join(BACKUP_DIR, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`Backed up ${colName}: ${docs.length} documents -> ${filePath}`);
  }

  await atlasConn.close();
  console.log('Atlas backup completed successfully.');
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
