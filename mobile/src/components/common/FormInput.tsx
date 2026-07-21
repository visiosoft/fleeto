import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

const FormInput: React.FC<Props> = ({ label, error, required, style, ...props }) => (
  <View style={styles.container}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <TextInput
      style={[styles.input, error && styles.inputError, style]}
      placeholderTextColor={colors.textLight}
      {...props}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
});

export default FormInput;
