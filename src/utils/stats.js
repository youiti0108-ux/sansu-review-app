const toRows = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const buildStats = (history = [], mistakes = []) => {
  const historyRows = toRows(history);
  const mistakeRows = toRows(mistakes);
  const today = todayKey();
  const activeMistakes = mistakeRows.filter((item) => item?.weak !== false && !item?.mastered);
  const masteredMistakes = mistakeRows.filter((item) => item?.mastered);
  const todayRows = historyRows.filter((item) => item?.date?.slice(0, 10) === today);
  const total = sum(historyRows, "total");
  const correct = sum(historyRows, "correct");
  const todayTotal = sum(todayRows, "total");
  const todayCorrect = sum(todayRows, "correct");
  const conqueredRows = historyRows.filter((item) => item?.unit === "苦手こくふく");
  const todayConqueredRows = todayRows.filter((item) => item?.unit === "苦手こくふく");
  const conqueredCount = sum(conqueredRows, "correct") + masteredMistakes.length;

  const byGrade = [1, 2, 3].map((grade) =>
    summarize(
      historyRows.filter((item) => item?.grade === grade),
      `${grade}年生`,
      activeMistakes.filter((item) => item?.grade === grade).length
    )
  );

  const unitNames = [
    ...new Set([
      ...historyRows.map((item) => item?.unit).filter(Boolean),
      ...activeMistakes.map((item) => item?.unit).filter(Boolean)
    ])
  ];
  const units = unitNames
    .map((unit) =>
      summarize(
        historyRows.filter((item) => item?.unit === unit),
        unit,
        activeMistakes.filter((item) => item?.unit === unit).length
      )
    )
    .sort((a, b) => b.weakCount - a.weakCount || b.total - a.total || a.label.localeCompare(b.label, "ja"));

  return {
    todaySessions: todayRows.length,
    todayTotal,
    todayCorrect,
    todayRate: rate(todayCorrect, todayTotal),
    todayConquered: sum(todayConqueredRows, "correct"),
    totalSessions: historyRows.length,
    total,
    correct,
    rate: rate(correct, total),
    activeWeakCount: activeMistakes.length,
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

const summarize = (rows, label, weakCount = 0) => {
  const total = sum(rows, "total");
  const correct = sum(rows, "correct");
  return { label, total, correct, rate: rate(correct, total), weakCount };
};

const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0);

const rate = (correct, total) => (total ? Math.round((correct / total) * 100) : 0);
