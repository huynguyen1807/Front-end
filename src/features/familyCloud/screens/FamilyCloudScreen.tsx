import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import AddMemberForm from "../components/AddMemberForm";
import CreateHouseholdForm from "../components/CreateHouseholdForm";
import FamilyCloudEmptyState from "../components/FamilyCloudEmptyState";
import FamilyCloudHeader from "../components/FamilyCloudHeader";
import HouseholdSelector from "../components/HouseholdSelector";
import MemberList from "../components/MemberList";
import {
  addFamilyMember,
  createFamilyHousehold,
  fetchHouseholdMembers,
  fetchMyHouseholds,
  removeFamilyMember,
  setSelectedHouseholdId,
  updateFamilyMember,
} from "../redux/familyCloudSlice";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { HouseholdMember, HouseholdRole } from "../types/familyCloud";

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra";
}

function getMemberUser(member: HouseholdMember) {
  return typeof member.userId === "string" ? null : member.userId;
}

export default function FamilyCloudScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const {
    households,
    selectedHouseholdId,
    members,
    loading,
    membersLoading,
    saving,
  } = useAppSelector((state) => state.familyCloud);

  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<HouseholdRole, "OWNER">>("MEMBER");

  const selectedMembership = useMemo(
    () => households.find((item) => item.household._id === selectedHouseholdId),
    [households, selectedHouseholdId]
  );

  const canManageMembers =
    selectedMembership?.role === "OWNER" ||
    selectedMembership?.role === "ADMIN" ||
    selectedMembership?.permission.canInviteMember;

  const refreshHouseholds = () => {
    dispatch(fetchMyHouseholds())
      .unwrap()
      .catch((error) => {
        Alert.alert("Không tải được Family Cloud", getErrorMessage(error));
      });
  };

  useEffect(() => {
    refreshHouseholds();
  }, []);

  useEffect(() => {
    if (!selectedHouseholdId) return;

    dispatch(fetchHouseholdMembers(selectedHouseholdId))
      .unwrap()
      .catch((error) => {
        Alert.alert("Không tải được thành viên", getErrorMessage(error));
      });
  }, [dispatch, selectedHouseholdId]);

  const handleCreateHousehold = async () => {
    const name = householdName.trim();
    if (!name) {
      Alert.alert("Thiếu tên gia đình", "Vui lòng nhập tên Family Cloud.");
      return;
    }

    try {
      const household = await dispatch(createFamilyHousehold({ householdName: name })).unwrap();
      setHouseholdName("");
      await dispatch(fetchMyHouseholds()).unwrap();
      dispatch(setSelectedHouseholdId(household._id));
    } catch (error: any) {
      Alert.alert("Không tạo được Family Cloud", getErrorMessage(error));
    }
  };

  const handleInviteMember = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!selectedHouseholdId) {
      Alert.alert("Chưa có Family Cloud", "Hãy tạo hoặc chọn một Family Cloud trước.");
      return;
    }
    if (!email) {
      Alert.alert("Thiếu email", "Vui lòng nhập email thành viên.");
      return;
    }

    try {
      const result = await dispatch(
        addFamilyMember({
          householdId: selectedHouseholdId,
          payload: { email, role: inviteRole },
        })
      ).unwrap();

      setInviteEmail("");
      await dispatch(fetchHouseholdMembers(selectedHouseholdId)).unwrap();

      if (result?.result?.invitation) {
        Alert.alert(
          "Đã tạo lời mời",
          "Email này chưa có tài khoản trong hệ thống, lời mời đang chờ xử lý."
        );
      }
    } catch (error: any) {
      Alert.alert("Không thêm được thành viên", getErrorMessage(error));
    }
  };

  const handleToggleRole = async (member: HouseholdMember) => {
    if (!selectedHouseholdId || member.role === "OWNER") return;

    const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
    try {
      await dispatch(
        updateFamilyMember({
          householdId: selectedHouseholdId,
          memberId: member._id,
          payload: { role: nextRole },
        })
      ).unwrap();
    } catch (error: any) {
      Alert.alert("Không đổi được vai trò", getErrorMessage(error));
    }
  };

  const handleRemoveMember = (member: HouseholdMember) => {
    const user = getMemberUser(member);
    Alert.alert("Xóa thành viên", `Xóa ${user?.fullName || "thành viên này"} khỏi Family Cloud?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(
              removeFamilyMember({ householdId: selectedHouseholdId, memberId: member._id })
            ).unwrap();
          } catch (error: any) {
            Alert.alert("Không xóa được", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FamilyCloudHeader onBack={() => navigation.goBack()} onRefresh={refreshHouseholds} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CreateHouseholdForm
          householdName={householdName}
          saving={saving}
          onChangeHouseholdName={setHouseholdName}
          onSubmit={handleCreateHousehold}
        />

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        ) : households.length === 0 ? (
          <FamilyCloudEmptyState />
        ) : (
          <>
            <HouseholdSelector
              households={households}
              selectedHouseholdId={selectedHouseholdId}
              onSelectHousehold={(householdId) => dispatch(setSelectedHouseholdId(householdId))}
            />

            {canManageMembers && (
              <AddMemberForm
                inviteEmail={inviteEmail}
                inviteRole={inviteRole}
                saving={saving}
                onChangeInviteEmail={setInviteEmail}
                onChangeInviteRole={setInviteRole}
                onSubmit={handleInviteMember}
              />
            )}

            <MemberList
              members={members}
              loading={membersLoading}
              canManageMembers={Boolean(canManageMembers)}
              onToggleRole={handleToggleRole}
              onRemoveMember={handleRemoveMember}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
