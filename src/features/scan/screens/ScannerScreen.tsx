import { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Platform, Alert, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenContainer from "../../../components/layout/ScreenContainer";
import BottomNavbar from "../../../components/layout/BottomNavbar";
import TopNavbar from "../../../components/layout/TopNavbar";
import CameraView from "../components/CameraView";
import ScanResultCard from "../components/ScanResultCard";
import { scannerScreenStyles as styles } from "../styles/ScannerScreen.styles";
import { ScanResult, StorageLocation } from "../types/scan";
import { COLORS } from "../../../constants/colors";
import { useAppDispatch } from "../../../redux/hooks";
// addFoodItem từ inventorySlice chỉ nhận FoodItem từ API - scan feature cần integrate riêng
import { useCameraPermissions } from "../../../hooks/useCameraPermissions";
import { scanProductFromImage, validateImage } from "../utils/scanUtils";

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const cameraRef = useRef(null);
  
  const { permission, isLoading: permissionsLoading } = useCameraPermissions();

  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Handle camera capture
  const handleCameraCapture = async (photo: any) => {
    try {
      setScanError(null);
      setIsScanning(true);

      // Validate image
      const validation = validateImage(photo.uri);
      if (!validation.valid) {
        throw new Error(validation.error || "Ảnh không hợp lệ");
      }

      // Scan product from image
      const result = await scanProductFromImage(photo.uri);
      setCurrentResult(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi quét sản phẩm";
      setScanError(errorMessage);
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescan = () => {
    setCurrentResult(null);
    setScanError(null);
  };

  const handleAddToInventory = (
    quantity: string,
    storage: StorageLocation,
    date: string
  ) => {
    if (!currentResult) return;

    // Chuyển sang AddFoodScreen với data đã điền sẵn từ scan
    const [day, month, year] = date.split("/").map(Number);
    const isoExpiry = year && month && day
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : '';

    navigation.navigate('AddFood', {
      prefill: {
        foodName: currentResult.foodRecognition.productName,
        imageUrl: currentResult.imageUrl ?? '',
        expiryDate: isoExpiry,
        quantity: quantity,
        sourceType: 'SUPERMARKET',
        expiryType: 'SCANNED',
      }
    });

    handleRescan();
  };

  if (permission !== "granted") {
    return (
      <ScreenContainer>
        <TopNavbar />
        <View
          style={[
            styles.cameraContainer,
            {
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="camera-off"
            size={64}
            color={COLORS.onSurfaceVariant}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: COLORS.onSurface,
              textAlign: "center",
            }}
          >
            Cần cấp quyền camera
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.onSurfaceVariant,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Vui lòng cấp quyền truy cập camera để sử dụng tính năng quét
          </Text>
        </View>
        <BottomNavbar />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TopNavbar />
      {currentResult ? (
        <ScanResultCard
          result={currentResult}
          onAddToInventory={handleAddToInventory}
          onRescan={handleRescan}
        />
      ) : (
        <CameraView
          isScanning={isScanning}
          onCapture={handleCameraCapture}
          cameraRef={cameraRef}
        />
      )}
      <BottomNavbar />
    </ScreenContainer>
  );
}

