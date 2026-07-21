import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { scheduleDayRolloverModalStyles as styles } from "../styles/ScheduleDayRolloverModal.styles";
import { ScheduleRolloverPrompt } from "../types/planner";

type ScheduleDayRolloverModalProps = {
  prompt: ScheduleRolloverPrompt | null;
  onAccept: () => void;
  onCancel: () => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ScheduleDayRolloverModal({
  prompt,
  onAccept,
  onCancel,
}: ScheduleDayRolloverModalProps) {
  if (!prompt) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.iconContainer}>
            <Ionicons name="moon-outline" size={28} color="#8a5700" />
          </View>
          <Text style={styles.title}>Chuyển sang ngày kế tiếp?</Text>
          <Text style={styles.message}>
            Giờ {prompt.time} thuộc rạng sáng của ngày hôm sau. Lịch chỉ được đổi ngày sau khi bạn chấp nhận.
          </Text>

          <View style={styles.dateTransition}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateCaption}>Ngày đang chọn</Text>
              <Text style={styles.dateText}>{formatDate(prompt.sourceDate)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateCaption}>Ngày sẽ chuyển đến</Text>
              <Text style={styles.dateText}>{formatDate(prompt.targetDate)}</Text>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            style={styles.acceptButton}
            onPress={onAccept}
          >
            <Ionicons name="checkmark" size={19} color={COLORS.onPrimary} />
            <Text style={styles.acceptButtonText}>Chấp nhận chuyển ngày</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.78}
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Giữ ngày và giờ hiện tại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
