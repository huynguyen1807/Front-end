import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItemData } from "../types/shopping";
import { addShoppingItemScreenStyles as styles } from "../styles/AddShoppingItemScreen.styles";

interface SuggestionCardProps {
  item: ItemData;
  selected: boolean;
  onToggleSelect: () => void;
}

export default function SuggestionCard({
  item,
  selected,
  onToggleSelect,
}: SuggestionCardProps) {
  return (
    <View style={styles.suggestionCard}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      {item.badge && (
        <View
          style={[
            styles.cardBadge,
            { backgroundColor: item.badge.color },
          ]}
        >
          <Text style={styles.cardBadgeText}>{item.badge.text}</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.itemName}>
          {item.name}
        </Text>
        <Text style={styles.itemQty}>{item.unit}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onToggleSelect}
          style={[
            styles.addBtn,
            selected && { backgroundColor: "#745b00" },
          ]}
        >
          <Ionicons
            name={selected ? "checkmark" : "add"}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.addBtnText}>
            {selected ? "Đã thêm" : "Thêm"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
