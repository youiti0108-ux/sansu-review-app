export default function ShapeDisplay({ shape, small = false }) {
  if (!shape) return null;

  const className = `shape-display shape-${shape} ${small ? "small" : ""}`;
  if (shape === "circleCenter") {
    return (
      <div className={className} aria-label="中心のある円">
        <span className="circle-line" />
        <span className="center-dot" />
      </div>
    );
  }

  if (shape === "circleRadius") {
    return (
      <div className={className} aria-label="半径のある円">
        <span className="circle-line" />
        <span className="center-dot" />
        <span className="radius-line" />
      </div>
    );
  }

  if (shape === "sphere") {
    return (
      <div className={className} aria-label="球">
        <span className="sphere-shine" />
      </div>
    );
  }

  return <div className={className} aria-label={shape} />;
}
