// lib/fixMissingUsernames.js
import 'dotenv/config';
import dbConnect from './database.js';
import Blog from '../models/Blog.js';

(async () => {
  await dbConnect();

  const result = await Blog.updateMany(
    { comments: { $exists: true, $ne: [] } }, // only if comments array exists & not empty
    { $set: { "comments.$[elem].username": "Unknown" } }, // set missing usernames
    {
      arrayFilters: [{ "elem.username": { $exists: false } }],
      runValidators: false
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} blog documents.`);
  process.exit();
})();
