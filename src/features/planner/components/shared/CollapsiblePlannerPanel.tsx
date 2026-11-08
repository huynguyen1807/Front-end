import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../../constants/colors";
import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type CollapsiblePlannerPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

export default function CollapsiblePlannerPanel({
  title,
  subtitle,
  children,
  defaultExpanded = true,
}: CollapsiblePlannerPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.collapsiblePanel}>
      <TouchableOpacity
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={expanded ? `Thu gọn ${title}` : `Mở rộng ${title}`}
        accessibilityState={{ expanded }}
        style={styles.collapsiblePanelHeader}
        onPress={() => setExpanded((current) => !current)}
      >
        <View style={styles.collapsiblePanelTitleBlock}>
          <Text style={styles.collapsiblePanelTitle}>{title}</Text>
          {subtitle ? <Text style={styles.collapsiblePanelSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.collapsiblePanelToggle}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={COLORS.primary}
          />
        </View>
      </TouchableOpacity>
      {expanded ? <View style={styles.collapsiblePanelContent}>{children}</View> : null}
    </View>
  );
}
