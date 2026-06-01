'use client';
import WorkSession from "../models/WorkSession";

export const getTodayArrivalTimesForUsers = async (userIds = []) => {
  if (!userIds.length) return {};

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const sessions = await WorkSession.find({
    date: { $gte: start, $lte: end },
    userId: { $in: userIds }
  }).select("userId arrivalTime");

  // map: userId -> arrivalTime
  const arrivalMap = {};
  sessions.forEach(s => {
    arrivalMap[s.userId.toString()] = s.arrivalTime;
  });

  return arrivalMap;
};
