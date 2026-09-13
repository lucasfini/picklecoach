import AVFoundation
import ExpoModulesCore
import ImageIO
import Vision

private enum PickleCoachPoseError: LocalizedError {
  case invalidVideoURI
  case missingVideoTrack
  case cannotReadVideo(String)

  var errorDescription: String? {
    switch self {
    case .invalidVideoURI:
      return "The practice video URI is invalid."
    case .missingVideoTrack:
      return "The practice clip does not contain a readable video track."
    case .cannotReadVideo(let detail):
      return "The practice clip could not be read. \(detail)"
    }
  }
}

private struct PoseCandidate {
  let landmarks: [String: [String: Any]]
  let area: Double
  let height: Double
  let confidenceTotal: Double
  let confidenceCount: Int
}

private enum PoseExtractor {
  private static let joints: [(VNHumanBodyPoseObservation.JointName, String)] = [
    (.nose, "nose"),
    (.neck, "neck"),
    (.root, "root"),
    (.leftEye, "leftEye"),
    (.rightEye, "rightEye"),
    (.leftEar, "leftEar"),
    (.rightEar, "rightEar"),
    (.leftShoulder, "leftShoulder"),
    (.rightShoulder, "rightShoulder"),
    (.leftElbow, "leftElbow"),
    (.rightElbow, "rightElbow"),
    (.leftWrist, "leftWrist"),
    (.rightWrist, "rightWrist"),
    (.leftHip, "leftHip"),
    (.rightHip, "rightHip"),
    (.leftKnee, "leftKnee"),
    (.rightKnee, "rightKnee"),
    (.leftAnkle, "leftAnkle"),
    (.rightAnkle, "rightAnkle"),
  ]

  private static let keyJointNames = [
    "leftShoulder", "rightShoulder",
    "leftElbow", "rightElbow",
    "leftWrist", "rightWrist",
    "leftHip", "rightHip",
    "leftKnee", "rightKnee",
    "leftAnkle", "rightAnkle",
  ]

  static func extract(
    videoURI: String,
    targetFramesPerSecond: Double,
    maximumFrames: Int,
    minimumConfidence: Double
  ) async throws -> [String: Any] {
    guard let videoURL = fileURL(from: videoURI) else {
      throw PickleCoachPoseError.invalidVideoURI
    }

    let asset = AVURLAsset(url: videoURL)
    let duration = try await asset.load(.duration)
    let tracks = try await asset.loadTracks(withMediaType: .video)
    guard let track = tracks.first else {
      throw PickleCoachPoseError.missingVideoTrack
    }

    let naturalSize = try await track.load(.naturalSize)
    let preferredTransform = try await track.load(.preferredTransform)
    let transformedSize = naturalSize.applying(preferredTransform)
    let displayWidth = abs(transformedSize.width)
    let displayHeight = abs(transformedSize.height)
    let orientation = imageOrientation(for: preferredTransform)

    let reader: AVAssetReader
    do {
      reader = try AVAssetReader(asset: asset)
    } catch {
      throw PickleCoachPoseError.cannotReadVideo(error.localizedDescription)
    }

    let outputSettings: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    ]
    let output = AVAssetReaderTrackOutput(track: track, outputSettings: outputSettings)
    output.alwaysCopiesSampleData = false

    guard reader.canAdd(output) else {
      throw PickleCoachPoseError.cannotReadVideo("The decoded video output is unsupported.")
    }
    reader.add(output)

    guard reader.startReading() else {
      throw PickleCoachPoseError.cannotReadVideo(reader.error?.localizedDescription ?? "The reader did not start.")
    }

    let framesPerSecond = min(max(targetFramesPerSecond, 1), 12)
    let frameLimit = min(max(maximumFrames, 1), 360)
    let confidenceFloor = min(max(minimumConfidence, 0), 1)
    let sampleInterval = 1 / framesPerSecond
    let poseRequest = VNDetectHumanBodyPoseRequest()

    var decodedFrameCount = 0
    var nextSampleTime = 0.0
    var frames: [[String: Any]] = []
    var poseFrameCount = 0
    var multiplePersonFrameCount = 0
    var visionFailureCount = 0
    var detectedKeyJointCount = 0
    var confidenceTotal = 0.0
    var confidenceCount = 0
    var subjectHeightTotal = 0.0

    while reader.status == .reading,
          frames.count < frameLimit,
          let sampleBuffer = output.copyNextSampleBuffer() {
      decodedFrameCount += 1
      let timestamp = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
      guard timestamp.isFinite else { continue }
      if frames.isEmpty {
        nextSampleTime = timestamp + sampleInterval
      } else {
        guard timestamp + 0.0001 >= nextSampleTime else { continue }
        repeat {
          nextSampleTime += sampleInterval
        } while nextSampleTime <= timestamp + 0.0001
      }

      var frame: [String: Any] = [
        "timestamp": timestamp,
        "poseDetected": false,
        "personCount": 0,
        "landmarks": [String: Any](),
      ]

      if let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation)
        do {
          try handler.perform([poseRequest])
          let observations = poseRequest.results ?? []
          let candidates = observations.compactMap {
            candidate(from: $0, minimumConfidence: confidenceFloor)
          }

          frame["personCount"] = observations.count
          if observations.count > 1 {
            multiplePersonFrameCount += 1
          }
          if let selected = candidates.max(by: { $0.area < $1.area }) {
            frame["poseDetected"] = true
            frame["landmarks"] = selected.landmarks
            poseFrameCount += 1
            detectedKeyJointCount += keyJointNames.reduce(0) { count, name in
              count + (selected.landmarks[name] == nil ? 0 : 1)
            }
            confidenceTotal += selected.confidenceTotal
            confidenceCount += selected.confidenceCount
            subjectHeightTotal += selected.height
          }
        } catch {
          visionFailureCount += 1
          let nativeError = error as NSError
          frame["frameError"] = "vision-request-failed"
          frame["frameErrorCode"] = "\(nativeError.domain):\(nativeError.code)"
#if DEBUG
          frame["frameErrorDescription"] = nativeError.localizedDescription
#endif
          if visionFailureCount == 1 {
            NSLog("PickleCoachPose first Vision failure: %@:%ld %@", nativeError.domain, nativeError.code, nativeError.localizedDescription)
          }
        }
      }

      frames.append(frame)
    }

    if frames.count >= frameLimit && reader.status == .reading {
      reader.cancelReading()
    }

    if reader.status == .failed {
      throw PickleCoachPoseError.cannotReadVideo(reader.error?.localizedDescription ?? "Frame decoding failed.")
    }

    let sampledFrameCount = frames.count
    let poseCoverage = ratio(poseFrameCount, sampledFrameCount)
    let keyJointCoverage = ratio(detectedKeyJointCount, sampledFrameCount * keyJointNames.count)
    let averageConfidence = ratio(confidenceTotal, Double(confidenceCount))
    let averageSubjectHeight = ratio(subjectHeightTotal, Double(poseFrameCount))
    let quality = qualityResult(
      sampledFrameCount: sampledFrameCount,
      poseFrameCount: poseFrameCount,
      multiplePersonFrameCount: multiplePersonFrameCount,
      visionFailureCount: visionFailureCount,
      poseCoverage: poseCoverage,
      keyJointCoverage: keyJointCoverage,
      averageConfidence: averageConfidence,
      averageSubjectHeight: averageSubjectHeight
    )

    return [
      "source": "apple-vision-2d",
      "sourceVersion": "VNDetectHumanBodyPoseRequest-revision-\(poseRequest.revision)",
      "processedAt": ISO8601DateFormatter().string(from: Date()),
      "coordinateSpace": "normalized-top-left-oriented-display",
      "video": [
        "duration": max(CMTimeGetSeconds(duration), 0),
        "width": Double(displayWidth),
        "height": Double(displayHeight),
      ],
      "sampling": [
        "targetFramesPerSecond": framesPerSecond,
        "decodedFrameCount": decodedFrameCount,
        "sampledFrameCount": sampledFrameCount,
        "maximumFrames": frameLimit,
        "visionFailureCount": visionFailureCount,
      ],
      "quality": quality,
      "frames": frames,
    ]
  }

  private static func candidate(
    from observation: VNHumanBodyPoseObservation,
    minimumConfidence: Double
  ) -> PoseCandidate? {
    guard let recognizedPoints = try? observation.recognizedPoints(.all) else {
      return nil
    }

    var landmarks: [String: [String: Any]] = [:]
    var minimumX = 1.0
    var minimumY = 1.0
    var maximumX = 0.0
    var maximumY = 0.0
    var confidenceTotal = 0.0
    var confidenceCount = 0

    for (joint, name) in joints {
      guard let point = recognizedPoints[joint], Double(point.confidence) >= minimumConfidence else {
        continue
      }

      let x = min(max(Double(point.location.x), 0), 1)
      let y = min(max(1 - Double(point.location.y), 0), 1)
      let confidence = Double(point.confidence)
      landmarks[name] = ["x": x, "y": y, "confidence": confidence]
      minimumX = min(minimumX, x)
      minimumY = min(minimumY, y)
      maximumX = max(maximumX, x)
      maximumY = max(maximumY, y)
      confidenceTotal += confidence
      confidenceCount += 1
    }

    guard confidenceCount > 0 else { return nil }
    let width = max(maximumX - minimumX, 0)
    let height = max(maximumY - minimumY, 0)
    return PoseCandidate(
      landmarks: landmarks,
      area: width * height,
      height: height,
      confidenceTotal: confidenceTotal,
      confidenceCount: confidenceCount
    )
  }

  private static func qualityResult(
    sampledFrameCount: Int,
    poseFrameCount: Int,
    multiplePersonFrameCount: Int,
    visionFailureCount: Int,
    poseCoverage: Double,
    keyJointCoverage: Double,
    averageConfidence: Double,
    averageSubjectHeight: Double
  ) -> [String: Any] {
    var issues: [String] = []
    if sampledFrameCount > 0 && ratio(visionFailureCount, sampledFrameCount) > 0.3 {
      issues.append("processing-failed")
    }
    if sampledFrameCount < 5 { issues.append("insufficient-frames") }
    if poseFrameCount == 0 { issues.append("person-not-found") }
    if ratio(multiplePersonFrameCount, sampledFrameCount) > 0.1 { issues.append("multiple-people") }
    if poseCoverage < 0.7 { issues.append("tracking-lost") }
    if keyJointCoverage < 0.55 { issues.append("body-not-fully-visible") }
    if poseFrameCount > 0 && averageSubjectHeight < 0.3 { issues.append("subject-too-small") }

    let isUsable = issues.isEmpty
    return [
      "status": isUsable ? "usable" : "retake",
      "issues": issues,
      "message": isUsable
        ? "Body landmarks stayed visible through the clip."
        : retakeMessage(for: issues),
      "poseCoverage": poseCoverage,
      "keyJointCoverage": keyJointCoverage,
      "averageConfidence": averageConfidence,
      "averageSubjectHeight": averageSubjectHeight,
      "poseFrameCount": poseFrameCount,
    ]
  }

  private static func retakeMessage(for issues: [String]) -> String {
    if issues.contains("processing-failed") {
      return "Pose tracking could not process enough frames. Keep the clip on this iPhone and try again."
    }
    if issues.contains("person-not-found") {
      return "No full player was found. Step into frame and record again."
    }
    if issues.contains("multiple-people") {
      return "Keep other players out of frame so tracking stays on you."
    }
    if issues.contains("subject-too-small") {
      return "Move the phone closer so the player fills more of the frame."
    }
    if issues.contains("body-not-fully-visible") {
      return "Keep the full body, including both feet and the paddle arm, in frame."
    }
    if issues.contains("tracking-lost") {
      return "Use steadier framing and brighter, even light so tracking can follow every rep."
    }
    return "Record at least a few seconds with the full player visible."
  }

  private static func fileURL(from value: String) -> URL? {
    if let url = URL(string: value), url.isFileURL {
      return url
    }
    guard !value.isEmpty else { return nil }
    return URL(fileURLWithPath: value)
  }

  private static func imageOrientation(for transform: CGAffineTransform) -> CGImagePropertyOrientation {
    let angle = atan2(transform.b, transform.a)
    let quarterTurn = Int(round(angle / (.pi / 2)))
    switch quarterTurn {
    case 1:
      return transform.d < 0 ? .leftMirrored : .right
    case -1:
      return transform.d < 0 ? .rightMirrored : .left
    case 2, -2:
      return transform.a > 0 ? .upMirrored : .down
    default:
      return transform.a < 0 ? .upMirrored : .up
    }
  }

  private static func ratio(_ numerator: Int, _ denominator: Int) -> Double {
    guard denominator > 0 else { return 0 }
    return Double(numerator) / Double(denominator)
  }

  private static func ratio(_ numerator: Double, _ denominator: Double) -> Double {
    guard denominator > 0 else { return 0 }
    return numerator / denominator
  }
}

public class PickleCoachPoseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PickleCoachPose")

    AsyncFunction("extractPose") {
      (
        videoURI: String,
        targetFramesPerSecond: Double,
        maximumFrames: Int,
        minimumConfidence: Double
      ) async throws -> [String: Any] in
      try await PoseExtractor.extract(
        videoURI: videoURI,
        targetFramesPerSecond: targetFramesPerSecond,
        maximumFrames: maximumFrames,
        minimumConfidence: minimumConfidence
      )
    }
  }
}
