import RubyText from "./RubyText";

export default function GraphDisplay({ graph }) {
  if (!graph?.rows?.length) return null;
  const max = Math.max(...graph.rows.map((row) => Number(row[1]) || 0), 1);

  return (
    <div className="graph-display">
      <strong><RubyText>{graph.title}</RubyText></strong>
      <table className="graph-table">
        <tbody>
          {graph.rows.map(([label, value]) => (
            <tr key={label}>
              <th><RubyText>{label}</RubyText></th>
              <td>{value}人</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bar-graph" aria-label="棒グラフ">
        {graph.rows.map(([label, value]) => (
          <div className="bar-graph-row" key={label}>
            <span><RubyText>{label}</RubyText></span>
            <i style={{ width: `${(Number(value) / max) * 100}%` }} />
            <b>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
