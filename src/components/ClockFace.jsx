export default function ClockFace({ clock }) {
  if (!clock) return null;

  const minute = Number(clock.minute) || 0;
  const hour = Number(clock.hour) || 0;
  const minuteAngle = minute * 6;
  const hourAngle = ((hour % 12) + minute / 60) * 30;

  return (
    <div className="clock-face" aria-label={`${hour}時${minute}分の時計`}>
      {Array.from({ length: 12 }, (_, index) => {
        const number = index + 1;
        const angle = number * 30;
        return (
          <span
            className="clock-number"
            key={number}
            style={{
              transform: `rotate(${angle}deg) translateY(-72px) rotate(-${angle}deg)`
            }}
          >
            {number}
          </span>
        );
      })}
      <span className="clock-hand hour-hand" style={{ transform: `rotate(${hourAngle}deg)` }} />
      <span className="clock-hand minute-hand" style={{ transform: `rotate(${minuteAngle}deg)` }} />
      <span className="clock-center" />
    </div>
  );
}
