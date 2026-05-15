const blank = "□";

export default function VerticalWork({ question, stepIndex }) {
  if (!question.layout) return null;

  const fill = question.steps?.[Math.max(0, stepIndex - 1)]?.fill || {};
  const { top, op, bottom } = question.layout;
  const result = `${fill.tens ?? blank}${fill.ones ?? blank}`;
  const helperRow = buildHelperRow(op, fill);

  return (
    <div className="vertical-work" aria-label="筆算の途中">
      <div className="vertical-row helper">{helperRow}</div>
      <div className="vertical-row">{top}</div>
      <div className="vertical-row">
        <span className="vertical-op">{op}</span>
        <span>{bottom}</span>
      </div>
      <div className="line" />
      <div className="vertical-row result">{result}</div>
    </div>
  );
}

function buildHelperRow(op, fill) {
  if (op === "-") {
    if (fill.borrow && fill.borrowedOnes) return `${fill.borrow} ${fill.borrowedOnes}`;
    if (fill.ones) return `  ${fill.ones}`;
    return "  □";
  }

  if (fill.carry) return ` ${fill.carry}`;
  return " □";
}
