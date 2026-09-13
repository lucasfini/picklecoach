import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  poseConnections,
  PoseFrame,
  PoseJointName,
  PoseLandmark,
} from '@/src/domain/poseTracking';
import { colors } from '@/src/theme';

type SkeletonOverlayProps = {
  frame: PoseFrame | null;
  videoWidth: number;
  videoHeight: number;
};

type DisplayPoint = PoseLandmark & { x: number; y: number };

export function SkeletonOverlay({ frame, videoWidth, videoHeight }: SkeletonOverlayProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const points = useMemo(() => {
    if (!frame || !layout.width || !layout.height || !videoWidth || !videoHeight) return {};
    const scale = Math.min(layout.width / videoWidth, layout.height / videoHeight);
    const renderedWidth = videoWidth * scale;
    const renderedHeight = videoHeight * scale;
    const offsetX = (layout.width - renderedWidth) / 2;
    const offsetY = (layout.height - renderedHeight) / 2;

    return Object.fromEntries(
      Object.entries(frame.landmarks).map(([name, point]) => [
        name,
        {
          ...point,
          x: offsetX + point.x * renderedWidth,
          y: offsetY + point.y * renderedHeight,
        },
      ]),
    ) as Partial<Record<PoseJointName, DisplayPoint>>;
  }, [frame, layout.height, layout.width, videoHeight, videoWidth]);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setLayout((current) => current.width === width && current.height === height ? current : { width, height });
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      {poseConnections.map(([startName, endName]) => {
        const start = points[startName];
        const end = points[endName];
        if (!start || !end) return null;
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        const opacity = Math.max(0.45, Math.min(start.confidence, end.confidence));
        return (
          <View
            key={`${startName}-${endName}`}
            style={[
              styles.line,
              {
                width: length,
                left: (start.x + end.x - length) / 2,
                top: (start.y + end.y) / 2 - 1.5,
                opacity,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}

      {Object.entries(points).map(([name, point]) => (
        <View
          key={name}
          style={[
            styles.pointHalo,
            {
              left: point.x - 6,
              top: point.y - 6,
              opacity: Math.max(0.55, point.confidence),
            },
          ]}
        >
          <View style={styles.point} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.ink,
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  pointHalo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  point: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryBright,
  },
});
