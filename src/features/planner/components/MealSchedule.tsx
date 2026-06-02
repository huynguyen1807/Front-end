import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { mockDates, mockTimelineItems } from "../data/plannerMock";
import TimelineItem from "./TimelineItem";

export default function MealSchedule() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch trình bữa ăn</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {mockDates.map((date, index) => {
          const isActive = index === 0;

          return (
            <TouchableOpacity
              key={date.id}
              activeOpacity={0.75}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {date.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.timeline}>
        {mockTimelineItems.map((item) => (
          <TimelineItem key={item.id} {...item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  tabsScroll: {
    marginBottom: 22,
  },
  tabsContainer: {
    gap: 12,
  },
  tab: {
    minWidth: 88,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  activeTabText: {
    color: COLORS.onPrimary,
  },
  timeline: {
    gap: 12,
  },
});
