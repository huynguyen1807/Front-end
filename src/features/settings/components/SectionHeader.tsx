import { Text, View } from "react-native";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";

interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}
