import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";

interface AddMemberFormProps {
  inviteEmail: string;
  saving: boolean;
  onChangeInviteEmail: (value: string) => void;
  onSubmit: () => void;
}

export default function AddMemberForm({
  inviteEmail,
  saving,
  onChangeInviteEmail,
  onSubmit,
}: AddMemberFormProps) {
  return (
    <View style={styles.formBox}>
      <Text style={styles.sectionTitle}>Thêm thành viên</Text>
      <TextInput
        value={inviteEmail}
        onChangeText={onChangeInviteEmail}
        placeholder="email@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={COLORS.onSurfaceVariant}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={saving}
        style={[styles.fullButton, saving && styles.disabled]}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Gửi lời mời</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
