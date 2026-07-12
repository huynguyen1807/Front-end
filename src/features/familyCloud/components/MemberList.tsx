import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { ROLE_LABEL } from "../types/constants";
import { HouseholdMember } from "../types/familyCloud";

function getMemberUser(member: HouseholdMember) {
  return typeof member.userId === "string" ? null : member.userId;
}

interface MemberListProps {
  members: HouseholdMember[];
  loading: boolean;
  canManageMembers: boolean;
  onRemoveMember: (member: HouseholdMember) => void;
}

export default function MemberList({
  members,
  loading,
  canManageMembers,
  onRemoveMember,
}: MemberListProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Thành viên</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        members.map((member) => {
          const user = getMemberUser(member);
          const manageable = canManageMembers && member.role !== "OWNER";

          return (
            <View key={member._id} style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.fullName || user?.email || "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{user?.fullName || "Người dùng"}</Text>
                <Text style={styles.memberEmail}>{user?.email || "Không có email"}</Text>
                <Text style={styles.memberRole}>{ROLE_LABEL[member.role]}</Text>
              </View>

              {manageable && (
                <View style={styles.memberActions}>
                  <TouchableOpacity onPress={() => onRemoveMember(member)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
