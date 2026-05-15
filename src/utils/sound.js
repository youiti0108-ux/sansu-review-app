import { getSettings } from "./storage";

const canPlay = () => getSettings().sound !== false && typeof window !== "undefined";

const playTone = (frequency, duration, type = "sine", delay = 0, volume = 0.16) => {
  if (!canPlay()) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const startAt = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.03);
  osc.addEventListener("ended", () => ctx.close?.());
};

export const playCorrectSound = () => {
  playTone(740, 0.1, "triangle", 0, 0.15);
  playTone(980, 0.12, "triangle", 0.08, 0.13);
};

export const playWrongSound = () => {
  playTone(330, 0.16, "sine", 0, 0.08);
  playTone(260, 0.18, "sine", 0.12, 0.06);
};

export const playClearSound = () => {
  playTone(660, 0.1, "triangle", 0, 0.13);
  playTone(880, 0.11, "triangle", 0.09, 0.13);
  playTone(1100, 0.16, "triangle", 0.2, 0.12);
};

export const playClickSound = () => {
  playTone(520, 0.045, "sine", 0, 0.045);
};

export const playCorrect = playCorrectSound;
export const playGentleWrong = playWrongSound;
