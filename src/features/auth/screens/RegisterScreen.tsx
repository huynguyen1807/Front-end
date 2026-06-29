<<<<<<< HEAD
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import { RegisterFormData } from "../types/auth";
import { registerStyles as styles } from "../styles/register.Styles";

type RegisterErrors = Partial<Record<keyof RegisterFormData, string>>;

const initialForm: RegisterFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen() {
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: RegisterErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    const isValid = validateForm();

    if (!isValid) return;

    Alert.alert("Success", "Register successfully!");

    console.log("Register data:", {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Sign up to start managing your food inventory and reduce waste with
            FreshFriends.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
            />

            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
            />

            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.onSurfaceVariant}
              secureTextEntry
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
            />

            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.onSurfaceVariant}
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
            />

            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
=======
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
import { MaterialIcons } from '@expo/vector-icons';

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
    if (!fullName || !email || !password || !confirmPassword) {
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
      await registerApi({ fullName, email, password });
      
      navigation.replace('OTPVerification', { email });
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
            placeholderTextColor={colors.onSurfaceVariant + '80'}
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
                <View style={[styles.socialIconPlaceholder, { backgroundColor: colors.googleBlue }]} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <MaterialIcons name="apps" size={20} color={colors.onSurface} />
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
>>>>>>> main
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
<<<<<<< HEAD
}
=======
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
>>>>>>> main
