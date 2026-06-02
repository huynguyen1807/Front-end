import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { SPACING } from "../../../constants/spacing";
import DailyGoalCard from "../components/DailyGoalCard";
import MealSchedule from "../components/MealSchedule";
import SuggestionSection from "../components/SuggestionSection";

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = Platform.OS === "ios" ? 104 + insets.bottom : 104;

  return (
    <ScreenContainer>
      <TopNavbar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomSpace,
          },
        ]}
      >
        <DailyGoalCard />
        <SuggestionSection />
        <MealSchedule />
      </ScrollView>
      <BottomNavbar />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 28,
  },
});
