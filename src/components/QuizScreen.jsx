import { useState } from "react";
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
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionHadMistake, setQuestionHadMistake] = useState(false);
  const [spark, setSpark] = useState(false);

  const current = questions[index];
  const isStep = modeType === "step" && current?.steps?.length;
  const activeStep = isStep ? current.steps[stepIndex] : null;
  const prompt = activeStep?.prompt || current?.question;
  const choices = (activeStep?.choices || current?.choices || []).slice(0, 4);
  const answer = activeStep?.answer || current?.answer;

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

    setSelected(value);
    setFeedback({
      ok,
      text: ok ? (weakMode ? "こくふく！" : cheers[Math.floor(Math.random() * cheers.length)]) : gentleMessages[Math.floor(Math.random() * gentleMessages.length)],
      explanation: activeStep?.explanation || current.explanation
    });
    setStreak(nextStreak);
    setMaxStreak((currentMax) => Math.max(currentMax, nextStreak));

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
      stepAnswer: activeStep?.answer
    });
    setWrongItems((items) => [...items, { question: current, selected: value, stepIndex: isStep ? stepIndex : null }]);
  };

  const next = () => {
    playClickSound();
    const stepDone = !isStep || stepIndex === current.steps.length - 1;
    const solvedQuestion = feedback?.ok && stepDone && !questionHadMistake;
    const nextCorrectCount = correctCount + (solvedQuestion ? 1 : 0);
    const nextMasteredCount = masteredCount + (weakMode && solvedQuestion ? 1 : 0);

    if (solvedQuestion) {
      setCorrectCount(nextCorrectCount);
      if (weakMode) {
        markCorrect(current.id);
        setMasteredCount(nextMasteredCount);
      }
    }

    if (isStep && stepIndex < current.steps.length - 1) {
      setStepIndex((n) => n + 1);
    } else if (index < questions.length - 1) {
      setIndex((n) => n + 1);
      setStepIndex(0);
      setQuestionHadMistake(false);
    } else {
      onFinish({
        total: questions.length,
        correct: nextCorrectCount,
        wrongItems,
        masteredCount: nextMasteredCount,
        maxStreak: Math.max(maxStreak, streak)
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
        <section className={`feedback ${feedback.ok ? "ok fade-in" : "try fade-in"}`}>
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

function QuestionVisual({ question, stepIndex }) {
  if (question.questionType === "vertical") return <VerticalWork question={question} stepIndex={stepIndex} />;
  if (question.questionType === "clock") return <ClockFace clock={question.clock} />;
  if (question.questionType === "shape" && question.shape) return <ShapeDisplay shape={question.shape} />;
  if (question.questionType === "graph") return <GraphDisplay graph={question.graph} />;
  return null;
}
