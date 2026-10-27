// The motion of the M3 Expressive progress indicators, ported from the animator delegates in
// material-components-android (DeterminateDrawable and the indeterminate animator delegates).

import {
  Spring,
  clamp,
  cubicBezier,
  emphasizedAccelerateEasing,
  rangeProgress,
  standardEasing,
} from "@/lib/motion";

// Wave amplitude is full between these two progress values and ramps to 0 outside of them
const FULL_AMPLITUDE_MIN = 0.1;
const FULL_AMPLITUDE_MAX = 0.9;
const AMPLITUDE_MS = 500;
// One wavelength per second, the speed Compose uses by default
const WAVE_CYCLE_MS = 1000;

// Determinate: progress follows its target with a critically damped spring, the wave fades in
// once there is some progress to show and fades out near the end, and the wave drifts along.
export class DeterminateMotion {
  progress: number;
  amplitude: number;
  phase = 0;
  private readonly spring: Spring;
  private amplitudeFrom: number;
  private amplitudeTarget: number;
  private amplitudeElapsed = AMPLITUDE_MS;

  constructor(progress: number) {
    this.progress = progress;
    this.spring = new Spring(progress, { stiffness: 50, dampingRatio: 1 });
    this.amplitudeTarget = DeterminateMotion.amplitudeFor(progress);
    this.amplitudeFrom = this.amplitudeTarget;
    this.amplitude = this.amplitudeTarget;
  }

  private static amplitudeFor(progress: number) {
    return progress >= FULL_AMPLITUDE_MIN && progress <= FULL_AMPLITUDE_MAX ? 1 : 0;
  }

  setTarget(target: number, animate: boolean) {
    this.spring.target = target;
    if (!animate) {
      this.spring.value = target;
      this.spring.velocity = 0;
      this.progress = target;
      this.amplitudeTarget = DeterminateMotion.amplitudeFor(target);
      this.amplitude = this.amplitudeTarget;
      this.amplitudeElapsed = AMPLITUDE_MS;
    }
  }

  // minChange: the smallest change in progress that is still visible (1 / track length in px)
  step(dtMs: number, minChange: number, driftWave: boolean) {
    this.spring.step(dtMs / 1000);
    if (this.spring.isAtRest(minChange)) {
      this.spring.value = this.spring.target;
      this.spring.velocity = 0;
    }
    this.progress = this.spring.value;

    const target = DeterminateMotion.amplitudeFor(this.progress);
    if (target !== this.amplitudeTarget) {
      this.amplitudeTarget = target;
      this.amplitudeFrom = this.amplitude;
      this.amplitudeElapsed = 0;
    }
    if (this.amplitudeElapsed < AMPLITUDE_MS) {
      this.amplitudeElapsed += dtMs;
      const ease = this.amplitudeTarget === 1 ? standardEasing : emphasizedAccelerateEasing;
      const t = ease(clamp(this.amplitudeElapsed / AMPLITUDE_MS, 0, 1));
      this.amplitude = this.amplitudeFrom + (this.amplitudeTarget - this.amplitudeFrom) * t;
    }
    if (driftWave) this.phase = (this.phase + dtMs / WAVE_CYCLE_MS) % 1;
  }

  // Nothing is moving: no need to draw another frame (unless the wave drifts)
  get settled() {
    return this.progress === this.spring.target && this.amplitudeElapsed >= AMPLITUDE_MS;
  }
}

// Phase of a wave that drifts at one wavelength per second
export const wavePhase = (timeMs: number) => (timeMs / WAVE_CYCLE_MS) % 1;

// ---------------------------------------------------------------------------------------------
// Linear indeterminate: two bars that run across the track, 1.8 seconds per cycle

const LINEAR_CYCLE_MS = 1800;
// Start and end of bar 1, then start and end of bar 2
const LINEAR_DELAY = [1267, 1000, 333, 0];
const LINEAR_DURATION = [533, 567, 850, 750];
const LINEAR_EASING = [
  cubicBezier(0.2, 0, 0.8, 1),
  cubicBezier(0.4, 0, 1, 1),
  cubicBezier(0, 0, 0.65, 1),
  cubicBezier(0.1, 0, 0.45, 1),
];

// Start and end of both bars, as a fraction of the track
export function linearIndeterminate(timeMs: number) {
  const t = timeMs % LINEAR_CYCLE_MS;
  return [0, 1].map((i) => ({
    start: LINEAR_EASING[2 * i](rangeProgress(t, LINEAR_DELAY[2 * i], LINEAR_DURATION[2 * i])),
    end: LINEAR_EASING[2 * i + 1](
      rangeProgress(t, LINEAR_DELAY[2 * i + 1], LINEAR_DURATION[2 * i + 1]),
    ),
  }));
}

// ---------------------------------------------------------------------------------------------
// Circular indeterminate ("retreat"): one arc that grows and shrinks while it turns, 6 seconds
// per cycle

const CIRCULAR_CYCLE_MS = 6000;
const SPIN_DELAYS = [0, 1500, 3000, 4500];
const SPIN_MS = 500;
const SPIN_DEGREES = 90;
// Rotation that never stops, per cycle
const CONSTANT_ROTATION = 1080;
// The arc covers between 10% and 87% of the circle
const END_FRACTION_MIN = 0.1;
const END_FRACTION_MAX = 0.87;

// Rotation in degrees and where the arc ends as a fraction of the circle (it starts at 0)
export function circularIndeterminate(timeMs: number) {
  const t = timeMs % CIRCULAR_CYCLE_MS;
  let spin = 0;
  for (const delay of SPIN_DELAYS)
    spin += standardEasing(rangeProgress(t, delay, SPIN_MS)) * SPIN_DEGREES;
  const grow =
    standardEasing(rangeProgress(t, 0, 3000)) - standardEasing(rangeProgress(t, 3000, 3000));
  return {
    rotation: CONSTANT_ROTATION * (t / CIRCULAR_CYCLE_MS) + spin,
    end: END_FRACTION_MIN + (END_FRACTION_MAX - END_FRACTION_MIN) * grow,
  };
}
