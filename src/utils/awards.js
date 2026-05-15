export const AWARD_DEFINITIONS = [
  {
    id: "first_finish",
    title: "さんすう がんばり賞",
    description: "はじめてクイズをさいごまでできた",
    icon: "◎",
    message: "あなたは はじめてのクイズを さいごまでがんばりました。これからも楽しく さんすうをつづけましょう。"
  },
  {
    id: "perfect_score",
    title: "まんてん賞",
    description: "サクサク10問でぜんぶ正解した",
    icon: "100",
    message: "あなたは 10問中10問 正解しました。さいごまでよくがんばりました。"
  },
  {
    id: "step_thinker",
    title: "じっくり考えたで賞",
    description: "じっくり5問をさいごまでできた",
    icon: "◆",
    message: "あなたは 途中の考え方を じっくりたしかめながら さいごまでがんばりました。"
  },
  {
    id: "weak_conquer",
    title: "苦手こくふく賞",
    description: "苦手問題を1問以上こくふくした",
    icon: "◎",
    message: "あなたは 苦手だった問題を もう一度考えて、正解できました。あきらめない力がすばらしいです。"
  },
  {
    id: "kuku_master_award",
    title: "九九マスター賞",
    description: "九九で80点以上をとった",
    icon: "×",
    message: "あなたは 九九の問題で 高い点をとりました。九九マスターに近づいています。"
  },
  {
    id: "division_award",
    title: "わり算チャレンジ賞",
    description: "わり算で80点以上をとった",
    icon: "÷",
    message: "あなたは わり算の問題にチャレンジして、高い点をとりました。"
  },
  {
    id: "steady_award",
    title: "こつこつ学習賞",
    description: "3日以上、学習をつづけた",
    icon: "✓",
    message: "あなたは 日をわけて こつこつ学習をつづけました。つづける力がすばらしいです。"
  },
  {
    id: "focus_award",
    title: "集中力すごいで賞",
    description: "1日に3回、さいごまでできた",
    icon: "!",
    message: "あなたは 今日、3回以上チャレンジをさいごまでやりとげました。集中力がすごいです。"
  }
];

export const getAwardDefinition = (awardId) => AWARD_DEFINITIONS.find((award) => award.id === awardId);

export const normalizeEarnedAward = (award) => {
  if (!award) return null;
  if (award.awardId) return award;
  return {
    awardId: award.id,
    earnedAt: award.earnedAt || award.date || new Date().toISOString(),
    relatedGrade: award.relatedGrade,
    relatedUnit: award.relatedUnit,
    score: award.score,
    total: award.total,
    message: award.message
  };
};

export const hydrateAward = (earnedAward) => {
  const normalized = normalizeEarnedAward(earnedAward);
  const definition = getAwardDefinition(normalized?.awardId);
  return definition ? { ...definition, ...normalized } : normalized;
};

export const evaluateNewAwards = ({ currentEntry, history, existingAwards, masteredCount = 0 }) => {
  const earnedIds = new Set(existingAwards.map((award) => normalizeEarnedAward(award)?.awardId).filter(Boolean));
  const rate = currentEntry.total ? Math.round((currentEntry.correct / currentEntry.total) * 100) : 0;
  const today = currentEntry.date.slice(0, 10);
  const historyWithCurrent = [currentEntry, ...history];
  const learnedDays = new Set(historyWithCurrent.map((item) => item.date?.slice(0, 10)).filter(Boolean));
  const todaySessions = historyWithCurrent.filter((item) => item.date?.slice(0, 10) === today).length;
  const unit = currentEntry.unit || "";

  const candidates = [
    ["first_finish", history.length === 0],
    ["perfect_score", currentEntry.modeType === "quick" && currentEntry.total === 10 && currentEntry.correct === 10],
    ["step_thinker", currentEntry.modeType === "step" && currentEntry.total >= 5],
    ["weak_conquer", masteredCount > 0],
    ["kuku_master_award", unit === "九九" && rate >= 80],
    ["division_award", (unit.includes("わり算") || unit.includes("あまりのあるわり算")) && rate >= 80],
    ["steady_award", learnedDays.size >= 3],
    ["focus_award", todaySessions >= 3]
  ];

  return candidates
    .filter(([awardId, ok]) => ok && !earnedIds.has(awardId))
    .map(([awardId]) => {
      const definition = getAwardDefinition(awardId);
      return {
        awardId,
        earnedAt: currentEntry.date,
        relatedGrade: currentEntry.grade,
        relatedUnit: currentEntry.unit,
        score: currentEntry.correct,
        total: currentEntry.total,
        message: definition?.message || ""
      };
    });
};
