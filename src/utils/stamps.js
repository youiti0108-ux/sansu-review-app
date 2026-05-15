export const STAMP_DEFINITIONS = [
  {
    id: "first_challenge",
    name: "はじめてチャレンジ",
    description: "はじめてクイズをさいごまでできた",
    icon: "★",
    style: "star"
  },
  {
    id: "quick_10",
    name: "10問がんばった",
    description: "サクサク10問モードを1回さいごまでできた",
    icon: "●",
    style: "medal"
  },
  {
    id: "five_streak",
    name: "5問れんぞく正解",
    description: "1回のチャレンジで5問れんぞく正解した",
    icon: "◎",
    style: "flower"
  },
  {
    id: "perfect_10",
    name: "まんてん賞",
    description: "サクサク10問で10問中10問正解した",
    icon: "100",
    style: "gold"
  },
  {
    id: "step_challenge",
    name: "じっくりチャレンジ",
    description: "じっくり5問モードを1回さいごまでできた",
    icon: "◆",
    style: "seal"
  },
  {
    id: "weak_clear",
    name: "苦手こくふく",
    description: "苦手問題を1問以上こくふくした",
    icon: "◎",
    style: "flower"
  },
  {
    id: "kuku_master",
    name: "九九マスター",
    description: "九九で80点以上をとった",
    icon: "×",
    style: "medal"
  },
  {
    id: "division_challenger",
    name: "わり算チャレンジャー",
    description: "わり算で80点以上をとった",
    icon: "÷",
    style: "seal"
  },
  {
    id: "steady_3days",
    name: "こつこつ学習",
    description: "3日分、学習をつづけた",
    icon: "✓",
    style: "star"
  },
  {
    id: "focus_3sessions",
    name: "すごい集中力",
    description: "1日に3回、さいごまでできた",
    icon: "!",
    style: "gold"
  }
];

export const getStampDefinition = (stampId) => STAMP_DEFINITIONS.find((stamp) => stamp.id === stampId);

export const normalizeEarnedStamp = (stamp) => {
  if (!stamp) return null;
  if (stamp.stampId) return stamp;
  return {
    stampId: stamp.id,
    earnedAt: stamp.earnedAt || stamp.date || new Date().toISOString(),
    relatedGrade: stamp.relatedGrade,
    relatedUnit: stamp.relatedUnit
  };
};

export const evaluateNewStamps = ({ currentEntry, history, existingStamps, maxStreak = 0, masteredCount = 0 }) => {
  const earnedIds = new Set(existingStamps.map((stamp) => normalizeEarnedStamp(stamp)?.stampId).filter(Boolean));
  const rate = currentEntry.total ? Math.round((currentEntry.correct / currentEntry.total) * 100) : 0;
  const today = currentEntry.date.slice(0, 10);
  const historyWithCurrent = [currentEntry, ...history];
  const learnedDays = new Set(historyWithCurrent.map((item) => item.date?.slice(0, 10)).filter(Boolean));
  const todaySessions = historyWithCurrent.filter((item) => item.date?.slice(0, 10) === today).length;
  const unit = currentEntry.unit || "";

  const candidates = [
    ["first_challenge", history.length === 0],
    ["quick_10", currentEntry.modeType === "quick" && currentEntry.total >= 10],
    ["five_streak", maxStreak >= 5],
    ["perfect_10", currentEntry.modeType === "quick" && currentEntry.total === 10 && currentEntry.correct === 10],
    ["step_challenge", currentEntry.modeType === "step" && currentEntry.total >= 5],
    ["weak_clear", masteredCount > 0],
    ["kuku_master", unit === "九九" && rate >= 80],
    ["division_challenger", (unit.includes("わり算") || unit.includes("あまりのあるわり算")) && rate >= 80],
    ["steady_3days", learnedDays.size >= 3],
    ["focus_3sessions", todaySessions >= 3]
  ];

  return candidates
    .filter(([stampId, ok]) => ok && !earnedIds.has(stampId))
    .map(([stampId]) => ({
      stampId,
      earnedAt: currentEntry.date,
      relatedGrade: currentEntry.grade,
      relatedUnit: currentEntry.unit
    }));
};

export const hydrateStamp = (earnedStamp) => {
  const normalized = normalizeEarnedStamp(earnedStamp);
  const definition = getStampDefinition(normalized?.stampId);
  return definition ? { ...definition, ...normalized } : normalized;
};
