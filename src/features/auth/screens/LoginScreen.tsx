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
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { loginApi, googleLoginApi } from '../services/authApi';
import { registerForPushNotifications } from '../../../services/pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import * as AuthSession from 'expo-auth-session';

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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await loginApi({ email: normalizedEmail, password });

      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));

      // Đăng ký push notification token sau khi đăng nhập (không chặn navigation)
      void registerForPushNotifications();

      if (response.user.role === 'ADMIN') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'freshfriends',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1099487569083-6lglj5h2og8nqrpk300oa5kqalp060io.apps.googleusercontent.com',
    androidClientId: '1099487569083-72uf7o9utn5gknn8ahlo7jf32kqjs4mh.apps.googleusercontent.com',
    iosClientId: '1099487569083-bi8cfkannjfjhdchpia69v0f5vs7rjhj.apps.googleusercontent.com',
    redirectUri,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLogin(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await googleLoginApi(accessToken);

      await AsyncStorage.setItem('userToken', res.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(res.user));

      // Đăng ký push notification token sau khi đăng nhập Google (không chặn navigation)
      void registerForPushNotifications();

      if (res.user.role === 'ADMIN') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } catch (err: any) {
      console.error("GOOGLE LOGIN ERROR:", err);
      setError(err.response?.data?.message || err.message || 'Đăng nhập Google thất bại');
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
          contentContainerStyle={[
            styles.content,
            Platform.OS === 'web' && styles.webContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding Header */}
          <View style={[styles.header, Platform.OS === 'web' && styles.webHeader]}>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => navigation.navigate('Landing')}
                style={styles.webBackButton}
              >
                <MaterialIcons name="arrow-back" size={18} color={colors.primary} />
                <Text style={styles.webBackButtonText}>Quay lại trang chủ</Text>
              </TouchableOpacity>
            )}
            <View style={styles.brandRow}>
              <MaterialIcons name="eco" size={36} color={colors.primary} />
              <Text style={styles.brandText}>FreshFriends</Text>
            </View>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>Đăng nhập để quản lý tủ lạnh của bạn ngay hôm nay.</Text>
          </View>

          {error ? (
            <Text style={[styles.errorText, Platform.OS === 'web' && styles.webFormWidth]}>
              {error}
            </Text>
          ) : null}

          {/* Login Form */}
          <View style={[styles.form, Platform.OS === 'web' && styles.webFormWidth]}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                isEmailFocused && styles.inputWrapperFocused
              ]}>
                <MaterialIcons name="mail" size={24} color={isEmailFocused ? colors.primary : colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.alpha(colors.onSurfaceVariant, '80')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused
              ]}>
                <MaterialIcons name="lock" size={24} color={isPasswordFocused ? colors.primary : colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.alpha(colors.onSurfaceVariant, '80')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
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
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => promptAsync()}
              disabled={loading || !request}
            >
              <GoogleIcon size={18} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={18} color={colors.onSurface} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Sign-up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Đăng ký ngay</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  webContent: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 48,
  },
  webFormWidth: {
    width: '100%',
    maxWidth: 430,
  },
  header: {
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  webHeader: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  webBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 27,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
  },
  webBackButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
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
    gap: 20,
  },
  inputContainer: {
    gap: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.onSurface,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
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
    borderRadius: 24,
    height: 48,
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
    marginTop: 32,
  },
  footerText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  registerText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
