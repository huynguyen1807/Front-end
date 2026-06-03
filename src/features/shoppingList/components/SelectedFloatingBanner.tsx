import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { addShoppingItemScreenStyles as styles } from "../styles/AddShoppingItemScreen.styles";

interface SelectedFloatingBannerProps {
  selectedItemsCount: number;
  selectedSummaryText: string;
  onConfirm: () => void;
}

export default function SelectedFloatingBanner({
  selectedItemsCount,
  selectedSummaryText,
  onConfirm,
}: SelectedFloatingBannerProps) {
  const bannerBottom = 16;

  return (
    <View style={[styles.floatingBanner, { bottom: bannerBottom }]}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerBadgeCircle}>
          <Text style={styles.bannerBadgeCircleText}>
            {selectedItemsCount}
          </Text>
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            Đã chọn {selectedItemsCount} món
          </Text>
          <Text numberOfLines={1} style={styles.bannerSub}>
            {selectedSummaryText}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConfirm}
        style={styles.bannerConfirmBtn}
      >
        <Text style={styles.bannerConfirmBtnText}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
}
