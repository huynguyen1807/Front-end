import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { scannerScreenStyles as styles } from "../styles/ScannerScreen.styles";
import { ScanResult, StorageLocation, STORAGE_LOCATIONS } from "../types/scan";
import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";
import { useState } from "react";

type ScanResultCardProps = {
  result: ScanResult;
  onAddToInventory: (quantity: string, storage: StorageLocation, date: string) => void;
  onRescan: () => void;
};

export default function ScanResultCard({
  result,
  onAddToInventory,
  onRescan,
}: ScanResultCardProps) {
  const [quantity, setQuantity] = useState("1");
  const [storageType, setStorageType] = useState<StorageLocation>("outside");
  const [expiryDate, setExpiryDate] = useState(
    new Date().toLocaleDateString("en-GB", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  );
  const [showStorageDropdown, setShowStorageDropdown] = useState(false);

  const handleAddToInventory = () => {
    onAddToInventory(quantity, storageType, expiryDate);
  };

  const quantityNum = parseInt(quantity) || 1;

  return (
    <ScrollView style={styles.resultSection} showsVerticalScrollIndicator={false}>
      {/* Result Header */}
      <View style={styles.resultHeader}>
        <View style={styles.resultIconContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={COLORS.onPrimary}
          />
        </View>
        <Text style={styles.resultTitle}>KẾT QUẢ AI</Text>
      </View>

      {/* Product Name */}
      <Text style={styles.productName}>{result.productName}</Text>

      {/* AI Prediction */}
      <Text style={styles.aiPrediction}>
        AI dự đoán hạn dùng:{" "}
        <Text style={styles.aiDays}>{result.aiPredictedDays} ngày</Text>
      </Text>

      {/* Quantity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Số lượng</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(String(Math.max(1, quantityNum - 1)))}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(String(quantityNum + 1))}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage Location Section */}
      <Text style={styles.sectionLabel}>Vị trí</Text>
      <TouchableOpacity
        style={styles.storageDropdown}
        onPress={() => setShowStorageDropdown(true)}
      >
        <Text style={styles.storageLabel}>
          {STORAGE_LOCATIONS[storageType]}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.onSurfaceVariant} />
      </TouchableOpacity>

      {/* Storage Dropdown Modal */}
      <Modal visible={showStorageDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowStorageDropdown(false)}
        >
          <View
            style={{
              backgroundColor: COLORS.surfaceContainerLowest,
              padding: SPACING.lg,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              position: "absolute",
              bottom: 0,
              width: "100%",
            }}
          >
            {(Object.entries(STORAGE_LOCATIONS) as Array<
              [StorageLocation, string]
            >).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={{
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.lg,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.surfaceContainer,
                }}
                onPress={() => {
                  setStorageType(key);
                  setShowStorageDropdown(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color:
                      storageType === key ? COLORS.primary : COLORS.onSurface,
                    fontWeight: storageType === key ? "600" : "400",
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Expiry Date Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Ngày hết hạn</Text>
        <View style={styles.datePickerRow}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={[styles.dateLabel, { marginLeft: SPACING.md }]}>
            {expiryDate}
          </Text>
          <TouchableOpacity style={styles.barcodeIcon}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onRescan}>
          <Text style={styles.secondaryButtonText}>Quét lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAddToInventory}
        >
          <Text style={styles.primaryButtonText}>Thêm vào kho</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
