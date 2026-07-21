import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";

import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { COLORS } from "../../../constants/colors";
import { logOutRevenueCat } from "../../subscription/services/revenueCatService";

import ProfileSection from "../components/ProfileSection";
import SettingsItem from "../components/SettingsItem";
import SettingsToggle from "../components/SettingsToggle";
import SectionHeader from "../components/SectionHeader";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";
import { UserProfile } from "../types/settings";
import { getMeApi, updatePreferencesApi } from "../services/userApi";
import { apiClient } from "../../../services/apiClient";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportContent, setSupportContent] = useState("");
  const [supportCategory, setSupportCategory] = useState("OTHER");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    name: "Đang tải...",
    email: "...",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvxKarOtflssf0DRAIlS7rBsZ2CsimMFiMYmnTyqxz6vhQRYPiMwW1HB9sf50iMpv1NdhjSpUsPrZtEcFFuDwagAYqXHATw6AYTj6Qe8Jbvf3jEoMM3FBZf9to-OualWQgWjZ0Ga-j1RgW52VCm0EkeQGLFldPGpOpkICGcdcAbKf_fkjvUlHOYhC7mFfzjM4-TI2yrUKNYoF9VuVgvDhKsZ70BsrOCe45CaxVB9cqarYDYpxV9rZNM-6wv_kZxM8n90vlMGhZac0",
  });

  const loadUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setUser(prev => ({
          ...prev,
          name: userInfo.fullName || userInfo.name || "Người dùng",
          email: userInfo.email || "",
          avatar: userInfo.avatarUrl || prev.avatar,
          role: userInfo.role || prev.role
        }));
      }

      // Fetch latest from API
      const data = await getMeApi();
      if (data && data.user) {
        setUser(prev => ({
          ...prev,
          name: data.user.fullName || prev.name,
          email: data.user.email || prev.email,
          avatar: data.user.avatarUrl || prev.avatar,
          role: data.user.role || prev.role
        }));
        // Update AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify({
           ...JSON.parse(userInfoString || '{}'),
           ...data.user
        }));
      }
      if (data && data.preferences) {
        setNotificationsEnabled(data.preferences.notificationsEnabled ?? true);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin user:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [])
  );

  const handleToggleNotification = async (value: boolean) => {
    try {
      setNotificationsEnabled(value); // Optimistic update
      await updatePreferencesApi({ notificationsEnabled: value });
    } catch (error) {
      setNotificationsEnabled(!value); // Revert on failure
      Alert.alert('Lỗi', 'Không thể lưu cài đặt thông báo');
    }
  };

  const bottomSpace = Platform.OS === "ios" ? 100 + insets.bottom : 100;

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?",
      [
        { text: "Hủy", onPress: () => {}, style: "cancel" },
        {
          text: "Đăng xuất",
          onPress: async () => {
            try {
              await logOutRevenueCat().catch(() => undefined);
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSpace },
        ]}
        style={styles.container}
      >
        {/* Profile Section */}
        <ProfileSection user={user} onEditPress={() => navigation.navigate("EditProfile")} />

        {/* Admin Section */}
        {user.role === 'ADMIN' && (
          <View style={styles.sectionContainer}>
            <SectionHeader title="Quản trị Hệ thống" />
            <View style={styles.sectionWrapper}>
              <SettingsItem
                icon="shield-checkmark-outline"
                label="Bảng điều khiển Admin"
                description="Quản lý người dùng và dữ liệu"
                iconColor={COLORS.error}
                onPress={() => navigation.navigate("AdminDashboard")}
                showChevron
                isLast
              />
            </View>
          </View>
        )}

        {/* App Settings Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Thiết lập ứng dụng" />
          <View style={styles.sectionWrapper}>
            {/* Notifications */}
            <SettingsItem
              icon="notifications-outline"
              label="Thông báo"
              description="Nhận tin nhắn về hạn sử dụng"
              iconColor={COLORS.primary}
              isLast
            >
              <SettingsToggle
                value={notificationsEnabled}
                onChange={handleToggleNotification}
              />
            </SettingsItem>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Dữ liệu & Quyền riêng tư" />
          <View style={styles.sectionWrapper}>
            <SettingsItem
              icon="people-outline"
              label="Family Cloud"
              description="Quản lý gia đình và quyền chia sẻ"
              iconColor={COLORS.primary}
              onPress={() => navigation.navigate("FamilyCloud")}
              showChevron
            />

            <SettingsItem
              icon="card-outline"
              label="Premium & Thanh toán"
              description="Mở khóa Family Cloud và giới hạn thành viên"
              iconColor={COLORS.secondary}
              onPress={() => navigation.navigate("Subscription")}
              showChevron
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Về ứng dụng" />
          <View style={styles.sectionWrapper}>
            <SettingsItem
              icon="information-circle-outline"
              label="Phiên bản ứng dụng"
              description="v2.4.0 (Fresh)"
              iconColor={COLORS.onSurfaceVariant}
            />

            <SettingsItem
              icon="help-circle-outline"
              label="Hỗ trợ"
              iconColor={COLORS.onSurfaceVariant}
              onPress={() => {
                setSupportModalVisible(true);
              }}
              showChevron
              isLast
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: COLORS.error }]}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <BottomNavbar />

      {/* Support Ticket Modal */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: COLORS.primaryContainer }]}>
                <Ionicons name="help-buoy" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Gửi Yêu Cầu Hỗ Trợ</Text>
              <Text style={styles.modalSubtitle}>
                Vui lòng mô tả chi tiết lỗi hoặc vấn đề bạn đang gặp phải.
              </Text>
            </View>

            <Text style={styles.sectionTitleModal}>Phân loại lỗi:</Text>
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  supportCategory === "STUCK_HOUSEHOLD" && styles.categoryBtnActive,
                ]}
                onPress={() => setSupportCategory("STUCK_HOUSEHOLD")}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    supportCategory === "STUCK_HOUSEHOLD" && styles.categoryBtnTextActive,
                  ]}
                >
                  Kẹt gia đình
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  supportCategory === "APP_BUG" && styles.categoryBtnActive,
                ]}
                onPress={() => setSupportCategory("APP_BUG")}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    supportCategory === "APP_BUG" && styles.categoryBtnTextActive,
                  ]}
                >
                  Lỗi hệ thống
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  supportCategory === "OTHER" && styles.categoryBtnActive,
                ]}
                onPress={() => setSupportCategory("OTHER")}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    supportCategory === "OTHER" && styles.categoryBtnTextActive,
                  ]}
                >
                  Khác
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.supportInput}
              multiline
              placeholder={
                supportCategory === "STUCK_HOUSEHOLD" 
                  ? "Mình bị kẹt gia đình, vui lòng gỡ giúp mình..." 
                  : "Mô tả lỗi hoặc góp ý của bạn..."
              }
              value={supportContent}
              onChangeText={setSupportContent}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setSupportModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.onSurface }]}>
                  Hủy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  if (!supportContent.trim()) {
                    Alert.alert("Lỗi", "Vui lòng nhập nội dung hỗ trợ");
                    return;
                  }
                  try {
                    setSupportSubmitting(true);
                    const res = await apiClient.post('/api/users/support', { 
                      content: supportContent,
                      category: supportCategory
                    });
                    if (res.data.success) {
                      Alert.alert("Thành công", "Đã gửi yêu cầu hỗ trợ. Admin sẽ kiểm tra sớm nhất.");
                      setSupportModalVisible(false);
                      setSupportContent("");
                      setSupportCategory("OTHER");
                    }
                  } catch (e: any) {
                    Alert.alert("Lỗi", e.response?.data?.message || "Không thể gửi yêu cầu hỗ trợ");
                  } finally {
                    setSupportSubmitting(false);
                  }
                }}
                disabled={supportSubmitting}
              >
                {supportSubmitting ? (
                  <ActivityIndicator color={COLORS.onPrimary} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: COLORS.onPrimary }]}>
                    Gửi
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}
