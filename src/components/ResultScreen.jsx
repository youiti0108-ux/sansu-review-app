import { useEffect } from "react";
import Award from "./Award";
import RubyText from "./RubyText";
import { playClearSound } from "../utils/sound";

export default function ResultScreen({ result, stamps, awards = [], unit, onRetry, onUnits, onHome, onWeak }) {
  const rate = Math.round((Number(result.correct) / Math.max(Number(result.total), 1)) * 100);
  const medal = getMedal(rate, result);
  const hintUsedCount = Number(result.hintUsedCount) || 0;
  const hint2UsedCount = Number(result.hint2UsedCount) || 0;
  const noHintCorrectCount = Number(result.noHintCorrectCount) || 0;
  const hintCorrectCount = Number(result.hintCorrectCount) || 0;
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
        {medal && (
          <div className={`medal-result ${medal.className}`}>
            <span aria-hidden="true">{medal.icon}</span>
            <strong><RubyText>{medal.label}</RubyText></strong>
            <small><RubyText>{medal.message}</RubyText></small>
          </div>
        )}
        {(hintUsedCount > 0 || noHintCorrectCount > 0 || hintCorrectCount > 0) && (
          <div className="hint-summary">
            <p><RubyText>{`ヒントなしで ${noHintCorrectCount}問 せいかい！`}</RubyText></p>
            <p><RubyText>{`ヒントを見て ${hintCorrectCount}問 できたよ`}</RubyText></p>
            <p><RubyText>{`ヒントを使った問題 ${hintUsedCount}問`}</RubyText></p>
            {hint2UsedCount > 0 && <p><RubyText>{`ヒント2まで見た問題 ${hint2UsedCount}問`}</RubyText></p>}
          </div>
        )}
        <p><RubyText>正答率</RubyText> {rate}% ・ <RubyText>{unit}</RubyText></p>
        {result.weakCorrectCount > 0 && (
          <p className="conquered-note">
            <RubyText>{`苦手問題に ${result.weakCorrectCount}問 正解しました。`}</RubyText>
          </p>
        )}
        {result.reviewingCount > 0 && (
          <p className="conquered-note">
            <RubyText>{`${result.reviewingCount}問は こくふくまで あと少しです。`}</RubyText>
          </p>
        )}
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
                <span><RubyText>えらんだ答え</RubyText>: {item.selected}</span>
                {Number(item.hintLevelUsed) > 0 && <span><RubyText>{`使ったヒント: ${item.hintLevelUsed}`}</RubyText></span>}
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

function getMedal(rate, result = {}) {
  const hintUsedCount = Number(result.hintUsedCount) || 0;
  if (rate === 100 && hintUsedCount === 0) {
    return { className: "gold", icon: "🏆", label: "金トロフィー", message: "ヒントなしでまんてん！すばらしいです。" };
  }
  if (rate === 100) {
    return { className: "silver", icon: "🥈", label: "銀メダル", message: "ヒントを使って、さいごまでよく考えました！" };
  }
  if (rate >= 90) {
    return { className: "silver", icon: "🥈", label: "銀メダル", message: "あと少しでまんてんです。" };
  }
  if (rate >= 80) {
    return { className: "bronze", icon: "🥉", label: "銅メダル", message: "よく考えて進められました。" };
  }
  return null;
}
