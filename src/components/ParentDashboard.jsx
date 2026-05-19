import { buildStats, medalForEntry } from "../utils/stats";
import { clearAwards, clearHistory, clearMistakes, clearStamps, getQuestionStats } from "../utils/storage";
import { AWARD_DEFINITIONS, hydrateAward } from "../utils/awards";
import { STAMP_DEFINITIONS, hydrateStamp } from "../utils/stamps";
import RubyText from "./RubyText";

export default function ParentDashboard({
  history,
  mistakes,
  stamps = [],
  awards = [],
  users = [],
  currentUser,
  onUserChange,
  soundOn,
  onToggleSound,
  onReset,
  onBack
}) {
  const stats = buildStats(history, mistakes);
  const questionStats = Object.values(getQuestionStats());
  const reviewTargetCount = questionStats.filter(needsReview).length;
  const earnedStamps = safeList(stamps).map(hydrateStamp).filter(Boolean);
  const earnedAwards = safeList(awards).map(hydrateAward).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const todayStamps = earnedStamps.filter((item) => (item.lastEarnedAt || item.earnedAt || "").slice(0, 10) === today);
  const todayAwards = earnedAwards.filter((item) => (item.earnedAt || "").slice(0, 10) === today);
  const medalRows = safeList(history).map((item) => ({ ...medalForEntry(item), unit: item.unit, date: item.date })).filter((item) => item.rank > 0);
  const todayMedals = medalRows.filter((item) => (item.date || "").slice(0, 10) === today);
  const medalCounts = medalRows.reduce((counts, medal) => {
    const key = medal.rank === 4 ? "trophy" : medal.rank === 3 ? "silver" : "bronze";
    counts[key] += 1;
    return counts;
  }, { trophy: 0, silver: 0, bronze: 0 });
  const bestMedalsByUnit = bestMedals(history).slice(0, 8);
  const recommendations = buildRecommendations(stats, questionStats);
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
      <section className="panel parent-section user-panel">
        <SectionTitle title="表示するユーザー" note="この画面では、選んでいる子どもの記録だけを表示します。" />
        <div className="user-switch parent-user-switch">
          <span>表示中: {currentUser?.name || "ゲスト"}</span>
          <div>
            {users.map((user) => (
              <button
                className={user.id === currentUser?.id ? "active" : ""}
                key={user.id}
                onClick={() => onUserChange(user.id)}
                type="button"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel parent-section">
        <SectionTitle title="今日の学習状況" note="今日どれくらい取り組んだかを確認できます。" />
        <div className="dashboard-grid">
          <Metric label="チャレンジ回数" value={`${stats.todaySessions}回`} />
          <Metric label="解いた問題数" value={`${stats.todayTotal}問`} />
          <Metric label="今日の正答率" value={`${stats.todayRate}%`} />
          <Metric label="今日の正解数" value={`${stats.todayCorrect}問`} />
          <Metric label="今日こくふく" value={`${stats.todayConquered}問`} />
          <Metric label="ヒント使用" value={`${stats.todayHintUsed}問`} />
          <Metric label="ヒントなし正解" value={`${stats.todayNoHintCorrect}問`} />
          <Metric label="今日のメダル" value={`${todayMedals.length}こ`} />
          <Metric label="今日のスタンプ" value={`${todayStamps.length}こ`} />
          <Metric label="今日の賞状" value={`${todayAwards.length}こ`} />
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
          <Metric label="克服中" value={`${stats.reviewingWeakCount}問`} />
          <Metric label="こくふく済み" value={`${stats.conqueredCount}問`} />
          <Metric label="ヒント使用" value={`${stats.hintUsedCount}問`} />
          <Metric label="ヒントあり正解" value={`${stats.hintCorrectCount}問`} />
          <Metric label="ヒント2使用" value={`${stats.hint2UsedCount}問`} />
          <Metric label="ヒントなし正解" value={`${stats.noHintCorrectCount}問`} />
          <Metric label="再確認候補" value={`${reviewTargetCount}問`} />
          <Metric label="金トロフィー" value={`${medalCounts.trophy}こ`} />
          <Metric label="銀メダル" value={`${medalCounts.silver}こ`} />
          <Metric label="銅メダル" value={`${medalCounts.bronze}こ`} />
          <Metric label="獲得スタンプ" value={`${earnedStamps.length} / ${STAMP_DEFINITIONS.length}`} />
          <Metric label="獲得賞状" value={`${earnedAwards.length} / ${AWARD_DEFINITIONS.length}`} />
        </div>
      </section>

      <section className="panel parent-section">
        <SectionTitle title="次のおすすめ" note="声かけや次の復習につなげやすい順に表示しています。" />
        <div className="recommend-list">
          {recommendations.map((item, index) => (
            <article className="parent-list-item recommendation" key={`${item}-${index}`}>{item}</article>
          ))}
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
        <SectionTitle title="ヒントの使い方" note="ヒントは考えるための道具です。多い単元は、じっくり確認すると伸びやすいところです。" />
        <div className="dashboard-grid">
          <Metric label="ヒントなし正解" value={`${stats.noHintCorrectCount}問`} />
          <Metric label="ヒントを使って正解" value={`${stats.hintCorrectCount}問`} />
          <Metric label="ヒント2使用" value={`${stats.hint2UsedCount}問`} />
        </div>
        <div className="parent-stat-list compact">
          {[...stats.units]
            .filter((row) => row.total > 0)
            .sort((a, b) => b.hint2UsedCount - a.hint2UsedCount || b.hintUsedCount - a.hintUsedCount)
            .slice(0, 5)
            .map((row) => <HintCard key={row.label} row={row} />)}
        </div>
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
        <SectionTitle title="スタンプと賞状" note="最近の達成状況を確認できます。" />
        <div className="achievement-summary">
          <Metric label="獲得スタンプ" value={`${earnedStamps.length} / ${STAMP_DEFINITIONS.length}`} />
          <Metric label="獲得賞状" value={`${earnedAwards.length} / ${AWARD_DEFINITIONS.length}`} />
          <Metric label="金トロフィー" value={`${medalCounts.trophy}こ`} />
          <Metric label="銀メダル" value={`${medalCounts.silver}こ`} />
          <Metric label="銅メダル" value={`${medalCounts.bronze}こ`} />
        </div>
        {bestMedalsByUnit.length > 0 && (
          <div className="medal-unit-list">
            {bestMedalsByUnit.map((item) => (
              <span className="medal-chip" key={item.unit}>{item.unit}: {item.medal.shortLabel}</span>
            ))}
          </div>
        )}
        <RecentAchievements title="最近のスタンプ" items={recentStamps} empty="まだ獲得したスタンプはありません。" getName={(item) => `${item.icon || ""} ${item.name || item.stampId}`} />
        <RecentAchievements title="最近の賞状" items={recentAwards} empty="まだ獲得した賞状はありません。" getName={(item) => `${item.icon || ""} ${item.title || item.awardId}`} />
      </section>

      <section className="panel parent-section danger-zone">
        <SectionTitle title="設定とリセット" note="記録を消す操作です。押すと確認画面が出ます。" />
        <div className="button-row">
          <button onClick={onToggleSound}><RubyText>{`音：${soundOn ? "オン" : "オフ"}`}</RubyText></button>
          <button className="warn" onClick={() => reset(clearMistakes, "このユーザーの苦手問題をリセットしますか？")}>このユーザーの苦手問題をリセット</button>
          <button className="warn" onClick={() => reset(clearHistory, "このユーザーの学習履歴をリセットしますか？")}>このユーザーの学習履歴をリセット</button>
          <button className="warn" onClick={() => reset(clearStamps, "このユーザーのスタンプをリセットしますか？")}>このユーザーのスタンプをリセット</button>
          <button className="warn" onClick={() => reset(clearAwards, "このユーザーの賞状をリセットしますか？")}>このユーザーの賞状をリセット</button>
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
  const bestMedal = row.bestMedal?.shortLabel || "なし";
  return (
    <article className={`parent-stat-card ${row.weakCount > 0 ? "needs-review" : ""}`}>
      <div>
        <strong>{row.label || "データなし"}</strong>
        <span>{row.total}問 / 苦手 {row.weakCount}問 / 克服中 {Number(row.reviewingCount) || 0}問 / 克服済み {Number(row.masteredCount) || 0}問</span>
        <span>ヒント {Number(row.hintUsedCount) || 0}問 / 最高メダル {bestMedal}</span>
        <span className="status-note">{row.statusMemo || "データなし"}</span>
      </div>
      <b>{row.rate}%</b>
      <div className="mini-bar"><i style={{ width: `${row.rate}%` }} /></div>
    </article>
  );
}

function HintCard({ row }) {
  const hintUsed = Number(row.hintUsedCount) || 0;
  const hint2Used = Number(row.hint2UsedCount) || 0;
  const noHintCorrect = Number(row.noHintCorrectCount) || 0;
  const memo = hint2Used > 0
    ? "ヒント2で考え方を確認しています"
    : hintUsed > 0
      ? "ヒントを使って考えています"
      : "ヒントなしでよく進めています";

  return (
    <article className={`parent-stat-card ${hint2Used > 0 ? "needs-review" : ""}`}>
      <div>
        <strong>{row.label || "データなし"}</strong>
        <span>ヒント {hintUsed}問 / ヒント2 {hint2Used}問</span>
        <span>ヒントなし正解 {noHintCorrect}問</span>
        <span className="status-note">{memo}</span>
      </div>
      <b>{row.rate}%</b>
    </article>
  );
}

function MistakeCard({ item }) {
  const status = mistakeStatus(item);
  const remaining = Math.max(0, Number(item.remainingCorrectCount) || 0);
  const hintLevel = Number(item.hintLevelUsed) || 0;

  return (
    <article className="parent-list-item">
      <strong>{formatGrade(item.grade)} / {item.unit || "単元なし"}</strong>
      <p>{item.question || "問題文なし"}</p>
      <p>正解: {item.answer ?? "データなし"} / 選んだ答え: {item.selected ?? "データなし"}</p>
      <p>間違えた回数: {Number(item.mistakeCount) || 0}回 / 最後: {formatDate(item.lastMistakeDate)}</p>
      <p>状態: {status} / あと{remaining}回正解でこくふく</p>
      {hintLevel > 0 && <p>ヒント使用: ヒント{hintLevel}まで</p>}
      {item.lastCorrectAt && <p>最後に正解した日: {formatDate(item.lastCorrectAt)}</p>}
      <StepMistakeDetails item={item} />
    </article>
  );
}

function HistoryCard({ item }) {
  const total = Number(item.total) || 0;
  const correct = Number(item.correct) || 0;
  const wrong = Number(item.wrongCount ?? total - correct) || 0;
  const rate = Number.isFinite(Number(item.rate)) ? Number(item.rate) : total ? Math.round((correct / total) * 100) : 0;
  const hintUsed = Number(item.hintUsedCount) || 0;
  const hint2Used = Number(item.hint2UsedCount) || 0;
  const noHintCorrect = Number(item.noHintCorrectCount) || 0;
  const medal = medalForEntry(item);

  return (
    <article className="parent-list-item">
      <strong>{formatDate(item.date)} / {item.unit || "単元なし"}</strong>
      <p>学年: {formatGrade(item.grade)} / モード: {formatMode(item.modeType)}</p>
      <p>{total}問中 {correct}問正解 / 正答率 {rate}% / 間違い {wrong}問</p>
      <p>ヒント使用 {hintUsed}問 / ヒント2 {hint2Used}問 / ヒントなし正解 {noHintCorrect}問</p>
      <p>メダル: {medal.shortLabel || "なし"} / 苦手こくふく: {Number(item.conqueredCount) || 0}問</p>
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
          {Number(detail.hintLevelUsed) > 0 && <span>ヒント: {detail.hintLevelUsed}</span>}
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

function mistakeStatus(item) {
  if (item?.mastered || item?.status === "mastered") return "克服済み";
  if (item?.status === "reviewing" || Number(item?.correctAfterWrongCount) > 0) return "克服中";
  return "苦手";
}

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function byEarnedDate(a, b) {
  return new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0);
}

function bestMedals(rows = []) {
  const byUnit = new Map();
  safeList(rows).forEach((row) => {
    const unit = row?.unit;
    if (!unit) return;
    const medal = medalForEntry(row);
    if (medal.rank <= 0) return;
    const current = byUnit.get(unit);
    if (!current || medal.rank > current.medal.rank) {
      byUnit.set(unit, { unit, medal });
    }
  });
  return [...byUnit.values()].sort((a, b) => b.medal.rank - a.medal.rank || a.unit.localeCompare(b.unit, "ja"));
}

function buildRecommendations(stats, questionStats) {
  const units = safeList(stats.units).filter((row) => row.total > 0 || row.weakCount > 0);
  const messages = [];
  const weakUnit = [...units].sort((a, b) => b.weakCount - a.weakCount)[0];
  const hintUnit = [...units]
    .filter((row) => row.hintUsedCount > 0 || row.hint2UsedCount > 0)
    .sort((a, b) => b.hint2UsedCount - a.hint2UsedCount || b.hintUsedCount - a.hintUsedCount)[0];
  const lowUnit = [...units].filter((row) => row.total > 0).sort((a, b) => a.rate - b.rate)[0];
  const strongUnit = [...units].filter((row) => row.total > 0).sort((a, b) => b.rate - a.rate)[0];
  const reviewCount = safeList(questionStats).filter(needsReview).length;

  if (stats.activeWeakCount > 0) {
    messages.push(`苦手こくふくを ${Math.min(stats.activeWeakCount, 3)}問くらいやってみましょう。`);
  }
  if (weakUnit?.weakCount > 0) {
    messages.push(`${weakUnit.label} は苦手こくふく中です。じっくり確認するとよさそうです。`);
  }
  if (hintUnit?.hint2UsedCount > 0) {
    messages.push(`${hintUnit.label} はヒント2で考え方を確認しています。次はヒント1までで挑戦してみましょう。`);
  } else if (hintUnit?.hintUsedCount > 0) {
    messages.push(`${hintUnit.label} はヒントを使って考えています。もう少しでヒントなしでもできそうです。`);
  }
  if (lowUnit?.total > 0 && lowUnit.rate < 70) {
    messages.push(`${lowUnit.label} をもう一度復習してみましょう。`);
  }
  if (strongUnit?.total > 0 && strongUnit.rate >= 90) {
    messages.push(`${strongUnit.label} はよくできています。しっかりほめたい単元です。`);
  }
  if (reviewCount > 0) {
    messages.push(`正解済みでも再確認したい問題が ${reviewCount}問あります。サクサク10問で少しずつ復習できます。`);
  }

  const unique = [...new Set(messages)].slice(0, 5);
  return unique.length ? unique : ["まだ記録が少ないため、まずは好きな単元を1回やってみましょう。"];
}

function needsReview(item) {
  if (!item?.seenCount) return false;
  const lastSeen = item.lastSeenAt ? new Date(item.lastSeenAt).getTime() : 0;
  const days = lastSeen && !Number.isNaN(lastSeen) ? (Date.now() - lastSeen) / 86400000 : 999;
  return Number(item.wrongCount) > 0 || Number(item.hintLevelMax) > 0 || Number(item.correctCount) <= 1 || days >= 7;
}
