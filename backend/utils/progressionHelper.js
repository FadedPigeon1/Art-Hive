import User from "../models/User.js";

// XP Constants
export const XP_REWARDS = {
  POST_CREATED: 10,
  LIKE_RECEIVED: 2,
  COMMENT_GIVEN: 5,
  COMMENT_RECEIVED: 5,
  REMIX_CREATED: 15,
  REMIX_RECEIVED: 10,
  DAILY_CHALLENGE: 50,
  GAME_PLAYED: 20,
  GAME_WON: 30,
  LOGIN_STREAK_BONUS: 5, // Per day in streak
};

// Achievement Definitions
export const ACHIEVEMENTS = {
  FIRST_POST: {
    id: "first_post",
    name: "First Masterpiece",
    description: "Upload your first artwork",
    icon: "🎨",
    condition: (stats) => stats.postsCreated >= 1,
  },
  PROLIFIC_ARTIST: {
    id: "prolific_artist",
    name: "Prolific Artist",
    description: "Create 10 artworks",
    icon: "🖼️",
    condition: (stats) => stats.postsCreated >= 10,
  },
  ART_MASTER: {
    id: "art_master",
    name: "Art Master",
    description: "Create 50 artworks",
    icon: "🏆",
    condition: (stats) => stats.postsCreated >= 50,
  },
  SOCIAL_BUTTERFLY: {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Receive 100 likes on your artwork",
    icon: "❤️",
    condition: (stats) => stats.likesReceived >= 100,
  },
  POPULAR_ARTIST: {
    id: "popular_artist",
    name: "Popular Artist",
    description: "Receive 500 likes on your artwork",
    icon: "⭐",
    condition: (stats) => stats.likesReceived >= 500,
  },
  REMIX_KING: {
    id: "remix_king",
    name: "Remix Royalty",
    description: "Create 20 remixes",
    icon: "🔄",
    condition: (stats) => stats.remixesCreated >= 20,
  },
  INSPIRATIONAL: {
    id: "inspirational",
    name: "Inspirational",
    description: "Have your art remixed 10 times",
    icon: "✨",
    condition: (stats) => stats.remixesReceived >= 10,
  },
  DEDICATED_ARTIST: {
    id: "dedicated_artist",
    name: "Dedicated Artist",
    description: "Complete a 7-day challenge streak",
    icon: "🔥",
    condition: (stats, user) => user.dailyChallengeStreak >= 7,
  },
  CHALLENGE_MASTER: {
    id: "challenge_master",
    name: "Challenge Master",
    description: "Complete 30 daily challenges",
    icon: "🎯",
    condition: (stats) => stats.challengesCompleted >= 30,
  },
  GAME_ENTHUSIAST: {
    id: "game_enthusiast",
    name: "Game Enthusiast",
    description: "Play 10 games",
    icon: "🎮",
    condition: (stats) => stats.gamesPlayed >= 10,
  },
  CONVERSATIONALIST: {
    id: "conversationalist",
    name: "Conversationalist",
    description: "Leave 50 comments",
    icon: "💬",
    condition: (stats) => stats.commentsGiven >= 50,
  },
  COMMUNITY_FAVORITE: {
    id: "community_favorite",
    name: "Community Favorite",
    description: "Receive 100 comments on your artwork",
    icon: "🌟",
    condition: (stats) => stats.commentsReceived >= 100,
  },
};

/**
 * Calculate required XP for a given level
 * Uses formula: baseXP * (level ^ 1.5)
 */
export const calculateRequiredXP = (level) => {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.5));
};

/**
 * Calculate level from total XP
 */
export const calculateLevelFromXP = (totalXP) => {
  let level = 1;
  let xpForNextLevel = calculateRequiredXP(level);
  let accumulatedXP = 0;

  while (accumulatedXP + xpForNextLevel <= totalXP) {
    accumulatedXP += xpForNextLevel;
    level++;
    xpForNextLevel = calculateRequiredXP(level);
  }

  return {
    level,
    currentXP: totalXP - accumulatedXP,
    xpForNextLevel,
  };
};

/**
 * Award XP to a user and handle level up
 * @param {String} userId - User ID
 * @param {Number} xpAmount - Amount of XP to award
 * @param {String} reason - Reason for XP award (for logging)
 * @returns {Object} - { leveledUp: Boolean, newLevel: Number, xpAwarded: Number }
 */
export const awardXP = async (userId, xpAmount, reason = "") => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const oldLevel = user.level;
    user.totalXP += xpAmount;

    // Calculate new level
    const levelInfo = calculateLevelFromXP(user.totalXP);
    user.level = levelInfo.level;
    user.xp = levelInfo.currentXP;

    const leveledUp = user.level > oldLevel;

    // Check for new achievements
    const newAchievements = await checkAchievements(user);

    await user.save();

    return {
      success: true,
      leveledUp,
      oldLevel,
      newLevel: user.level,
      xpAwarded: xpAmount,
      currentXP: user.xp,
      xpForNextLevel: levelInfo.xpForNextLevel,
      newAchievements,
      reason,
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check and unlock achievements for a user
 * @param {Object} user - User document
 * @returns {Array} - Array of newly unlocked achievements
 */
export const checkAchievements = async (user) => {
  const newAchievements = [];
  const currentAchievementIds = user.achievements.map((a) => a.id);

  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Skip if already unlocked
    if (currentAchievementIds.includes(achievement.id)) {
      continue;
    }

    // Check if condition is met
    if (achievement.condition(user.stats, user)) {
      const unlockedAchievement = {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlockedAt: new Date(),
      };

      user.achievements.push(unlockedAchievement);
      newAchievements.push(unlockedAchievement);
    }
  }

  return newAchievements;
};

/**
 * Update user stats and award XP
 * @param {String} userId - User ID
 * @param {String} statType - Type of stat to update
 * @param {Number} increment - Amount to increment (default 1)
 */
export const updateStatsAndAwardXP = async (
  userId,
  statType,
  increment = 1
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update stat
    if (user.stats[statType] !== undefined) {
      user.stats[statType] += increment;
    }

    await user.save();

    // Determine XP reward based on stat type
    let xpAmount = 0;
    let reason = "";

    switch (statType) {
      case "postsCreated":
        xpAmount = XP_REWARDS.POST_CREATED;
        reason = "Created a post";
        break;
      case "likesReceived":
        xpAmount = XP_REWARDS.LIKE_RECEIVED;
        reason = "Received a like";
        break;
      case "commentsGiven":
        xpAmount = XP_REWARDS.COMMENT_GIVEN;
        reason = "Left a comment";
        break;
      case "commentsReceived":
        xpAmount = XP_REWARDS.COMMENT_RECEIVED;
        reason = "Received a comment";
        break;
      case "remixesCreated":
        xpAmount = XP_REWARDS.REMIX_CREATED;
        reason = "Created a remix";
        break;
      case "remixesReceived":
        xpAmount = XP_REWARDS.REMIX_RECEIVED;
        reason = "Artwork was remixed";
        break;
      case "gamesPlayed":
        xpAmount = XP_REWARDS.GAME_PLAYED;
        reason = "Played a game";
        break;
      case "challengesCompleted":
        xpAmount = XP_REWARDS.DAILY_CHALLENGE;
        reason = "Completed daily challenge";
        break;
      default:
        return { success: true, xpAwarded: 0 };
    }

    // Award XP
    return await awardXP(userId, xpAmount, reason);
  } catch (error) {
    console.error("Error updating stats:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Calculate and update daily challenge streak
 * @param {Object} user - User document
 * @param {Date} completionDate - Date of completion
 */
export const updateChallengeStreak = (user, completionDate) => {
  const now = new Date(completionDate);
  const lastCompleted = user.lastChallengeCompletedAt;

  if (!lastCompleted) {
    // First challenge
    user.dailyChallengeStreak = 1;
  } else {
    const lastDate = new Date(lastCompleted);
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      user.dailyChallengeStreak += 1;
    } else if (daysDiff === 0) {
      // Same day (already completed)
      return false;
    } else {
      // Streak broken
      user.dailyChallengeStreak = 1;
    }
  }

  user.lastChallengeCompletedAt = now;
  return true;
};

/**
 * Get user progression summary
 * @param {String} userId - User ID
 */
export const getProgressionSummary = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const levelInfo = calculateLevelFromXP(user.totalXP);

    return {
      level: user.level,
      currentXP: user.xp,
      totalXP: user.totalXP,
      xpForNextLevel: levelInfo.xpForNextLevel,
      progressPercent: Math.floor((user.xp / levelInfo.xpForNextLevel) * 100),
      achievements: user.achievements,
      stats: user.stats,
      dailyChallengeStreak: user.dailyChallengeStreak,
    };
  } catch (error) {
    console.error("Error getting progression summary:", error);
    return null;
  }
};
