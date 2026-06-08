import { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Platform, Alert, Text } from "react-native";
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
import { addInventoryItem } from "../../inventory/redux/inventorySlice";
import { useCameraPermissions } from "../../../hooks/useCameraPermissions";
import { scanProductFromImage, validateImage } from "../utils/scanUtils";

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
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

    // Parse date from DD/MM/YYYY to calculate daysLeft
    const [day, month, year] = date.split("/").map(Number);
    const expiryDate = new Date(year, month - 1, day);
    const today = new Date();
    const daysLeft = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const storageMap = {
      fridge: "Tủ lạnh",
      outside: "Bên ngoài",
      freezer: "Ngăn đông",
    };

    dispatch(
      addInventoryItem({
        id: `${Date.now()}`,
        name: currentResult.foodRecognition.productName,
        quantity: quantity,
        storageLabel: storageMap[storage],
        storageType: storage,
        daysLeft: Math.max(1, daysLeft),
        freshnessPercent: 100 - Math.min(50, Math.abs(daysLeft - 5) * 10),
        imageUrl: currentResult.imageUrl,
      })
    );

    // Reset state after adding
    handleRescan();
    Alert.alert("Thành công", "Sản phẩm đã được thêm vào kho hàng");
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

