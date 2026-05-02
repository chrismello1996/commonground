// Category tags for debate topics
export const CATEGORY_TAGS = [
  { id: "anything", label: "Anything Goes", icon: "🗣️" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "economics", label: "Economics", icon: "📈" },
  { id: "philosophy", label: "Philosophy", icon: "🧠" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "culture", label: "Culture", icon: "🎭" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "conspiracy", label: "Conspiracy", icon: "👁️" },
  { id: "pill", label: "Pill", icon: "💊" },
  { id: "religion", label: "Religion", icon: "🛐" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "government", label: "Government", icon: "🏛️" },
  { id: "unpopular", label: "Unpopular", icon: "🌶️" },
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
  finance: {
    label: "Finance", icon: "💰",
    stances: [
      { id: "bull", label: "Bull", color: "#10b981" },
      { id: "bear", label: "Bear", color: "#ef4444" },
      { id: "diamondHands", label: "Diamond Hands", color: "#3b82f6" },
      { id: "paperHands", label: "Paper Hands", color: "#f59e0b" },
      { id: "degen", label: "Degen", color: "#8b5cf6" },
      { id: "valueInvestor", label: "Value Investor", color: "#0891b2" },
      { id: "dayTrader", label: "Day Trader", color: "#ec4899" },
      { id: "hodler", label: "HODLer", color: "#d97706" },
      { id: "goldBug", label: "Gold Bug", color: "#ca8a04" },
      { id: "cryptoMaxi", label: "Crypto Maxi", color: "#f97316" },
      { id: "tradFi", label: "TradFi", color: "#64748b" },
      { id: "deFi", label: "DeFi", color: "#6366f1" },
    ],
    opposites: {
      bull: ["bear", "paperHands"],
      bear: ["bull", "diamondHands", "degen"],
      diamondHands: ["paperHands", "bear"],
      paperHands: ["diamondHands", "bull", "hodler"],
      degen: ["valueInvestor", "bear", "tradFi"],
      valueInvestor: ["degen", "dayTrader"],
      dayTrader: ["hodler", "valueInvestor"],
      hodler: ["dayTrader", "paperHands"],
      goldBug: ["cryptoMaxi", "deFi", "degen"],
      cryptoMaxi: ["goldBug", "tradFi"],
      tradFi: ["deFi", "cryptoMaxi", "degen"],
      deFi: ["tradFi", "goldBug"],
    },
  },
  technology: {
    label: "Technology", icon: "💻",
    stances: [
      { id: "aiAccelerationist", label: "AI Accelerationist", color: "#10b981" },
      { id: "aiCautious", label: "AI Cautious", color: "#f59e0b" },
      { id: "techOptimist", label: "Tech Optimist", color: "#3b82f6" },
      { id: "techSkeptic", label: "Tech Skeptic", color: "#ef4444" },
    ],
    opposites: { aiAccelerationist: ["aiCautious"], aiCautious: ["aiAccelerationist"], techOptimist: ["techSkeptic"], techSkeptic: ["techOptimist"] },
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
  culture: {
    label: "Culture", icon: "🎭",
    stances: [
      { id: "progressive", label: "Progressive", color: "#3b82f6" },
      { id: "conservative", label: "Conservative", color: "#ef4444" },
      { id: "traditionalist", label: "Traditionalist", color: "#92400e" },
      { id: "modernist", label: "Modernist", color: "#8b5cf6" },
      { id: "centrist", label: "Centrist", color: "#6b7280" },
    ],
    opposites: { progressive: ["conservative", "traditionalist"], conservative: ["progressive", "modernist"], traditionalist: ["modernist", "progressive"], modernist: ["traditionalist", "conservative"], centrist: [] },
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
  unpopular: {
    label: "Unpopular", icon: "🌶️",
    stances: [
      { id: "contrarian", label: "Contrarian", color: "#ef4444" },
      { id: "radical", label: "Radical", color: "#8b5cf6" },
      { id: "mainstream", label: "Mainstream", color: "#6b7280" },
    ],
    opposites: { contrarian: ["mainstream"], radical: ["centrist", "mainstream"], mainstream: ["contrarian", "radical"] },
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
      { id: "catholicism", label: "Catholicism", color: "#6d28d9" },
      { id: "islam", label: "Islam", color: "#059669" },
      { id: "judaism", label: "Judaism", color: "#2563eb" },
      { id: "hinduism", label: "Hinduism", color: "#ea580c" },
      { id: "buddhism", label: "Buddhism", color: "#d97706" },
      { id: "sikhism", label: "Sikhism", color: "#0891b2" },
      { id: "atheism", label: "Atheism", color: "#64748b" },
      { id: "agnosticism", label: "Agnosticism", color: "#94a3b8" },
      { id: "spiritual", label: "Spiritual", color: "#c026d3" },
      { id: "mormonism", label: "Mormonism", color: "#1d4ed8" },
      { id: "orthodoxChristianity", label: "Orthodox Christianity", color: "#b91c1c" },
      { id: "protestantism", label: "Protestantism", color: "#4f46e5" },
      { id: "jehovahsWitness", label: "Jehovah's Witness", color: "#0e7490" },
      { id: "paganism", label: "Paganism", color: "#16a34a" },
      { id: "taoism", label: "Taoism", color: "#0d9488" },
      { id: "shinto", label: "Shinto", color: "#dc2626" },
      { id: "jainism", label: "Jainism", color: "#ca8a04" },
      { id: "zoroastrianism", label: "Zoroastrianism", color: "#b45309" },
      { id: "bahai", label: "Baha'i", color: "#7e22ce" },
      { id: "rastafari", label: "Rastafari", color: "#15803d" },
      { id: "scientology", label: "Scientology", color: "#0284c7" },
      { id: "deism", label: "Deism", color: "#78716c" },
      { id: "satanism", label: "Satanism", color: "#991b1b" },
    ],
    opposites: {
      christianity: ["atheism", "islam", "satanism"], catholicism: ["atheism", "protestantism", "satanism"], islam: ["atheism", "christianity", "hinduism"],
      judaism: ["atheism", "islam"], hinduism: ["atheism", "islam"], buddhism: ["atheism", "satanism"],
      sikhism: ["atheism"], atheism: ["christianity", "catholicism", "islam", "judaism", "hinduism", "buddhism", "spiritual", "mormonism", "scientology"],
      agnosticism: ["christianity", "islam", "scientology"], spiritual: ["atheism", "scientology"],
      mormonism: ["atheism", "catholicism"], orthodoxChristianity: ["atheism", "protestantism"],
      protestantism: ["atheism", "catholicism", "orthodoxChristianity"], jehovahsWitness: ["atheism", "satanism"],
      paganism: ["christianity", "islam", "atheism"], taoism: ["atheism", "satanism"],
      shinto: ["atheism", "islam"], jainism: ["atheism", "satanism"],
      zoroastrianism: ["atheism", "satanism"], bahai: ["atheism"],
      rastafari: ["atheism", "scientology"], scientology: ["atheism", "agnosticism", "spiritual"],
      deism: ["atheism", "christianity", "scientology"], satanism: ["christianity", "catholicism", "islam", "judaism", "buddhism"],
    },
  },
  government: {
    label: "Government", icon: "🏛️",
    stances: [
      { id: "democracy", label: "Democracy", color: "#3b82f6" },
      { id: "republic", label: "Constitutional Republic", color: "#2563eb" },
      { id: "socialism", label: "Socialism", color: "#ef4444" },
      { id: "communism", label: "Communism", color: "#dc2626" },
      { id: "fascism", label: "Fascism", color: "#1a1a1a" },
      { id: "anarchy", label: "Anarchism", color: "#6b7280" },
      { id: "monarchy", label: "Monarchy", color: "#d97706" },
      { id: "theocracy", label: "Theocracy", color: "#7c3aed" },
      { id: "libertarianism", label: "Libertarianism", color: "#eab308" },
      { id: "authoritarianism", label: "Authoritarianism", color: "#991b1b" },
      { id: "oligarchy", label: "Oligarchy", color: "#78716c" },
      { id: "technocracy", label: "Technocracy", color: "#0891b2" },
    ],
    opposites: {
      democracy: ["fascism", "authoritarianism", "monarchy", "oligarchy"],
      republic: ["communism", "fascism", "monarchy", "authoritarianism"],
      socialism: ["fascism", "libertarianism", "oligarchy"],
      communism: ["fascism", "libertarianism", "monarchy", "republic"],
      fascism: ["democracy", "communism", "anarchy", "republic", "socialism"],
      anarchy: ["fascism", "authoritarianism", "monarchy", "theocracy"],
      monarchy: ["democracy", "anarchy", "communism", "republic"],
      theocracy: ["anarchy", "democracy", "technocracy"],
      libertarianism: ["authoritarianism", "communism", "fascism", "theocracy"],
      authoritarianism: ["democracy", "anarchy", "libertarianism"],
      oligarchy: ["democracy", "socialism", "communism"],
      technocracy: ["theocracy", "monarchy", "anarchy"],
    },
  },
};

// Debate topic pools — stance-aware prompts per category
export const DEBATE_TOPICS: Record<string, { general: string[]; stancePairs: Record<string, string[]> }> = {
  politics: {
    general: ["Should voting be mandatory?", "Is the two-party system broken?", "Should there be term limits for Congress?", "Does the electoral college still make sense?", "Should the voting age be lowered to 16?"],
    stancePairs: {
      "democrat|republican": ["Is big government the solution or the problem?", "Should taxes on the wealthy be increased?", "Gun control: safety measure or rights violation?", "Is universal healthcare a right or a pipe dream?", "Immigration: open borders or secure borders?", "Should student loans be forgiven?"],
      "libertarian|democrat": ["Should the government regulate social media?", "Is the welfare state helping or hurting?", "Should drugs be fully decriminalized?"],
      "libertarian|republican": ["Should the government have any role in marriage?", "Is military spending out of control?", "Should we abolish the Federal Reserve?"],
    },
  },
  economics: {
    general: ["Is inflation always a monetary phenomenon?", "Should we return to the gold standard?", "Is UBI inevitable?", "Are we heading for a recession?", "Is the stock market rigged?"],
    stancePairs: {
      "capitalist|socialist": ["Should billionaires exist?", "Is profit inherently exploitative?", "Private healthcare vs single-payer: which delivers?", "Should workers own the means of production?", "Is wealth inequality the biggest threat to society?", "Does trickle-down economics work?"],
      "keynesian|austrian": ["Should governments run deficits during recessions?", "Is central banking a net positive?", "Does government spending actually stimulate growth?", "Are bailouts ever justified?"],
    },
  },
  technology: {
    general: ["Will AI replace most jobs in 10 years?", "Is social media destroying society?", "Should tech companies be broken up?", "Is privacy dead in the digital age?"],
    stancePairs: {
      "techOptimist|techSkeptic": ["Is technology making us smarter or dumber?", "Are smartphones ruining human connection?", "Is Silicon Valley a force for good?", "Should kids have access to smartphones?"],
      "aiAccelerationist|aiCautious": ["Should we pause AI development?", "Is AGI an existential risk or humanity's greatest tool?", "Should AI be open-sourced or regulated?", "Will AI make inequality worse or better?", "Is AI art real art?"],
    },
  },
  philosophy: {
    general: ["Is free will an illusion?", "Does objective morality exist?", "Is consciousness just an emergent property?", "Can you live a meaningful life without purpose?"],
    stancePairs: {
      "rationalist|empiricist": ["Can we know anything without experience?", "Is math discovered or invented?", "Are thought experiments valid evidence?"],
      "nihilist|existentialist": ["Does life have inherent meaning?", "Is creating your own meaning just cope?", "Is optimism rational or delusional?"],
    },
  },
  culture: {
    general: ["Is cancel culture real?", "Are gender roles natural or constructed?", "Is modern music worse than older music?", "Should art be separated from the artist?"],
    stancePairs: {
      "progressive|conservative": ["Is tradition worth preserving?", "Should society change faster or slower?", "Are Western values universal?", "Is political correctness helping or hurting?", "Is meritocracy a myth?"],
      "traditionalist|modernist": ["Was life better 50 years ago?", "Is the nuclear family the ideal structure?", "Has feminism gone too far?", "Is religion necessary for morality?"],
    },
  },
  sports: {
    general: ["Is the GOAT debate even possible?", "Should college athletes be paid?", "Are sports leagues too commercialized?", "Is esports a real sport?"],
    stancePairs: {
      "statsFirst|eyeTest": ["Do analytics ruin the fun of sports?", "Can stats capture clutch performance?", "Is the eye test more reliable than advanced metrics?"],
      "oldSchool|newEra": ["Were athletes tougher in the past?", "Is load management ruining competition?", "Are modern records less impressive due to technology?"],
    },
  },
  conspiracy: {
    general: ["Is the government hiding alien contact?", "Are we living in a simulation?", "Is the media trustworthy?", "Do secret societies control the world?"],
    stancePairs: {
      "believer|skeptic": ["Is questioning the narrative dangerous or necessary?", "Are conspiracy theorists paranoid or ahead of the curve?", "Should the government declassify everything?"],
      "believer|debunker": ["Is the moon landing real?", "Are pharmaceutical companies suppressing cures?", "Is climate change exaggerated for control?", "Was 9/11 an inside job?"],
    },
  },
  unpopular: {
    general: ["Most people are NPCs", "College is a scam for most people", "Social media should require ID verification", "Democracy is overrated"],
    stancePairs: {
      "contrarian|mainstream": ["Is going against the grain just edgy, or is it necessary?", "Are popular opinions popular because they're right?", "Is conformity the real danger?"],
      "radical|centrist": ["Is centrism just cowardice?", "Do radical ideas move society forward?", "Is compromise always the answer?"],
    },
  },
  pill: {
    general: ["Which pill ideology is the most accurate worldview?", "Are pill ideologies helpful or reductive?", "Is the matrix metaphor overused?"],
    stancePairs: {
      "redPill|bluePill": ["Is ignorance bliss?", "Is 'waking up' worth the cost?", "Are red-pillers seeing reality or just a different narrative?", "Is the mainstream view comfortable but wrong?"],
      "blackPill|whitePill": ["Is humanity doomed or redeemable?", "Can individual action change systemic problems?", "Is hope rational or naive?"],
    },
  },
  religion: {
    general: ["Can morality exist without religion?", "Should religion influence law?", "Is organized religion a net positive for humanity?", "Can science and faith coexist?"],
    stancePairs: {
      "christianity|atheism": ["Does God exist?", "Is the Bible literally true?", "Is faith a virtue or a weakness?", "Can atheists have objective morality?"],
      "islam|atheism": ["Is Islam compatible with Western values?", "Does secularism lead to moral decay?", "Is religious law ever justified in modern society?"],
      "christianity|islam": ["Is there one true religion?", "Can interfaith dialogue solve global conflict?", "Are Abrahamic religions more alike than different?"],
    },
  },
  government: {
    general: ["What is the ideal form of government?", "Is democracy the best system or just the least bad?", "Should governments have term limits?", "Is a benevolent dictatorship better than a dysfunctional democracy?", "Can any government truly represent the people?"],
    stancePairs: {
      "democracy|fascism": ["Is order more important than freedom?", "Does democracy lead to weak leadership?", "Can fascism ever be justified?", "Is mob rule worse than one-party rule?"],
      "democracy|authoritarianism": ["Is strong leadership worth sacrificing civil liberties?", "Do democracies make better long-term decisions?", "Is China's model more effective than Western democracy?"],
      "communism|libertarianism": ["Should the state own the means of production?", "Is private property a fundamental right or theft?", "Can a stateless society actually function?"],
      "socialism|libertarianism": ["Should healthcare be a public service or a private market?", "Are regulations necessary or oppressive?", "Is the free market fair without government intervention?"],
      "anarchy|authoritarianism": ["Is government inherently oppressive?", "Can society self-organize without a state?", "Is hierarchy natural or constructed?"],
      "monarchy|republic": ["Is hereditary rule ever legitimate?", "Are constitutional monarchies more stable than republics?", "Does tradition have value in governance?"],
      "democracy|oligarchy": ["Do the wealthy already run democracies?", "Is meritocracy just oligarchy with extra steps?", "Should the most qualified lead, regardless of popularity?"],
      "technocracy|theocracy": ["Should scientists or religious leaders guide society?", "Is evidence-based policy better than faith-based governance?", "Can morality be legislated without religion?"],
    },
  },
  finance: {
    general: ["Is the stock market a casino?", "Will crypto replace traditional currency?", "Is the next recession around the corner?", "Should you invest or pay off debt first?", "Is real estate still the best investment?"],
    stancePairs: {
      "bull|bear": ["Are we in a bubble or the start of a super cycle?", "Is the S&P 500 overvalued right now?", "Will the market crash in the next 12 months?", "Is buy-the-dip still a valid strategy?", "Are earnings actually supporting current valuations?", "Is this a bear market rally or a real recovery?"],
      "diamondHands|paperHands": ["Is holding through a 50% drawdown smart or delusional?", "When is selling not paper-handing?", "Is loss aversion a bigger problem than panic selling?", "Should you ever sell at a loss?"],
      "degen|valueInvestor": ["Is YOLO investing ever rational?", "Do meme stocks prove markets are irrational?", "Is fundamental analysis dead in the age of Reddit?", "Can you beat the market with vibes?"],
      "dayTrader|hodler": ["Is active trading a waste of time vs buy and hold?", "Can you consistently beat index funds with day trading?", "Is patience the most underrated trading strategy?", "Are day traders just paying fees to Wall Street?"],
      "goldBug|cryptoMaxi": ["Is Bitcoin digital gold or digital tulips?", "Will gold ever become irrelevant as a store of value?", "Is scarcity enough to make something valuable?", "Which survives a dollar collapse — gold or crypto?"],
      "tradFi|deFi": ["Is DeFi the future of finance or a house of cards?", "Can decentralized systems handle institutional-scale capital?", "Are banks obsolete or essential?", "Is yield farming just fancy gambling?"],
      "bull|paperHands": ["Is conviction the most important trait in investing?", "Does the average investor sell too early?", "Is FOMO a bigger threat than missing the top?"],
      "bear|degen": ["Is risk management overrated?", "Are bears just salty they missed the rally?", "Is leveraged trading ever smart?"],
    },
  },
  anything: {
    general: ["What's the most overrated thing in society?", "Is humanity getting better or worse?", "Should we colonize Mars?", "Is the American Dream dead?", "Are we in a simulation?", "Is social media a net negative?", "Should voting be mandatory?", "Is privacy dead?"],
    stancePairs: {},
  },
};

// ===== DEBATE FORMATS =====
export const DEBATE_FORMATS = {
  unstructured: {
    id: "unstructured",
    label: "Open Mic",
    icon: "🎙️",
    description: "No rules. Talk over each other. Pure chaos.",
    rounds: null,
    totalTime: null,
  },
  standard: {
    id: "standard",
    label: "Standard Debate",
    icon: "⚖️",
    description: "Opening → Rebuttals → Cross-exam → Closing",
    rounds: [
      { name: "Opening Statement", speaker: "A", duration: 120, description: "Side A presents their position" },
      { name: "Opening Statement", speaker: "B", duration: 120, description: "Side B presents their position" },
      { name: "Rebuttal", speaker: "A", duration: 90, description: "Side A responds to Side B" },
      { name: "Rebuttal", speaker: "B", duration: 90, description: "Side B responds to Side A" },
      { name: "Cross-Examination", speaker: "both", duration: 180, description: "Open back-and-forth questioning" },
      { name: "Closing Statement", speaker: "A", duration: 60, description: "Side A final remarks" },
      { name: "Closing Statement", speaker: "B", duration: 60, description: "Side B final remarks" },
    ],
    totalTime: 720,
  },
  quick: {
    id: "quick",
    label: "Quick Fire",
    icon: "⚡",
    description: "2-min rounds. Fast. No filler.",
    rounds: [
      { name: "Side A Speaks", speaker: "A", duration: 120, description: "Make your case" },
      { name: "Side B Speaks", speaker: "B", duration: 120, description: "Make your case" },
      { name: "Rebuttal A", speaker: "A", duration: 60, description: "Quick counter" },
      { name: "Rebuttal B", speaker: "B", duration: 60, description: "Quick counter" },
      { name: "Free-for-all", speaker: "both", duration: 120, description: "No holds barred" },
    ],
    totalTime: 480,
  },
  lincoln: {
    id: "lincoln",
    label: "Lincoln-Douglas",
    icon: "🎩",
    description: "Classic format. Long-form. For serious debaters.",
    rounds: [
      { name: "Affirmative Constructive", speaker: "A", duration: 360, description: "Build your full argument" },
      { name: "Cross-Examination", speaker: "B", duration: 180, description: "Side B questions Side A" },
      { name: "Negative Constructive", speaker: "B", duration: 420, description: "Counter-argument + rebuttal" },
      { name: "Cross-Examination", speaker: "A", duration: 180, description: "Side A questions Side B" },
      { name: "First Affirmative Rebuttal", speaker: "A", duration: 240, description: "Respond and rebuild" },
      { name: "Negative Rebuttal", speaker: "B", duration: 360, description: "Final negative case" },
      { name: "Second Affirmative Rebuttal", speaker: "A", duration: 180, description: "Last word" },
    ],
    totalTime: 1920,
  },
};

// ===== JURY CATEGORIES =====
export const JURY_CATEGORIES = [
  { id: "bestArgument", label: "Best Argument", icon: "🧠", description: "Most logical and well-structured points" },
  { id: "mostPersuasive", label: "Most Persuasive", icon: "🎯", description: "Changed minds or held the room" },
  { id: "bestFacts", label: "Best Use of Facts", icon: "📊", description: "Backed up claims with evidence" },
  { id: "bestMoment", label: "Best Moment", icon: "🔥", description: "The single best moment of the debate" },
];

// ===== CLIP BOUNTY PRESETS =====
export const BOUNTY_PRESETS = [
  { label: "Clip that!", cost: 25, icon: "✂️" },
  { label: "Fact check this!", cost: 50, icon: "🔍" },
  { label: "Best comeback", cost: 75, icon: "🔥" },
  { label: "Finish them!", cost: 100, icon: "💀" },
];

// ===== GIFT ITEMS =====
export const GIFT_ITEMS = [
  { emoji: "⚡", name: "Zap", cost: 10 },
  { emoji: "🔥", name: "Fire", cost: 50 },
  { emoji: "💎", name: "Diamond", cost: 100 },
  { emoji: "👑", name: "Crown", cost: 500 },
  { emoji: "🏆", name: "Trophy", cost: 1000 },
];

// ===== FACTION MOTTOS =====
export const FACTION_MOTTOS: Record<string, string> = {
  // Politics
  democrat: "Progress through policy", republican: "Tradition and freedom", libertarian: "Don't tread on me", independent: "Free from party lines",
  // Economics
  capitalist: "Free markets, free people", socialist: "Power to the workers", keynesian: "Smart spending wins", austrian: "Sound money, sound logic",
  // Technology
  aiAccelerationist: "Build it faster", aiCautious: "Slow down and think", techOptimist: "Tech saves everything", techSkeptic: "Question the machine",
  // Philosophy
  rationalist: "Logic above all", empiricist: "Show me the data", existentialist: "Create your own meaning", nihilist: "Nothing matters, debate anyway",
  // Culture
  progressive: "Forward, always", conservative: "Preserve what works", traditionalist: "Roots run deep", modernist: "Embrace the new", centrist: "Balance is strength",
  // Sports
  statsFirst: "Numbers don't lie", eyeTest: "Trust what you see", oldSchool: "Respect the game", newEra: "Evolution is inevitable",
  // Conspiracy
  believer: "Question everything", skeptic: "Prove it", debunker: "Facts over fiction", openMinded: "Truth is somewhere",
  // Unpopular
  contrarian: "Against the grain", radical: "Burn it down", mainstream: "Popular for a reason",
  // Pill
  redPill: "Hard truths only", bluePill: "Comfort in the known", blackPill: "Nothing matters anyway", whitePill: "Optimism wins",
  purplePill: "Take from both sides", greyPill: "Nuance over narrative", greenPill: "Growth mindset", pinkPill: "Self-improvement first",
  // Government
  democracy: "Power to the people", republic: "Liberty through law", socialism: "Equality for all", communism: "Workers of the world, unite",
  fascism: "Order above all", anarchy: "No gods, no masters", monarchy: "Born to rule", theocracy: "Divine authority",
  libertarianism: "Maximum freedom", authoritarianism: "Strength through control", oligarchy: "The capable lead", technocracy: "Governed by expertise",
  // Finance
  bull: "Stonks only go up", bear: "Winter is coming", diamondHands: "Never selling", paperHands: "Lock in profits",
  degen: "YOLO or die trying", valueInvestor: "Margin of safety", dayTrader: "Scalp the volatility", hodler: "Time in the market",
  goldBug: "Real money is heavy", cryptoMaxi: "Code is law", tradFi: "Trust the institutions", deFi: "Be your own bank",
  // Religion
  christianity: "Faith and grace", islam: "Submission to truth", judaism: "Covenant and debate", hinduism: "Many paths, one truth",
  buddhism: "Middle way", sikhism: "Service and equality", atheism: "Reason over faith", agnosticism: "Honest uncertainty",
  spiritual: "Inner truth", deism: "The clockmaker's world",
};

// ===== FAKE DATA FOR BROWSE/LEADERBOARD =====
export const FAKE_USERS = [
  { name: "DebateKing_42", elo: 1847, wins: 142, losses: 58, followers: 12400, color: "#10b981", categories: ["politics", "economics"], stances: { politics: "republican", economics: "capitalist", culture: "conservative", religion: "christianity" } },
  { name: "LogicLord", elo: 1723, wins: 98, losses: 45, followers: 8700, color: "#8B4513", categories: ["philosophy", "technology"], stances: { philosophy: "rationalist", technology: "aiAccelerationist", economics: "austrian", religion: "atheism" } },
  { name: "FreeThinker99", elo: 1695, wins: 201, losses: 112, followers: 15200, color: "#00f593", categories: ["conspiracy", "unpopular"], stances: { conspiracy: "believer", unpopular: "contrarian", politics: "libertarian", pill: "redPill" } },
  { name: "DevilsAdvocate", elo: 1654, wins: 88, losses: 52, followers: 6300, color: "#ffb74d", categories: ["politics", "philosophy"], stances: { politics: "democrat", philosophy: "existentialist", culture: "progressive", pill: "bluePill" } },
  { name: "PolicyWonk", elo: 1612, wins: 76, losses: 48, followers: 4800, color: "#64b5f6", categories: ["politics", "economics"], stances: { politics: "democrat", economics: "keynesian", technology: "techOptimist", religion: "agnosticism" } },
  { name: "SkepticalMind", elo: 1589, wins: 134, losses: 89, followers: 9100, color: "#8B4513", categories: ["philosophy", "conspiracy"], stances: { philosophy: "empiricist", conspiracy: "skeptic", technology: "techSkeptic", religion: "buddhism" } },
  { name: "RationalRex", elo: 1567, wins: 67, losses: 39, followers: 3200, color: "#ffd43b", categories: ["technology", "economics"], stances: { technology: "techOptimist", economics: "capitalist", philosophy: "rationalist" } },
  { name: "ThinkTankTina", elo: 1545, wins: 112, losses: 78, followers: 7600, color: "#4dd0e1", categories: ["culture", "politics"], stances: { culture: "progressive", politics: "democrat", economics: "socialist", religion: "spiritual" } },
  { name: "MarketBull", elo: 1534, wins: 55, losses: 33, followers: 11200, color: "#ff7043", categories: ["economics", "technology"], stances: { economics: "capitalist", technology: "aiAccelerationist", sports: "statsFirst" } },
  { name: "BearCase", elo: 1498, wins: 44, losses: 30, followers: 5400, color: "#ab47bc", categories: ["economics", "politics"], stances: { economics: "keynesian", politics: "independent", culture: "modernist" } },
  { name: "AlphaDebater", elo: 1476, wins: 89, losses: 67, followers: 4100, color: "#26c6da", categories: ["sports", "culture"], stances: { sports: "eyeTest", culture: "conservative", unpopular: "mainstream" } },
  { name: "ContraryView", elo: 1455, wins: 38, losses: 28, followers: 2800, color: "#ef5350", categories: ["unpopular", "philosophy"], stances: { unpopular: "contrarian", philosophy: "nihilist", conspiracy: "openMinded", pill: "blackPill" } },
  { name: "SigmaGrind", elo: 1423, wins: 156, losses: 134, followers: 18900, color: "#66bb6a", categories: ["culture", "sports"], stances: { culture: "traditionalist", sports: "oldSchool", politics: "republican", pill: "redPill", religion: "islam" } },
  { name: "W_Takes_Only", elo: 1401, wins: 72, losses: 61, followers: 8200, color: "#ffa726", categories: ["conspiracy", "unpopular"], stances: { conspiracy: "believer", unpopular: "radical", philosophy: "nihilist", pill: "blackPill" } },
  { name: "RizzDebater", elo: 1388, wins: 33, losses: 25, followers: 22100, color: "#42a5f5", categories: ["culture", "sports"], stances: { culture: "modernist", sports: "newEra", technology: "techOptimist", pill: "pinkPill" } },
  { name: "TouchGrass420", elo: 1367, wins: 29, losses: 24, followers: 3100, color: "#7e57c2", categories: ["conspiracy", "technology"], stances: { conspiracy: "debunker", technology: "aiCautious", economics: "socialist", pill: "greenPill" } },
];

export const STREAM_TITLES = [
  "HEATED: Capitalism vs Socialism - who cooks?",
  "Is AI going to replace your job? No filter.",
  "Hot takes on the housing market - come at me",
  "Crypto dead or sleeping? Open mic",
  "Say whatever you want - ZERO censorship",
  "Debating strangers until I lose",
  "Election year takes - unfiltered",
  "Billionaires shouldn't exist - change my mind",
  "Is college a scam? Real talk no cap",
  "OPEN MIC: Any topic. Any opinion. No rules.",
  "Conspiracy hour - come with receipts",
  "Unpopular opinions ONLY - soft people DNE",
];

export const SCHEDULED_EVENTS = [
  { id: 1, title: "DebateKing_42 vs LogicLord - The Rematch", time: "Tonight 9PM EST", host: "DebateKing_42", interested: 2340, category: "anything" },
  { id: 2, title: "Open Mic Monday - Unpopular Opinions Only", time: "Monday 8PM EST", host: "FreeThinker99", interested: 1820, category: "unpopular" },
  { id: 3, title: "Bull vs Bear: Market Predictions Q2", time: "Wednesday 7PM EST", host: "MarketBull", interested: 3100, category: "economics" },
  { id: 4, title: "Conspiracy Deep Dive - Moon Landing Edition", time: "Friday 10PM EST", host: "SigmaGrind", interested: 4200, category: "conspiracy" },
];

export const CLIPS = [
  { id: 1, user: "DebateKing_42", title: "Absolutely destroyed his argument", views: 45200, likes: 3400, duration: 28, timeAgo: "2h ago" },
  { id: 2, user: "FreeThinker99", title: "The crowd went WILD after this take", views: 31800, likes: 2100, duration: 22, timeAgo: "4h ago" },
  { id: 3, user: "LogicLord", title: "When the facts don't care about feelings", views: 28400, likes: 1800, duration: 30, timeAgo: "6h ago" },
  { id: 4, user: "SigmaGrind", title: "Most unhinged argument I've ever heard", views: 67300, likes: 5200, duration: 15, timeAgo: "8h ago" },
  { id: 5, user: "RizzDebater", title: "Bro changed his mind mid-debate", views: 52100, likes: 4100, duration: 26, timeAgo: "12h ago" },
  { id: 6, user: "DevilsAdvocate", title: "This is why people watch Common Ground", views: 89700, likes: 7800, duration: 19, timeAgo: "1d ago" },
];

// Helper to format viewer counts
export const formatViewers = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
export const formatNumber = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
export const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
