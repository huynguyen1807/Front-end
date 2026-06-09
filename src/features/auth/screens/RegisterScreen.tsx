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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}