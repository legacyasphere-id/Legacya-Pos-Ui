import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export default function DashboardShell() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-app text-ink antialiased"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
