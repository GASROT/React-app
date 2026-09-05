import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { register, type RegisterPayload } from '@/shared/services/api/auth-api';
import { getApiErrorMessage } from '@/shared/services/api/api-client';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const initialForm: RegisterPayload = {
  name: '',
  email: '',
  password: '',
  profileType: 'PF',
  document: '',
};

export default function RegisterRoute() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRegister() {
    setMessage(null);

    const document = form.document.replace(/\D/g, '');

    if (!form.name.trim()) {
      setMessage('Informe seu nome.');
      return;
    }

    if (!form.email.trim()) {
      setMessage('Informe um e-mail valido.');
      return;
    }

    if (form.password.length < 8) {
      setMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (!document) {
      setMessage(form.profileType === 'PF' ? 'Informe o CPF.' : 'Informe o CNPJ.');
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        ...form,
        email: form.email.trim(),
        document,
      });
      router.replace((response.user.role === 'ADMIN' ? '/dashboard' : '/catalog') as never);
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Cadastro de cliente para acessar perfil, pedidos e checkout.</Text>
      </View>

      <View style={styles.form}>
        <Field label="Nome" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="E-mail"
          value={form.email}
          onChangeText={(email) => setForm({ ...form, email })}
        />
        <Field
          label="Senha"
          secureTextEntry
          value={form.password}
          onChangeText={(password) => setForm({ ...form, password })}
        />

        <View style={styles.segmented}>
          <ProfileTypeButton
            active={form.profileType === 'PF'}
            label="PF"
            onPress={() => setForm({ ...form, profileType: 'PF' })}
          />
          <ProfileTypeButton
            active={form.profileType === 'PJ'}
            label="PJ"
            onPress={() => setForm({ ...form, profileType: 'PJ' })}
          />
        </View>

        <Field
          keyboardType="numeric"
          label={form.profileType === 'PF' ? 'CPF' : 'CNPJ'}
          value={form.document}
          onChangeText={(document) => setForm({ ...form, document })}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={handleRegister}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{loading ? 'Registrando...' : 'Registrar'}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/login' as never)}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Ja tenho conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={Colors.text.muted} style={styles.input} {...props} />
    </View>
  );
}

function ProfileTypeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    gap: Spacing[1],
    padding: Layout.screenPaddingH,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  form: {
    gap: Spacing[4],
    padding: Layout.screenPaddingH,
  },
  field: {
    gap: Spacing[2],
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.text.primary,
    minHeight: Layout.inputHeight,
    paddingHorizontal: Spacing[3],
  },
  segmented: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    overflow: 'hidden',
  },
  segmentButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  segmentButtonText: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentButtonTextActive: {
    color: Colors.text.inverse,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  secondaryButtonText: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
  message: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
  },
});
