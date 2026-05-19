import { useMemo, useState } from "react";
import Home from "./components/Home";
import UnitSelect from "./components/UnitSelect";
import QuizScreen from "./components/QuizScreen";
import ResultScreen from "./components/ResultScreen";
import StampBook from "./components/StampBook";
import AwardsPage from "./components/AwardsPage";
import ParentDashboard from "./components/ParentDashboard";
import { addAwards, addHistory, addStamps, getAwards, getCurrentUser, getHistory, getMistakes, getSettings, getStamps, getUsers, recordQuestionAttempts, saveSettings, setCurrentUser } from "./utils/storage";
import { getQuestionById, getQuestionsFor } from "./utils/quizUtils";
import { playClickSound } from "./utils/sound";
import { evaluateNewStamps, hydrateStamp } from "./utils/stamps";
import { evaluateNewAwards, hydrateAward } from "./utils/awards";

export default function App() {
  const [view, setView] = useState("home");
  const [history, setHistory] = useState(getHistory());
  const [mistakes, setMistakes] = useState(getMistakes());
  const [stamps, setStamps] = useState(getStamps());
  const [awards, setAwards] = useState(getAwards());
  const [users, setUsers] = useState(getUsers());
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [session, setSession] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [newStamps, setNewStamps] = useState([]);
  const [newAwards, setNewAwards] = useState([]);
  const [settings, setSettings] = useState(getSettings());

  const refresh = () => {
    setUsers(getUsers());
    setCurrentUserState(getCurrentUser());
    setHistory(getHistory());
    setMistakes(getMistakes());
    setStamps(getStamps());
    setAwards(getAwards());
    setSettings(getSettings());
  };

  const changeUser = (userId) => {
    const next = setCurrentUser(userId);
    setUsers(getUsers());
    setCurrentUserState(next);
    setHistory(getHistory());
    setMistakes(getMistakes());
    setStamps(getStamps());
    setAwards(getAwards());
  };

  const toggleSound = () => {
    const next = { ...settings, sound: settings.sound === false };
    saveSettings(next);
    setSettings(next);
    if (next.sound) playClickSound();
  };

  const startQuiz = (config) => {
    const limit = config.modeType === "quick" ? 10 : 5;
    const selected = getQuestionsFor({ ...config, limit });
    const fallback = getQuestionsFor({ ...config, modeType: undefined, limit });
    setSession(config);
    setQuizQuestions(selected.length ? selected : fallback.slice(0, limit));
    setView("quiz");
  };

  const startWeak = () => {
    const weakQuestions = getMistakes()
      .filter((item) => item.weak !== false && !item.mastered)
      .map((item) => getQuestionById(item.questionId))
      .filter(Boolean);
    setSession({ grade: "mix", unit: "苦手こくふく", modeType: "step", weakMode: true });
    setQuizQuestions(weakQuestions.slice(0, 10));
    setView("quiz");
  };

  const finishQuiz = (summary) => {
    const conquered = session?.weakMode && summary.correct > 0;
    const historyModeType = session?.weakMode ? "weak" : session.modeType;
    recordQuestionAttempts(summary.answerRecords || []);
    const entry = {
      grade: session.grade === "mix" ? 0 : session.grade,
      unit: session.unit || "全学年ミックス",
      modeType: historyModeType,
      total: summary.total,
      correct: summary.correct,
      wrongCount: summary.wrongItems?.length || 0,
      hintUsedCount: summary.hintUsedCount || 0,
      hint1UsedCount: summary.hint1UsedCount || 0,
      hint2UsedCount: summary.hint2UsedCount || 0,
      noHintCorrectCount: summary.noHintCorrectCount || 0,
      hintCorrectCount: summary.hintCorrectCount || 0,
      answerRecords: summary.answerRecords || []
    };
    const savedEntry = addHistory(entry);
    const earnedRaw = evaluateNewStamps({
      currentEntry: savedEntry,
      history,
      existingStamps: stamps,
      maxStreak: summary.maxStreak || 0,
      masteredCount: summary.masteredCount || 0
    });
    const earned = addStamps(earnedRaw).map(hydrateStamp);
    const earnedAwardsRaw = evaluateNewAwards({
      currentEntry: savedEntry,
      history,
      existingAwards: awards,
      masteredCount: summary.masteredCount || 0
    });
    const earnedAwards = addAwards(earnedAwardsRaw).map(hydrateAward);

    setResult({
      ...summary,
      conquered,
      masteredCount: summary.masteredCount || 0,
      reviewingCount: summary.reviewingCount || 0,
      weakCorrectCount: summary.weakCorrectCount || 0
    });
    setNewStamps(earned);
    setNewAwards(earnedAwards);
    refresh();
    setView("result");
  };

  const route = useMemo(() => {
    if (view === "home") {
      return (
        <Home
          users={users}
          currentUser={currentUser}
          onUserChange={changeUser}
          soundOn={settings.sound !== false}
          onToggleSound={toggleSound}
          onNavigate={(type, value) => {
            if (type === "grade") {
              setSession({ grade: value });
              setView("units");
            }
            if (type === "mix") startQuiz({ grade: "mix", unit: "", modeType: "quick" });
            if (type === "weak") startWeak();
            if (type === "stamps") {
              refresh();
              setView("stamps");
            }
            if (type === "awards") {
              refresh();
              setView("awards");
            }
            if (type === "parent") {
              refresh();
              setView("parent");
            }
          }}
        />
      );
    }
    if (view === "units") {
      return <UnitSelect grade={session.grade} history={history} mistakes={mistakes} onStart={startQuiz} onBack={() => setView("home")} />;
    }
    if (view === "quiz") {
      return (
        <QuizScreen
          questions={quizQuestions}
          modeType={session.modeType}
          weakMode={session.weakMode}
          onFinish={finishQuiz}
          onBack={() => setView(session?.grade && session.grade !== "mix" ? "units" : "home")}
        />
      );
    }
    if (view === "result") {
      return (
        <ResultScreen
          result={result}
          stamps={newStamps}
          awards={newAwards}
          unit={session.unit || "全学年ミックス"}
          onRetry={() => (session?.weakMode ? startWeak() : startQuiz(session))}
          onUnits={() => setView(session?.grade && session.grade !== "mix" ? "units" : "home")}
          onHome={() => setView("home")}
          onWeak={startWeak}
        />
      );
    }
    if (view === "stamps") return <StampBook stamps={stamps} onBack={() => setView("home")} />;
    if (view === "awards") return <AwardsPage awards={awards} onBack={() => setView("home")} />;
    if (view === "parent") {
      return (
        <ParentDashboard
          history={history}
          mistakes={mistakes}
          stamps={stamps}
          awards={awards}
          users={users}
          currentUser={currentUser}
          onUserChange={changeUser}
          soundOn={settings.sound !== false}
          onToggleSound={toggleSound}
          onReset={refresh}
          onBack={() => setView("home")}
        />
      );
    }
    return null;
  }, [view, history, mistakes, stamps, awards, users, currentUser, session, quizQuestions, result, newStamps, newAwards, settings]);

  return <>{route}</>;
}
