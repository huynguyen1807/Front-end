import { ReactNode } from "react";
import { View } from "react-native";

import { PlannerDetailTab } from "../constants/plannerConstants";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import ChipButton from "./shared/ChipButton";

type PlannerDetailTabsProps = {
  activeTab: PlannerDetailTab;
  onChangeTab: (tab: PlannerDetailTab) => void;
  children: ReactNode;
};

const tabs: Array<{ key: PlannerDetailTab; label: string }> = [
  { key: "inventory", label: "Inventory-based suggestions" },
  { key: "schedule", label: "Lịch trình bữa ăn" },
  { key: "macro", label: "Macro Report" },
  { key: "calories", label: "Calculate Meal Calories" },
  { key: "video", label: "Extract Recipe from Video" },
];

export default function PlannerDetailTabs({
  activeTab,
  onChangeTab,
  children,
}: PlannerDetailTabsProps) {
  return (
    <View style={styles.detailTabPanel}>
      <View style={styles.segmentRow}>
        {tabs.map((tab) => (
          <ChipButton
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => onChangeTab(tab.key)}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
