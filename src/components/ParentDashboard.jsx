import { buildStats } from "../utils/stats";
import { clearAwards, clearHistory, clearMistakes, clearStamps } from "../utils/storage";
import { AWARD_DEFINITIONS, hydrateAward } from "../utils/awards";
import { STAMP_DEFINITIONS, hydrateStamp } from "../utils/stamps";
import RubyText from "./RubyText";

export default function ParentDashboard({ history, mistakes, stamps = [], awards = [], soundOn, onToggleSound, onReset, onBack }) {
  const stats = buildStats(history, mistakes);
  const earnedStamps = safeList(stamps).map(hydrateStamp).filter(Boolean);
  const earnedAwards = safeList(awards).map(hydrateAward).filter(Boolean);
  const recentStamps = [...earnedStamps].sort(byEarnedDate).slice(0, 4);
  const recentAwards = [...earnedAwards].sort(byEarnedDate).slice(0, 4);

  const reset = (fn, message) => {
    if (!window.confirm(message)) return;
    fn();
    onReset();
  };

  return (
    <main className="page-shell parent">
      <div className="topbar">
        <button className="ghost-button" onClick={onBack}>ホームへ戻る</button>
        <h1>おうちの人</h1>
      </div>

      <section className="panel parent-section">
        <SectionTitle title="今日の学習状況" note="今日どれくらい取り組んだかを確認できます。" />
        <div className="dashboard-grid">
          <Metric label="チャレンジ回数" value={`${stats.todaySessions}回`} />
          <Metric label="解いた問題数" value={`${stats.todayTotal}問`} />
          <Metric label="今日の正答率" value={`${stats.todayRate}%`} />
          <Metric label="今日こくふく" value={`${stats.todayConquered}問`} />
        </div>
      </section>

      <section className="panel parent-section">
        <SectionTitle title="全体サマリー" note="これまでの学習量と苦手の残りをまとめています。" />
        <div className="dashboard-grid">
          <Metric label="累計チャレンジ" value={`${stats.totalSessions}回`} />
          <Metric label="累計問題数" value={`${stats.total}問`} />
          <Metric label="累計正解数" value={`${stats.correct}問`} />
          <Metric label="全体正答率" value={`${stats.rate}%`} />
          <Metric label="現在の苦手" value={`${stats.activeWeakCount}問`} />
          <Metric label="こくふく済み" value={`${stats.conqueredCount}問`} />
          <Metric label="獲得スタンプ" value={`${earnedStamps.length} / ${STAMP_DEFINITIONS.length}`} />
          <Metric label="獲得賞状" value={`${earnedAwards.length} / ${AWARD_DEFINITIONS.length}`} />
        </div>
      </section>

      <section className="panel parent-section">
        <SectionTitle title="学年別成績" note="正答率、解いた問題数、苦手数を学年ごとに見られます。" />
        <div className="parent-stat-list">
          {stats.byGrade.map((row) => <StatCard key={row.label} row={row} />)}
        </div>
      </section>

      <section className="panel parent-section">
        <SectionTitle title="単元別成績" note="苦手数が多い単元を上に表示しています。" />
        {stats.units.length ? (
          <div className="parent-stat-list">
            {stats.units.map((row) => <StatCard key={row.label} row={row} />)}
          </div>
        ) : (
          <p className="empty-note">まだ学習履歴がありません。</p>
        )}
      </section>

      <section className="panel parent-section">
        <SectionTitle title="よく間違える問題" note="復習するとよさそうな問題です。" />
        {stats.topMistakes.length ? (
          <div className="parent-list">
            {stats.topMistakes.map((item) => <MistakeCard key={item.questionId || item.question} item={item} />)}
          </div>
        ) : (
          <p className="empty-note">苦手問題はありません。</p>
        )}
      </section>

      <section className="panel parent-section">
        <SectionTitle title="最近の学習履歴" note="新しい順に直近10件を表示します。" />
        {stats.recent.length ? (
          <div className="parent-list">
            {stats.recent.map((item, index) => <HistoryCard key={`${item.date || "no-date"}-${index}`} item={item} />)}
          </div>
        ) : (
          <p className="empty-note">まだ学習履歴がありません。</p>
        )}
      </section>

      <section className="panel parent-section">
        <SectionTitle title="スタンプ・賞状" note="最近の達成状況を確認できます。" />
        <div className="achievement-summary">
          <Metric label="獲得スタンプ" value={`${earnedStamps.length} / ${STAMP_DEFINITIONS.length}`} />
          <Metric label="獲得賞状" value={`${earnedAwards.length} / ${AWARD_DEFINITIONS.length}`} />
        </div>
        <RecentAchievements title="最近のスタンプ" items={recentStamps} empty="まだ獲得したスタンプはありません。" getName={(item) => `${item.icon || ""} ${item.name || item.stampId}`} />
        <RecentAchievements title="最近の賞状" items={recentAwards} empty="まだ獲得した賞状はありません。" getName={(item) => `${item.icon || ""} ${item.title || item.awardId}`} />
      </section>

      <section className="panel parent-section danger-zone">
        <SectionTitle title="設定とリセット" note="記録を消す操作です。押すと確認画面が出ます。" />
        <div className="button-row">
          <button onClick={onToggleSound}><RubyText>{`音：${soundOn ? "オン" : "オフ"}`}</RubyText></button>
          <button className="warn" onClick={() => reset(clearMistakes, "苦手問題をリセットしますか？")}>苦手問題をリセット</button>
          <button className="warn" onClick={() => reset(clearHistory, "学習履歴をリセットしますか？")}>学習履歴をリセット</button>
          <button className="warn" onClick={() => reset(clearStamps, "スタンプをリセットしますか？")}>スタンプをリセット</button>
          <button className="warn" onClick={() => reset(clearAwards, "賞状をリセットしますか？")}>賞状をリセット</button>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ title, note }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function StatCard({ row }) {
  return (
    <article className={`parent-stat-card ${row.weakCount > 0 ? "needs-review" : ""}`}>
      <div>
        <strong>{row.label || "データなし"}</strong>
        <span>{row.total}問 / 苦手 {row.weakCount}問</span>
      </div>
      <b>{row.rate}%</b>
      <div className="mini-bar"><i style={{ width: `${row.rate}%` }} /></div>
    </article>
  );
}

function MistakeCard({ item }) {
  return (
    <article className="parent-list-item">
      <strong>{formatGrade(item.grade)} / {item.unit || "単元なし"}</strong>
      <p>{item.question || "問題文なし"}</p>
      <p>正解: {item.answer ?? "データなし"} / 選んだ答え: {item.selected ?? "データなし"}</p>
      <p>間違えた回数: {Number(item.mistakeCount) || 0}回 / 最後: {formatDate(item.lastMistakeDate)}</p>
      <StepMistakeDetails item={item} />
    </article>
  );
}

function HistoryCard({ item }) {
  const total = Number(item.total) || 0;
  const correct = Number(item.correct) || 0;
  const wrong = Number(item.wrongCount ?? total - correct) || 0;
  const rate = Number.isFinite(Number(item.rate)) ? Number(item.rate) : total ? Math.round((correct / total) * 100) : 0;

  return (
    <article className="parent-list-item">
      <strong>{formatDate(item.date)} / {item.unit || "単元なし"}</strong>
      <p>学年: {formatGrade(item.grade)} / モード: {formatMode(item.modeType)}</p>
      <p>{total}問中 {correct}問正解 / 正答率 {rate}% / 間違い {wrong}問</p>
    </article>
  );
}

function RecentAchievements({ title, items, empty, getName }) {
  return (
    <div className="recent-achievements">
      <h3>{title}</h3>
      {items.length ? (
        <div className="parent-stamp-list">
          {items.map((item) => (
            <span className={`stamp ${item.style || "gold"}`} key={item.stampId || item.awardId}>
              {getName(item)}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty-note">{empty}</p>
      )}
    </div>
  );
}

function StepMistakeDetails({ item }) {
  const details = safeList(item.wrongStepDetails);
  const wrongSteps = safeList(item.wrongSteps);
  if (!details.length && !wrongSteps.length) return null;

  if (!details.length) {
    return <p className="step-detail-note">間違えたステップ: {wrongSteps.map((step) => Number(step) + 1).join(", ")}</p>;
  }

  return (
    <div className="step-detail-list">
      <p>つまずいたところ</p>
      {details.slice(0, 3).map((detail, index) => (
        <div key={`${detail.date || "no-date"}-${index}`} className="step-detail-item">
          <strong>{describeStep(detail)}</strong>
          <span>選んだ答え: {detail.selected ?? "データなし"} / 正解: {detail.answer ?? "データなし"}</span>
        </div>
      ))}
    </div>
  );
}

function describeStep(detail) {
  const label = detail.stepLabel || detail.stepPrompt || `ステップ${detail.stepNumber || "?"}`;
  if (label.includes("式")) return "式を選ぶところで間違えました";
  if (label.includes("くり下がり")) return "くり下がりの考え方で間違えました";
  if (label.includes("くり上がり")) return "くり上がりの考え方で間違えました";
  if (label.includes("一の位") || label.includes("十の位")) return "筆算の途中で間違えました";
  if (label.includes("答え")) return "最後の答えで間違えました";
  return `${label}で間違えました`;
}

function formatDate(value) {
  if (!value) return "データなし";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "データなし";
  return date.toLocaleString("ja-JP");
}

function formatGrade(value) {
  if (value === 0 || value === "mix") return "ミックス";
  return value ? `${value}年生` : "学年なし";
}

function formatMode(value) {
  if (value === "weak") return "苦手こくふく";
  if (value === "quick") return "サクサク";
  if (value === "step") return "じっくり";
  return value || "データなし";
}

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function byEarnedDate(a, b) {
  return new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0);
}
