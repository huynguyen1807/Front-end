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
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { registerApi } from '../services/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName || !normalizedEmail || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    // Yêu cầu: ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await registerApi({ fullName, email: normalizedEmail, password });
      
      navigation.replace('OTPVerification', { email: normalizedEmail });
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string, 
    icon: keyof typeof MaterialIcons.glyphMap, 
    placeholder: string, 
    value: string, 
    onChangeText: (text: string) => void, 
    fieldId: string,
    secureTextEntry: boolean = false,
    showToggle: boolean = false,
    onTogglePress?: () => void,
    isShowingPassword?: boolean
  ) => {
    const isFocused = focusedField === fieldId;
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <MaterialIcons name={icon} size={22} color={isFocused ? colors.primary : colors.onSurfaceVariant} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.alpha(colors.onSurfaceVariant, '80')}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            autoCapitalize={fieldId === 'email' ? 'none' : 'words'}
            keyboardType={fieldId === 'email' ? 'email-address' : 'default'}
            onFocus={() => setFocusedField(fieldId)}
            onBlur={() => setFocusedField(null)}
          />
          {showToggle && (
            <TouchableOpacity onPress={onTogglePress} style={styles.eyeIcon}>
              <MaterialIcons 
                name={isShowingPassword ? 'visibility-off' : 'visibility'} 
                size={22} 
                color={colors.onSurfaceVariant} 
              />
            </TouchableOpacity>
          )}
        </View>
        {fieldId === 'password' && (
          <Text style={styles.hintText}>
            Mật khẩu dài ít nhất 8 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Anchor */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="eco" size={36} color={colors.onPrimary} />
            </View>
            <Text style={styles.brandTitle}>FreshFriends</Text>
            <Text style={styles.brandSubtitle}>Quản lý thực phẩm thông minh, giảm thiểu lãng phí</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Tạo tài khoản mới</Text>
              <Text style={styles.subtitle}>Bắt đầu hành trình sống xanh của bạn ngay hôm nay</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              {renderInput('Họ tên', 'person', 'Nguyễn Văn A', fullName, setFullName, 'name')}
              {renderInput('Email', 'mail', 'example@gmail.com', email, setEmail, 'email')}
              {renderInput('Mật khẩu', 'lock', '••••••••', password, setPassword, 'password', !showPassword, true, () => setShowPassword(!showPassword), showPassword)}
              {renderInput('Xác nhận mật khẩu', 'lock-reset', '••••••••', confirmPassword, setConfirmPassword, 'confirm', !showConfirmPassword, true, () => setShowConfirmPassword(!showConfirmPassword), showConfirmPassword)}

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Đăng ký</Text>
                    <MaterialIcons name="arrow-forward" size={24} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Social Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng ký bằng</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <GoogleIcon size={18} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={18} color={colors.onSurface} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{height: 40}} />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  brandSubtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Platform.OS === 'web' ? colors.surface : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden'
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    height: '100%',
  },
  hintText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginLeft: 4,
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.8,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    height: 44,
    gap: 8,
  },
  socialIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
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
});
