import { questions } from "../data/questions";
import { getMistakes, getQuestionStats } from "./storage";

export const getQuestionsFor = ({ grade, unit, modeType, limit }) => {
  const pool = questions.filter((q) => {
    const gradeMatch = grade === "mix" || q.grade === grade;
    const unitMatch = !unit || q.unit === unit;
    const modeMatch = !modeType || q.modeType === modeType || (modeType === "step" && q.steps?.length);
    return gradeMatch && unitMatch && modeMatch;
  });
  if (!limit) return shuffle(pool);
  const questionStats = getQuestionStats();
  const mistakeMap = new Map(getMistakes().map((item) => [item.questionId, item]));
  if (grade === "mix" && modeType === "quick") {
    return fillToLimit(weightedBalancedByGrade(pool, limit, questionStats, mistakeMap), pool, limit);
  }
  return fillToLimit(pickWeighted(pool, limit, questionStats, mistakeMap), pool, limit);
};

export const getQuestionById = (id) => questions.find((question) => question.id === id);

export const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const fillToLimit = (picked, pool, limit) => {
  if (!limit || picked.length >= limit || pool.length === 0) return picked.slice(0, limit);
  const result = picked.slice();
  while (result.length < limit) {
    result.push(...shuffle(pool).slice(0, limit - result.length));
  }
  return result.slice(0, limit);
};

const balancedByGrade = (items, limit = items.length) => {
  const buckets = [1, 2, 3].map((grade) => shuffle(items.filter((item) => item.grade === grade)));
  const picked = [];
  while (picked.length < limit && buckets.some((bucket) => bucket.length)) {
    buckets.forEach((bucket) => {
      if (picked.length < limit && bucket.length) picked.push(bucket.shift());
    });
  }
  return picked;
};

const weightedBalancedByGrade = (items, limit, questionStats, mistakeMap) => {
  const picked = [];
  const pickedIds = new Set();
  while (picked.length < limit && [1, 2, 3].some((grade) => items.some((item) => item.grade === grade && !pickedIds.has(item.id)))) {
    [1, 2, 3].forEach((grade) => {
      if (picked.length >= limit) return;
      const candidates = items.filter((item) => item.grade === grade && !pickedIds.has(item.id));
      const choice = pickOneWeighted(candidates, questionStats, mistakeMap);
      if (choice) {
        picked.push(choice);
        pickedIds.add(choice.id);
      }
    });
  }
  return picked;
};

const pickWeighted = (items, limit, questionStats, mistakeMap) => {
  const picked = [];
  const remaining = [...items];
  while (picked.length < limit && remaining.length) {
    const choice = pickOneWeighted(remaining, questionStats, mistakeMap);
    if (!choice) break;
    picked.push(choice);
    remaining.splice(remaining.findIndex((item) => item.id === choice.id), 1);
  }
  return picked;
};

const pickOneWeighted = (items, questionStats, mistakeMap) => {
  if (!items.length) return null;
  const weighted = items.map((item) => ({
    item,
    weight: questionWeight(item, questionStats[item.id], mistakeMap.get(item.id))
  }));
  const total = weighted.reduce((sum, row) => sum + row.weight, 0);
  let cursor = Math.random() * total;
  for (const row of weighted) {
    cursor -= row.weight;
    if (cursor <= 0) return row.item;
  }
  return weighted[weighted.length - 1]?.item || null;
};

const questionWeight = (question, stat, mistake) => {
  let weight = 10;
  const activeMistake = mistake && mistake.weak !== false && !mistake.mastered;

  if (activeMistake) {
    weight += mistake.status === "reviewing" ? 40 : 50;
    if (mistake.lastWrongAt || mistake.lastMistakeDate) weight += 20;
  }

  if (!stat || !stat.seenCount) {
    weight += 15;
  } else {
    const elapsedDays = daysSince(stat.lastSeenAt);
    if (elapsedDays >= 7) weight += 18;
    else if (elapsedDays >= 1) weight += 10;
    else weight -= 8;

    if ((Number(stat.correctCount) || 0) <= 1) weight += 8;
    if ((Number(stat.wrongCount) || 0) > 0) weight += Math.min(20, Number(stat.wrongCount) * 5);
    if ((Number(stat.hintLevelMax) || 0) >= 2) weight += 20;
    else if ((Number(stat.hintLevelMax) || 0) === 1) weight += 10;
    if (stat.lastResult === "correct" && elapsedDays < 1) weight -= 10;
  }

  if (question.modeType === "quick") weight += 2;
  return Math.max(1, weight);
};

const daysSince = (value) => {
  if (!value) return 999;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 999;
  return (Date.now() - time) / 86400000;
};

export const getUnitStats = (history, grade, unit) => {
  const rows = history.filter((item) => item.grade === grade && item.unit === unit);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const correct = rows.reduce((sum, row) => sum + row.correct, 0);
  return { total, correct, rate: total ? Math.round((correct / total) * 100) : 0 };
};

export const stampRules = ({ total, correct, unit, conquered = false, historyCount = 0 }) => {
  const stamps = [];
  if (historyCount === 0) stamps.push({ id: "first", name: "はじめてチャレンジ", icon: "star" });
  if (total >= 10) stamps.push({ id: "ten", name: "10問がんばった", icon: "medal" });
  if (correct >= 5) stamps.push({ id: "five-correct", name: "5問れんぞく正解", icon: "flower" });
  if (total > 0 && correct === total) stamps.push({ id: `perfect-${unit}`, name: "まんてん賞", icon: "gold" });
  if (unit === "九九") stamps.push({ id: "kuku", name: "九九マスター", icon: "seal" });
  if (unit?.includes("わり算")) stamps.push({ id: "division", name: "わり算チャレンジャー", icon: "seal" });
  if (conquered) stamps.push({ id: "weak-clear", name: "苦手こくふく", icon: "flower" });
  return stamps;
};
