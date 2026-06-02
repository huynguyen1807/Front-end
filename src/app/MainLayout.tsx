import React from "react";
import { View, StyleSheet } from "react-native";
import HomeScreen from "../features/home/screens/HomeScreen";
import PlannerScreen from "../features/planner/screens/PlannerScreen";
import { useAppSelector } from "../redux/hooks";

export default function MainLayout() {
  const activeTab = useAppSelector((state) => state.app.activeTab);

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "meal":
        return <PlannerScreen />;
      // Fallback for other tabs not yet implemented
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
