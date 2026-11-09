import Svg, { Circle } from "react-native-svg";

type CalorieProgressRingProps = {
  percentage: number;
  size: number;
  radius: number;
  strokeWidth: number;
  color: string;
};

export default function CalorieProgressRing({
  percentage,
  size,
  radius,
  strokeWidth,
  color,
}: CalorieProgressRingProps) {
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#e5e1e1"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - percentage * circumference}
        rotation="-90"
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}
