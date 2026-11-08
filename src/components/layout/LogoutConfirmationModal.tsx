import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

type LogoutConfirmationModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutConfirmationModal({
  visible,
  onCancel,
  onConfirm,
}: LogoutConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          accessibilityRole="alert"
          style={styles.dialog}
        >
          <Text style={styles.title}>Đăng xuất</Text>
          <Text style={styles.message}>
            Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}
            >
              <Text style={styles.confirmText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    backgroundColor: COLORS.surface,
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.18)",
  },
  title: {
    marginBottom: 10,
    color: COLORS.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  message: {
    color: COLORS.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  button: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  confirmButton: {
    backgroundColor: COLORS.error,
  },
  cancelText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
});
