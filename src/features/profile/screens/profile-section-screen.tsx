import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addAddress,
  getProfile,
  removeAddress,
  updateBiometrics,
  updateLgpdConsent,
  updateProfile,
  updateTechnicalResponsible,
  type ProfileResponse,
} from '@/features/profile/api/profile.api';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

type ProfileSection = 'dados' | 'enderecos' | 'biometria' | 'responsavel-tecnico' | 'lgpd';

const titles: Record<ProfileSection, string> = {
  dados: 'Dados cadastrais',
  enderecos: 'Enderecos',
  biometria: 'Biometria',
  'responsavel-tecnico': 'Responsavel tecnico',
  lgpd: 'LGPD',
};

export function ProfileSectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const section = normalizeSection(params.section);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState('Carregando...');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((response) => {
        if (!mounted) return;
        setProfile(response);
        setStatus('');
      })
      .catch(() => {
        if (!mounted) return;
        setStatus('Nao foi possivel carregar o perfil.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>{titles[section]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {status ? <Text style={styles.stateText}>{status}</Text> : null}
        {profile && section === 'dados' ? (
          <RegistrationForm
            profile={profile}
            onSaved={(next) => {
              setProfile(next);
              setModalMessage('Dados cadastrais atualizados.');
            }}
          />
        ) : null}
        {profile && section === 'enderecos' ? (
          <AddressManager
            profile={profile}
            onChanged={(addresses) => {
              setProfile({ ...profile, addresses });
              setModalMessage('Enderecos atualizados.');
            }}
          />
        ) : null}
        {profile && section === 'biometria' ? (
          <BiometricsPanel
            profile={profile}
            onSaved={(next) => {
              setProfile(next);
              setModalMessage('Preferencia de biometria atualizada.');
            }}
          />
        ) : null}
        {profile && section === 'responsavel-tecnico' ? (
          <TechnicalResponsibleForm
            profile={profile}
            onSaved={(next) => {
              setProfile(next);
              setModalMessage('Responsavel tecnico atualizado.');
            }}
          />
        ) : null}
        {profile && section === 'lgpd' ? (
          <LgpdPanel
            profile={profile}
            onDeleteRequest={() =>
              setModalMessage('Solicitacao registrada. A exclusao definitiva exige nova autenticacao.')
            }
            onSaved={(next) => {
              setProfile(next);
              setModalMessage('Consentimento LGPD atualizado.');
            }}
          />
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setModalMessage(null)}
        transparent
        visible={Boolean(modalMessage)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setModalMessage(null)}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Ok</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RegistrationForm({
  profile,
  onSaved,
}: {
  profile: ProfileResponse;
  onSaved: (profile: ProfileResponse) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);

  return (
    <View style={styles.panel}>
      <ReadonlyRow label="Documento" value={profile.documentMasked} />
      <ReadonlyRow label="Tipo" value={profile.profileType} />
      <Field label="Nome" onChangeText={setName} value={name} />
      <Field label="E-mail" onChangeText={setEmail} value={email} />
      <Field label="Telefone" onChangeText={setPhone} value={phone} />
      <ActionButton label="Salvar dados" onPress={() => void updateProfile({ name, email, phone }).then(onSaved)} />
    </View>
  );
}

function AddressManager({
  profile,
  onChanged,
}: {
  profile: ProfileResponse;
  onChanged: (addresses: ProfileResponse['addresses']) => void;
}) {
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  return (
    <View style={styles.panel}>
      {profile.addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <Text style={styles.cardTitle}>{address.street}</Text>
          <Text style={styles.cardSub}>{address.city}/{address.uf} - CEP {address.cep}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void removeAddress(address.id).then(onChanged)}
            style={styles.dangerButton}>
            <Text style={styles.dangerText}>Remover</Text>
          </Pressable>
        </View>
      ))}
      <Field label="CEP" onChangeText={setCep} value={cep} />
      <Field label="Endereco" onChangeText={setStreet} value={street} />
      <Field label="Cidade" onChangeText={setCity} value={city} />
      <Field label="UF" onChangeText={setUf} value={uf.toUpperCase()} />
      <ActionButton
        label="Adicionar endereco"
        onPress={() =>
          void addAddress({ cep, street, city, uf: uf.toUpperCase() }).then((addresses) => {
            setCep('');
            setStreet('');
            setCity('');
            setUf('');
            onChanged(addresses);
          })
        }
      />
    </View>
  );
}

function BiometricsPanel({
  profile,
  onSaved,
}: {
  profile: ProfileResponse;
  onSaved: (profile: ProfileResponse) => void;
}) {
  return (
    <View style={styles.panel}>
      <ToggleRow
        label="Login por biometria"
        onValueChange={(enabled) => void updateBiometrics(enabled).then(onSaved)}
        value={profile.biometricsEnabled}
      />
      <Text style={styles.helpText}>
        A ativacao usa a biometria do dispositivo e pode ser desabilitada a qualquer momento.
      </Text>
    </View>
  );
}

function TechnicalResponsibleForm({
  profile,
  onSaved,
}: {
  profile: ProfileResponse;
  onSaved: (profile: ProfileResponse) => void;
}) {
  const [cpf, setCpf] = useState('');
  const [crea, setCrea] = useState(profile.agronomistResponsible?.crea ?? '');

  return (
    <View style={styles.panel}>
      {profile.agronomistResponsible ? (
        <ReadonlyRow
          label="Responsavel atual"
          value={`${profile.agronomistResponsible.cpfMasked} - CREA ${profile.agronomistResponsible.crea}`}
        />
      ) : null}
      <Field label="CPF do agronomo" onChangeText={setCpf} value={cpf} />
      <Field label="CREA" onChangeText={setCrea} value={crea} />
      <ActionButton
        label="Salvar responsavel"
        onPress={() => void updateTechnicalResponsible({ cpf, crea }).then(onSaved)}
      />
    </View>
  );
}

function LgpdPanel({
  profile,
  onSaved,
  onDeleteRequest,
}: {
  profile: ProfileResponse;
  onSaved: (profile: ProfileResponse) => void;
  onDeleteRequest: () => void;
}) {
  return (
    <View style={styles.panel}>
      <ToggleRow
        label="Consentimento para tratamento de dados"
        onValueChange={(consent) => void updateLgpdConsent(consent).then(onSaved)}
        value={profile.lgpdConsent}
      />
      <Text style={styles.helpText}>
        O app usa dados cadastrais, enderecos e historico de pedidos para cumprir compra,
        entrega, suporte e obrigacoes legais.
      </Text>
      <Pressable accessibilityRole="button" onPress={onDeleteRequest} style={styles.dangerButton}>
        <Text style={styles.dangerText}>Solicitar exclusao da conta</Text>
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholderTextColor={Colors.text.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readonlyRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.readonlyValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={value ? Colors.surface.base : Colors.text.secondary}
        trackColor={{ false: Colors.surface.layer3, true: Colors.accent.primary }}
        value={value}
      />
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function normalizeSection(section: string | undefined): ProfileSection {
  const values: ProfileSection[] = ['dados', 'enderecos', 'biometria', 'responsavel-tecnico', 'lgpd'];
  return values.includes(section as ProfileSection) ? (section as ProfileSection) : 'dados';
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
  backButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 32,
  },
  backText: {
    color: Colors.accent.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  content: {
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.tabBarHeight + Spacing[6],
  },
  stateText: {
    color: Colors.text.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  panel: {
    gap: Spacing[3],
  },
  field: {
    gap: Spacing[1],
  },
  fieldLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
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
  readonlyRow: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
  },
  readonlyValue: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
    paddingHorizontal: Spacing[4],
  },
  primaryButtonText: {
    color: Colors.surface.base,
    fontSize: 14,
    fontWeight: '900',
  },
  addressCard: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[2],
    padding: Layout.cardPadding,
  },
  cardTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  cardSub: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  dangerButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: Colors.feedback.error,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing[3],
  },
  dangerText: {
    color: Colors.feedback.error,
    fontSize: 12,
    fontWeight: '800',
  },
  helpText: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  toggleRow: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Layout.cardPadding,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: Colors.surface.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPaddingH,
  },
  modalBox: {
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[4],
    padding: Layout.cardPaddingLg,
    width: '100%',
  },
  modalText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
});
