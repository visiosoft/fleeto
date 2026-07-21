import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerLogo}>
            <Icon name="truck-outline" size={32} color={colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join Efficient Fleet Manager</Text>
        </View>

        <View style={styles.formCard}>
          <FormInput label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" required />
          <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" required />
          <FormInput label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry required />
          <FormInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm your password" secureTextEntry required />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  header: { paddingTop: spacing.xxl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'center' },
  backBtn: { position: 'absolute', top: spacing.xxl, left: spacing.lg },
  headerLogo: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.xxl, fontFamily: fonts.extraBold, color: colors.white },
  headerSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs, fontFamily: fonts.regular },
  formCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flex: 1,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { fontSize: fontSize.md, color: colors.textSecondary, fontFamily: fonts.regular },
  linkBold: { color: colors.primary, fontFamily: fonts.bold },
});

export default RegisterScreen;
