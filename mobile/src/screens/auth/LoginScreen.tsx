import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="truck-fast" size={40} color={colors.white} />
          </View>
          <Text style={styles.appName}>Efficient Fleet Manager</Text>
          <Text style={styles.subtitle}>Fleet Management System</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>

          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View>
            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  logoContainer: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 28, fontFamily: fonts.extraBold, color: colors.white, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.md, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs, fontFamily: fonts.regular,
  },
  formCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flex: 1,
    minHeight: 400,
  },
  formTitle: {
    fontSize: fontSize.xxl, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg, fontFamily: fonts.regular,
  },
  eyeIcon: {
    position: 'absolute', right: 12, top: 34,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: {
    color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold,
  },
  registerLink: { alignItems: 'center', marginTop: spacing.lg },
  registerText: { fontSize: fontSize.md, color: colors.textSecondary, fontFamily: fonts.regular },
  registerTextBold: { color: colors.primary, fontFamily: fonts.bold },
});

export default LoginScreen;
