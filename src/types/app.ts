// Shared application-layer types (view models, store shapes, UI state)

import type React from 'react';
import type { AppRole, OrderPaymentStatus, PaymentMethod } from './supabase';

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  avatar_url: string | null;
}

// ── Navigation ────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  path: string;
  badge?: number;
  alert?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Cashier / Cart ───────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string | null;
}

export interface PlaceOrderPayload {
  discount_id?: string | null;
  items: Array<{ menu_item_id: string; qty: number }>;
}

// ── Orders list view model ────────────────────────────────────────────────────

export type DisplayOrderStatus = 'pending' | 'completed' | 'void';

export interface OrderRow {
  id: string;
  rowId: string;
  items: Array<{ name: string; qty: number }>;
  total: number;
  status: DisplayOrderStatus;
  paymentStatus: OrderPaymentStatus;
  payment: PaymentMethod | null;
  time: string;
  date: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationCategory = 'Inventory' | 'Orders' | 'Payments' | 'Team' | 'System';
export type NotificationType = 'warning' | 'success' | 'info' | 'danger';

export interface Notification {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  timestamp: string;
  isRead: boolean;
  action?: string;
}

// ── UI State ─────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
