import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { scheduleValidationNoticeStyles as styles } from "../styles/ScheduleValidationNotice.styles";
import { ScheduleNotice } from "../types/planner";

type ScheduleValidationNoticeProps = {
  notice: ScheduleNotice;
  onDismiss: () => void;
};

const toneConfig = {
  info: {
    icon: "information-circle-outline" as const,
    containerStyle: styles.infoContainer,
    iconColor: "#006a44",
  },
  warning: {
    icon: "warning-outline" as const,
    containerStyle: styles.warningContainer,
    iconColor: "#8a5700",
  },
  error: {
    icon: "alert-circle-outline" as const,
    containerStyle: styles.errorContainer,
    iconColor: "#ba1a1a",
  },
};

export default function ScheduleValidationNotice({
  notice,
  onDismiss,
}: ScheduleValidationNoticeProps) {
  const config = toneConfig[notice.tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.container, config.containerStyle]}
    >
      <Ionicons name={config.icon} size={22} color={config.iconColor} />
      <View style={styles.copy}>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.message}>{notice.message}</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="Đóng thông báo"
        accessibilityRole="button"
        activeOpacity={0.72}
        onPress={onDismiss}
        style={styles.dismissButton}
      >
        <Ionicons name="close" size={18} color="#1c1b1b" />
      </TouchableOpacity>
    </View>
  );
}
