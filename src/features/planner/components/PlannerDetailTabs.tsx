import { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { PlannerDetailTab } from "../constants/plannerConstants";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import ChipButton from "./shared/ChipButton";

type PlannerDetailTabsProps = {
  activeTab: PlannerDetailTab;
  onChangeTab: (tab: PlannerDetailTab) => void;
  children: ReactNode;
};

const tabs: Array<{ key: PlannerDetailTab; label: string }> = [
  { key: "inventory", label: "Thực phẩm" },
  { key: "recipes", label: "Công thức" },
  { key: "schedule", label: "Lịch trình bữa ăn" },
  { key: "bmi", label: "Chỉ số BMI" },
  { key: "macro", label: "Báo cáo macro" },
  { key: "video", label: "Trích xuất từ video" },
];

export default function PlannerDetailTabs({
  activeTab,
  onChangeTab,
  children,
}: PlannerDetailTabsProps) {
  return (
    <View style={styles.detailTabPanel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.detailTabScroll}
        contentContainerStyle={styles.detailTabContent}
      >
        {tabs.map((tab) => (
          <ChipButton
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => onChangeTab(tab.key)}
          />
        ))}
      </ScrollView>
      {children}
    </View>
  );
}
