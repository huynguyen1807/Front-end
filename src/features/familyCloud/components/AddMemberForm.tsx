import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { ROLE_LABEL } from "../types/constants";
import { HouseholdRole } from "../types/familyCloud";

interface AddMemberFormProps {
  inviteEmail: string;
  inviteRole: Exclude<HouseholdRole, "OWNER">;
  saving: boolean;
  onChangeInviteEmail: (value: string) => void;
  onChangeInviteRole: (role: Exclude<HouseholdRole, "OWNER">) => void;
  onSubmit: () => void;
}

export default function AddMemberForm({
  inviteEmail,
  inviteRole,
  saving,
  onChangeInviteEmail,
  onChangeInviteRole,
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
      <View style={styles.roleRow}>
        {(["MEMBER", "ADMIN"] as const).map((role) => (
          <TouchableOpacity
            key={role}
            onPress={() => onChangeInviteRole(role)}
            style={[styles.roleChip, inviteRole === role && styles.roleChipActive]}
          >
            <Text style={[styles.roleText, inviteRole === role && styles.roleTextActive]}>
              {ROLE_LABEL[role]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={onSubmit}
        disabled={saving}
        style={[styles.fullButton, saving && styles.disabled]}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Thêm vào Family Cloud</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
