// lib/checkpoint.js
import redis from "./redis.js";

// Generate unique Redis key per worker + job
export const checkpointKey = (workerName, jobId) =>
  `${workerName}:checkpoint:${jobId}`;

// Save checkpoint with 7-day expiry
export const saveCheckpoint = async (workerName, jobId, index) => {
  await redis.set(
    checkpointKey(workerName, jobId),
    index,
    "EX",
    60 * 60 * 24 * 7
  );
};

// Get existing checkpoint (defaults to 0)
export const getCheckpoint = async (workerName, jobId) => {
  const value = await redis.get(checkpointKey(workerName, jobId));
  return value ? parseInt(value) : 0;
};

// Delete checkpoint on completion
export const clearCheckpoint = async (workerName, jobId) => {
  await redis.del(checkpointKey(workerName, jobId));
};
