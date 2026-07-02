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
  const [storageType, setStorageType] = useState<StorageLocation>(
    result.storageSuggestion.location
  );
  const [expiryDate, setExpiryDate] = useState(result.expiryDate);
  const [showStorageDropdown, setShowStorageDropdown] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const handleAddToInventory = () => {
    onAddToInventory(quantity, storageType, expiryDate);
  };

  const quantityNum = parseInt(quantity) || 1;
  const productName = result.foodRecognition.productName;
  const confidence = Math.round(result.foodRecognition.confidence * 100);

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

      {/* Product Name & Confidence */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.productName}>{productName}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>
          Độ chính xác: {confidence}% • {result.foodRecognition.category}
        </Text>
      </View>

      {/* AI Prediction & Expiry Date */}
      <View
        style={{
          backgroundColor: COLORS.surfaceContainer,
          padding: SPACING.lg,
          borderRadius: 12,
          marginBottom: SPACING.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                color: COLORS.onSurfaceVariant,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              Dự đoán hạn sử dụng
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.primary,
              }}
            >
              {result.aiPredictedDays} ngày
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: COLORS.onSurfaceVariant,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              Ngày hết hạn
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: COLORS.onSurface,
              }}
            >
              {expiryDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Storage Suggestion */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={styles.sectionLabel}>Gợi ý bảo quản</Text>
        <View
          style={{
            backgroundColor: COLORS.surfaceContainer,
            padding: SPACING.lg,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.primary,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.onSurface }}>
              {STORAGE_LOCATIONS[result.storageSuggestion.location]}
            </Text>
            <Text
              style={{
                fontSize: 12,
                backgroundColor: COLORS.primaryContainer,
                color: COLORS.onPrimaryContainer,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              {result.storageSuggestion.temperature}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: COLORS.onSurfaceVariant,
              lineHeight: 18,
            }}
          >
            {result.storageSuggestion.description}
          </Text>
        </View>
      </View>

      {/* Nutrition Info */}
      {result.nutritionInfo && (
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={styles.sectionLabel}>Thông tin dinh dưỡng (100g)</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: COLORS.surfaceContainer,
              padding: SPACING.lg,
              borderRadius: 12,
            }}
          >
            <NutritionItem
              label="Calo"
              value={`${result.nutritionInfo.calories}`}
              icon="fire"
            />
            <NutritionItem
              label="Protein"
              value={`${result.nutritionInfo.protein.toFixed(1)}g`}
              icon="dumbbell"
            />
            <NutritionItem
              label="Carbs"
              value={`${result.nutritionInfo.carbs.toFixed(1)}g`}
              icon="grain"
            />
            <NutritionItem
              label="Fat"
              value={`${result.nutritionInfo.fat.toFixed(1)}g`}
              icon="water"
            />
          </View>
        </View>
      )}

      {/* Meal Suggestions */}
      {result.mealSuggestions.length > 0 && (
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={styles.sectionLabel}>Gợi ý món ăn</Text>
          {result.mealSuggestions.map((meal, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: COLORS.surfaceContainer,
                padding: SPACING.lg,
                borderRadius: 12,
                marginBottom: SPACING.md,
              }}
              onPress={() =>
                setExpandedMeal(expandedMeal === index ? null : index)
              }
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: COLORS.onSurface,
                      marginBottom: 4,
                    }}
                  >
                    {meal.dishName}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: SPACING.md,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={COLORS.onSurfaceVariant}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.onSurfaceVariant,
                          marginLeft: 2,
                        }}
                      >
                        {meal.cookingTime} phút
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="star-outline"
                        size={12}
                        color={COLORS.onSurfaceVariant}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.onSurfaceVariant,
                          marginLeft: 2,
                        }}
                      >
                        {meal.difficulty === "easy"
                          ? "Dễ"
                          : meal.difficulty === "medium"
                          ? "Trung bình"
                          : "Khó"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name={expandedMeal === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.onSurfaceVariant}
                />
              </View>

              {/* Expanded Meal Details */}
              {expandedMeal === index && (
                <View style={{ marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerHighest, paddingTop: SPACING.lg }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: COLORS.onSurface,
                      marginBottom: SPACING.md,
                    }}
                  >
                    Nguyên liệu:
                  </Text>
                  {meal.ingredients.map((ingredient, idx) => (
                    <Text
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: COLORS.onSurfaceVariant,
                        marginBottom: 4,
                        marginLeft: SPACING.md,
                      }}
                    >
                      • {ingredient}
                    </Text>
                  ))}
                  {meal.missingIngredients && meal.missingIngredients.length > 0 && (
                    <>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: COLORS.error,
                          marginTop: SPACING.md,
                          marginBottom: SPACING.sm,
                        }}
                      >
                        Nguyên liệu còn thiếu:
                      </Text>
                      {meal.missingIngredients.map((ingredient, idx) => (
                        <Text
                          key={idx}
                          style={{
                            fontSize: 12,
                            color: COLORS.error,
                            marginBottom: 4,
                            marginLeft: SPACING.md,
                          }}
                        >
                          • {ingredient}
                        </Text>
                      ))}
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

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
      <Text style={styles.sectionLabel}>Vị trí lưu trữ</Text>
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

// Helper component for nutrition display
function NutritionItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      <Text
        style={{
          fontSize: 12,
          color: COLORS.onSurfaceVariant,
          marginTop: 4,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: COLORS.onSurface,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
