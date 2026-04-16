// Category tags for debate topics
export const CATEGORY_TAGS = [
  { id: "anything", label: "Anything Goes", icon: "🗣️" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "economics", label: "Economics", icon: "📈" },
  { id: "philosophy", label: "Philosophy", icon: "🧠" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "conspiracy", label: "Conspiracy", icon: "👁️" },
  { id: "pill", label: "Pill", icon: "💊" },
  { id: "religion", label: "Religion", icon: "🛐" },
] as const;

// Stance options per category with opposing pairs for matchmaking
export const STANCE_OPTIONS: Record<string, {
  label: string;
  icon: string;
  stances: { id: string; label: string; color: string }[];
  opposites: Record<string, string[]>;
}> = {
  politics: {
    label: "Politics", icon: "🏛️",
    stances: [
      { id: "democrat", label: "Democrat", color: "#3b82f6" },
      { id: "republican", label: "Republican", color: "#ef4444" },
      { id: "libertarian", label: "Libertarian", color: "#eab308" },
      { id: "independent", label: "Independent", color: "#8b5cf6" },
    ],
    opposites: { democrat: ["republican", "libertarian"], republican: ["democrat"], libertarian: ["democrat"], independent: [] },
  },
  economics: {
    label: "Economics", icon: "📈",
    stances: [
      { id: "capitalist", label: "Capitalist", color: "#10b981" },
      { id: "socialist", label: "Socialist", color: "#ef4444" },
      { id: "keynesian", label: "Keynesian", color: "#3b82f6" },
      { id: "austrian", label: "Austrian School", color: "#f59e0b" },
    ],
    opposites: { capitalist: ["socialist"], socialist: ["capitalist", "austrian"], keynesian: ["austrian"], austrian: ["keynesian", "socialist"] },
  },
  philosophy: {
    label: "Philosophy", icon: "🧠",
    stances: [
      { id: "rationalist", label: "Rationalist", color: "#3b82f6" },
      { id: "empiricist", label: "Empiricist", color: "#10b981" },
      { id: "nihilist", label: "Nihilist", color: "#6b7280" },
      { id: "existentialist", label: "Existentialist", color: "#8b5cf6" },
    ],
    opposites: { rationalist: ["empiricist", "nihilist"], empiricist: ["rationalist"], nihilist: ["existentialist", "rationalist"], existentialist: ["nihilist"] },
  },
  sports: {
    label: "Sports", icon: "⚽",
    stances: [
      { id: "statsFirst", label: "Stats-First", color: "#3b82f6" },
      { id: "eyeTest", label: "Eye Test", color: "#10b981" },
      { id: "oldSchool", label: "Old School", color: "#92400e" },
      { id: "newEra", label: "New Era", color: "#8b5cf6" },
    ],
    opposites: { statsFirst: ["eyeTest", "oldSchool"], eyeTest: ["statsFirst"], oldSchool: ["newEra", "statsFirst"], newEra: ["oldSchool"] },
  },
  conspiracy: {
    label: "Conspiracy", icon: "👁️",
    stances: [
      { id: "believer", label: "Believer", color: "#8b5cf6" },
      { id: "skeptic", label: "Skeptic", color: "#6b7280" },
      { id: "openMinded", label: "Open-Minded", color: "#10b981" },
      { id: "debunker", label: "Debunker", color: "#ef4444" },
    ],
    opposites: { believer: ["skeptic", "debunker"], skeptic: ["believer"], openMinded: ["debunker"], debunker: ["believer", "openMinded"] },
  },
  pill: {
    label: "Pill", icon: "💊",
    stances: [
      { id: "redPill", label: "Red Pill", color: "#ef4444" },
      { id: "bluePill", label: "Blue Pill", color: "#3b82f6" },
      { id: "blackPill", label: "Black Pill", color: "#1a1a1a" },
      { id: "whitePill", label: "White Pill", color: "#d1d5db" },
      { id: "purplePill", label: "Purple Pill", color: "#8b5cf6" },
      { id: "greyPill", label: "Grey Pill", color: "#6b7280" },
      { id: "greenPill", label: "Green Pill", color: "#10b981" },
      { id: "pinkPill", label: "Pink Pill", color: "#ec4899" },
    ],
    opposites: { redPill: ["bluePill", "purplePill"], bluePill: ["redPill", "blackPill"], blackPill: ["whitePill", "bluePill", "pinkPill"], whitePill: ["blackPill"], purplePill: ["redPill"], greyPill: ["redPill", "bluePill"], greenPill: ["blackPill", "greyPill"], pinkPill: ["blackPill", "greyPill"] },
  },
  religion: {
    label: "Religion", icon: "🛐",
    stances: [
      { id: "christianity", label: "Christianity", color: "#7c3aed" },
      { id: "islam", label: "Islam", color: "#059669" },
      { id: "atheism", label: "Atheism", color: "#64748b" },
      { id: "agnosticism", label: "Agnosticism", color: "#94a3b8" },
      { id: "buddhism", label: "Buddhism", color: "#d97706" },
      { id: "hinduism", label: "Hinduism", color: "#ea580c" },
      { id: "judaism", label: "Judaism", color: "#2563eb" },
      { id: "spiritual", label: "Spiritual", color: "#c026d3" },
    ],
    opposites: {
      christianity: ["atheism", "islam"], islam: ["atheism", "christianity"],
      atheism: ["christianity", "islam", "hinduism", "buddhism", "spiritual"],
      agnosticism: ["christianity", "islam"], buddhism: ["atheism"],
      hinduism: ["atheism", "islam"], judaism: ["atheism", "islam"],
      spiritual: ["atheism"],
    },
  },
};

// Debate topic pools
export const DEBATE_TOPICS: Record<string, { general: string[]; stancePairs: Record<string, string[]> }> = {
  politics: {
    general: ["Should voting be mandatory?", "Is the two-party system broken?", "Should there be term limits for Congress?"],
    stancePairs: {
      "democrat|republican": ["Is big government the solution or the problem?", "Should taxes on the wealthy be increased?", "Gun control: safety measure or rights violation?"],
      "libertarian|democrat": ["Should the government regulate social media?", "Is the welfare state helping or hurting?"],
    },
  },
  economics: {
    general: ["Is inflation always a monetary phenomenon?", "Should we return to the gold standard?", "Is UBI inevitable?"],
    stancePairs: {
      "capitalist|socialist": ["Should billionaires exist?", "Is profit inherently exploitative?", "Does trickle-down economics work?"],
      "keynesian|austrian": ["Should governments run deficits during recessions?", "Is central banking a net positive?"],
    },
  },
  philosophy: {
    general: ["Is free will an illusion?", "Does objective morality exist?", "Is consciousness just an emergent property?"],
    stancePairs: {
      "rationalist|empiricist": ["Can we know anything without experience?", "Is math discovered or invented?"],
      "nihilist|existentialist": ["Does life have inherent meaning?", "Is creating your own meaning just cope?"],
    },
  },
  anything: {
    general: ["What's the most overrated thing in society?", "Is humanity getting better or worse?", "Should we colonize Mars?", "Is the American Dream dead?", "Is social media a net negative?"],
    stancePairs: {},
  },
};
