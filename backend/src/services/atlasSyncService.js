import mongoose from 'mongoose';
import Category from '../models/Category.js';

function getAtlasUri() {
  return (
    process.env.ATLAS_MONGO_URI ||
    'mongodb+srv://ramavathvamshicse_db_user:vamshi123@cluster0.p4u8yex.mongodb.net/?appName=Cluster0'
  );
}

async function getAtlasDb() {
  const uri = getAtlasUri();
  if (!uri) return null;
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  // By default when uri doesn't specify a db name, use 'test' (Atlas cluster default)
  const db = conn.useDb('test');
  return { conn, db };
}

export async function syncCategoryToAtlas(categoryDoc, { isDelete = false } = {}) {
  if (process.env.NODE_ENV === 'test' || !categoryDoc?._id) return;
  let connectionObj = null;
  try {
    connectionObj = await getAtlasDb();
    if (!connectionObj) return;
    const { db } = connectionObj;

    if (isDelete) {
      await db.collection('categories').deleteOne({ _id: categoryDoc._id });
      return;
    }

    await db.collection('categories').updateOne(
      { key: categoryDoc.key },
      {
        $set: {
          key: categoryDoc.key,
          name: categoryDoc.name,
          description: categoryDoc.description || '',
          color: categoryDoc.color,
          sortOrder: categoryDoc.sortOrder || 0,
          active: categoryDoc.active !== false,
          updatedAt: categoryDoc.updatedAt || new Date(),
        },
        $setOnInsert: {
          _id: categoryDoc._id,
          createdAt: categoryDoc.createdAt || new Date(),
          __v: categoryDoc.__v || 0,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[atlas-sync] Category sync skipped or failed:', err.message);
  } finally {
    if (connectionObj?.conn) await connectionObj.conn.close().catch(() => {});
  }
}

export async function syncStageToAtlas(stageDoc, { isDelete = false } = {}) {
  if (process.env.NODE_ENV === 'test' || !stageDoc?._id) return;
  let connectionObj = null;
  try {
    connectionObj = await getAtlasDb();
    if (!connectionObj) return;
    const { db } = connectionObj;

    if (isDelete) {
      await db.collection('stages').deleteOne({ _id: stageDoc._id });
      return;
    }

    await db.collection('stages').updateOne(
      { key: stageDoc.key },
      {
        $set: {
          key: stageDoc.key,
          name: stageDoc.name,
          color: stageDoc.color,
          sortOrder: stageDoc.sortOrder || 0,
          active: stageDoc.active !== false,
          updatedAt: stageDoc.updatedAt || new Date(),
        },
        $setOnInsert: {
          _id: stageDoc._id,
          createdAt: stageDoc.createdAt || new Date(),
          __v: stageDoc.__v || 0,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[atlas-sync] Stage sync skipped or failed:', err.message);
  } finally {
    if (connectionObj?.conn) await connectionObj.conn.close().catch(() => {});
  }
}

export async function syncKYCategoryToAtlas(kyCategoryDoc, { isDelete = false } = {}) {
  if (process.env.NODE_ENV === 'test' || !kyCategoryDoc?._id) return;
  let connectionObj = null;
  try {
    connectionObj = await getAtlasDb();
    if (!connectionObj) return;
    const { db } = connectionObj;

    if (isDelete) {
      await db.collection('kycategories').deleteOne({ _id: kyCategoryDoc._id });
      return;
    }

    const filter = kyCategoryDoc.kyRoot
      ? { key: kyCategoryDoc.key, kyRoot: kyCategoryDoc.kyRoot }
      : { key: kyCategoryDoc.key };

    await db.collection('kycategories').updateOne(
      filter,
      {
        $set: {
          key: kyCategoryDoc.key,
          name: kyCategoryDoc.name,
          description: kyCategoryDoc.description || '',
          color: kyCategoryDoc.color,
          sortOrder: kyCategoryDoc.sortOrder || 0,
          active: kyCategoryDoc.active !== false,
          kyRoot: kyCategoryDoc.kyRoot || null,
          businessType: kyCategoryDoc.businessType || null,
          updatedAt: kyCategoryDoc.updatedAt || new Date(),
        },
        $setOnInsert: {
          _id: kyCategoryDoc._id,
          createdAt: kyCategoryDoc.createdAt || new Date(),
          __v: kyCategoryDoc.__v || 0,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[atlas-sync] KYCategory sync skipped or failed:', err.message);
  } finally {
    if (connectionObj?.conn) await connectionObj.conn.close().catch(() => {});
  }
}

export async function syncQuestionToAtlas(questionDoc, { isDelete = false } = {}) {
  if (process.env.NODE_ENV === 'test' || !questionDoc?._id) return;
  let connectionObj = null;
  try {
    connectionObj = await getAtlasDb();
    if (!connectionObj) return;
    const { db } = connectionObj;

    if (isDelete) {
      await db.collection('questions').deleteOne({ _id: questionDoc._id });
      return;
    }

    // Remap category to atlas category ID
    let atlasCatId = questionDoc.category;
    const catId = questionDoc.category?._id || questionDoc.category;
    if (catId) {
      const localCat = await Category.findById(catId);
      if (localCat) {
        const atlasCat = await db.collection('categories').findOne({ key: localCat.key });
        if (atlasCat) atlasCatId = atlasCat._id;
      }
    }

    await db.collection('questions').updateOne(
      { _id: questionDoc._id },
      {
        $set: {
          text: questionDoc.text,
          category: atlasCatId,
          businessType: questionDoc.businessType || null,
          weight: questionDoc.weight,
          stageKey: questionDoc.stageKey || null,
          options: questionDoc.options,
          active: questionDoc.active,
          displayOrder: questionDoc.displayOrder,
          updatedAt: questionDoc.updatedAt || new Date(),
        },
        $setOnInsert: {
          _id: questionDoc._id,
          createdAt: questionDoc.createdAt || new Date(),
          __v: questionDoc.__v || 0,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[atlas-sync] Question sync skipped or failed:', err.message);
  } finally {
    if (connectionObj?.conn) await connectionObj.conn.close().catch(() => {});
  }
}
