import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { getHouseholdSubscriptionApi } from "../../subscription/services/paymentApi";
import { HouseholdSubscription } from "../../subscription/types/subscription";
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
  deleteFamilyHousehold,
  fetchHouseholdInvitations,
  fetchHouseholdMembers,
  fetchMyHouseholds,
  fetchMyHouseholdInvitations,
  rejectFamilyInvitation,
  removeFamilyMember,
  setSelectedHouseholdId,
  updateFamilyMember,
} from "../redux/familyCloudSlice";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";
import { HouseholdInvitation, HouseholdMember, MemberPermission } from "../types/familyCloud";

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra";
}

function getMemberUser(member: HouseholdMember) {
  return typeof member.userId === "string" ? null : member.userId;
}

function confirmAction(title: string, message: string, action: () => Promise<void>, destructive = false) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) void action();
  } else {
    Alert.alert(title, message, [{ text: 'Hủy', style: 'cancel' }, {
      text: 'Xác nhận', style: destructive ? 'destructive' : 'default', onPress: () => void action(),
    }]);
  }
}

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
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
  const [invitationFeedback, setInvitationFeedback] = useState('');
  const [householdSubscription, setHouseholdSubscription] = useState<HouseholdSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const entitlementRequest = useRef(0);
  const permissionLock = useRef(false);
  const invitationLock = useRef(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const selectedMembership = useMemo(
    () => households.find((item) => item.household._id === selectedHouseholdId),
    [households, selectedHouseholdId]
  );

  const canManageMembers = selectedMembership?.role === "OWNER"
    && householdSubscription?.householdId === selectedHouseholdId && householdSubscription?.canManageSubscription === true;

  const refreshEntitlement = useCallback(() => {
    const request = ++entitlementRequest.current;
    setHouseholdSubscription(null); setSubscriptionError('');
    if (!selectedHouseholdId) { setSubscriptionLoading(false); return; }
    setSubscriptionLoading(true);
    getHouseholdSubscriptionApi(selectedHouseholdId)
      .then((data) => { if (request === entitlementRequest.current) setHouseholdSubscription(data); })
      .catch((error) => { if (request === entitlementRequest.current) setSubscriptionError(getErrorMessage(error)); })
      .finally(() => { if (request === entitlementRequest.current) setSubscriptionLoading(false); });
  }, [selectedHouseholdId]);

  const refreshHouseholds = useCallback(() => {
    dispatch(fetchMyHouseholds())
      .unwrap()
      .catch((error) => {
        notify("Không tải được Family Cloud", getErrorMessage(error));
      });

    dispatch(fetchMyHouseholdInvitations())
      .unwrap()
      .catch((error) => {
        notify("Không tải được lời mời của bạn", getErrorMessage(error));
      });

    refreshEntitlement();
  }, [dispatch, refreshEntitlement]);

  useFocusEffect(
    useCallback(() => {
      refreshHouseholds();
      return () => { entitlementRequest.current++; };
    }, [refreshHouseholds])
  );

  const refreshScreen = () => {
    refreshHouseholds();
    if (!selectedHouseholdId) return;
    dispatch(fetchHouseholdMembers(selectedHouseholdId)).unwrap()
      .catch((error) => notify('Không tải được thành viên', getErrorMessage(error)));
    if (canManageMembers) dispatch(fetchHouseholdInvitations(selectedHouseholdId)).unwrap()
      .catch((error) => notify('Không tải được lời mời', getErrorMessage(error)));
  };

  useEffect(() => {
    setInvitationFeedback('');
    if (!selectedHouseholdId) return;

    dispatch(fetchHouseholdMembers(selectedHouseholdId))
      .unwrap()
      .catch((error) => {
        notify("Không tải được thành viên", getErrorMessage(error));
      });
  }, [dispatch, selectedHouseholdId]);

  useEffect(() => {
    if (!selectedHouseholdId || !canManageMembers) return;

    dispatch(fetchHouseholdInvitations(selectedHouseholdId))
      .unwrap()
      .catch((error) => {
        notify("Không tải được lời mời", getErrorMessage(error));
      });
  }, [canManageMembers, dispatch, selectedHouseholdId]);

  const handleCreateHousehold = async () => {
    const name = householdName.trim();
    if (!name) {
      notify("Thiếu tên gia đình", "Vui lòng nhập tên Family Cloud.");
      return;
    }

    try {
      const household = await dispatch(createFamilyHousehold({ householdName: name })).unwrap();
      setHouseholdName("");
      await dispatch(fetchMyHouseholds()).unwrap();
      await dispatch(fetchMyHouseholdInvitations()).unwrap();
      dispatch(setSelectedHouseholdId(household._id));
    } catch (error: any) {
      notify("Không tạo được Family Cloud", getErrorMessage(error));
    }
  };

  const handleInviteMember = async () => {
    if (!canManageMembers || !householdSubscription?.hasPaidAccess || saving || invitationLock.current) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!selectedHouseholdId) {
      notify("Chưa có Family Cloud", "Hãy tạo hoặc chọn một Family Cloud trước.");
      return;
    }
    if (!email) {
      setInvitationFeedback('Vui lòng nhập email của người đã đăng ký FreshFriends.');
      notify("Thiếu email", "Vui lòng nhập email thành viên.");
      return;
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInvitationFeedback('Email không hợp lệ. Ví dụ: ban@example.com.');
      return;
    }

    invitationLock.current = true;
    try {
      setInvitationFeedback('');
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
        setInvitationFeedback('Đã gửi lời mời. Người nhận cần xác nhận trong Family Cloud.');
        notify("Đã gửi lời mời", "Lời mời đang chờ người dùng xác nhận.");
      }
    } catch (error: any) {
      setInvitationFeedback(getErrorMessage(error));
      notify("Không gửi được lời mời", getErrorMessage(error));
    } finally { invitationLock.current = false; }
  };

  const handleUpdatePermission = async (member: HouseholdMember, permission: keyof MemberPermission, value: boolean) => {
    if (!canManageMembers || !householdSubscription?.hasPaidAccess || member.role === 'OWNER' || saving || permissionLock.current) return;
    permissionLock.current = true;
    setPermissionSaving(true);
    try {
      await dispatch(updateFamilyMember({ householdId: selectedHouseholdId, memberId: member._id,
        payload: { permission: { [permission]: value } },
      })).unwrap();
    } catch (error) { notify('Không cập nhật được quyền', getErrorMessage(error)); }
    finally { permissionLock.current = false; setPermissionSaving(false); }
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (!canManageMembers || saving) return;
    confirmAction("Thu hồi lời mời", "Bạn muốn xóa lời mời này khỏi Family Cloud?", async () => {
      try {
        await dispatch(
          cancelFamilyInvitation({ householdId: selectedHouseholdId, invitationId })
        ).unwrap();
      } catch (error: any) {
        notify("Không thu hồi được", getErrorMessage(error));
      }
    }, true);
  };

  const handleAcceptInvitation = (invitation: HouseholdInvitation) => {
    if (saving) return;
    confirmAction("Tham gia Family Cloud", "Khi tham gia, toàn bộ thực phẩm và vị trí lưu trữ cá nhân của bạn sẽ được chuyển vào kho chung của gia đình. Bạn muốn tiếp tục?", async () => {
      try {
        await dispatch(acceptFamilyInvitation(invitation._id)).unwrap();
        await dispatch(fetchMyHouseholds()).unwrap();
        await dispatch(fetchMyHouseholdInvitations()).unwrap();
      } catch (error: any) {
        notify("Không tham gia được", getErrorMessage(error));
      }
    });
  };

  const handleRejectInvitation = (invitation: HouseholdInvitation) => {
    if (saving) return;
    confirmAction("Từ chối lời mời", "Bạn muốn từ chối lời mời Family Cloud này?", async () => {
      try {
        await dispatch(rejectFamilyInvitation(invitation._id)).unwrap();
      } catch (error: any) {
        notify("Không từ chối được", getErrorMessage(error));
      }
    }, true);
  };

  const handleRemoveMember = (member: HouseholdMember) => {
    if (!canManageMembers || member.role === 'OWNER' || saving) return;
    const user = getMemberUser(member);
    confirmAction("Xóa thành viên", `Xóa ${user?.fullName || "thành viên này"} khỏi Family Cloud?`, async () => {
      try {
        await dispatch(
          removeFamilyMember({ householdId: selectedHouseholdId, memberId: member._id })
        ).unwrap();
      } catch (error: any) {
        notify("Không xóa được", getErrorMessage(error));
      }
    }, true);
  };

  const handleDeleteHousehold = () => {
    if (!selectedHouseholdId || !canManageMembers || saving) return;

    confirmAction(
      "Xóa Family Cloud",
      "Bạn chắc chắn muốn xóa nhà hiện tại? Các thành viên sẽ bị gỡ khỏi Family Cloud và lời mời đang chờ sẽ bị hủy.",
      async () => {
        try {
          await dispatch(deleteFamilyHousehold(selectedHouseholdId)).unwrap();
          await dispatch(fetchMyHouseholds()).unwrap();
          await dispatch(fetchMyHouseholdInvitations()).unwrap();
        } catch (error: any) {
          notify("Không xóa được Family Cloud", getErrorMessage(error));
        }
      }, true
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FamilyCloudHeader onBack={() => navigation.goBack()} onRefresh={refreshScreen} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        ) : households.length === 0 ? (
          <CreateHouseholdForm
            householdName={householdName}
            saving={saving}
            onChangeHouseholdName={setHouseholdName}
            onSubmit={handleCreateHousehold}
          />
        ) : null}

        <ReceivedInvitationList
          invitations={receivedInvitations}
          loading={receivedInvitationsLoading}
          saving={saving}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
        />

        {loading ? null : households.length === 0 ? (
          <FamilyCloudEmptyState />
        ) : (
          <>
            <HouseholdSelector
              households={households}
              selectedHouseholdId={selectedHouseholdId}
              onSelectHousehold={(householdId) => dispatch(setSelectedHouseholdId(householdId))}
            />

            <View style={styles.upgradeBox}>
              <Text style={styles.upgradeTitle}>Family Plan</Text>
              {subscriptionLoading ? <ActivityIndicator /> : <>
                <Text style={styles.upgradeText}>{subscriptionError || (householdSubscription?.hasPaidAccess
                  ? 'Gói đang hoạt động'
                  : householdSubscription?.readOnly ? 'Gói đã ngừng hiệu lực. Dữ liệu dùng chung chỉ đọc.' : 'Chưa có gói Family hiệu lực. Chủ gia đình có thể chọn gói để kích hoạt.')}</Text>
                {householdSubscription?.source === 'LEGACY_OWNER' && <Text style={styles.upgradeText}>Quyền Family hiện được cung cấp từ Premium của chủ gia đình.</Text>}
                {householdSubscription?.subscription?.endDate && <Text style={styles.upgradeText}>Hết hạn: {new Date(householdSubscription.subscription.endDate).toLocaleDateString('vi-VN')}</Text>}
                {householdSubscription?.limits && <Text style={styles.upgradeText}>Tối đa {householdSubscription.limits.maxMembers} thành viên · {householdSubscription.limits.maxFoodItems} thực phẩm · {householdSubscription.limits.maxStorageLocations} vị trí lưu trữ</Text>}
              </>}
              <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate('Subscription', { householdId: selectedHouseholdId })}>
                <Text style={styles.primaryButtonText}>{canManageMembers ? 'Chọn gói / Gia hạn Family' : 'Xem Family Plan'}</Text>
              </TouchableOpacity>
            </View>

            {canManageMembers && (
              <>
                {householdSubscription?.hasPaidAccess ? <AddMemberForm
                  inviteEmail={inviteEmail}
                  saving={saving}
                  onChangeInviteEmail={setInviteEmail}
                  onSubmit={handleInviteMember}
                /> : <Text style={styles.upgradeText}>Cần gói Family hiệu lực để mời thành viên hoặc thay đổi quyền. Bạn vẫn có thể thu hồi lời mời và gỡ thành viên.</Text>}
                {invitationFeedback ? <Text accessibilityLiveRegion="polite" style={styles.upgradeText}>{invitationFeedback}</Text> : null}

                <InvitationList
                  invitations={invitations}
                  loading={invitationsLoading}
                  saving={saving}
                  onCancelInvitation={(invitation) => handleCancelInvitation(invitation._id)}
                />

                <TouchableOpacity
                  onPress={handleDeleteHousehold}
                  disabled={saving}
                  style={[styles.deleteHouseholdButton, saving && styles.disabled]}
                >
                  <Text style={styles.deleteHouseholdText}>Xóa Family Cloud này</Text>
                </TouchableOpacity>
              </>
            )}

            <MemberList
              members={members}
              loading={membersLoading}
              canManageMembers={Boolean(canManageMembers)}
              canEditPermissions={Boolean(canManageMembers && householdSubscription?.hasPaidAccess)}
              saving={saving || permissionSaving}
              onUpdatePermission={handleUpdatePermission}
              onRemoveMember={handleRemoveMember}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
