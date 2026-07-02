import { ReactNode } from "react";
import { Text, View } from "react-native";

import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function Section({ title, subtitle, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}
