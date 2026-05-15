import { grades, unitDescriptions } from "../data/questions";
import { getUnitStats } from "../utils/quizUtils";
import RubyText from "./RubyText";

export default function UnitSelect({ grade, history, mistakes, onStart, onBack }) {
  const gradeInfo = grades.find((item) => item.id === grade);

  return (
    <main className="page-shell">
      <div className="topbar">
        <button className="ghost-button" onClick={onBack}>← <RubyText>ホームへ戻る</RubyText></button>
        <h1><RubyText>{`${gradeInfo.label}の単元`}</RubyText></h1>
      </div>
      <section className="unit-grid">
        {gradeInfo.units.map((unit) => {
          const stats = getUnitStats(history, grade, unit);
          const weakCount = mistakes.filter((item) => item.grade === grade && item.unit === unit && item.weak && !item.mastered).length;

          return (
            <article className="unit-card" key={unit}>
              <h2><RubyText>{unit}</RubyText></h2>
              <p><RubyText>{unitDescriptions[unit]}</RubyText></p>
              <div className="unit-metrics">
                <span><RubyText>正答率</RubyText> {stats.rate}%</span>
                <span><RubyText>苦手問題</RubyText> {weakCount}</span>
              </div>
              <div className="button-row">
                <button onClick={() => onStart({ grade, unit, modeType: "quick" })}><RubyText>サクサク10問</RubyText></button>
                <button className="secondary" onClick={() => onStart({ grade, unit, modeType: "step" })}><RubyText>じっくり5問</RubyText></button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
