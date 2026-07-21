import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { resetPasswordApi } from '../services/authApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = (route.params?.email || '').trim().toLowerCase();

  const handleResetPassword = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số OTP");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi({ email, otp, newPassword });
      
      Alert.alert(
        "Thành công", 
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock-reset" size={36} color={colors.onPrimary} />
            </View>
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập mã OTP đã gửi tới email {email}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mã xác nhận (OTP)</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="dialpad" size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputOtp}
                  placeholder="Nhập 6 số..."
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', padding: 8, marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 64, height: 64, backgroundColor: colors.primary,
    borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.onSurface },
  subtitle: { fontSize: 16, color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  inputContainer: { gap: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceVariant, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, height: 56
  },
  inputIcon: { marginRight: 12 },
  inputOtp: { flex: 1, fontSize: 24, color: colors.onSurface, letterSpacing: 8, fontWeight: 'bold' },
  input: { flex: 1, fontSize: 16, color: colors.onSurface },
  eyeIcon: { padding: 8 },
  button: {
    backgroundColor: colors.primary, height: 54, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 8
  },
  buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' }
});
