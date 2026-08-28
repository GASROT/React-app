import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile, type ProfileResponse } from '@/features/profile/api/profile.api';
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
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((response) => {
        if (mounted) setProfile(response);
      })
      .catch(() => {
        if (mounted) setProfile(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AS</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{profile?.name ?? 'AgroShop Demo'}</Text>
          <Text style={styles.email}>{profile?.email ?? 'produtor@agroshop.com.br'}</Text>
          <Text style={styles.badge}>
            Perfil {profile?.profileType ?? 'PF'} {profile?.emailVerified ? 'verificado' : 'pendente'}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Conta e seguranca</Text>
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
