import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Product } from '@/features/catalog/data/products';
import {
  useProductEdit,
  type ProductEditErrors,
} from '@/features/catalog/hooks/use-product-edit';
import type { ProductEditFormValues } from '@/features/catalog/schemas/product-edit.schema';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';

const categories: Product['category'][] = [
  'fertilizante',
  'defensivo',
  'semente',
  'irrigacao',
  'maquinario',
  'nutricao',
];
const units: Product['unit'][] = ['kg', 'L', 'sc', 'un'];
const toxicClasses = ['', 'I', 'II', 'III', 'IV'] as const;

function toFormValues(product: Product): ProductEditFormValues {
  return {
    name: product.name,
    manufacturer: product.manufacturer,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory,
    npk: product.npk ?? '',
    dosage: product.dosage,
    unit: product.unit,
    packageSize: product.packageSize,
    price: String(product.price),
    oldPrice: product.oldPrice === undefined ? '' : String(product.oldPrice),
    pmf: product.pmf === undefined ? '' : String(product.pmf),
    wholesalePrice:
      product.wholesalePrice === undefined ? '' : String(product.wholesalePrice),
    stock: String(product.stock),
    minMultiple: String(product.minMultiple ?? 1),
    mapa: product.mapa ?? '',
    toxicClass: product.toxicClass ?? '',
    requiresAgronomistCpf: Boolean(product.requiresAgronomistCpf),
    technicalSheetUrl: product.technicalSheetUrl,
    seasonalStartsAt: product.seasonalStartsAt?.slice(0, 10) ?? '',
    seasonalEndsAt: product.seasonalEndsAt?.slice(0, 10) ?? '',
    description: product.description,
    application: product.application,
    marker: product.marker,
    imageUrl: '',
  };
}

export function ProductEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { authorized, loadError, loading, product, save, saving, user } = useProductEdit(id);
  const [formState, setFormState] = useState<{
    productId: string;
    values: ProductEditFormValues;
  } | null>(null);
  const [errors, setErrors] = useState<ProductEditErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (loading || authorized) return;

    if (user && id) {
      router.replace({ pathname: '/products/[id]', params: { id } });
      return;
    }

    router.replace('/login');
  }, [authorized, id, loading, router, user]);

  const form = product
    ? formState?.productId === product.id
      ? formState.values
      : toFormValues(product)
    : null;

  function updateField(field: keyof ProductEditFormValues, value: string | boolean) {
    if (!product || !form) return;

    setFormState({ productId: product.id, values: { ...form, [field]: value } });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    if (!form || saving) return;

    setMessage(null);
    const result = await save(form);
    if (!result.ok) {
      setErrors(result.errors);
      setMessage(result.message);
      return;
    }

    setErrors({});
    router.replace({ pathname: '/products/[id]', params: { id: result.product.id } });
  }

  if (!authorized || loading || !form || !product) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <Text style={loadError ? styles.errorText : styles.mutedText}>
            {loadError ?? (authorized ? 'Carregando produto...' : 'Acesso restrito ao administrador.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentImageUrl = product.media.find((media) => media.type === 'image' && media.url)?.url;
  const previewImageUrl = form.imageUrl.trim() || currentImageUrl;
  const previewFailed = Boolean(previewImageUrl && failedPreviewUrl === previewImageUrl);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar aos detalhes" accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>Voltar</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Editar produto</Text>
          <Text numberOfLines={1} style={styles.subtitle}>SKU {product.sku}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Identificacao">
          <Field error={errors.name} label="Nome" onChangeText={(value) => updateField('name', value)} value={form.name} />
          <Field error={errors.manufacturer} label="Fabricante" onChangeText={(value) => updateField('manufacturer', value)} value={form.manufacturer} />
          <Field autoCapitalize="characters" error={errors.sku} label="SKU" onChangeText={(value) => updateField('sku', value)} value={form.sku} />
          <ChoiceField
            error={errors.category}
            label="Categoria"
            onChange={(value) => updateField('category', value)}
            options={categories}
            value={form.category}
          />
          <Field error={errors.subcategory} label="Subcategoria" onChangeText={(value) => updateField('subcategory', value)} value={form.subcategory} />
          <Field error={errors.marker} label="Marcador" onChangeText={(value) => updateField('marker', value)} value={form.marker} />
        </Section>

        <Section title="Venda e estoque">
          <View style={styles.inline}>
            <Field decimal error={errors.price} label="Preco" onChangeText={(value) => updateField('price', value)} value={form.price} />
            <Field decimal error={errors.oldPrice} label="Preco anterior" onChangeText={(value) => updateField('oldPrice', value)} value={form.oldPrice} />
          </View>
          <View style={styles.inline}>
            <Field decimal error={errors.pmf} label="PMF" onChangeText={(value) => updateField('pmf', value)} value={form.pmf} />
            <Field decimal error={errors.wholesalePrice} label="Preco atacado" onChangeText={(value) => updateField('wholesalePrice', value)} value={form.wholesalePrice} />
          </View>
          <View style={styles.inline}>
            <Field decimal error={errors.stock} label="Estoque" onChangeText={(value) => updateField('stock', value)} value={form.stock} />
            <Field decimal error={errors.minMultiple} label="Multiplo minimo" onChangeText={(value) => updateField('minMultiple', value)} value={form.minMultiple} />
          </View>
          <ChoiceField error={errors.unit} label="Unidade" onChange={(value) => updateField('unit', value)} options={units} value={form.unit} />
          <Field error={errors.packageSize} label="Embalagem" onChangeText={(value) => updateField('packageSize', value)} value={form.packageSize} />
        </Section>

        <Section title="Informacoes tecnicas">
          <Field error={errors.npk} label="NPK (opcional)" onChangeText={(value) => updateField('npk', value)} value={form.npk} />
          <Field error={errors.dosage} label="Dosagem" onChangeText={(value) => updateField('dosage', value)} value={form.dosage} />
          <Field error={errors.mapa} label="Registro MAPA (opcional)" onChangeText={(value) => updateField('mapa', value)} value={form.mapa} />
          <ChoiceField
            error={errors.toxicClass}
            label="Classe toxicologica"
            onChange={(value) => updateField('toxicClass', value)}
            options={toxicClasses}
            renderOption={(value) => value || 'Nenhuma'}
            value={form.toxicClass}
          />
          <Pressable
            accessibilityLabel="Exigir responsavel agronomo"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.requiresAgronomistCpf }}
            onPress={() => updateField('requiresAgronomistCpf', !form.requiresAgronomistCpf)}
            style={[styles.checkbox, form.requiresAgronomistCpf && styles.checkboxChecked]}>
            <Text style={styles.checkboxText}>{form.requiresAgronomistCpf ? 'Selecionado' : 'Selecionar'}: exigir responsavel agronomo</Text>
          </Pressable>
          {errors.requiresAgronomistCpf ? <Text style={styles.fieldError}>{errors.requiresAgronomistCpf}</Text> : null}
          <Field error={errors.technicalSheetUrl} label="URL da ficha tecnica" onChangeText={(value) => updateField('technicalSheetUrl', value)} value={form.technicalSheetUrl} />
          <Field error={errors.seasonalStartsAt} label="Inicio sazonal (AAAA-MM-DD)" onChangeText={(value) => updateField('seasonalStartsAt', value)} value={form.seasonalStartsAt} />
          <Field error={errors.seasonalEndsAt} label="Fim sazonal (AAAA-MM-DD)" onChangeText={(value) => updateField('seasonalEndsAt', value)} value={form.seasonalEndsAt} />
        </Section>

        <Section title="Conteudo e imagem">
          <Field error={errors.description} label="Descricao" multiline onChangeText={(value) => updateField('description', value)} value={form.description} />
          <Field error={errors.application} label="Aplicacao" multiline onChangeText={(value) => updateField('application', value)} value={form.application} />
          {previewImageUrl && !previewFailed ? (
            <Image
              accessibilityLabel={`Pre-visualizacao da imagem de ${product.name}`}
              cachePolicy="memory-disk"
              contentFit="contain"
              onError={() => setFailedPreviewUrl(previewImageUrl)}
              source={{ uri: previewImageUrl }}
              style={styles.imagePreview}
              transition={150}
            />
          ) : null}
          {previewFailed ? (
            <Text style={styles.previewError}>
              Nao foi possivel carregar esta imagem. Verifique se a URL e publica e aponta
              diretamente para um arquivo de imagem.
            </Text>
          ) : null}
          {currentImageUrl ? <Text style={styles.currentImage}>Imagem atual: {currentImageUrl}</Text> : <Text style={styles.mutedText}>O produto ainda nao possui URL de imagem.</Text>}
          <Field
            autoCapitalize="none"
            error={errors.imageUrl}
            keyboardType="url"
            label="Nova URL de imagem (opcional)"
            onChangeText={(value) => updateField('imageUrl', value)}
            placeholder="https://exemplo.com/produto.jpg"
            value={form.imageUrl}
          />
          <Text style={styles.hint}>Deixe em branco para manter a imagem atual.</Text>
        </Section>

        {message ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{message}</Text> : null}

        <Pressable
          accessibilityLabel="Salvar alteracoes do produto"
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => void handleSave()}
          style={[styles.saveButton, saving && styles.disabled]}>
          <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar alteracoes'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Field({ decimal, error, label, multiline, ...props }: ComponentProps<typeof TextInput> & { decimal?: boolean; error?: string; label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={decimal ? 'decimal-pad' : props.keyboardType}
        multiline={multiline}
        placeholderTextColor={Colors.text.muted}
        style={[styles.input, multiline && styles.textArea, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ChoiceField<T extends string>({ error, label, onChange, options, renderOption, value }: { error?: string; label: string; onChange: (value: T) => void; options: readonly T[]; renderOption?: (value: T) => string; value: T }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: value === option }}
            key={option || 'empty'}
            onPress={() => onChange(option)}
            style={[styles.choice, value === option && styles.choiceSelected]}>
            <Text style={[styles.choiceText, value === option && styles.choiceTextSelected]}>{renderOption?.(option) ?? option}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface.base, flex: 1 },
  stateContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Layout.screenPaddingH },
  header: { alignItems: 'center', backgroundColor: Colors.surface.layer2, borderBottomColor: Colors.border.subtle, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing[3], minHeight: Layout.headerHeight, paddingHorizontal: Layout.screenPaddingH },
  back: { color: Colors.accent.primary, fontSize: 14, fontWeight: '900' },
  headerText: { flex: 1 },
  title: { color: Colors.text.primary, fontSize: 18, fontWeight: '900' },
  subtitle: { color: Colors.text.secondary, fontSize: 11 },
  content: { gap: Spacing[4], padding: Layout.screenPaddingH, paddingBottom: Spacing[10] },
  section: { backgroundColor: Colors.surface.layer1, borderColor: Colors.border.default, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing[3], padding: Layout.cardPadding },
  sectionTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '900' },
  inline: { flexDirection: 'row', gap: Spacing[2] },
  field: { flex: 1, gap: Spacing[1] },
  label: { color: Colors.text.secondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface.layer2, borderColor: Colors.border.default, borderRadius: BorderRadius.sm, borderWidth: 1, color: Colors.text.primary, minHeight: Layout.inputHeight, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.feedback.error },
  fieldError: { color: Colors.feedback.error, fontSize: 11 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  choice: { alignItems: 'center', backgroundColor: Colors.surface.layer2, borderColor: Colors.border.default, borderRadius: BorderRadius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing[3] },
  choiceSelected: { backgroundColor: Colors.accent.primaryMuted, borderColor: Colors.accent.primary },
  choiceText: { color: Colors.text.secondary, fontSize: 12, fontWeight: '800' },
  choiceTextSelected: { color: Colors.accent.primary },
  checkbox: { backgroundColor: Colors.surface.layer2, borderColor: Colors.border.default, borderRadius: BorderRadius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing[3] },
  checkboxChecked: { backgroundColor: Colors.accent.primaryMuted, borderColor: Colors.accent.primary },
  checkboxText: { color: Colors.text.primary, fontSize: 12, fontWeight: '800' },
  currentImage: { color: Colors.accent.primary, fontSize: 11, lineHeight: 17 },
  imagePreview: { backgroundColor: Colors.surface.layer2, borderRadius: BorderRadius.md, height: 220, width: '100%' },
  previewError: { color: Colors.feedback.error, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  hint: { color: Colors.text.muted, fontSize: 11 },
  mutedText: { color: Colors.text.muted, fontSize: 13, textAlign: 'center' },
  errorText: { color: Colors.feedback.error, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  saveButton: { alignItems: 'center', backgroundColor: Colors.accent.primary, borderRadius: BorderRadius.sm, justifyContent: 'center', minHeight: Layout.buttonHeightLg },
  saveButtonText: { color: Colors.text.inverse, fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.55 },
});
