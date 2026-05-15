import { hydrateAward } from "../utils/awards";
import RubyText from "./RubyText";

export default function Award({ award }) {
  const item = hydrateAward(award);
  if (!item) return null;

  return (
    <section className="award-card">
      <div className="award-border">
        <p className="award-ribbon"><RubyText>賞状</RubyText></p>
        <div className="award-seal">{item.icon}</div>
        <h2 className="award-title"><RubyText>{item.title}</RubyText></h2>
        <p className="award-body"><RubyText>{item.message}</RubyText></p>
        {item.total ? (
          <p className="award-score">
            {item.total}<RubyText>問中</RubyText>{item.score}<RubyText>問 正解</RubyText>
          </p>
        ) : null}
        <p className="award-date"><RubyText>{`日付：${formatDate(item.earnedAt)}`}</RubyText></p>
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
