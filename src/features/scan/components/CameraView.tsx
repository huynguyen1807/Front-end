import { View, Animated, Text, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { scannerScreenStyles as styles } from "../styles/ScannerScreen.styles";
import { useEffect, useRef, useState } from "react";
import { COLORS } from "../../../constants/colors";
import { CameraView as ExpoCamera } from "expo-camera";

type CameraViewProps = {
  isScanning?: boolean;
  onCapture?: (photo: any) => void;
  cameraRef?: any;
};

export default function CameraView({ 
  isScanning = false, 
  onCapture,
  cameraRef
}: CameraViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const localCameraRef = useRef(null);

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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning, pulseAnim]);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const handleTakePicture = async () => {
    if (!isCameraReady || isScanning || isTakingPicture) return;

    try {
      setIsTakingPicture(true);
      const camera = cameraRef?.current || localCameraRef.current;
      if (!camera) return;

      const photo = await camera.takePictureAsync({
        quality: 0.45,
        base64: false,
      });

      onCapture?.(photo);
    } catch (error) {
      console.error('Error taking picture:', error);
    } finally {
      setIsTakingPicture(false);
    }
  };

  const frameScale = pulseAnim;

  return (
    <View style={styles.cameraContainer}>
      <ExpoCamera
        ref={cameraRef || localCameraRef}
        style={styles.cameraPlaceholder}
        onCameraReady={handleCameraReady}
      />
        {/* Overlay: Scan Frame */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scanFrame,
            {
              transform: [{ scale: frameScale }],
            },
          ]}
        />

        {/* Overlay: Detection Label */}
        {isScanning && (
          <View style={styles.detectionLabel} pointerEvents="none">
            <MaterialCommunityIcons
              name="motion-sensor"
              size={16}
              color={COLORS.onPrimary}
            />
            <Text style={styles.detectionText}>AI DANG NHAN DIEN...</Text>
          </View>
        )}

        {/* Overlay: Capture Button */}
        {!isScanning && isCameraReady && (
          <TouchableOpacity
            style={[
              styles.captureButton,
              { opacity: isTakingPicture ? 0.5 : 1 }
            ]}
            onPress={handleTakePicture}
            disabled={isTakingPicture}
          >
            <View style={styles.captureButtonInner}>
              <MaterialCommunityIcons
                name="camera"
                size={32}
                color={COLORS.onPrimary}
              />
            </View>
          </TouchableOpacity>
        )}
    </View>
  );
}
