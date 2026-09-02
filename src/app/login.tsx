import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const customerDemo = {
  email: 'cliente@agroshop.com.br',
  password: 'Cliente@12345',
};

const adminDemo = {
  email: 'admin@agroshop.com.br',
  password: 'Admin@12345',
};

export default function LoginRoute() {
  const router = useRouter();
  const [email, setEmail] = useState(adminDemo.email);
  const [password, setPassword] = useState(adminDemo.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const response = await login(email.trim(), password);
      router.replace((response.user.role === 'ADMIN' ? '/dashboard' : '/catalog') as never);
    } catch {
      setError('Nao foi possivel autenticar. Confira e-mail e senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Agro<Text style={styles.logoAccent}>Shop</Text>
        </Text>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>
          Clientes seguem para a loja. Administradores entram no painel de metricas, produtos e
          pedidos.
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="E-mail"
          onChangeText={setEmail}
          value={email}
        />
        <Field label="Senha" onChangeText={setPassword} secureTextEntry value={password} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={handleLogin}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </Pressable>

        <View style={styles.quickAccess}>
          <QuickButton
            label="Admin demo"
            onPress={() => {
              setEmail(adminDemo.email);
              setPassword(adminDemo.password);
            }}
          />
          <QuickButton
            label="Cliente demo"
            onPress={() => {
              setEmail(customerDemo.email);
              setPassword(customerDemo.password);
            }}
          />
        </View>
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

function QuickButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickButton}>
      <Text style={styles.quickButtonText}>{label}</Text>
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
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  logo: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  logoAccent: {
    color: Colors.brand.cyan,
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
  errorText: {
    color: Colors.feedback.error,
    fontSize: 13,
    fontWeight: '800',
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
  pressed: {
    opacity: 0.78,
  },
  quickAccess: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  quickButtonText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});
