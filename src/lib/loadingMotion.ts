// Motion of the M3 loading indicator, same numbers as LoadingIndicatorAnimatorDelegate on Android.
// Every 650ms the morph target moves on to the next shape, and a spring (so it overshoots a
// little) chases it. The rotation is a constant spin plus an extra kick on every morph.
export const DURATION_PER_SHAPE_MS = 650;
const CONSTANT_ROTATION_DEG = 50;
const EXTRA_ROTATION_DEG = 90;
const SPRING_STIFFNESS = 200;
const SPRING_DAMPING_RATIO = 0.6;
const SPRING_DAMPING = 2 * SPRING_DAMPING_RATIO * Math.sqrt(SPRING_STIFFNESS);

export type LoadingMotion = {
  // Morph position: the whole part is the current shape, the rest how far it is toward the next
  position: number;
  velocity: number;
  // The position the spring is heading for, goes up by one per shape
  target: number;
  // Time into the current shape
  elapsed: number;
};

export const createLoadingMotion = (): LoadingMotion => ({
  position: 0,
  velocity: 0,
  target: 1,
  elapsed: 0,
});

export function stepLoadingMotion(m: LoadingMotion, deltaMs: number) {
  m.elapsed += deltaMs;
  while (m.elapsed >= DURATION_PER_SHAPE_MS) {
    m.elapsed -= DURATION_PER_SHAPE_MS;
    m.target += 1;
  }

  // Small fixed steps keep the spring stable at any frame rate
  const seconds = deltaMs / 1000;
  const steps = Math.max(1, Math.ceil(seconds * 240));
  const h = seconds / steps;
  for (let i = 0; i < steps; i++) {
    const acceleration = -SPRING_STIFFNESS * (m.position - m.target) - SPRING_DAMPING * m.velocity;
    m.velocity += acceleration * h;
    m.position += m.velocity * h;
  }
}

// Rotation of the indicator in degrees
export function loadingRotation(m: LoadingMotion): number {
  const base = m.target - 1;
  return (
    ((CONSTANT_ROTATION_DEG + EXTRA_ROTATION_DEG) * base +
      CONSTANT_ROTATION_DEG * (m.elapsed / DURATION_PER_SHAPE_MS) +
      EXTRA_ROTATION_DEG * (m.position - base)) %
    360
  );
}
