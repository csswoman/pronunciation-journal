export interface SwipeDirectionOptions {
  threshold?: number;
  velocityThreshold?: number;
}

export type SwipeDirection = "left" | "right" | null;

/**
 * Resolves whether a drag gesture should result in a swipe left, right, or null (snap back).
 *
 * @param offset Current horizontal drag offset in pixels.
 * @param velocity Velocity in px/ms (positive moving right, negative moving left).
 * @param options Configurable distance and velocity thresholds.
 */
export function resolveSwipeDirection(
  offset: number,
  velocity: number,
  options?: SwipeDirectionOptions,
): SwipeDirection {
  const threshold = options?.threshold ?? 80;
  const velocityThreshold = options?.velocityThreshold ?? 0.5;

  // Velocity-based trigger if moved past a minimal deadzone in the same direction
  if (Math.abs(velocity) >= velocityThreshold) {
    if (velocity > 0 && offset > 20) return "right";
    if (velocity < 0 && offset < -20) return "left";
  }

  // Distance-based trigger
  if (offset >= threshold) return "right";
  if (offset <= -threshold) return "left";

  return null;
}
