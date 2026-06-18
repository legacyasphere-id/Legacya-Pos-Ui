import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardShell from './components/layout/DashboardShell';
import RequireAuth from './components/auth/RequireAuth';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CashierPage from './pages/Cashier';
import OrdersPage from './pages/Orders';
import AnalyticsPage from './pages/Analytics';
import InventoryPage from './pages/Inventory';
import MenuPage from './pages/Menu';
import NotificationsPage from './pages/Notifications';
import SettingsPage from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardShell />,
        children: [
          { path: '/dashboard',     element: <DashboardPage /> },
          { path: '/cashier',       element: <CashierPage /> },
          { path: '/orders',        element: <OrdersPage /> },
          { path: '/analytics',     element: <AnalyticsPage /> },
          { path: '/inventory',     element: <InventoryPage /> },
          { path: '/menu',          element: <MenuPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings',      element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
