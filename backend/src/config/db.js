import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGO_URI) {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(
      `[db] MongoDB connection failed (${err.name || 'Error'}: ${err.message})${
        err.cause?.message ? ` — cause: ${err.cause.message}` : ''
      }`
    );
    console.error('      Check that MONGO_URI is set and the cluster is reachable.');
    process.exit(1);
  }
}
