import { ScrollView, Text, View } from "react-native";

import { InventoryFood } from "../types/planner";
import { getDaysUntilExpiry } from "../utils/plannerUtils";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";

type InventoryBucketProps = {
  title: string;
  tone: "warning" | "safe";
  foods: InventoryFood[];
};

export default function InventoryBucket({ title, tone, foods }: InventoryBucketProps) {
  return (
    <View style={styles.bucket}>
      <View style={styles.bucketHeader}>
        <Text style={styles.bucketTitle}>{title}</Text>
        <Text style={[styles.bucketCount, tone === "warning" && styles.bucketWarning]}>{foods.length}</Text>
      </View>
      {foods.length === 0 ? (
        <Text style={styles.emptyText}>Không có món nào trong nhóm này.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodStrip}>
          {foods.slice(0, 10).map((food) => {
            const days = getDaysUntilExpiry(food.expiryDate);
            return (
              <View key={food._id} style={styles.foodPill}>
                <Text style={styles.foodName} numberOfLines={1}>{food.foodName}</Text>
                <Text style={styles.foodMeta}>
                  {food.quantity} {food.unit} - {days <= 0 ? "hôm nay" : `${days} ngày`}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
