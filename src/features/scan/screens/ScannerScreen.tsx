import { useState, useEffect } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const mockScanResults: ScanResult[] = [
  {
    id: "1",
    productName: "Chuối Cavendish",
    aiPredictedDays: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1587182372962-717ba6df58a8?w=400",
    confidence: 0.95,
  },
  {
    id: "2",
    productName: "Ớt chuông đỏ",
    aiPredictedDays: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1599599810694-b5ac4dd37e33?w=400",
    confidence: 0.92,
  },
  {
    id: "3",
    productName: "Cà chua tươi",
    aiPredictedDays: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1595521624291-1d7d35294f34?w=400",
    confidence: 0.98,
  },
];

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const [isScanning, setIsScanning] = useState(true);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [resultIndex, setResultIndex] = useState(0);

  // Simulate scanning
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        setIsScanning(false);
        setCurrentResult(mockScanResults[resultIndex]);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isScanning, resultIndex]);

  const handleRescan = () => {
    setCurrentResult(null);
    setIsScanning(true);
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
        name: currentResult.productName,
        quantity: quantity,
        storageLabel: storageMap[storage],
        storageType: storage,
        daysLeft: Math.max(1, daysLeft),
        freshnessPercent: 100 - Math.min(50, Math.abs(daysLeft - 5) * 10),
        imageUrl: currentResult.imageUrl,
      })
    );

    // Show next result or rescan
    if (resultIndex < mockScanResults.length - 1) {
      setResultIndex(resultIndex + 1);
      handleRescan();
    } else {
      setResultIndex(0);
      handleRescan();
    }
  };

  const bottomSpace = Platform.OS === "ios" ? 120 + insets.bottom : 120;

  return (
    <ScreenContainer>
      {/* Header */}
      <TopNavbar />

      {/* Camera or Result View */}
      {isScanning || !currentResult ? (
        <CameraView isScanning={isScanning} />
      ) : (
        <View style={{ flex: 1 }}>
          <ScanResultCard
            result={currentResult}
            onAddToInventory={handleAddToInventory}
            onRescan={handleRescan}
          />
        </View>
      )}

      {/* Bottom Navbar */}
      <View style={{ position: "absolute", bottom: 0, width: "100%" }}>
        <BottomNavbar />
      </View>
    </ScreenContainer>
  );
}
