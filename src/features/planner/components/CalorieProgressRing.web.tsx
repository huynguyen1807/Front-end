import { StyleSheet, View } from "react-native";

type CalorieProgressRingProps = {
  percentage: number;
  size: number;
  radius: number;
  strokeWidth: number;
  color: string;
};

const segmentCount = 60;

export default function CalorieProgressRing({
  percentage,
  size,
  radius,
  strokeWidth,
  color,
}: CalorieProgressRingProps) {
  const center = size / 2;
  const activeSegments = Math.round(percentage * segmentCount);
  const segmentSize = Math.max(3, strokeWidth / 2);

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      {Array.from({ length: segmentCount }, (_, index) => {
        const angle = (index / segmentCount) * Math.PI * 2 - Math.PI / 2;
        const left = center + Math.cos(angle) * radius - segmentSize / 2;
        const top = center + Math.sin(angle) * radius - segmentSize / 2;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                width: segmentSize,
                height: segmentSize,
                left,
                top,
                backgroundColor: index < activeSegments ? color : "#e5e1e1",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "relative",
  },
  segment: {
    position: "absolute",
    borderRadius: 999,
  },
});
