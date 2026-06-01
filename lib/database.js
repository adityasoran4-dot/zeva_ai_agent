import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env");
}

global.mongoose = global.mongoose || { conn: null, promise: null };
let cached = global.mongoose;

async function dbConnect() {
  if (cached.conn) {
    if (cached.conn.connection.db.databaseName !== "web") {
      console.log("⚠️ Connected to wrong database, reconnecting...");
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
    } else {
      return cached.conn;
    }
  }

  if (!cached.promise) {
    console.log("🟡 Connecting to MongoDB...");
    const uri = MONGODB_URI.includes("?") ? MONGODB_URI : `${MONGODB_URI}?authSource=admin`;
    console.log("🔗 Connection URI:", uri);

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      dbName: "web",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected successfully!");
      console.log("📍 Connected to database:", mongoose.connection.db.databaseName);
      return mongoose;
    }).catch(err => {
      console.error("❌ MongoDB connection error:", err);
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;


// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env");

// let cached = global.mongoose;
// if (!cached) cached = global.mongoose = { conn: null, promise: null };

// async function dbConnect() {
//   if (cached.conn) return cached.conn;

//   if (!cached.promise) {
//     console.log("🟡 Connecting to MongoDB...");
//     const uri = MONGODB_URI.includes("?") ? MONGODB_URI : `${MONGODB_URI}?authSource=admin`;

//     cached.promise = mongoose.connect(uri, {
//       dbName: "web",
//       bufferCommands: false,
//     }).then((mongoose) => {
//       console.log("✅ MongoDB connected successfully!");
//       return mongoose;
//     }).catch(err => {
//       cached.promise = null; // allow retry
//       console.error("❌ MongoDB connection error:", err);
//       throw err;
//     });
//   }

//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// export default dbConnect;
