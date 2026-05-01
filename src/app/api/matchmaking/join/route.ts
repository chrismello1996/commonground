import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { STANCE_OPTIONS, DEBATE_TOPICS } from "@/utils/constants";

const QUEUE_KEY = "matchmaking:queue";
const MATCH_PREFIX = "matchmaking:match:";

// Entries older than 60 seconds are considered stale
// (the client polls every 2s and re-joins, so fresh entries are always recent)
const STALE_THRESHOLD_MS = 60 * 1000;

interface QueueEntry {
  userId: string;
  category: string;
  stance?: string;
  joinedAt: number;
}

export async function POST(req: Request) {
  try {
    const { userId, category, stance } = await req.json();

    if (!userId || !category) {
      return NextResponse.json({ error: "Missing userId or category" }, { status: 400 });
    }

    // Check if user is suspended
    const supabaseCheck = await createClient();
    const { data: userProfile } = await supabaseCheck
      .from("users")
      .select("suspended_until, suspension_reason")
      .eq("id", userId)
      .single();

    if (userProfile?.suspended_until && new Date(userProfile.suspended_until) > new Date()) {
      return NextResponse.json(
        {
          error: "Your account is suspended",
          suspended_until: userProfile.suspended_until,
          reason: userProfile.suspension_reason,
        },
        { status: 403 }
      );
    }

    // Get all current queue entries
    const queueRaw = await redis.lrange(QUEUE_KEY, 0, -1);
    const now = Date.now();

    // === AGGRESSIVE STALE CLEANUP ===
    // Remove ALL stale entries upfront, not just during matching
    for (const raw of queueRaw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const isStale = parsed.joinedAt && now - parsed.joinedAt > STALE_THRESHOLD_MS;
      const isSelf = parsed.userId === userId;
      if (isStale || isSelf) {
        await redis.lrem(QUEUE_KEY, 0, raw); // 0 = remove ALL occurrences
      }
    }

    // Re-fetch cleaned queue
    const cleanedRaw = await redis.lrange(QUEUE_KEY, 0, -1);
    const queue: QueueEntry[] = cleanedRaw.map((entry) =>
      typeof entry === "string" ? JSON.parse(entry) : entry
    );

    // Try to find a match
    let matchedEntry: QueueEntry | null = null;

    for (const entry of queue) {
      if (entry.userId === userId) continue;

      // "Anything" matches anyone
      if (category === "anything" || entry.category === "anything") {
        matchedEntry = entry;
        break;
      }

      // Same category — check for opposing stances
      if (entry.category === category && stance && entry.stance) {
        const opposites = STANCE_OPTIONS[category]?.opposites?.[stance] || [];
        if (opposites.includes(entry.stance)) {
          matchedEntry = entry;
          break;
        }
      }
    }

    if (matchedEntry) {
      // Create a debate in Supabase
      const supabase = await createClient();

      // Pick a topic
      const debateCategory = category === "anything" ? matchedEntry.category || "anything" : category;
      const topicPool = DEBATE_TOPICS[debateCategory];
      let topic = "Open debate — discuss anything!";

      if (topicPool) {
        if (stance && matchedEntry.stance) {
          const pairKey1 = `${stance}|${matchedEntry.stance}`;
          const pairKey2 = `${matchedEntry.stance}|${stance}`;
          const pairTopics = topicPool.stancePairs[pairKey1] || topicPool.stancePairs[pairKey2];
          if (pairTopics && pairTopics.length > 0) {
            topic = pairTopics[Math.floor(Math.random() * pairTopics.length)];
          } else if (topicPool.general.length > 0) {
            topic = topicPool.general[Math.floor(Math.random() * topicPool.general.length)];
          }
        } else if (topicPool.general.length > 0) {
          topic = topicPool.general[Math.floor(Math.random() * topicPool.general.length)];
        }
      }

      const { data: debate, error: dbError } = await supabase
        .from("debates")
        .insert({
          user_a: userId,
          user_b: matchedEntry.userId,
          category: debateCategory,
          topic,
          status: "active",
          format: "1v1",
        })
        .select()
        .single();

      if (dbError || !debate) {
        return NextResponse.json(
          { error: "Failed to create debate" },
          { status: 500 }
        );
      }

      // Remove the matched user from queue (all occurrences)
      for (const raw of cleanedRaw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed.userId === matchedEntry.userId) {
          await redis.lrem(QUEUE_KEY, 0, raw);
        }
      }

      // Store match result for both users to poll
      const matchDataForSelf = JSON.stringify({
        debateId: debate.id,
        matched: true,
        topic,
        opponent: {
          userId: matchedEntry.userId,
          stance: matchedEntry.stance || "unknown",
        },
      });
      const matchDataForOpponent = JSON.stringify({
        debateId: debate.id,
        matched: true,
        topic,
        opponent: {
          userId: userId,
          stance: stance || "unknown",
        },
      });
      await redis.set(`${MATCH_PREFIX}${userId}`, matchDataForSelf, { ex: 120 });
      await redis.set(`${MATCH_PREFIX}${matchedEntry.userId}`, matchDataForOpponent, { ex: 120 });

      // Fetch opponent data
      const { data: opponentProfile } = await supabase
        .from("users")
        .select("username, elo")
        .eq("id", matchedEntry.userId)
        .single();

      return NextResponse.json({
        status: "matched",
        matched: true,
        debateId: debate.id,
        topic,
        opponent: {
          userId: matchedEntry.userId,
          username: opponentProfile?.username || "Unknown",
          stance: matchedEntry.stance || "unknown",
          elo: opponentProfile?.elo || 1200,
        },
      });
    }

    // No match found — add to queue with fresh timestamp
    const newEntry: QueueEntry = {
      userId,
      category,
      stance,
      joinedAt: Date.now(),
    };

    await redis.rpush(QUEUE_KEY, JSON.stringify(newEntry));

    return NextResponse.json({ status: "queued", matched: false, queued: true });
  } catch (error) {
    console.error("Matchmaking join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
