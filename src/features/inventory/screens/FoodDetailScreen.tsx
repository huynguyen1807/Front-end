import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";
import { FoodItem } from "../types/inventory";
import { formatFoodAmount } from "../../../utils/foodUnits";
import {
  FOOD_STATUS_CONFIG,
  getCategoryDisplayName,
  getDaysLeft,
  getInventoryUrgencyLabel,
} from "../utils/inventoryDisplay";

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

export default function FoodDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item } = route.params as { item: FoodItem };

  const cfg = FOOD_STATUS_CONFIG[item.status] ?? FOOD_STATUS_CONFIG.SAFE;
  const daysLeft = getDaysLeft(item.expiryDate);
  const freshnessScore = item.freshnessScore ?? 0;
  const urgentLabel = getInventoryUrgencyLabel(item);
  const nutrition = item.nutrition;
  const calories = nutrition?.calories ?? item.calories ?? 0;
  const macroSummary = nutrition?.macroSummary ?? item.macroSummary ?? { protein: 0, carbs: 0, fat: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết thực phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate("UpdateFood", { item })} style={styles.editBtn}>
          <MaterialIcons name="edit" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialIcons name="fastfood" size={80} color={COLORS.primary + "60"} />
            </View>
          )}
          {urgentLabel && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>{urgentLabel}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.foodName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + "22" }]}>
              <MaterialIcons name={cfg.icon as keyof typeof MaterialIcons.glyphMap} size={14} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={styles.category}>{getCategoryDisplayName(item.categoryId)}</Text>

          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.cardTitle}>Độ tươi ngon</Text>
              <Text style={[styles.percent, { color: cfg.color, fontWeight: "bold" }]}>
                {freshnessScore}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${freshnessScore}%`, backgroundColor: cfg.color }]} />
            </View>
            <Text style={[styles.daysLeft, { color: cfg.color, marginTop: 8 }]}>
              {daysLeft > 0
                ? `Còn ${daysLeft} ngày`
                : daysLeft === 0
                  ? "Hết hạn hôm nay"
                  : `Quá hạn ${Math.abs(daysLeft)} ngày`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dinh dưỡng ước tính</Text>
            <View style={styles.nutritionGrid}>
              <NutritionMetric label="Kcal" value={Math.round(calories).toString()} />
              <NutritionMetric label="Protein" value={`${Math.round(macroSummary.protein)}g`} />
              <NutritionMetric label="Carbs" value={`${Math.round(macroSummary.carbs)}g`} />
              <NutritionMetric label="Fat" value={`${Math.round(macroSummary.fat)}g`} />
            </View>
            <Text style={styles.nutritionHint}>
              {nutrition?.matched === false
                ? "Chưa tìm thấy nutrition fact khớp với thực phẩm này."
                : "Dữ liệu được tính từ nutrition fact theo số lượng trong inventory."}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin chi tiết</Text>
            <DetailRow icon="inventory" label="Số lượng:" value={formatFoodAmount(item.quantity, item.unit)} />
            <DetailRow
              icon="place"
              label="Vị trí lưu trữ:"
              value={item.storageLocationId?.storageName ?? "N/A"}
            />
            <DetailRow
              icon="shopping-cart"
              label="Nguồn gốc:"
              value={item.sourceType === "SUPERMARKET" ? "Siêu thị" : "Chợ"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thời gian</Text>
            <DetailRow icon="event" label="Ngày mua:" value={formatDate(item.purchaseDate)} />
            <DetailRow
              icon="event-busy"
              label="Ngày hết hạn:"
              value={formatDate(item.expiryDate)}
              danger={!!urgentLabel}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon} size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, danger && { color: COLORS.tertiary }]}>{value}</Text>
    </View>
  );
}

function NutritionMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nutritionMetric}>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  backBtn: { padding: 4 },
  editBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.onSurface },
  content: { paddingBottom: 40 },
  imageContainer: { height: 250, position: "relative", backgroundColor: COLORS.surfaceContainer },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  urgentBadge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.tertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  urgentText: { color: COLORS.onTertiary, fontSize: 13, fontWeight: "700" },
  infoContainer: { padding: SPACING.lg },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: { fontSize: 24, fontWeight: "800", color: COLORS.onSurface, flex: 1, marginRight: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 13, fontWeight: "700" },
  category: { fontSize: 15, color: COLORS.primary, fontWeight: "600", marginBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 8,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(189, 202, 191, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.onSurface, marginBottom: SPACING.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  percent: { fontSize: 16 },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: RADIUS.full },
  daysLeft: { fontSize: 14, fontWeight: "600", textAlign: "right" },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionMetric: {
    width: "47%",
    minHeight: 62,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  nutritionValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  nutritionLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  nutritionHint: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  detailIcon: { marginRight: 12 },
  detailLabel: { fontSize: 15, color: COLORS.onSurfaceVariant, width: 112 },
  detailValue: { fontSize: 15, color: COLORS.onSurface, fontWeight: "500", flex: 1 },
});
