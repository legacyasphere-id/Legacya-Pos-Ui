import {
  LayoutDashboard, ShoppingCart, ReceiptText, ChefHat,
  Package, UtensilsCrossed, BarChart3, Bell, Settings,
} from 'lucide-react';

export const navGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
      { id: 'cashier',   label: 'POS Cashier',     icon: ShoppingCart,    path: '/cashier' },
      { id: 'orders',    label: 'Orders',          icon: ReceiptText,     path: '/orders',  badge: 3 },
      { id: 'kitchen',   label: 'Kitchen Display', icon: ChefHat,         path: '/kitchen', badge: 5 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'inventory', label: 'Inventory', icon: Package,         path: '/inventory', alert: true },
      { id: 'menu',      label: 'Menu',      icon: UtensilsCrossed, path: '/menu' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3,       path: '/analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell,     path: '/notifications' },
      { id: 'settings',      label: 'Settings',      icon: Settings, path: '/settings' },
    ],
  },
];
