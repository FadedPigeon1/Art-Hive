import GameSession from "../models/GameSession.js";

export const startCleanupTask = () => {
  // Cleanup stale games periodically (every hour)
  setInterval(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await GameSession.deleteMany({
        updatedAt: { $lt: oneDayAgo },
      });
      if (result.deletedCount > 0) {
        console.log(
          `[CLEANUP] Deleted ${result.deletedCount} stale game sessions.`
        );
      }
    } catch (err) {
      console.error("[CLEANUP] Error cleaning up stale games:", err);
    }
  }, 60 * 60 * 1000); // Run every hour
};
