import { useFocusEffect } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createAdminProduct,
  getAdminMetrics,
  listAdminOrders,
  updateAdminOrderStatus,
  type AdminMetrics,
  type AdminOrder,
  type CreateAdminProductPayload,
} from '@/shared/services/api/admin-api';
import type { ProductCategory } from '@/features/catalog/data/products';
import type { OrderStatus } from '@/features/orders/data/orders';
import { BorderRadius, Colors, Layout, Spacing } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

const nextStatusByCurrent: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'SEPARANDO',
  SEPARANDO: 'ENVIADO',
  ENVIADO: 'ENTREGUE',
};

const initialProduct: CreateAdminProductPayload = {
  name: '',
  manufacturer: '',
  sku: '',
  category: 'fertilizante',
  subcategory: '',
  dosage: '',
  unit: 'sc',
  packageSize: '',
  price: 0,
  stock: 0,
  technicalSheetUrl: 'https://cdn.agroshop.local/fichas/novo-produto.pdf',
  description: '',
  application: '',
  marker: '',
};

export default function AdminDashboardRoute() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [product, setProduct] = useState<CreateAdminProductPayload>(initialProduct);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(() => {
    let mounted = true;

    setLoading(true);
    Promise.all([getAdminMetrics(), listAdminOrders()])
      .then(([metricsResponse, ordersResponse]) => {
        if (!mounted) return;
        setMetrics(metricsResponse);
        setOrders(ordersResponse);
        setMessage(null);
      })
      .catch(() => {
        if (mounted) setMessage('Faca login como administrador para acessar o dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(loadDashboard);

  async function handleCreateProduct() {
    try {
      await createAdminProduct(product);
      setProduct(initialProduct);
      setMessage('Produto cadastrado com sucesso.');
      loadDashboard();
    } catch {
      setMessage('Nao foi possivel cadastrar o produto. Verifique SKU, PMF e campos obrigatorios.');
    }
  }

  async function advanceOrder(order: AdminOrder) {
    const nextStatus = nextStatusByCurrent[order.status];
    if (!nextStatus) return;

    try {
      await updateAdminOrderStatus(order.id, nextStatus);
      setMessage(`Pedido ${order.id} atualizado para ${nextStatus}.`);
      loadDashboard();
    } catch {
      setMessage('Transicao de status nao permitida para este pedido.');
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard administrativo</Text>
        <Text style={styles.subtitle}>Metricas, cadastro de produtos e pedidos enviados.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.muted}>Carregando dashboard...</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {metrics ? (
          <View style={styles.metricGrid}>
            <Metric label="Receita" value={formatCurrency(metrics.revenue)} />
            <Metric label="Ticket medio" value={formatCurrency(metrics.averageTicket)} />
            <Metric label="Pedidos" value={String(metrics.totalOrders)} />
            <Metric label="Pendentes" value={String(metrics.pendingOrders)} />
            <Metric label="Catalogo" value={String(metrics.productsInCatalog)} />
            <Metric label="Estoque baixo" value={String(metrics.lowStockProducts)} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Novo produto</Text>
          <Field label="Nome" value={product.name} onChangeText={(value) => setProduct({ ...product, name: value })} />
          <Field label="Fabricante" value={product.manufacturer} onChangeText={(value) => setProduct({ ...product, manufacturer: value })} />
          <Field label="SKU" value={product.sku} onChangeText={(value) => setProduct({ ...product, sku: value })} />
          <View style={styles.inline}>
            <Field label="Categoria" value={product.category} onChangeText={(value) => setProduct({ ...product, category: value as ProductCategory })} />
            <Field label="Unidade" value={product.unit} onChangeText={(value) => setProduct({ ...product, unit: value })} />
          </View>
          <Field label="Subcategoria" value={product.subcategory} onChangeText={(value) => setProduct({ ...product, subcategory: value })} />
          <Field label="Embalagem" value={product.packageSize} onChangeText={(value) => setProduct({ ...product, packageSize: value })} />
          <View style={styles.inline}>
            <Field keyboardType="numeric" label="Preco" value={String(product.price)} onChangeText={(value) => setProduct({ ...product, price: Number(value) })} />
            <Field keyboardType="numeric" label="Estoque" value={String(product.stock)} onChangeText={(value) => setProduct({ ...product, stock: Number(value) })} />
          </View>
          <Field label="Dosagem" value={product.dosage} onChangeText={(value) => setProduct({ ...product, dosage: value })} />
          <Field label="Ficha tecnica URL" value={product.technicalSheetUrl} onChangeText={(value) => setProduct({ ...product, technicalSheetUrl: value })} />
          <Field label="Descricao" value={product.description} onChangeText={(value) => setProduct({ ...product, description: value })} />
          <Field label="Aplicacao" value={product.application} onChangeText={(value) => setProduct({ ...product, application: value })} />
          <Field label="Marcador" value={product.marker} onChangeText={(value) => setProduct({ ...product, marker: value })} />
          <Pressable accessibilityRole="button" onPress={handleCreateProduct} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Adicionar produto</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos enviados para a empresa</Text>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.status}>{order.status}</Text>
              </View>
              <Text style={styles.muted}>{order.deliveryAddress}</Text>
              <Text style={styles.orderItems}>
                {order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(', ')}
              </Text>
              <View style={styles.orderFooter}>
                <Text style={styles.total}>{formatCurrency(Number(order.total))}</Text>
                {nextStatusByCurrent[order.status] ? (
                  <Pressable accessibilityRole="button" onPress={() => advanceOrder(order)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Avancar status</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Field(props: ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={Colors.text.muted} style={styles.input} {...inputProps} />
    </View>
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
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  content: {
    gap: Spacing[4],
    padding: Layout.screenPaddingH,
    paddingBottom: Spacing[8],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  metricCard: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[1],
    padding: Layout.cardPadding,
    width: '48%',
  },
  metricLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  section: {
    gap: Spacing[3],
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  field: {
    flex: 1,
    gap: Spacing[1],
  },
  inline: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 11,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    minHeight: Layout.buttonHeightLg,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  orderCard: {
    backgroundColor: Colors.surface.layer1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing[2],
    padding: Layout.cardPadding,
  },
  orderTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  status: {
    color: Colors.accent.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  orderItems: {
    color: Colors.text.primary,
    fontSize: 13,
  },
  orderFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  total: {
    color: Colors.text.price,
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
    minHeight: 36,
    paddingHorizontal: Spacing[3],
  },
  secondaryButtonText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  muted: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  message: {
    color: Colors.brand.cyan,
    fontSize: 13,
    fontWeight: '800',
  },
});
