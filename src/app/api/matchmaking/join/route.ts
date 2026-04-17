import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { STANCE_OPTIONS, DEBATE_TOPICS } from "@/utils/constants";

const QUEUE_KEY = "matchmaking:queue";
const MATCH_PREFIX = "matchmaking:match:";

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

    // Get all current queue entries
    const queueRaw = await redis.lrange(QUEUE_KEY, 0, -1);
    const queue: QueueEntry[] = queueRaw.map((entry) =>
      typeof entry === "string" ? JSON.parse(entry) : entry
    );

    // Remove any existing entry for this user (re-queue)
    const filtered = queue.filter((e) => e.userId !== userId);

    // Try to find a match
    let matchedEntry: QueueEntry | null = null;

    for (const entry of filtered) {
      // Can't match with yourself
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
        // Try stance-specific topic first
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

      // Remove the matched user from queue
      await redis.lrem(QUEUE_KEY, 1, JSON.stringify(matchedEntry));
      // Also try removing if stored as object
      for (const raw of queueRaw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed.userId === matchedEntry.userId) {
          await redis.lrem(QUEUE_KEY, 1, raw);
        }
      }

      // Store match result for both users to poll
      const matchData = JSON.stringify({ debateId: debate.id, matched: true });
      await redis.set(`${MATCH_PREFIX}${userId}`, matchData, { ex: 120 });
      await redis.set(`${MATCH_PREFIX}${matchedEntry.userId}`, matchData, { ex: 120 });

      return NextResponse.json({ matched: true, debateId: debate.id });
    }

    // No match found — add to queue
    const newEntry: QueueEntry = {
      userId,
      category,
      stance,
      joinedAt: Date.now(),
    };

    // Remove any old entry for this user first
    for (const raw of queueRaw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed.userId === userId) {
        await redis.lrem(QUEUE_KEY, 1, raw);
      }
    }

    await redis.rpush(QUEUE_KEY, JSON.stringify(newEntry));

    return NextResponse.json({ matched: false, queued: true });
  } catch (error) {
    console.error("Matchmaking join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
