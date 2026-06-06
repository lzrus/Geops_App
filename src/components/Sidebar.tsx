/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'caisse', label: 'Caisse / Ventes', icon: ShoppingCart },
    { id: 'stock', label: 'Stock & Articles', icon: Package },
    { id: 'expenses', label: 'Dépenses & Charges', icon: Receipt },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white border-r border-slate-100 text-slate-700">
      {/* Brand title */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100 gap-2.5">
        <TrendingUp className="h-5 w-5 text-slate-900" />
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-wide uppercase">BOUCHERIE PRO</h1>
          <p className="text-[9px] font-mono text-slate-400">Système de caisse v1.0</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-4 py-3">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconComponent className={`h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
