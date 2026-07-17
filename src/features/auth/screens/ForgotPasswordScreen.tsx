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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { forgotPasswordApi } from '../services/authApi';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  
  const navigation = useNavigation<any>();

  const handleForgotPassword = async () => {
    if (!email) return;
    
    try {
      setLoading(true);
      await forgotPasswordApi(email);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigation.navigate('ResetPassword', { email });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Lỗi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock-reset" size={32} color={colors.onPrimaryContainer} />
            </View>

            {/* Typography Header */}
            <View style={styles.headerText}>
              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.subtitle}>Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</Text>
            </View>

            {/* Form */}
            {!success ? (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, isEmailFocused && { color: colors.primary }]}>Email</Text>
                  <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
                    <MaterialIcons name="mail" size={24} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="example@fresh.com"
                      placeholderTextColor={colors.onSurfaceVariant + '80'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Gửi yêu cầu</Text>
                      <MaterialIcons name="send" size={20} color={colors.onPrimary} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Secondary Action */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Nhớ lại mật khẩu? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginText}>Đăng nhập ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.successMessage}>
                <MaterialIcons name="check-circle" size={48} color={colors.primary} />
                <Text style={styles.successTitle}>Yêu cầu đã gửi!</Text>
                <Text style={styles.successSubtitle}>Vui lòng kiểm tra hộp thư đến của bạn.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: colors.primaryContainer,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerText: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  form: {
    width: '100%',
    gap: 24,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.onSurface,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  loginText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successMessage: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 106, 68, 0.05)',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginTop: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
