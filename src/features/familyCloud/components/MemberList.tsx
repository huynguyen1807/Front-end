import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { ROLE_LABEL } from "../types/constants";
import { HouseholdMember, MemberPermission } from "../types/familyCloud";

const permissionLabels: [keyof MemberPermission, string][] = [
  ['canViewInventory', 'Xem kho'], ['canEditInventory', 'Sửa kho'],
  ['canViewShoppingList', 'Xem danh sách mua sắm'], ['canEditShoppingList', 'Sửa danh sách mua sắm'],
  ['canInviteMember', 'Mời thành viên'],
];

function getMemberUser(member: HouseholdMember) {
  return typeof member.userId === "string" ? null : member.userId;
}

interface MemberListProps {
  members: HouseholdMember[];
  loading: boolean;
  canManageMembers: boolean;
  canEditPermissions: boolean;
  saving: boolean;
  onUpdatePermission: (member: HouseholdMember, permission: keyof MemberPermission, value: boolean) => void;
  onRemoveMember: (member: HouseholdMember) => void;
}

export default function MemberList({
  members,
  loading,
  canManageMembers,
  canEditPermissions,
  saving,
  onUpdatePermission,
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
                {permissionLabels.map(([key, label]) => <View key={key} style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>{label}</Text>
                  {canEditPermissions && member.role !== 'OWNER' && key !== 'canInviteMember'
                    ? <Switch accessibilityLabel={`${label}: ${user?.fullName || user?.email || 'Thành viên'}`} value={member.permission[key]} disabled={saving}
                        onValueChange={(value) => onUpdatePermission(member, key, value)} />
                    : <Text style={styles.memberEmail}>{member.permission[key] ? 'Có' : 'Không'}</Text>}
                </View>)}
              </View>

              {manageable && (
                <View style={styles.memberActions}>
                  <TouchableOpacity disabled={saving} accessibilityLabel="Xóa thành viên" onPress={() => onRemoveMember(member)} style={styles.actionButton}>
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
