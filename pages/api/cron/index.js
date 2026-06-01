import cron from "node-cron";
import "./cleanupJobs.js";

cron.schedule("0 0 * * *", () => {
  console.log("🔁 Running daily job cleanup...");
  import("./cleanupJobs.js");
});
