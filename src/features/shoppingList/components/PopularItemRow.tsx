import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItemData } from "../types/shopping";
import { addShoppingItemScreenStyles as styles } from "../styles/AddShoppingItemScreen.styles";

interface PopularItemRowProps {
  item: ItemData;
  selected: boolean;
  onToggleSelect: () => void;
}

export default function PopularItemRow({
  item,
  selected,
  onToggleSelect,
}: PopularItemRowProps) {
  return (
    <View style={styles.popularItemRow}>
      <View style={styles.popularItemLeft}>
        <Image source={{ uri: item.image }} style={styles.popularItemImage} />
        <View style={styles.popularItemInfo}>
          <Text style={styles.popularItemName}>{item.name}</Text>
          <Text style={styles.popularItemQty}>{item.unit}</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggleSelect}
        style={[
          styles.circleActionBtn,
          selected && styles.circleActionBtnActive,
        ]}
      >
        <Ionicons
          name={selected ? "checkmark" : "add"}
          size={20}
          color={selected ? "#ffffff" : "#757575"}
        />
      </TouchableOpacity>
    </View>
  );
}
