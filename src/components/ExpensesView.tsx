/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingDown,
  Clock,
  Euro
} from 'lucide-react';
import { Expense } from '../types';

export default function ExpensesView() {
  const { expenses, addExpense, deleteExpense } = useAppStore();

  // New Expense form states
  const [category, setCategory] = useState('Infrastructures & Factures');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  const expenseCategories = [
    'Loyer',
    'Infrastructures & Factures',
    'Fournitures de service',
    'Salaires & Commissions',
    'Achats de marchandises',
    'Autres charges'
  ];

  // Apply filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category filer
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;

      // Period filter
      let matchPeriod = true;
      const expenseTime = new Date(e.date).getTime();

      if (periodFilter === '7d') {
        const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
        matchPeriod = expenseTime >= threshold;
      } else if (periodFilter === '30d') {
        const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
        matchPeriod = expenseTime >= threshold;
      } else if (periodFilter === 'custom' && startDateStr && endDateStr) {
        const start = new Date(startDateStr).getTime();
        const end = new Date(endDateStr).getTime() + 24 * 60 * 60 * 1000; // end of that day
        matchPeriod = expenseTime >= start && expenseTime <= end;
      }

      return matchCat && matchPeriod;
    });
  }, [expenses, periodFilter, categoryFilter, startDateStr, endDateStr]);

  // Total amount computed of current filtered selection
  const totalAmountFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Overall statistics
  const currentMonthExpenses = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      alert('Veuillez renseigner un montant positif.');
      return;
    }
    if (!description.trim()) {
      alert('Veuillez décrire brièvement la cause de la dépense.');
      return;
    }

    addExpense(category, parsedAmount, description, date);

    // Reset Form
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    alert('Dépense commerciale insérée avec succès.');
  };

  const handleDeleteExpenseClick = (id: string, name: string) => {
    if (confirm(`Voulez-vous supprimer et annuler la dépense correspondante "${name}" ?`)) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dépenses & Charges</h2>
      </div>

      {/* KPI stats bar & Quick add form */}
      <div className="space-y-6">
        {/* Statistics and Quick Add Column (1 col) */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Charges (Ce mois)</p>
                <p className="text-3xl font-bold font-mono text-amber-400 mt-2">
                  {Math.round(currentMonthExpenses).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-[10px] text-slate-400 font-sans mt-1">Cumulé du mois calendaire en cours</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-amber-400">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            {/* Background design */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4">
              <Receipt className="h-28 w-28 text-white" />
            </div>
          </div>

          {/* New Expense Card Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-blue-500" />
              Enregistrer une Dépense
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Catégorie de charge</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-slate-300 py-2.5 px-3 text-xs bg-white text-slate-800 w-full focus:outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Montant décaissé (FCFA) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center font-bold text-slate-400 text-[10px]">CFA</span>
                  <input
                    type="number"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Date du paiement</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono bg-white text-slate-800"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Justification / Description *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Achat cartouche d'encre noir"
                  rows={2}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-3 text-xs rounded-lg transition-colors cursor-pointer text-center shadow"
              >
                Enregistrer la dépense
              </button>
            </form>
          </div>
        </div>

        {/* Filters and Expenses Logs and History Table (2 cols) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt className="h-5 w-5 text-blue-500" />
              Registre historique des dépenses
            </h3>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Total sélection filtrée :</span>
              <p className="text-lg font-black font-sans text-red-650">-{Math.round(totalAmountFiltered).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>

          {/* Filtering parameters banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtrer catégorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-250 py-1.5 px-2 bg-white text-xs text-slate-700 w-full"
              >
                <option value="all">Toutes dépenses</option>
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Time period selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtrer période</label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="rounded-lg border border-slate-250 py-1.5 px-2 bg-white text-xs text-slate-700 w-full"
              >
                <option value="all">Tout l'historique</option>
                <option value="7d">Les 7 derniers jours</option>
                <option value="30d">Les 30 derniers jours</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>

            {/* Dynamic Custom Date Inputs */}
            {periodFilter === 'custom' && (
              <div className="sm:col-span-2 md:col-span-1 grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-205">
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="block w-full py-0.5 px-1 text-[10px] border-none text-slate-700 outline-none"
                  title="Du"
                />
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="block w-full py-0.5 px-1 text-[10px] border-none border-l border-slate-200 text-slate-700 outline-none"
                  title="Au"
                />
              </div>
            )}
          </div>

          {/* Table display */}
          {filteredExpenses.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              Aucune dépense enregistrée sur cette sélection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Catégorie</th>
                    <th className="py-3 px-3">Description / Cause</th>
                    <th className="py-3 px-3 text-right">Montant</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(exp.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 block truncate max-w-[120px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="py-3 px-3 font-bold text-red-600 font-mono text-right whitespace-nowrap">
                        -{Math.round(exp.amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteExpenseClick(exp.id, exp.description)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
