const KEYS = {
  mistakes: "sansu_mistakes_v1",
  history: "sansu_history_v1",
  questionStats: "sansu_question_stats_v1",
  stamps: "sansu_stamps_v1",
  awards: "sansu_awards_v1",
  settings: "sansu_settings_v1"
};
const USER_KEYS = {
  users: "sansu_users_v1",
  currentUser: "sansu_current_user_v1"
};

export const DEFAULT_USERS = [
  { id: "haruka", name: "はるか", icon: "1" },
  { id: "shiori", name: "しおり", icon: "2" },
  { id: "guest", name: "ゲスト", icon: "G" }
];

const read = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can fail in private mode or when storage is full.
  }
};

const readArray = (key) => {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
};

const readScoped = (key, fallback) => {
  const currentUserId = getCurrentUser().id;
  const scopedKey = `${key}:${currentUserId}`;
  const scopedValue = read(scopedKey, null);
  if (scopedValue !== null) return scopedValue;
  if (currentUserId === "guest") return read(key, fallback);
  return fallback;
};

const writeScoped = (key, value) => write(`${key}:${getCurrentUser().id}`, value);

const readScopedArray = (key) => {
  const value = readScoped(key, []);
  return Array.isArray(value) ? value : [];
};

export const getUsers = () => {
  const users = readArray(USER_KEYS.users);
  if (!users.length) return DEFAULT_USERS;
  const normalized = users
    .filter((user) => user?.id && user?.name)
    .map((user) => ({ id: String(user.id), name: String(user.name), icon: user.icon || user.name.slice(0, 1) }));
  return normalized.length ? normalized : DEFAULT_USERS;
};

export const getCurrentUser = () => {
  const users = getUsers();
  const id = read(USER_KEYS.currentUser, "guest");
  return users.find((user) => user.id === id) || users.find((user) => user.id === "guest") || users[0];
};

export const setCurrentUser = (userId) => {
  const users = getUsers();
  const next = users.find((user) => user.id === userId) || users.find((user) => user.id === "guest") || users[0];
  write(USER_KEYS.users, users);
  write(USER_KEYS.currentUser, next.id);
  return next;
};

export const getSettings = () => read(KEYS.settings, { sound: true });
export const saveSettings = (settings) => write(KEYS.settings, settings);

const reviewGoal = (count) => (count >= 2 ? 2 : 1);

const normalizeMistake = (item) => {
  if (!item || typeof item !== "object") return null;
  const mistakeCount = Math.max(1, Number(item.mistakeCount ?? item.wrongCount) || 1);
  const mastered = item.mastered === true || item.status === "mastered";
  const correctAfterWrongCount = mastered
    ? Math.max(reviewGoal(mistakeCount), Number(item.correctAfterWrongCount) || 0)
    : Math.max(0, Number(item.correctAfterWrongCount) || 0);
  const requiredCorrectCount = reviewGoal(mistakeCount);
  const status = mastered
    ? "mastered"
    : correctAfterWrongCount > 0
      ? "reviewing"
      : item.status || "weak";

  return {
    ...item,
    questionId: item.questionId || item.id,
    mistakeCount,
    wrongCount: mistakeCount,
    correctAfterWrongCount,
    requiredCorrectCount,
    remainingCorrectCount: mastered ? 0 : Math.max(0, requiredCorrectCount - correctAfterWrongCount),
    lastMistakeDate: item.lastMistakeDate || item.lastWrongAt || null,
    lastWrongAt: item.lastWrongAt || item.lastMistakeDate || null,
    lastCorrectAt: item.lastCorrectAt || null,
    hintLevelUsed: Number(item.hintLevelUsed) || 0,
    lastHintLevelUsed: Number(item.lastHintLevelUsed ?? item.hintLevelUsed) || 0,
    mastered,
    masteredAt: item.masteredAt || null,
    status,
    weak: mastered ? false : item.weak !== false
  };
};

export const getMistakes = () => readScopedArray(KEYS.mistakes).map(normalizeMistake).filter(Boolean);
export const saveMistakes = (mistakes) => writeScoped(KEYS.mistakes, Array.isArray(mistakes) ? mistakes : []);

export const recordMistake = ({
  question,
  selected,
  stepIndex = null,
  stepLabel = "",
  stepPrompt = "",
  stepAnswer = null,
  hintLevelUsed = 0
}) => {
  const mistakes = getMistakes();
  const existing = mistakes.find((item) => item.questionId === question.id);
  const date = new Date().toISOString();
  const mistakeCount = Math.max(1, Number(existing?.mistakeCount ?? existing?.wrongCount) || 0) + 1;
  const hasStep = stepIndex !== null && stepIndex !== undefined;
  const stepDetail = hasStep
    ? {
        questionId: question.id,
        grade: question.grade,
        unit: question.unit,
        questionType: question.questionType,
        stepNumber: stepIndex + 1,
        stepLabel,
        stepPrompt,
        selected,
        answer: stepAnswer ?? question.answer,
        hintLevelUsed: Number(hintLevelUsed) || 0,
        date
      }
    : null;
  const maxHintLevelUsed = Math.max(Number(existing?.hintLevelUsed) || 0, Number(hintLevelUsed) || 0);

  const payload = {
    ...(existing || {}),
    questionId: question.id,
    grade: question.grade,
    unit: question.unit,
    questionType: question.questionType,
    question: question.question,
    answer: question.answer,
    selected,
    hintLevelUsed: maxHintLevelUsed,
    lastHintLevelUsed: Number(hintLevelUsed) || 0,
    mistakeCount: existing ? mistakeCount : 1,
    wrongCount: existing ? mistakeCount : 1,
    lastMistakeDate: date,
    lastWrongAt: date,
    correctAfterWrongCount: 0,
    requiredCorrectCount: reviewGoal(existing ? mistakeCount : 1),
    remainingCorrectCount: reviewGoal(existing ? mistakeCount : 1),
    lastCorrectAt: existing?.lastCorrectAt || null,
    masteredAt: null,
    status: "weak",
    weak: true,
    mastered: false,
    wrongSteps: [
      ...new Set([...(existing?.wrongSteps || []), hasStep ? stepIndex : null].filter((value) => value !== null))
    ],
    wrongStepDetails: stepDetail
      ? [stepDetail, ...(existing?.wrongStepDetails || [])].slice(0, 10)
      : existing?.wrongStepDetails || []
  };

  saveMistakes(existing ? mistakes.map((item) => (item.questionId === question.id ? payload : item)) : [payload, ...mistakes]);
};

export const markCorrect = (questionId) => {
  const mistakes = getMistakes();
  const existing = mistakes.find((item) => item.questionId === questionId);
  if (!existing) return null;

  const date = new Date().toISOString();
  const mistakeCount = Math.max(1, Number(existing.mistakeCount ?? existing.wrongCount) || 1);
  const requiredCorrectCount = reviewGoal(mistakeCount);
  const correctAfterWrongCount = Math.max(0, Number(existing.correctAfterWrongCount) || 0) + 1;
  const mastered = correctAfterWrongCount >= requiredCorrectCount;
  const updated = {
    ...existing,
    mistakeCount,
    wrongCount: mistakeCount,
    correctAfterWrongCount,
    requiredCorrectCount,
    remainingCorrectCount: mastered ? 0 : Math.max(0, requiredCorrectCount - correctAfterWrongCount),
    lastCorrectAt: date,
    mastered,
    masteredAt: mastered ? date : null,
    status: mastered ? "mastered" : "reviewing",
    weak: !mastered
  };

  saveMistakes(mistakes.map((item) => (item.questionId === questionId ? updated : item)));
  return updated;
};

export const clearMistakes = () => saveMistakes([]);

export const getHistory = () => readScopedArray(KEYS.history);
export const addHistory = (entry) => {
  const total = Number(entry.total) || 0;
  const correct = Number(entry.correct) || 0;
  const wrong = Number(entry.wrongCount ?? total - correct) || 0;
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const savedEntry = {
    date: new Date().toISOString(),
    grade: entry.grade,
    unit: entry.unit,
    modeType: entry.modeType,
    total,
    correct,
    rate,
    wrongCount: wrong,
    hintUsedCount: Number(entry.hintUsedCount) || 0,
    hint1UsedCount: Number(entry.hint1UsedCount) || 0,
    hint2UsedCount: Number(entry.hint2UsedCount) || 0,
    noHintCorrectCount: Number(entry.noHintCorrectCount) || 0,
    hintCorrectCount: Number(entry.hintCorrectCount) || 0,
    answerRecords: Array.isArray(entry.answerRecords) ? entry.answerRecords.slice(0, 50) : []
  };
  writeScoped(KEYS.history, [savedEntry, ...getHistory()].slice(0, 100));
  return savedEntry;
};
export const clearHistory = () => writeScoped(KEYS.history, []);

const normalizeQuestionStat = (item) => {
  if (!item || typeof item !== "object") return null;
  const id = item.id || item.questionId;
  if (!id) return null;
  return {
    ...item,
    id,
    questionId: id,
    seenCount: Math.max(0, Number(item.seenCount) || 0),
    correctCount: Math.max(0, Number(item.correctCount) || 0),
    wrongCount: Math.max(0, Number(item.wrongCount) || 0),
    hintLevelMax: Math.max(0, Number(item.hintLevelMax) || 0),
    lastSeenAt: item.lastSeenAt || null,
    lastCorrectAt: item.lastCorrectAt || null,
    lastWrongAt: item.lastWrongAt || null,
    lastResult: item.lastResult || "none",
    status: item.status || "normal"
  };
};

export const getQuestionStats = () => {
  const value = readScoped(KEYS.questionStats, {});
  const rows = Array.isArray(value) ? value : Object.values(value || {});
  return rows.reduce((map, item) => {
    const normalized = normalizeQuestionStat(item);
    if (normalized) map[normalized.id] = normalized;
    return map;
  }, {});
};

export const saveQuestionStats = (stats) => {
  writeScoped(KEYS.questionStats, stats && typeof stats === "object" ? stats : {});
};

export const recordQuestionAttempts = (records = []) => {
  if (!Array.isArray(records) || !records.length) return getQuestionStats();

  const current = getQuestionStats();
  const grouped = records.reduce((map, record) => {
    if (!record?.questionId) return map;
    const existing = map[record.questionId] || {
      id: record.questionId,
      questionId: record.questionId,
      grade: record.grade,
      unit: record.unit,
      correct: true,
      hintLevelMax: 0
    };
    existing.correct = existing.correct && record.correct === true;
    existing.hintLevelMax = Math.max(existing.hintLevelMax, Number(record.hintLevelUsed) || 0);
    existing.grade = existing.grade ?? record.grade;
    existing.unit = existing.unit || record.unit;
    map[record.questionId] = existing;
    return map;
  }, {});

  const date = new Date().toISOString();
  Object.values(grouped).forEach((record) => {
    const previous = normalizeQuestionStat(current[record.id]) || { id: record.id, questionId: record.id };
    const correct = record.correct === true;
    current[record.id] = {
      ...previous,
      id: record.id,
      questionId: record.id,
      grade: record.grade ?? previous.grade,
      unit: record.unit || previous.unit,
      seenCount: (Number(previous.seenCount) || 0) + 1,
      correctCount: (Number(previous.correctCount) || 0) + (correct ? 1 : 0),
      wrongCount: (Number(previous.wrongCount) || 0) + (correct ? 0 : 1),
      lastSeenAt: date,
      lastCorrectAt: correct ? date : previous.lastCorrectAt || null,
      lastWrongAt: correct ? previous.lastWrongAt || null : date,
      hintLevelMax: Math.max(Number(previous.hintLevelMax) || 0, Number(record.hintLevelMax) || 0),
      lastHintLevelUsed: Number(record.hintLevelMax) || 0,
      lastResult: correct ? "correct" : "wrong",
      status: previous.status || "normal"
    };
  });

  saveQuestionStats(current);
  return current;
};

export const getStamps = () => readScopedArray(KEYS.stamps);
export const addStamps = (stamps) => {
  const current = getStamps();
  const next = [...current];
  const additions = [];

  stamps.forEach((stamp) => {
    if (!stamp?.stampId) return;
    const earnedAt = stamp.earnedAt || new Date().toISOString();
    const index = next.findIndex((item) => (item.stampId || item.id) === stamp.stampId);

    if (index === -1) {
      const saved = {
        ...stamp,
        earnedAt,
        lastEarnedAt: stamp.lastEarnedAt || earnedAt,
        count: Number(stamp.count || 1)
      };
      next.push(saved);
      additions.push(saved);
      return;
    }

    if (stamp.repeatable) {
      const existing = next[index];
      const count = Number(existing.count || 1) + 1;
      const earnedDates = [earnedAt, ...(Array.isArray(existing.earnedDates) ? existing.earnedDates : [])].slice(0, 30);
      const updated = {
        ...existing,
        ...stamp,
        earnedAt: existing.earnedAt || earnedAt,
        lastEarnedAt: earnedAt,
        count,
        earnedDates
      };
      next[index] = updated;
      additions.push({ ...updated, repeatEarned: true });
    }
  });

  if (additions.length) writeScoped(KEYS.stamps, next);
  return additions;
};
export const clearStamps = () => writeScoped(KEYS.stamps, []);

export const getAwards = () => readScopedArray(KEYS.awards);
export const addAwards = (awards) => {
  const current = getAwards();
  const ids = new Set(current.map((award) => award.awardId || award.id).filter(Boolean));
  const additions = awards
    .filter((award) => award?.awardId && !ids.has(award.awardId))
    .map((award) => ({ ...award, earnedAt: award.earnedAt || new Date().toISOString() }));
  if (additions.length) writeScoped(KEYS.awards, [...current, ...additions]);
  return additions;
};
export const clearAwards = () => writeScoped(KEYS.awards, []);
