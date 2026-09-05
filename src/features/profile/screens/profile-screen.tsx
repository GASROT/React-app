import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentUser, logout, type LoginResponse } from '@/shared/services/api/auth-api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const options = [
  ['dados', 'Dados cadastrais', 'Nome, telefone, e-mail e tipo de perfil PF/PJ'],
  ['enderecos', 'Enderecos', 'Ate 5 enderecos com preenchimento por CEP'],
  ['biometria', 'Biometria', 'Atalho de login com FaceID ou TouchID'],
  ['responsavel-tecnico', 'Responsavel tecnico', 'CPF/CREA para defensivos classe I e II'],
  ['lgpd', 'LGPD', 'Privacidade, consentimento e exclusao de conta'],
] as const;

export function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ notice?: string }>();
  const [user, setUser] = useState<LoginResponse['user'] | null>(() => getCurrentUser());
  const showCheckoutAuthNotice = !user && params.notice === 'checkout-auth-required';

  useFocusEffect(
    useCallback(() => {
      setUser(getCurrentUser());
    }, []),
  );

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name}>Acesse sua conta</Text>
            <Text style={styles.email}>
              Entre ou registre-se para ver dados cadastrais, enderecos e preferencias.
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          {showCheckoutAuthNotice ? (
            <Text
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              style={styles.authNotice}>
              Você precisa estar logado para comprar algum item.
            </Text>
          ) : null}
          <Text style={styles.panelTitle}>Conta AgroShop</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login' as never)}
            style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Entrar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/register' as never)}
            style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Registrar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'AS'}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.badge}>
            Perfil {user.profileType} {user.emailVerified ? 'verificado' : 'pendente'}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Conta e seguranca</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            logout();
            setUser(null);
          }}
          style={styles.logoutAction}>
          <Text style={styles.logoutActionText}>Sair da conta</Text>
        </Pressable>
        {options.map(([section, title, subtitle]) => (
          <Pressable
            accessibilityRole="button"
            key={section}
            onPress={() => router.push({ pathname: '/profile/[section]', params: { section } })}
            style={styles.option}>
            <View>
              <Text style={styles.optionTitle}>{title}</Text>
              <Text style={styles.optionSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    flex: 1,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  primaryActionText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.strong,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  secondaryActionText: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  logoutAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing[3],
  },
  logoutActionText: {
    color: Colors.feedback.error,
    fontSize: 12,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderBottomColor: Colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Layout.screenPaddingH,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.brand.cyanMuted,
    borderColor: Colors.brand.cyanBorder,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: Colors.brand.cyan,
    fontSize: 20,
    fontWeight: '900',
  },
  identity: {
    flex: 1,
    gap: Spacing[1],
  },
  name: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  email: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.feedback.successMuted,
    borderColor: '#4EE97B60',
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    color: Colors.feedback.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    textTransform: 'uppercase',
  },
  panel: {
    gap: Spacing[2],
    padding: Layout.screenPaddingH,
  },
  authNotice: {
    backgroundColor: Colors.feedback.warningMuted,
    borderColor: Colors.feedback.warning,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    color: Colors.feedback.warning,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    padding: Spacing[3],
  },
  panelTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: Spacing[1],
  },
  option: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    padding: Layout.cardPadding,
  },
  optionTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: Spacing[0.5],
  },
  chevron: {
    color: Colors.accent.primary,
    fontSize: 30,
  },
});
