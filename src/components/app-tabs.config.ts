import type { UserRole } from '@/shared/services/api/auth-api';

export type AppTabConfig = {
  nativeName: string;
  webName: string;
  href: string;
  label: string;
  icon: string;
  sf: {
    default: string;
    selected: string;
  };
  md: {
    default: string;
    selected: string;
  };
  roles?: UserRole[];
};

export const appTabs: AppTabConfig[] = [
  {
    nativeName: 'index',
    webName: 'home',
    href: '/',
    label: 'Inicio',
    icon: 'INI',
    sf: { default: 'house', selected: 'house.fill' },
    md: { default: 'home', selected: 'home_filled' },
  },
  {
    nativeName: 'catalog',
    webName: 'catalog',
    href: '/catalog',
    label: 'Catalogo',
    icon: 'CAT',
    sf: { default: 'folder', selected: 'folder.fill' },
    md: { default: 'folder', selected: 'folder' },
  },
  {
    nativeName: 'cart',
    webName: 'cart',
    href: '/cart',
    label: 'Carrinho',
    icon: 'CAR',
    sf: { default: 'cart', selected: 'cart.fill' },
    md: { default: 'shopping_cart', selected: 'shopping_cart' },
    roles: ['CUSTOMER'],
  },
  {
    nativeName: 'dashboard',
    webName: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'DASH',
    sf: { default: 'chart.bar', selected: 'chart.bar.fill' },
    md: { default: 'dashboard', selected: 'dashboard' },
    roles: ['ADMIN'],
  },
  {
    nativeName: 'orders',
    webName: 'orders',
    href: '/orders',
    label: 'Pedidos',
    icon: 'PED',
    sf: { default: 'shippingbox', selected: 'shippingbox.fill' },
    md: { default: 'inventory_2', selected: 'inventory_2' },
  },
  {
    nativeName: 'profile',
    webName: 'profile',
    href: '/profile',
    label: 'Perfil',
    icon: 'PER',
    sf: { default: 'person', selected: 'person.fill' },
    md: { default: 'person', selected: 'person' },
  },
];

export function getAppTabsForRole(role: UserRole | null | undefined) {
  const effectiveRole = role ?? 'CUSTOMER';

  return appTabs.filter((tab) => !tab.roles || tab.roles.includes(effectiveRole));
}
