import { useEffect } from "react";
import Award from "./Award";
import RubyText from "./RubyText";
import { playClearSound } from "../utils/sound";

export default function ResultScreen({ result, stamps, awards = [], unit, onRetry, onUnits, onHome, onWeak }) {
  const rate = Math.round((result.correct / Math.max(result.total, 1)) * 100);
  const message =
    rate === 100
      ? "すごい！まんてんです！"
      : rate >= 70
        ? "よくできました！あと少しでまんてん！"
        : "だいじょうぶ。まちがえた問題をもう一回やってみよう！";

  useEffect(() => {
    playClearSound();
  }, []);

  return (
    <main className="page-shell result-shell">
      <section className="result-card fade-in">
        <p className="eyebrow"><RubyText>結果</RubyText></p>
        <h1><RubyText>{message}</RubyText></h1>
        <div className="score-circle">{result.correct}/{result.total}</div>
        <p><RubyText>正答率</RubyText> {rate}% ・ <RubyText>{unit}</RubyText></p>
        {result.masteredCount > 0 && (
          <p className="conquered-note"><RubyText>{`苦手問題を ${result.masteredCount}問 こくふくしました。`}</RubyText></p>
        )}
      </section>

      {awards.length > 0 && (
        <section className="new-award-panel fade-in">
          <h2><RubyText>おめでとう！あたらしい賞状をゲット！</RubyText></h2>
          {awards.map((award) => <Award award={award} key={award.awardId} />)}
        </section>
      )}

      {stamps.length > 0 && (
        <section className="panel">
          <h2><RubyText>新しいスタンプ</RubyText></h2>
          <div className="stamp-row">
            {stamps.map((stamp) => <span className={`stamp ${stamp.style}`} key={stamp.stampId}><RubyText>{stamp.name}</RubyText></span>)}
          </div>
        </section>
      )}

      <section className="panel">
        <h2><RubyText>今回まちがえた問題</RubyText></h2>
        {result.wrongItems?.length ? (
          <ul className="mistake-list">
            {result.wrongItems.map((item, idx) => (
              <li key={`${item.question.id}-${idx}`}>
                <RubyText>{item.question.question}</RubyText>
                <span><RubyText>選んだ答え</RubyText>: {item.selected}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p><RubyText>まちがえた問題はありません。</RubyText></p>
        )}
      </section>

      <div className="button-row sticky-actions">
        <button onClick={onRetry}><RubyText>もう一回</RubyText></button>
        <button className="secondary" onClick={onUnits}><RubyText>単元選択へ戻る</RubyText></button>
        <button className="secondary" onClick={onHome}><RubyText>ホームへ戻る</RubyText></button>
        <button className="warn" onClick={onWeak}><RubyText>苦手こくふくへ進む</RubyText></button>
      </div>
    </main>
  );
}
