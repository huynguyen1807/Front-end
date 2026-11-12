import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../../constants/colors";
import { plannerStyles } from "../../styles/PlannerScreen.styles";

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export type NoticeState = {
  title: string;
  message: string;
};

type AppAlertModalProps = {
  confirmDialog: ConfirmDialogState | null;
  onCancelConfirm: () => void;
  onConfirm: (dialog: ConfirmDialogState) => void;
  notice: NoticeState | null;
  onCloseNotice: () => void;
};

export default function AppAlertModal({
  confirmDialog,
  onCancelConfirm,
  onConfirm,
  notice,
  onCloseNotice,
}: AppAlertModalProps) {
  const visible = Boolean(confirmDialog || notice);
  const isConfirm = Boolean(confirmDialog);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={isConfirm ? onCancelConfirm : onCloseNotice}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{confirmDialog?.title ?? notice?.title}</Text>
          <Text style={styles.message}>{confirmDialog?.message ?? notice?.message}</Text>
          <View style={styles.actionRow}>
            {isConfirm ? (
              <>
                <TouchableOpacity
                  style={[plannerStyles.button, plannerStyles.secondaryButton, styles.flexButton]}
                  activeOpacity={0.8}
                  onPress={onCancelConfirm}
                >
                  <Text style={[plannerStyles.buttonText, plannerStyles.secondaryButtonText]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[plannerStyles.button, styles.flexButton, styles.destructiveButton]}
                  activeOpacity={0.8}
                  onPress={() => confirmDialog && onConfirm(confirmDialog)}
                >
                  <Text style={plannerStyles.buttonText}>{confirmDialog?.confirmLabel || "Xóa"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[plannerStyles.button, styles.flexButton]}
                activeOpacity={0.8}
                onPress={onCloseNotice}
              >
                <Text style={plannerStyles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    padding: 18,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  message: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: COLORS.error,
  },
});
