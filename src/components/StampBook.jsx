import { STAMP_DEFINITIONS, hydrateStamp, normalizeEarnedStamp } from "../utils/stamps";
import RubyText from "./RubyText";

export default function StampBook({ stamps, onBack }) {
  const earnedMap = new Map(stamps.map((stamp) => {
    const normalized = normalizeEarnedStamp(stamp);
    return [normalized?.stampId, hydrateStamp(normalized)];
  }));

  return (
    <main className="page-shell stamp-book-page">
      <div className="topbar">
        <button className="ghost-button" onClick={onBack}>← <RubyText>ホームへ戻る</RubyText></button>
        <h1><RubyText>スタンプちょう</RubyText></h1>
      </div>

      <section className="stamp-book-cover">
        <div>
          <p className="eyebrow"><RubyText>あつめたスタンプ</RubyText></p>
          <strong>{earnedMap.size} / {STAMP_DEFINITIONS.length}</strong>
        </div>
      </section>

      <section className="stamp-grid">
        {STAMP_DEFINITIONS.map((definition) => {
          const earned = earnedMap.get(definition.id);
          return (
            <article className={`stamp-card ${earned ? "earned" : "locked"}`} key={definition.id}>
              <span className={`stamp big ${definition.style}`}>{earned ? definition.icon : "?"}</span>
              <strong><RubyText>{definition.name}</RubyText></strong>
              <p><RubyText>{definition.description}</RubyText></p>
              <small>
                {earned ? (
                  <>
                    {`もらった日: ${formatDate(earned.lastEarnedAt || earned.earnedAt)}`}
                    {Number(earned.count || 1) > 1 && <span className="stamp-count">{earned.count}回</span>}
                  </>
                ) : "まだです"}
              </small>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}
