export const poseJointNames = [
  'nose',
  'neck',
  'root',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
] as const;

export type PoseJointName = (typeof poseJointNames)[number];

export type PoseLandmark = {
  x: number;
  y: number;
  confidence: number;
};

export type PoseFrame = {
  timestamp: number;
  poseDetected: boolean;
  personCount: number;
  landmarks: Partial<Record<PoseJointName, PoseLandmark>>;
  frameError?: 'vision-request-failed';
};

export type PoseQualityIssue =
  | 'processing-failed'
  | 'insufficient-frames'
  | 'person-not-found'
  | 'multiple-people'
  | 'tracking-lost'
  | 'body-not-fully-visible'
  | 'subject-too-small';

export type PoseTrackingQuality = {
  status: 'usable' | 'retake';
  issues: PoseQualityIssue[];
  message: string;
  poseCoverage: number;
  keyJointCoverage: number;
  averageConfidence: number;
  averageSubjectHeight: number;
  poseFrameCount: number;
};

export type PoseExtractionResult = {
  source: 'apple-vision-2d';
  sourceVersion: string;
  processedAt: string;
  coordinateSpace: 'normalized-top-left-oriented-display';
  video: {
    duration: number;
    width: number;
    height: number;
  };
  sampling: {
    targetFramesPerSecond: number;
    decodedFrameCount: number;
    sampledFrameCount: number;
    maximumFrames: number;
  };
  quality: PoseTrackingQuality;
  frames: PoseFrame[];
};

export const poseConnections: ReadonlyArray<readonly [PoseJointName, PoseJointName]> = [
  ['leftEar', 'leftEye'],
  ['leftEye', 'nose'],
  ['nose', 'rightEye'],
  ['rightEye', 'rightEar'],
  ['nose', 'neck'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'root'],
  ['rightHip', 'root'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

export const poseKeyJointNames = [
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
] as const satisfies ReadonlyArray<PoseJointName>;

export type PoseKeyJointName = (typeof poseKeyJointNames)[number];

export type PoseJointCoverage = {
  joint: PoseKeyJointName;
  detectedFrameCount: number;
  coverage: number;
};

const poseJointNameSet = new Set<string>(poseJointNames);
export const MAX_MULTIPLE_PERSON_FRAME_RATIO = 0.1;
const MAXIMUM_NATIVE_POSE_FRAMES = 360;
const MAXIMUM_NATIVE_VIDEO_DURATION_SECONDS = 31;
const MAXIMUM_NATIVE_VIDEO_DIMENSION = 16_384;
const MAXIMUM_DECODED_FRAME_COUNT = 1_000_000;
const MAXIMUM_PEOPLE_PER_FRAME = 32;
const MAXIMUM_PROVENANCE_LABEL_LENGTH = 120;
const qualityIssues = new Set<PoseQualityIssue>([
  'processing-failed',
  'insufficient-frames',
  'person-not-found',
  'multiple-people',
  'tracking-lost',
  'body-not-fully-visible',
  'subject-too-small',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isUnitNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function retakeMessage(issues: PoseQualityIssue[]) {
  if (issues.includes('processing-failed')) {
    return 'Pose tracking could not process enough frames. Keep the clip on this iPhone and try again.';
  }
  if (issues.includes('person-not-found')) {
    return 'No full player was found. Step into frame and record again.';
  }
  if (issues.includes('multiple-people')) {
    return 'Keep other players out of frame so tracking stays on you.';
  }
  if (issues.includes('subject-too-small')) {
    return 'Move the phone closer so the player fills more of the frame.';
  }
  if (issues.includes('body-not-fully-visible')) {
    return 'Keep the full body, including both feet and the paddle arm, in frame.';
  }
  if (issues.includes('tracking-lost')) {
    return 'Use steadier framing and brighter, even light so tracking can follow every rep.';
  }
  return 'Record at least a few seconds with the full player visible.';
}

/**
 * Recomputes the native quality gate from the frame-level evidence. This is a
 * deliberate second check: UI code never trusts a native "usable" flag without
 * verifying that the landmarks themselves satisfy the same thresholds.
 */
export function evaluatePoseTrackingQuality(frames: PoseFrame[]): PoseTrackingQuality {
  const visionFailureCount = frames.reduce(
    (count, frame) => count + (frame.frameError === 'vision-request-failed' ? 1 : 0),
    0,
  );
  const multiplePersonFrameCount = frames.reduce(
    (count, frame) => count + (frame.personCount > 1 ? 1 : 0),
    0,
  );
  let poseFrameCount = 0;
  let detectedKeyJointCount = 0;
  let confidenceTotal = 0;
  let confidenceCount = 0;
  let subjectHeightTotal = 0;

  for (const frame of frames) {
    if (!frame.poseDetected) continue;
    const landmarks = Object.values(frame.landmarks);
    if (!landmarks.length) continue;

    poseFrameCount += 1;
    detectedKeyJointCount += poseKeyJointNames.reduce(
      (count, name) => count + (frame.landmarks[name] ? 1 : 0),
      0,
    );
    confidenceTotal += landmarks.reduce((total, landmark) => total + landmark.confidence, 0);
    confidenceCount += landmarks.length;
    const yCoordinates = landmarks.map((landmark) => landmark.y);
    subjectHeightTotal += Math.max(...yCoordinates) - Math.min(...yCoordinates);
  }

  const poseCoverage = ratio(poseFrameCount, frames.length);
  const keyJointCoverage = ratio(
    detectedKeyJointCount,
    frames.length * poseKeyJointNames.length,
  );
  const averageConfidence = ratio(confidenceTotal, confidenceCount);
  const averageSubjectHeight = ratio(subjectHeightTotal, poseFrameCount);
  const issues: PoseQualityIssue[] = [];

  if (ratio(visionFailureCount, frames.length) > 0.3) issues.push('processing-failed');
  if (frames.length < 5) issues.push('insufficient-frames');
  if (poseFrameCount === 0) issues.push('person-not-found');
  if (ratio(multiplePersonFrameCount, frames.length) > MAX_MULTIPLE_PERSON_FRAME_RATIO) {
    issues.push('multiple-people');
  }
  if (poseCoverage < 0.7) issues.push('tracking-lost');
  if (keyJointCoverage < 0.55) issues.push('body-not-fully-visible');
  if (poseFrameCount > 0 && averageSubjectHeight < 0.3) issues.push('subject-too-small');

  const status = issues.length === 0 ? 'usable' : 'retake';
  return {
    status,
    issues,
    message: status === 'usable'
      ? 'Body landmarks stayed visible through the clip.'
      : retakeMessage(issues),
    poseCoverage,
    keyJointCoverage,
    averageConfidence,
    averageSubjectHeight,
    poseFrameCount,
  };
}

/** Returns tracking evidence only; joint coverage is not a technique metric. */
export function calculateKeyJointCoverage(frames: PoseFrame[]): PoseJointCoverage[] {
  return poseKeyJointNames.map((joint) => {
    const detectedFrameCount = frames.reduce(
      (count, frame) => count + (frame.landmarks[joint] ? 1 : 0),
      0,
    );
    return {
      joint,
      detectedFrameCount,
      coverage: ratio(detectedFrameCount, frames.length),
    };
  });
}

function parseLandmarks(value: unknown): PoseFrame['landmarks'] | null {
  if (!isObject(value)) return null;

  const landmarks: PoseFrame['landmarks'] = {};
  for (const [name, landmarkValue] of Object.entries(value)) {
    if (!poseJointNameSet.has(name) || !isObject(landmarkValue)) return null;
    const { x, y, confidence } = landmarkValue;
    if (!isUnitNumber(x) || !isUnitNumber(y) || !isUnitNumber(confidence)) return null;
    landmarks[name as PoseJointName] = { x, y, confidence };
  }
  return landmarks;
}

function parseFrame(value: unknown): PoseFrame | null {
  if (!isObject(value)) return null;
  const { timestamp, poseDetected, personCount, frameError } = value;
  const landmarks = parseLandmarks(value.landmarks);
  if (
    !isFiniteNumber(timestamp) || timestamp < 0 ||
    typeof poseDetected !== 'boolean' ||
    !isNonNegativeSafeInteger(personCount) || personCount > MAXIMUM_PEOPLE_PER_FRAME ||
    (frameError !== undefined && frameError !== 'vision-request-failed') ||
    !landmarks
  ) {
    return null;
  }

  return {
    timestamp,
    poseDetected,
    personCount: Number(personCount),
    landmarks,
    ...(frameError === 'vision-request-failed' ? { frameError } : {}),
  };
}

function parseQuality(value: unknown): PoseTrackingQuality | null {
  if (!isObject(value)) return null;
  const {
    status,
    issues,
    message,
    poseCoverage,
    keyJointCoverage,
    averageConfidence,
    averageSubjectHeight,
    poseFrameCount,
  } = value;
  if (
    (status !== 'usable' && status !== 'retake') ||
    !Array.isArray(issues) ||
    issues.length > qualityIssues.size ||
    new Set(issues).size !== issues.length ||
    !issues.every((issue): issue is PoseQualityIssue => qualityIssues.has(issue as PoseQualityIssue)) ||
    typeof message !== 'string' || message.length > 300 ||
    !isUnitNumber(poseCoverage) ||
    !isUnitNumber(keyJointCoverage) ||
    !isUnitNumber(averageConfidence) ||
    !isUnitNumber(averageSubjectHeight) ||
    !isNonNegativeSafeInteger(poseFrameCount) || poseFrameCount > MAXIMUM_NATIVE_POSE_FRAMES
  ) {
    return null;
  }

  return {
    status,
    issues,
    message,
    poseCoverage,
    keyJointCoverage,
    averageConfidence,
    averageSubjectHeight,
    poseFrameCount: Number(poseFrameCount),
  };
}

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) <= 0.00001;
}

function sameIssues(left: PoseQualityIssue[], right: PoseQualityIssue[]) {
  return left.length === right.length && left.every((issue) => right.includes(issue));
}

export function parsePoseExtractionResult(value: unknown): PoseExtractionResult | null {
  if (!isObject(value) || value.source !== 'apple-vision-2d') return null;
  if (
    typeof value.sourceVersion !== 'string' ||
    value.sourceVersion.trim().length === 0 ||
    value.sourceVersion.length > MAXIMUM_PROVENANCE_LABEL_LENGTH ||
    typeof value.processedAt !== 'string' ||
    value.processedAt.length > MAXIMUM_PROVENANCE_LABEL_LENGTH ||
    !Number.isFinite(Date.parse(value.processedAt)) ||
    value.coordinateSpace !== 'normalized-top-left-oriented-display' ||
    !isObject(value.video) ||
    !isObject(value.sampling) ||
    !Array.isArray(value.frames) ||
    value.frames.length > MAXIMUM_NATIVE_POSE_FRAMES
  ) {
    return null;
  }

  const video = value.video;
  const sampling = value.sampling;
  if (
    !isFiniteNumber(video.duration) || video.duration < 0 || video.duration > MAXIMUM_NATIVE_VIDEO_DURATION_SECONDS ||
    !isFiniteNumber(video.width) || video.width <= 0 || video.width > MAXIMUM_NATIVE_VIDEO_DIMENSION ||
    !isFiniteNumber(video.height) || video.height <= 0 || video.height > MAXIMUM_NATIVE_VIDEO_DIMENSION ||
    !isFiniteNumber(sampling.targetFramesPerSecond) ||
    sampling.targetFramesPerSecond < 1 ||
    sampling.targetFramesPerSecond > 12 ||
    !isNonNegativeSafeInteger(sampling.decodedFrameCount) ||
    sampling.decodedFrameCount > MAXIMUM_DECODED_FRAME_COUNT ||
    !isNonNegativeSafeInteger(sampling.sampledFrameCount) ||
    sampling.sampledFrameCount > MAXIMUM_NATIVE_POSE_FRAMES ||
    !Number.isSafeInteger(sampling.maximumFrames) ||
    Number(sampling.maximumFrames) <= 0 ||
    Number(sampling.maximumFrames) > MAXIMUM_NATIVE_POSE_FRAMES
  ) {
    return null;
  }

  const videoDuration = video.duration as number;
  const videoWidth = video.width as number;
  const videoHeight = video.height as number;
  const targetFramesPerSecond = sampling.targetFramesPerSecond as number;
  const decodedFrameCount = sampling.decodedFrameCount as number;
  const sampledFrameCount = sampling.sampledFrameCount as number;
  const maximumFrames = sampling.maximumFrames as number;

  const nativeQuality = parseQuality(value.quality);
  const frames = value.frames.map(parseFrame);
  if (!nativeQuality || frames.some((frame) => frame === null)) return null;

  const typedFrames = frames as PoseFrame[];
  if (
    sampledFrameCount !== typedFrames.length ||
    decodedFrameCount < typedFrames.length ||
    maximumFrames < typedFrames.length ||
    typedFrames.some((frame, index) =>
      (index > 0 && frame.timestamp < typedFrames[index - 1].timestamp) ||
      frame.timestamp > videoDuration + 0.1 ||
      frame.poseDetected !== (Object.keys(frame.landmarks).length > 0) ||
      (frame.poseDetected && frame.personCount < 1)
    )
  ) {
    return null;
  }

  const quality = evaluatePoseTrackingQuality(typedFrames);
  if (
    nativeQuality.status !== quality.status ||
    !sameIssues(nativeQuality.issues, quality.issues) ||
    nativeQuality.poseFrameCount !== quality.poseFrameCount ||
    !nearlyEqual(nativeQuality.poseCoverage, quality.poseCoverage) ||
    !nearlyEqual(nativeQuality.keyJointCoverage, quality.keyJointCoverage) ||
    !nearlyEqual(nativeQuality.averageConfidence, quality.averageConfidence) ||
    !nearlyEqual(nativeQuality.averageSubjectHeight, quality.averageSubjectHeight)
  ) {
    return null;
  }

  return {
    source: 'apple-vision-2d',
    sourceVersion: value.sourceVersion,
    processedAt: value.processedAt,
    coordinateSpace: 'normalized-top-left-oriented-display',
    video: { duration: videoDuration, width: videoWidth, height: videoHeight },
    sampling: {
      targetFramesPerSecond,
      decodedFrameCount,
      sampledFrameCount,
      maximumFrames,
    },
    quality,
    frames: typedFrames,
  };
}

export function nearestPoseFrame(frames: PoseFrame[], time: number): PoseFrame | null {
  if (!frames.length) return null;
  let low = 0;
  let high = frames.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle].timestamp < time) low = middle + 1;
    else high = middle;
  }

  const next = frames[low];
  const previous = frames[Math.max(0, low - 1)];
  return Math.abs(next.timestamp - time) < Math.abs(previous.timestamp - time) ? next : previous;
}

export function formatPosePercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}
