import { PropsWithChildren } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";

type Props = PropsWithChildren<{
  translation: SharedValue<number>;
  distance: number;
  minimumScale: number;
  style?: StyleProp<ViewStyle>;
}>;

export default function SwipeActionScale({ translation, distance, minimumScale, style, children }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translation.value, [-distance, 0], [1, minimumScale], Extrapolation.CLAMP) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
