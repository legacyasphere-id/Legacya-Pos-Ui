import { create } from 'zustand';
import { allNotifications } from '../data/mockNotifications';

export const useNotificationsStore = create((set) => ({
  items: allNotifications,
  toggleRead: (id) =>
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
    })),
  dismiss: (id) =>
    set((state) => ({ items: state.items.filter((n) => n.id !== id) })),
  markAllRead: () =>
    set((state) => ({ items: state.items.map((n) => ({ ...n, isRead: true })) })),
}));
