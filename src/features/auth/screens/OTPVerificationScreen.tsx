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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { verifyOTPApi, resendOTPApi } from '../services/authApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await verifyOTPApi(email, otp);
      
      Alert.alert(
        "Thành công", 
        "Xác thực email thành công! Bạn đã có thể đăng nhập.",
        [{ text: "OK", onPress: () => navigation.replace('Login') }]
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');
      await resendOTPApi(email);
      Alert.alert("Thông báo", "Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi gửi lại mã');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="mark-email-read" size={36} color={colors.onPrimary} />
            </View>
            <Text style={styles.title}>Xác thực Email</Text>
            <Text style={styles.subtitle}>
              Chúng tôi vừa gửi mã gồm 6 số đến email:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mã xác nhận (OTP)</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="dialpad" size={22} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập 6 số..."
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Chưa nhận được mã? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendLink}>Gửi lại ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  backButton: { position: 'absolute', top: 24, left: 16, zIndex: 10, padding: 8 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  iconCircle: {
    width: 64, height: 64, backgroundColor: colors.primary,
    borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.onSurface },
  subtitle: { fontSize: 16, color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' },
  emailText: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  errorText: {
    color: colors.error, marginBottom: 16, textAlign: 'center',
    backgroundColor: colors.errorContainer, padding: 12, borderRadius: 8
  },
  inputContainer: { gap: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceVariant, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, height: 56
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 24, color: colors.onSurface, letterSpacing: 8, fontWeight: 'bold' },
  button: {
    backgroundColor: colors.primary, height: 54, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, alignItems: 'center' },
  resendText: { color: colors.onSurfaceVariant, fontSize: 14 },
  resendLink: { color: colors.primary, fontWeight: 'bold', fontSize: 14 }
});
