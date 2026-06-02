import { View, Animated, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { scannerScreenStyles as styles } from "../styles/ScannerScreen.styles";
import { useEffect, useRef } from "react";
import { COLORS } from "../../../constants/colors";

type CameraViewProps = {
  isScanning?: boolean;
};

export default function CameraView({ isScanning = false }: CameraViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isScanning]);

  const frameScale = pulseAnim;

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.cameraPlaceholder}>
        {/* Scan Frame */}
        <Animated.View
          style={[
            styles.scanFrame,
            {
              transform: [{ scale: frameScale }],
            },
          ]}
        />

        {/* Detection Label */}
        {isScanning && (
          <View style={styles.detectionLabel}>
            <MaterialCommunityIcons
              name="motion-sensor"
              size={16}
              color={COLORS.onPrimary}
            />
            <Text style={styles.detectionText}>AI ĐANG NHẬN DIỆN...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
