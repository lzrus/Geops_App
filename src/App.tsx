/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import CaisseView from './components/CaisseView';
import StockView from './components/StockView';
import ExpensesView from './components/ExpensesView';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const fetchData = useAppStore((state) => state.fetchData);
  const isLocked = useAppStore((state) => state.isLocked);
  const unlock = useAppStore((state) => state.unlock);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900">
      {/* Sidebar - fixed left panel */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area - padded to bypass sidebar width */}
      <main className="pl-64 min-h-screen flex flex-col">
        {/* Navigation header bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white border-b border-slate-150 px-8 select-none">
          <div className="flex items-center gap-2">
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Gérant Principal</p>
              <p className="text-[10px] text-slate-400 font-medium">Session Active</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs border border-slate-800/10">
              GP
            </div>
          </div>
        </header>

        {/* Content switch wrappers with standard container spacing */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'caisse' && <CaisseView />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'expenses' && <ExpensesView />}
        </div>

        {/* Global sticky footer */}
        <footer className="py-4 border-t border-slate-150 bg-white text-center text-[10px] font-mono text-slate-400 select-none">
        </footer>
      </main>
    </div>
  );
}
