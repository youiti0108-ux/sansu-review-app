import { useState } from "react";
import { AWARD_DEFINITIONS, hydrateAward, normalizeEarnedAward } from "../utils/awards";
import Award from "./Award";
import RubyText from "./RubyText";

export default function AwardsPage({ awards, onBack }) {
  const earnedMap = new Map(awards.map((award) => {
    const normalized = normalizeEarnedAward(award);
    return [normalized?.awardId, hydrateAward(normalized)];
  }));
  const firstEarned = awards.length ? hydrateAward(awards[0]) : null;
  const [selected, setSelected] = useState(firstEarned);

  return (
    <main className="page-shell awards-page">
      <div className="topbar">
        <button className="ghost-button" onClick={onBack}>← <RubyText>ホームへ戻る</RubyText></button>
        <h1><RubyText>しょうじょう</RubyText></h1>
      </div>

      <section className="award-summary">
        <p className="eyebrow"><RubyText>もらった賞状</RubyText></p>
        <strong>{earnedMap.size} / {AWARD_DEFINITIONS.length}</strong>
      </section>

      {selected && <Award award={selected} />}

      <section className="award-list">
        {AWARD_DEFINITIONS.map((definition) => {
          const earned = earnedMap.get(definition.id);
          return (
            <button
              className={`award-list-item ${earned ? "earned" : "award-locked"}`}
              key={definition.id}
              onClick={() => earned && setSelected(earned)}
            >
              <span className="award-mini-seal">{earned ? definition.icon : "?"}</span>
              <strong><RubyText>{definition.title}</RubyText></strong>
              <small><RubyText>{definition.description}</RubyText></small>
              <em>{earned ? `もらった日: ${formatDate(earned.earnedAt)}` : "まだです"}</em>
            </button>
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
