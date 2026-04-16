import { redis } from "./redis";
import { STANCE_OPTIONS, DEBATE_TOPICS } from "@/utils/constants";

// Redis key patterns
const QUEUE_KEY = (category: string) => `queue:${category}`;
const USER_QUEUE_KEY = (userId: string) => `user:queue:${userId}`;
const MATCH_KEY = (userId: string) => `match:${userId}`;

export interface QueueEntry {
  userId: string;
  username: string;
  category: string;
  stance: string;
  elo: number;
  joinedAt: number;
}

export interface MatchResult {
  debateId: string;
  category: string;
  topic: string;
  opponent: {
    userId: string;
    username: string;
    stance: string;
    elo: number;
  };
}

/**
 * Add a user to the matchmaking queue for a category
 */
export async function joinQueue(entry: QueueEntry): Promise<{ queued: boolean; match?: MatchResult }> {
  // Check if user is already in a queue
  const existingQueue = await redis.get<string>(USER_QUEUE_KEY(entry.userId));
  if (existingQueue) {
    // Remove from old queue first
    await leaveQueue(entry.userId);
  }

  // Try to find a match first before queuing
  const match = await findMatch(entry);
  if (match) {
    return { queued: false, match };
  }

  // No match found — add to queue
  const pipeline = redis.pipeline();
  pipeline.hset(QUEUE_KEY(entry.category), { [entry.userId]: JSON.stringify(entry) });
  pipeline.set(USER_QUEUE_KEY(entry.userId), entry.category, { ex: 300 }); // 5min TTL
  await pipeline.exec();

  return { queued: true };
}

/**
 * Remove a user from the matchmaking queue
 */
export async function leaveQueue(userId: string): Promise<void> {
  const category = await redis.get<string>(USER_QUEUE_KEY(userId));
  if (category) {
    const pipeline = redis.pipeline();
    pipeline.hdel(QUEUE_KEY(category), userId);
    pipeline.del(USER_QUEUE_KEY(userId));
    await pipeline.exec();
  }
}

/**
 * Check if a match has been found for a user
 */
export async function checkMatch(userId: string): Promise<MatchResult | null> {
  const match = await redis.get<MatchResult>(MATCH_KEY(userId));
  if (match) {
    // Clean up the match key after reading
    await redis.del(MATCH_KEY(userId));
    return match;
  }
  return null;
}

/**
 * Check if user is currently in queue
 */
export async function isInQueue(userId: string): Promise<string | null> {
  return await redis.get<string>(USER_QUEUE_KEY(userId));
}

/**
 * Find an opposing match in the queue
 */
async function findMatch(seeker: QueueEntry): Promise<MatchResult | null> {
  const queueData = await redis.hgetall<Record<string, string>>(QUEUE_KEY(seeker.category));
  if (!queueData || Object.keys(queueData).length === 0) return null;

  const categoryConfig = STANCE_OPTIONS[seeker.category];
  if (!categoryConfig) return null;

  // Get opposing stances for this user
  const opposingStances = categoryConfig.opposites[seeker.stance] || [];

  // Find best match: prioritize opposing stance, then closest ELO
  let bestMatch: QueueEntry | null = null;
  let bestEloDiff = Infinity;

  for (const [userId, entryJson] of Object.entries(queueData)) {
    if (userId === seeker.userId) continue;

    const entry: QueueEntry = typeof entryJson === "string" ? JSON.parse(entryJson) : entryJson;

    // Check if this user has an opposing stance
    const isOpposing = opposingStances.includes(entry.stance);
    if (!isOpposing) continue;

    // Pick closest ELO among opposing matches
    const eloDiff = Math.abs(seeker.elo - entry.elo);
    if (eloDiff < bestEloDiff) {
      bestEloDiff = eloDiff;
      bestMatch = entry;
    }
  }

  // Also allow "anything" category to match anyone
  if (!bestMatch && seeker.category === "anything") {
    for (const [userId, entryJson] of Object.entries(queueData)) {
      if (userId === seeker.userId) continue;
      const entry: QueueEntry = typeof entryJson === "string" ? JSON.parse(entryJson) : entryJson;
      const eloDiff = Math.abs(seeker.elo - entry.elo);
      if (eloDiff < bestEloDiff) {
        bestEloDiff = eloDiff;
        bestMatch = entry;
      }
    }
  }

  if (!bestMatch) return null;

  // Match found! Remove matched user from queue
  const pipeline = redis.pipeline();
  pipeline.hdel(QUEUE_KEY(seeker.category), bestMatch.userId);
  pipeline.del(USER_QUEUE_KEY(bestMatch.userId));
  await pipeline.exec();

  // Pick a debate topic
  const topic = pickTopic(seeker.category, seeker.stance, bestMatch.stance);

  // Generate a debate ID (will be replaced with Supabase insert)
  const debateId = crypto.randomUUID();

  // Store match result for the other user to pick up
  const matchForOpponent: MatchResult = {
    debateId,
    category: seeker.category,
    topic,
    opponent: {
      userId: seeker.userId,
      username: seeker.username,
      stance: seeker.stance,
      elo: seeker.elo,
    },
  };
  await redis.set(MATCH_KEY(bestMatch.userId), JSON.stringify(matchForOpponent), { ex: 60 });

  // Return match result for the seeker
  return {
    debateId,
    category: seeker.category,
    topic,
    opponent: {
      userId: bestMatch.userId,
      username: bestMatch.username,
      stance: bestMatch.stance,
      elo: bestMatch.elo,
    },
  };
}

/**
 * Pick a relevant debate topic based on category and stances
 */
function pickTopic(category: string, stanceA: string, stanceB: string): string {
  const topics = DEBATE_TOPICS[category];
  if (!topics) return "Open debate — pick your own topic!";

  // Try stance-specific topics first
  const pairKey1 = `${stanceA}|${stanceB}`;
  const pairKey2 = `${stanceB}|${stanceA}`;
  const stanceTopics = topics.stancePairs[pairKey1] || topics.stancePairs[pairKey2];

  if (stanceTopics && stanceTopics.length > 0) {
    return stanceTopics[Math.floor(Math.random() * stanceTopics.length)];
  }

  // Fall back to general topics
  if (topics.general.length > 0) {
    return topics.general[Math.floor(Math.random() * topics.general.length)];
  }

  return "Open debate — convince your opponent!";
}

/**
 * Get queue stats for display
 */
export async function getQueueStats(): Promise<Record<string, number>> {
  const categories = ["anything", "politics", "economics", "philosophy", "sports", "conspiracy", "pill", "religion"];
  const stats: Record<string, number> = {};

  for (const cat of categories) {
    const queueData = await redis.hgetall(QUEUE_KEY(cat));
    stats[cat] = queueData ? Object.keys(queueData).length : 0;
  }

  return stats;
}
