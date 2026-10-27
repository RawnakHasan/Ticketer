// Small animation helpers shared by the progress and loading indicators.

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// How far `time` is through a range that starts at `start` and lasts `duration`, in [0, 1]
export const rangeProgress = (time: number, start: number, duration: number) =>
  clamp((time - start) / duration, 0, 1);

// Same as CSS cubic-bezier(): x is time and y is progress, both in [0, 1]
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bezier = (a: number, b: number, s: number) => {
    const u = 1 - s;
    return 3 * u * u * s * a + 3 * u * s * s * b + s * s * s;
  };
  const slope = (a: number, b: number, s: number) => {
    const u = 1 - s;
    return 3 * u * u * a + 6 * u * s * (b - a) + 3 * s * s * (1 - b);
  };
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Newton's method finds the curve parameter whose x is t, bisection is the fallback
    let s = t;
    for (let i = 0; i < 8; i++) {
      const error = bezier(x1, x2, s) - t;
      if (Math.abs(error) < 1e-6) return bezier(y1, y2, s);
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= error / d;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 30; i++) {
      const x = bezier(x1, x2, s);
      if (Math.abs(x - t) < 1e-6) break;
      if (x < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return bezier(y1, y2, s);
  };
}

// M3 motion easing tokens
export const standardEasing = cubicBezier(0.2, 0, 0, 1);
export const emphasizedAccelerateEasing = cubicBezier(0.3, 0, 0.8, 0.15);

// A damped spring (mass 1) pulling `value` toward `target`, like Android's SpringForce
export class Spring {
  value: number;
  target: number;
  velocity = 0;
  private readonly stiffness: number;
  private readonly damping: number;

  constructor(value: number, options: { stiffness: number; dampingRatio: number }) {
    this.value = value;
    this.target = value;
    this.stiffness = options.stiffness;
    this.damping = 2 * options.dampingRatio * Math.sqrt(options.stiffness);
  }

  step(seconds: number) {
    // Small fixed steps keep the integration stable however long a frame took
    const h = 1 / 240;
    let remaining = seconds;
    while (remaining > 1e-9) {
      const d = Math.min(h, remaining);
      const acceleration =
        -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += acceleration * d;
      this.value += this.velocity * d;
      remaining -= d;
    }
  }

  // minChange is the smallest change that is still visible, in the units of the value
  isAtRest(minChange: number) {
    return (
      Math.abs(this.value - this.target) < minChange && Math.abs(this.velocity) < minChange * 62.5
    );
  }
}

// Calls step on every animation frame until it returns false. Returns a function that stops it.
export function runAnimationLoop(step: (dtMs: number, nowMs: number) => boolean | void) {
  let frame = 0;
  let last: number | null = null;
  const tick = (now: number) => {
    // Time spent in a background tab shouldn't make the animation jump
    const dt = last === null ? 0 : Math.min(now - last, 64);
    last = now;
    if (step(dt, now) === false) return;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
