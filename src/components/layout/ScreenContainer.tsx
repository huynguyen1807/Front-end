import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";

export default function ScreenContainer({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});