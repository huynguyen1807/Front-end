import { ReactNode } from "react";
import { Text, View } from "react-native";

import { adminDataStyles as styles } from "../../styles/AdminData.styles";

type AdminSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AdminSection({ title, subtitle, children }: AdminSectionProps) {
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
