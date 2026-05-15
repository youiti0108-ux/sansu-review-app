import { questions } from "../data/questions";

export const getQuestionsFor = ({ grade, unit, modeType, limit }) => {
  const pool = questions.filter((q) => {
    const gradeMatch = grade === "mix" || q.grade === grade;
    const unitMatch = !unit || q.unit === unit;
    const modeMatch = !modeType || q.modeType === modeType || (modeType === "step" && q.steps?.length);
    return gradeMatch && unitMatch && modeMatch;
  });
  if (grade === "mix" && modeType === "quick") return balancedByGrade(pool, limit);
  return shuffle(pool).slice(0, limit);
};

export const getQuestionById = (id) => questions.find((question) => question.id === id);

export const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

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
