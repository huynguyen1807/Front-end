import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { Household, HouseholdInvitation } from "../types/familyCloud";

interface ReceivedInvitationListProps {
  invitations: HouseholdInvitation[];
  loading: boolean;
  saving: boolean;
  onAccept: (invitation: HouseholdInvitation) => void;
  onReject: (invitation: HouseholdInvitation) => void;
}

function getHouseholdName(invitation: HouseholdInvitation) {
  const household = invitation.householdId as Household | string;
  return typeof household === "string" ? "Family Cloud" : household.householdName;
}

function formatExpiredAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Hết hạn sau 7 ngày";
  }

  return `Hết hạn ${date.toLocaleDateString("vi-VN")}`;
}

export default function ReceivedInvitationList({
  invitations,
  loading,
  saving,
  onAccept,
  onReject,
}: ReceivedInvitationListProps) {
  if (loading) {
    return <ActivityIndicator color={COLORS.primary} style={styles.loader} />;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Lời mời của bạn</Text>

      {invitations.map((invitation) => (
        <View key={invitation._id} style={styles.invitationCard}>
          <View style={styles.invitationHeader}>
            <View style={styles.avatar}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{getHouseholdName(invitation)}</Text>
              <Text style={styles.memberEmail}>Bạn được mời tham gia Family Cloud này.</Text>
              <Text style={styles.memberRole}>{formatExpiredAt(invitation.expiresAt)}</Text>
            </View>
          </View>

          <View style={styles.invitationActionRow}>
            <TouchableOpacity
              onPress={() => onReject(invitation)}
              disabled={saving}
              style={[styles.secondaryButton, saving && styles.disabled]}
            >
              <Text style={styles.secondaryButtonText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onAccept(invitation)}
              disabled={saving}
              style={[styles.acceptButton, saving && styles.disabled]}
            >
              <Text style={styles.primaryButtonText}>Tham gia</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
