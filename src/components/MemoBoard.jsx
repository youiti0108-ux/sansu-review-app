import { useEffect, useRef, useState } from "react";
import RubyText from "./RubyText";

export default function MemoBoard({ grid = false }) {
  const canvasRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState("pen");

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [open]);

  const pos = (event) => {
    const point = event.touches?.[0] || event;
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const drawStart = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvasRef.current.dataset.drawing = "true";
  };

  const drawMove = (event) => {
    if (canvasRef.current?.dataset.drawing !== "true") return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(event);
    ctx.strokeStyle = tool === "pen" ? "#263238" : "#fffdf6";
    ctx.lineWidth = tool === "pen" ? 4 : 18;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    if (canvasRef.current) canvasRef.current.dataset.drawing = "false";
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <section className="memo-wrap">
      <button className="memo-toggle" onClick={() => setOpen(!open)}>
        <RubyText>{open ? "メモを閉じる" : "メモを開く"}</RubyText>
      </button>
      {open && (
        <div className="memo-panel">
          <div className="memo-tools">
            <button className={tool === "pen" ? "active" : ""} onClick={() => setTool("pen")}><RubyText>ペン</RubyText></button>
            <button className={tool === "eraser" ? "active" : ""} onClick={() => setTool("eraser")}><RubyText>消しゴム</RubyText></button>
            <button onClick={clear}><RubyText>ぜんぶけす</RubyText></button>
          </div>
          <canvas
            className={`memo-canvas ${grid ? "grid-bg" : ""}`}
            ref={canvasRef}
            onMouseDown={drawStart}
            onMouseMove={drawMove}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={drawStart}
            onTouchMove={drawMove}
            onTouchEnd={stop}
          />
        </div>
      )}
    </section>
  );
}
