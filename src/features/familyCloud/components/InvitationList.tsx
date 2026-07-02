import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { HouseholdInvitation } from "../types/familyCloud";

interface InvitationListProps {
  invitations: HouseholdInvitation[];
  loading: boolean;
  saving: boolean;
  onCancelInvitation: (invitation: HouseholdInvitation) => void;
}

function formatExpiredAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không rõ hạn";
  }

  return `Hết hạn ${date.toLocaleDateString("vi-VN")}`;
}

export default function InvitationList({
  invitations,
  loading,
  saving,
  onCancelInvitation,
}: InvitationListProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Lời mời đang chờ</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : invitations.length === 0 ? (
        <View style={styles.invitationEmptyBox}>
          <Text style={styles.invitationEmptyText}>Chưa có lời mời nào đang chờ.</Text>
        </View>
      ) : (
        invitations.map((invitation) => (
          <View key={invitation._id} style={styles.memberCard}>
            <View style={styles.avatar}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{invitation.inviteEmail}</Text>
              <Text style={styles.memberEmail}>Đang chờ xác nhận</Text>
              <Text style={styles.memberRole}>{formatExpiredAt(invitation.expiresAt)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => onCancelInvitation(invitation)}
              disabled={saving}
              style={[styles.actionButton, saving && styles.disabled]}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}
