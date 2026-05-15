const KEYS = {
  mistakes: "sansu_mistakes_v1",
  history: "sansu_history_v1",
  stamps: "sansu_stamps_v1",
  awards: "sansu_awards_v1",
  settings: "sansu_settings_v1"
};

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

export const getSettings = () => read(KEYS.settings, { sound: true });
export const saveSettings = (settings) => write(KEYS.settings, settings);

export const getMistakes = () => readArray(KEYS.mistakes);
export const saveMistakes = (mistakes) => write(KEYS.mistakes, Array.isArray(mistakes) ? mistakes : []);

export const recordMistake = ({
  question,
  selected,
  stepIndex = null,
  stepLabel = "",
  stepPrompt = "",
  stepAnswer = null
}) => {
  const mistakes = getMistakes();
  const existing = mistakes.find((item) => item.questionId === question.id);
  const date = new Date().toISOString();
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
        date
      }
    : null;

  const payload = {
    ...(existing || {}),
    questionId: question.id,
    grade: question.grade,
    unit: question.unit,
    questionType: question.questionType,
    question: question.question,
    answer: question.answer,
    selected,
    mistakeCount: existing ? existing.mistakeCount + 1 : 1,
    lastMistakeDate: date,
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
  saveMistakes(mistakes.filter((item) => item.questionId !== questionId));
};

export const clearMistakes = () => saveMistakes([]);

export const getHistory = () => readArray(KEYS.history);
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
    wrongCount: wrong
  };
  write(KEYS.history, [savedEntry, ...getHistory()].slice(0, 100));
  return savedEntry;
};
export const clearHistory = () => write(KEYS.history, []);

export const getStamps = () => readArray(KEYS.stamps);
export const addStamps = (stamps) => {
  const current = getStamps();
  const ids = new Set(current.map((stamp) => stamp.stampId || stamp.id).filter(Boolean));
  const additions = stamps
    .filter((stamp) => stamp?.stampId && !ids.has(stamp.stampId))
    .map((stamp) => ({ ...stamp, earnedAt: stamp.earnedAt || new Date().toISOString() }));
  if (additions.length) write(KEYS.stamps, [...current, ...additions]);
  return additions;
};
export const clearStamps = () => write(KEYS.stamps, []);

export const getAwards = () => readArray(KEYS.awards);
export const addAwards = (awards) => {
  const current = getAwards();
  const ids = new Set(current.map((award) => award.awardId || award.id).filter(Boolean));
  const additions = awards
    .filter((award) => award?.awardId && !ids.has(award.awardId))
    .map((award) => ({ ...award, earnedAt: award.earnedAt || new Date().toISOString() }));
  if (additions.length) write(KEYS.awards, [...current, ...additions]);
  return additions;
};
export const clearAwards = () => write(KEYS.awards, []);
