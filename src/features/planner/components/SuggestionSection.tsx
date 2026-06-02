import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { mockSuggestedRecipes } from "../data/plannerMock";
import RecipeCard from "./RecipeCard";

export default function SuggestionSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.title}>Gợi ý hôm nay</Text>
        </View>
        <TouchableOpacity activeOpacity={0.75}>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Dựa trên <Text style={styles.strong}>Bơ</Text> và{" "}
          <Text style={styles.strong}>Ức gà</Text> sắp hết hạn trong 2 ngày tới.
        </Text>
      </View>

      {mockSuggestedRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} {...recipe} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginLeft: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  banner: {
    backgroundColor: "#fff1c7",
    borderColor: COLORS.secondaryContainer,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 21,
  },
  strong: {
    fontWeight: "800",
  },
});
