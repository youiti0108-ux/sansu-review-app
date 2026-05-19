import { useEffect, useMemo, useRef, useState } from "react";
import ClockFace from "./ClockFace";
import GraphDisplay from "./GraphDisplay";
import MemoBoard from "./MemoBoard";
import RubyText from "./RubyText";
import ShapeDisplay from "./ShapeDisplay";
import VerticalWork from "./VerticalWork";
import { markCorrect, recordMistake } from "../utils/storage";
import { playClickSound, playCorrectSound, playWrongSound } from "../utils/sound";

const cheers = ["すごい！", "いいね！", "そのちょうし！", "よく見つけたね！"];
const gentleMessages = ["おしい！", "もういちど みてみよう", "だいじょうぶ。いっしょに かんがえよう"];

const choiceValue = (choice) => (typeof choice === "object" ? choice.label : choice);

export default function QuizScreen({ questions, modeType, weakMode = false, onFinish, onBack }) {
  const [index, setIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewingCount, setReviewingCount] = useState(0);
  const [weakCorrectCount, setWeakCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionHadMistake, setQuestionHadMistake] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [questionHintLevel, setQuestionHintLevel] = useState(0);
  const [hintStats, setHintStats] = useState({
    hintUsedCount: 0,
    hint1UsedCount: 0,
    hint2UsedCount: 0,
    noHintCorrectCount: 0,
    hintCorrectCount: 0
  });
  const [spark, setSpark] = useState(false);
  const feedbackRef = useRef(null);
  const answerRecordsRef = useRef([]);
  const current = questions[index];
  const isStep = modeType === "step" && current?.steps?.length;
  const activeStep = isStep ? current.steps[stepIndex] : null;
  const prompt = activeStep?.prompt || current?.question;
  const answer = activeStep?.answer || current?.answer;
  const rawChoices = (activeStep?.choices || current?.choices || []).slice(0, 4);
  const choices = useMemo(
    () => shuffleChoices(rawChoices, answer),
    [current?.id, index, stepIndex, answer]
  );
  const hints = getHints(current, activeStep);

  useEffect(() => {
    if (!feedback) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [feedback]);

  if (!current) {
    return (
      <main className="page-shell empty-state">
        <h1><RubyText>苦手な問題はありません</RubyText></h1>
        <p><RubyText>今はもう一回やる問題がありません。</RubyText></p>
        <button onClick={onBack}><RubyText>ホームへ戻る</RubyText></button>
      </main>
    );
  }

  const choose = (choice) => {
    if (selected) return;
    playClickSound();
    const value = choiceValue(choice);
    const ok = value === answer;
    const nextStreak = ok ? streak + 1 : 0;
    const usedHintLevel = Math.max(hintLevel, questionHintLevel);

    setSelected(value);
    setFeedback({
      ok,
      text: ok ? (weakMode ? "こくふく！" : cheers[Math.floor(Math.random() * cheers.length)]) : gentleMessages[Math.floor(Math.random() * gentleMessages.length)],
      explanation: activeStep?.explanation || current.explanation
    });
    setStreak(nextStreak);
    setMaxStreak((currentMax) => Math.max(currentMax, nextStreak));
    answerRecordsRef.current = [
      ...answerRecordsRef.current,
      {
        questionId: current.id,
        grade: current.grade,
        unit: current.unit,
        correct: ok,
        selectedAnswer: value,
        answer,
        hintLevelUsed: usedHintLevel,
        stepIndex: isStep ? stepIndex : null,
        answeredAt: new Date().toISOString()
      }
    ];

    if (ok) {
      playCorrectSound();
      setSpark(true);
      setTimeout(() => setSpark(false), 700);
      return;
    }

    playWrongSound();
    setQuestionHadMistake(true);
    recordMistake({
      question: current,
      selected: value,
      stepIndex: isStep ? stepIndex : null,
      stepLabel: activeStep?.label,
      stepPrompt: activeStep?.prompt,
      stepAnswer: activeStep?.answer,
      hintLevelUsed: usedHintLevel
    });
    setWrongItems((items) => [...items, { question: current, selected: value, stepIndex: isStep ? stepIndex : null, hintLevelUsed: usedHintLevel }]);
  };

  const showHint = (level) => {
    if (selected) return;
    playClickSound();
    setHintLevel((currentLevel) => Math.max(currentLevel, level));
    setQuestionHintLevel((currentLevel) => Math.max(currentLevel, level));
  };

  const next = () => {
    playClickSound();
    const stepDone = !isStep || stepIndex === current.steps.length - 1;
    const solvedQuestion = feedback?.ok && stepDone && !questionHadMistake;
    const nextCorrectCount = correctCount + (solvedQuestion ? 1 : 0);
    const finalHintLevel = questionHintLevel;
    const nextHintStats = { ...hintStats };
    let nextMasteredCount = masteredCount;
    let nextReviewingCount = reviewingCount;
    let nextWeakCorrectCount = weakCorrectCount;

    if (stepDone) {
      if (finalHintLevel > 0) nextHintStats.hintUsedCount += 1;
      if (finalHintLevel >= 1) nextHintStats.hint1UsedCount += 1;
      if (finalHintLevel >= 2) nextHintStats.hint2UsedCount += 1;
      if (solvedQuestion) {
        if (finalHintLevel > 0) nextHintStats.hintCorrectCount += 1;
        else nextHintStats.noHintCorrectCount += 1;
      }
      setHintStats(nextHintStats);
    }

    if (solvedQuestion) {
      setCorrectCount(nextCorrectCount);
      if (weakMode) {
        const reviewResult = markCorrect(current.id);
        nextWeakCorrectCount += 1;
        if (reviewResult?.mastered) {
          nextMasteredCount += 1;
        } else {
          nextReviewingCount += 1;
        }
        setWeakCorrectCount(nextWeakCorrectCount);
        setMasteredCount(nextMasteredCount);
        setReviewingCount(nextReviewingCount);
      }
    }

    if (isStep && stepIndex < current.steps.length - 1) {
      setStepIndex((n) => n + 1);
      setHintLevel(0);
    } else if (index < questions.length - 1) {
      setIndex((n) => n + 1);
      setStepIndex(0);
      setQuestionHadMistake(false);
      setHintLevel(0);
      setQuestionHintLevel(0);
    } else {
      onFinish({
        total: questions.length,
        correct: nextCorrectCount,
        wrongItems,
        masteredCount: nextMasteredCount,
        reviewingCount: nextReviewingCount,
        weakCorrectCount: nextWeakCorrectCount,
        maxStreak: Math.max(maxStreak, streak),
        answerRecords: answerRecordsRef.current,
        ...nextHintStats
      });
    }
    setSelected(null);
    setFeedback(null);
  };

  return (
    <main className="page-shell quiz-shell">
      {spark && (
        <div className="sparkles">
          <span>★</span>
          <span>花まる</span>
          <span>★</span>
        </div>
      )}
      <div className="quiz-top">
        <button className="ghost-button" onClick={onBack}>← <RubyText>もどる</RubyText></button>
        <div className="progress-pill">
          <RubyText>もんだい</RubyText> {index + 1}/{questions.length}
          {isStep && <span> ・ <RubyText>ステップ</RubyText> {stepIndex + 1}/{current.steps.length}</span>}
        </div>
      </div>

      <div className={`streak-pill ${streak >= 5 ? "hot" : ""}`}>
        <RubyText>{streak >= 5 ? `${streak}もんれんぞく！すごい！` : `${streak}もん れんぞく 正解！`}</RubyText>
      </div>

      <section className="question-panel">
        <div className="question-meta">
          <span>{current.grade}<RubyText>年生</RubyText></span>
          <span><RubyText>{current.unit}</RubyText></span>
        </div>
        <h1><RubyText>{current.question}</RubyText></h1>
        {isStep && (
          <div className="step-guide">
            <strong>{stepIndex + 1}/{current.steps.length}</strong>
            <span><RubyText>{activeStep?.label || "考えよう"}</RubyText></span>
          </div>
        )}
        <QuestionVisual question={current} stepIndex={stepIndex} />
        {isStep && <p className="step-prompt"><RubyText>{prompt}</RubyText></p>}
      </section>

      <section className="hint-box">
        <strong><RubyText>ヒント</RubyText></strong>
        {hintLevel >= 1 && <p><RubyText>{hints[0]}</RubyText></p>}
        {hintLevel >= 2 && <p><RubyText>{hints[1]}</RubyText></p>}
        {!selected && (
          <div className="hint-actions">
            <button className="secondary" disabled={hintLevel >= 1} onClick={() => showHint(1)}>
              <RubyText>ヒント1を見る</RubyText>
            </button>
            <button className="secondary" disabled={hintLevel < 1 || hintLevel >= 2} onClick={() => showHint(2)}>
              <RubyText>ヒント2を見る</RubyText>
            </button>
          </div>
        )}
      </section>

      <section className="choice-grid">
        {choices.map((choice, choiceIndex) => {
          const value = choiceValue(choice);
          const state = selected && (value === answer ? "correct" : value === selected ? "wrong" : "");
          return (
            <button className={`choice ${state} ${typeof choice === "object" ? "shape-choice" : ""}`} key={`${value}-${choiceIndex}`} onClick={() => choose(choice)}>
              {typeof choice === "object" && <ShapeDisplay shape={choice.shape} small />}
              <RubyText>{value}</RubyText>
            </button>
          );
        })}
      </section>

      {feedback && (
        <section ref={feedbackRef} className={`feedback ${feedback.ok ? "ok fade-in" : "try fade-in"}`}>
          {feedback.ok && <div className="hanamaru-pop" aria-hidden="true">◎</div>}
          <strong><RubyText>{feedback.text}</RubyText></strong>
          <p><RubyText>{feedback.explanation}</RubyText></p>
          <button onClick={next}>
            <RubyText>{index === questions.length - 1 && (!isStep || stepIndex === current.steps.length - 1) ? "けっかを見る" : isStep && stepIndex < current.steps.length - 1 ? "つぎのステップへ" : "つぎのもんだいへ"}</RubyText>
          </button>
        </section>
      )}

      <MemoBoard grid={current.questionType === "vertical"} />
    </main>
  );
}

function shuffleChoices(choices, answer) {
  const answerText = String(answer);
  const values = choices.some((choice) => String(choiceValue(choice)) === answerText)
    ? choices
    : [...choices.slice(0, 3), answerText];
  const uniqueValues = values.filter((choice, index, array) => (
    array.findIndex((item) => String(choiceValue(item)) === String(choiceValue(choice))) === index
  ));
  const answerChoice = uniqueValues.find((choice) => String(choiceValue(choice)) === answerText);
  if (!answerChoice) return fisherYates(uniqueValues).slice(0, 4);

  const distractors = uniqueValues.filter((choice) => String(choiceValue(choice)) !== answerText);
  return fisherYates([answerChoice, ...distractors]).slice(0, 4);
}

function fisherYates(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getHints(question, step) {
  const text = `${step?.prompt || ""} ${question?.question || ""}`;
  const explanation = step?.explanation || question?.explanation || "どんな式になるかを先に考えてみよう。";
  const type = question?.questionType;

  if (type === "vertical") {
    return ["一の位から順番に見よう。", "くり上がりやくり下がりの数を小さく書いて考えよう。"];
  }
  if (type === "clock") {
    return ["短いはりは時、長いはりは分を表します。", "長いはりが12なら00分、6なら30分です。"];
  }
  if (type === "shape") {
    return ["辺の数や角の形を見よう。", "まる、さんかく、しかくのちがいをたしかめよう。"];
  }
  if (type === "graph") {
    return ["表やグラフの一番大きい数を見よう。", "くらべたいものの数をもう一度たしかめよう。"];
  }
  if (text.includes("÷")) {
    return ["かけ算の九九を思い出そう。", "わる数の段で、わられる数に近い数をさがそう。"];
  }
  if (text.includes("×")) {
    return ["同じ数が何こ分あるかを考えよう。", "九九を使って、一つずつたしかめよう。"];
  }
  if (text.includes("-")) {
    return ["のこりを考えるときは、ひき算を使います。", "大きい数から小さい数をひいてみよう。"];
  }
  if (text.includes("+")) {
    return ["ふえたときや、ぜんぶを考えるときは、たし算を使います。", "10のまとまりを作れるか見てみよう。"];
  }
  return ["問題文の大事な数に注目しよう。", explanation];
}

function QuestionVisual({ question, stepIndex }) {
  if (question.questionType === "vertical") return <VerticalWork question={question} stepIndex={stepIndex} />;
  if (question.questionType === "clock") return <ClockFace clock={question.clock} />;
  if (question.questionType === "shape" && question.shape) return <ShapeDisplay shape={question.shape} />;
  if (question.questionType === "graph") return <GraphDisplay graph={question.graph} />;
  return null;
}
