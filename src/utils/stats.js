const toRows = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const buildStats = (history = [], mistakes = []) => {
  const historyRows = toRows(history);
  const mistakeRows = toRows(mistakes).map(normalizeMistakeRow);
  const today = todayKey();
  const activeMistakes = mistakeRows.filter((item) => item?.weak !== false && !item?.mastered);
  const reviewingMistakes = activeMistakes.filter((item) => item?.status === "reviewing");
  const masteredMistakes = mistakeRows.filter((item) => item?.mastered);
  const todayRows = historyRows.filter((item) => item?.date?.slice(0, 10) === today);
  const total = sum(historyRows, "total");
  const correct = sum(historyRows, "correct");
  const todayTotal = sum(todayRows, "total");
  const todayCorrect = sum(todayRows, "correct");
  const todayHintUsed = sum(todayRows, "hintUsedCount");
  const todayHint2Used = sum(todayRows, "hint2UsedCount");
  const todayNoHintCorrect = sum(todayRows, "noHintCorrectCount");
  const todayHintCorrect = sum(todayRows, "hintCorrectCount");
  const hintUsedCount = sum(historyRows, "hintUsedCount");
  const hint2UsedCount = sum(historyRows, "hint2UsedCount");
  const noHintCorrectCount = sum(historyRows, "noHintCorrectCount");
  const hintCorrectCount = sum(historyRows, "hintCorrectCount");
  const conqueredRows = historyRows.filter((item) => item?.unit === "苦手こくふく");
  const todayConqueredRows = todayRows.filter((item) => item?.unit === "苦手こくふく");
  const conqueredCount = sum(conqueredRows, "correct") + masteredMistakes.length;

  const byGrade = [1, 2, 3].map((grade) => {
    const gradeMistakes = mistakeRows.filter((item) => item?.grade === grade);
    return summarize(
      historyRows.filter((item) => item?.grade === grade),
      `${grade}年生`,
      gradeMistakes.filter((item) => item?.weak !== false && !item?.mastered).length,
      {
        reviewingCount: gradeMistakes.filter((item) => item?.status === "reviewing" && !item?.mastered).length,
        masteredCount: gradeMistakes.filter((item) => item?.mastered).length
      }
    );
  });

  const unitNames = [
    ...new Set([
      ...historyRows.map((item) => item?.unit).filter(Boolean),
      ...mistakeRows.map((item) => item?.unit).filter(Boolean)
    ])
  ];
  const units = unitNames
    .map((unit) => {
      const unitMistakes = mistakeRows.filter((item) => item?.unit === unit);
      return summarize(
        historyRows.filter((item) => item?.unit === unit),
        unit,
        unitMistakes.filter((item) => item?.weak !== false && !item?.mastered).length,
        {
          reviewingCount: unitMistakes.filter((item) => item?.status === "reviewing" && !item?.mastered).length,
          masteredCount: unitMistakes.filter((item) => item?.mastered).length
        }
      );
    })
    .sort((a, b) => b.weakCount - a.weakCount || b.total - a.total || a.label.localeCompare(b.label, "ja"));

  return {
    todaySessions: todayRows.length,
    todayTotal,
    todayCorrect,
    todayRate: rate(todayCorrect, todayTotal),
    todayConquered: sum(todayConqueredRows, "correct"),
    todayHintUsed,
    todayHint2Used,
    todayNoHintCorrect,
    todayHintCorrect,
    totalSessions: historyRows.length,
    total,
    correct,
    rate: rate(correct, total),
    hintUsedCount,
    hint2UsedCount,
    noHintCorrectCount,
    hintCorrectCount,
    activeWeakCount: activeMistakes.length,
    reviewingWeakCount: reviewingMistakes.length,
    conqueredCount,
    byGrade,
    units,
    mistakes: activeMistakes,
    topMistakes: [...activeMistakes]
      .sort((a, b) => (Number(b.mistakeCount) || 0) - (Number(a.mistakeCount) || 0))
      .slice(0, 10),
    recent: historyRows.slice(0, 10)
  };
};

const summarize = (rows, label, weakCount = 0, extra = {}) => {
  const total = sum(rows, "total");
  const correct = sum(rows, "correct");
  const hintUsedCount = sum(rows, "hintUsedCount");
  const hint2UsedCount = sum(rows, "hint2UsedCount");
  const noHintCorrectCount = sum(rows, "noHintCorrectCount");
  const hintCorrectCount = sum(rows, "hintCorrectCount");
  return {
    label,
    total,
    correct,
    rate: rate(correct, total),
    weakCount,
    reviewingCount: Number(extra.reviewingCount) || 0,
    masteredCount: Number(extra.masteredCount) || 0,
    hintUsedCount,
    hint2UsedCount,
    noHintCorrectCount,
    hintCorrectCount,
    bestMedal: bestMedal(rows),
    statusMemo: statusMemo({ total, rate: rate(correct, total), weakCount, hintUsedCount, hint2UsedCount })
  };
};

const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0);

const rate = (correct, total) => (total ? Math.round((correct / total) * 100) : 0);

export const medalForEntry = (entry = {}) => {
  const total = Number(entry.total) || 0;
  const correct = Number(entry.correct) || 0;
  const entryRate = Number.isFinite(Number(entry.rate)) ? Number(entry.rate) : rate(correct, total);
  const hintUsed = Number(entry.hintUsedCount) || 0;
  if (entryRate === 100 && hintUsed === 0) return { rank: 4, label: "金トロフィー", shortLabel: "金トロフィー" };
  if (entryRate === 100) return { rank: 3, label: "銀メダル", shortLabel: "銀" };
  if (entryRate >= 90) return { rank: 3, label: "銀メダル", shortLabel: "銀" };
  if (entryRate >= 80) return { rank: 2, label: "銅メダル", shortLabel: "銅" };
  return { rank: 0, label: "なし", shortLabel: "なし" };
};

const bestMedal = (rows) => rows.reduce((best, row) => {
  const medal = medalForEntry(row);
  return medal.rank > best.rank ? medal : best;
}, { rank: 0, label: "なし", shortLabel: "なし" });

const statusMemo = ({ total, rate: rowRate, weakCount, hintUsedCount, hint2UsedCount }) => {
  if (!total) return "まだ記録がありません";
  if (weakCount > 0) return "苦手こくふく中";
  if (rowRate >= 90 && hintUsedCount <= Math.max(1, Math.floor(total * 0.1))) return "得意そう";
  if (rowRate >= 80 && hintUsedCount > Math.max(1, Math.floor(total * 0.25))) return "ヒントを使って考えています";
  if (hint2UsedCount > 0) return "もう少しでヒントなしでもできそう";
  if (rowRate < 70) return "もう一度復習したい";
  return "順調に取り組めています";
};

const normalizeMistakeRow = (item) => {
  const mistakeCount = Math.max(1, Number(item?.mistakeCount ?? item?.wrongCount) || 1);
  const correctAfterWrongCount = Math.max(0, Number(item?.correctAfterWrongCount) || 0);
  const requiredCorrectCount = Number(item?.requiredCorrectCount) || (mistakeCount >= 2 ? 2 : 1);
  const mastered = item?.mastered === true || item?.status === "mastered";
  const status = mastered
    ? "mastered"
    : correctAfterWrongCount > 0
      ? "reviewing"
      : item?.status || "weak";

  return {
    ...item,
    mistakeCount,
    correctAfterWrongCount,
    requiredCorrectCount,
    remainingCorrectCount: mastered ? 0 : Math.max(0, requiredCorrectCount - correctAfterWrongCount),
    hintLevelUsed: Number(item?.hintLevelUsed) || 0,
    lastHintLevelUsed: Number(item?.lastHintLevelUsed ?? item?.hintLevelUsed) || 0,
    mastered,
    status,
    weak: mastered ? false : item?.weak !== false
  };
};
