import {
  LayoutDashboard, ShoppingCart, ReceiptText,
  Package, Tag, BarChart3, Bell, Settings,
} from 'lucide-react';

export const navGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
      { id: 'cashier',   label: 'POS Cashier',     icon: ShoppingCart,    path: '/cashier' },
      { id: 'orders',    label: 'Orders',          icon: ReceiptText,     path: '/orders',  badge: 3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', alert: true },
      { id: 'products',  label: 'Products',  icon: Tag,     path: '/products' },
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
