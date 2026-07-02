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
import InvitationList from "../components/InvitationList";
import MemberList from "../components/MemberList";
import ReceivedInvitationList from "../components/ReceivedInvitationList";
import {
  acceptFamilyInvitation,
  addFamilyMember,
  cancelFamilyInvitation,
  createFamilyHousehold,
  fetchHouseholdInvitations,
  fetchHouseholdMembers,
  fetchMyHouseholds,
  fetchMyHouseholdInvitations,
  rejectFamilyInvitation,
  removeFamilyMember,
  setSelectedHouseholdId,
} from "../redux/familyCloudSlice";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { HouseholdInvitation, HouseholdMember } from "../types/familyCloud";

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
    invitations,
    receivedInvitations,
    loading,
    membersLoading,
    invitationsLoading,
    receivedInvitationsLoading,
    saving,
  } = useAppSelector((state) => state.familyCloud);

  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const selectedMembership = useMemo(
    () => households.find((item) => item.household._id === selectedHouseholdId),
    [households, selectedHouseholdId]
  );

  const canManageMembers = selectedMembership?.role === "OWNER";

  const refreshHouseholds = () => {
    dispatch(fetchMyHouseholds())
      .unwrap()
      .catch((error) => {
        Alert.alert("Không tải được Family Cloud", getErrorMessage(error));
      });

    dispatch(fetchMyHouseholdInvitations())
      .unwrap()
      .catch((error) => {
        Alert.alert("Không tải được lời mời của bạn", getErrorMessage(error));
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

  useEffect(() => {
    if (!selectedHouseholdId || !canManageMembers) return;

    dispatch(fetchHouseholdInvitations(selectedHouseholdId))
      .unwrap()
      .catch((error) => {
        Alert.alert("Không tải được lời mời", getErrorMessage(error));
      });
  }, [canManageMembers, dispatch, selectedHouseholdId]);

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
      await dispatch(fetchMyHouseholdInvitations()).unwrap();
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
          payload: { email },
        })
      ).unwrap();

      setInviteEmail("");
      await dispatch(fetchHouseholdInvitations(selectedHouseholdId)).unwrap();
      await dispatch(fetchMyHouseholdInvitations()).unwrap();

      if (result?.result?.invitation) {
        Alert.alert("Đã gửi lời mời", "Lời mời đang chờ người dùng xác nhận.");
      }
    } catch (error: any) {
      Alert.alert("Không gửi được lời mời", getErrorMessage(error));
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    Alert.alert("Thu hồi lời mời", "Bạn muốn xóa lời mời này khỏi Family Cloud?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thu hồi",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(
              cancelFamilyInvitation({ householdId: selectedHouseholdId, invitationId })
            ).unwrap();
          } catch (error: any) {
            Alert.alert("Không thu hồi được", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleAcceptInvitation = (invitation: HouseholdInvitation) => {
    Alert.alert("Tham gia Family Cloud", "Bạn muốn xác nhận tham gia family này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Tham gia",
        onPress: async () => {
          try {
            await dispatch(acceptFamilyInvitation(invitation._id)).unwrap();
            await dispatch(fetchMyHouseholds()).unwrap();
            await dispatch(fetchMyHouseholdInvitations()).unwrap();
          } catch (error: any) {
            Alert.alert("Không tham gia được", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleRejectInvitation = (invitation: HouseholdInvitation) => {
    Alert.alert("Từ chối lời mời", "Bạn muốn từ chối lời mời Family Cloud này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Từ chối",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(rejectFamilyInvitation(invitation._id)).unwrap();
          } catch (error: any) {
            Alert.alert("Không từ chối được", getErrorMessage(error));
          }
        },
      },
    ]);
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
        {!loading && households.length === 0 && (
          <CreateHouseholdForm
            householdName={householdName}
            saving={saving}
            onChangeHouseholdName={setHouseholdName}
            onSubmit={handleCreateHousehold}
          />
        )}

        <ReceivedInvitationList
          invitations={receivedInvitations}
          loading={receivedInvitationsLoading}
          saving={saving}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
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
              <>
                <AddMemberForm
                  inviteEmail={inviteEmail}
                  saving={saving}
                  onChangeInviteEmail={setInviteEmail}
                  onSubmit={handleInviteMember}
                />

                <InvitationList
                  invitations={invitations}
                  loading={invitationsLoading}
                  saving={saving}
                  onCancelInvitation={(invitation) => handleCancelInvitation(invitation._id)}
                />
              </>
            )}

            <MemberList
              members={members}
              loading={membersLoading}
              canManageMembers={Boolean(canManageMembers)}
              onRemoveMember={handleRemoveMember}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
