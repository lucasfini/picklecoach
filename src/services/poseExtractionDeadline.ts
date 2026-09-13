export const POSE_EXTRACTION_TIMEOUT_MILLISECONDS = 60_000;

export class PoseExtractionTimeoutError extends Error {
  constructor() {
    super('On-device pose extraction exceeded its processing deadline.');
    this.name = 'PoseExtractionTimeoutError';
  }
}

export function withPoseExtractionDeadline<T>(
  operation: Promise<T>,
  timeoutMilliseconds = POSE_EXTRACTION_TIMEOUT_MILLISECONDS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let isSettled = false;
    const timeout = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      reject(new PoseExtractionTimeoutError());
    }, timeoutMilliseconds);

    operation.then(
      (value) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
