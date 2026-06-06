/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  ShoppingCart,
  FileText,
  Package
} from 'lucide-react';


export default function DashboardView() {
  const { sales, expenses, products, categories } = useAppStore();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today calculations
  const todayRevenue = useMemo(() => {
    return sales
      .filter((s) => s.date && s.date.startsWith(todayStr))
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales, todayStr]);

  const todayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const estimatedTodayProfit = useMemo(() => {
    // Profit = sum of items' margin (sellingPrice - purchasePrice) * quantity for today's sales
    let profit = 0;
    const todaySales = sales.filter((s) => s.date && s.date.startsWith(todayStr));
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const margin = prod.sellingPrice - prod.purchasePrice;
          profit += margin * item.quantity;
        } else {
          // Fallback margin
          profit += item.totalPrice * 0.4;
        }
      });
    });
    return Number(profit.toFixed(2));
  }, [sales, products, todayStr]);

  // Overall statistics
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => !p.barcode?.startsWith('SERVICE-') && p.stock <= p.minStock);
  }, [products]);

  const stockValuations = useMemo(() => {
    let buyingVal = 0;
    let sellingVal = 0;
    products.forEach((p) => {
      if (!p.barcode?.startsWith('SERVICE-')) {
        buyingVal += p.purchasePrice * p.stock;
        sellingVal += p.sellingPrice * p.stock;
      }
    });
    return {
      purchase: Number(buyingVal.toFixed(2)),
      selling: Number(sellingVal.toFixed(2)),
      potentialProfit: Number((sellingVal - buyingVal).toFixed(2))
    };
  }, [products]);

  // KPIs statistics
  const todaySalesCount = useMemo(() => {
    return sales.filter((s) => s.date && s.date.startsWith(todayStr)).length;
  }, [sales, todayStr]);

  const totalPhysicalStock = useMemo(() => {
    return products
      .filter((p) => !p.barcode?.startsWith('SERVICE-'))
      .reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const totalProductsCount = useMemo(() => {
    return products.filter((p) => !p.barcode?.startsWith('SERVICE-')).length;
  }, [products]);



  // Export to CSV helper
  const exportToCSV = () => {
    let csv = 'Identifiant Vente,Date,Montant Total,Encaisse,Monnaie,Methode Paiement,Produits Voci\r\n';
    sales.forEach((sale) => {
      const productsStr = sale.items.map(i => `${i.productName} (x${i.quantity})`).join('|');
      csv += `${sale.saleNumber},${sale.date.split('T')[0]},${sale.total},${sale.received},${sale.change},${sale.paymentMethod},"${productsStr}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `comptabilite_recettes_gerant_pro_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter Recettes (CSV)
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Recettes du jour */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 border-l-4 border-l-emerald-500 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recettes du Jour</p>
            <h3 className="text-xl font-bold font-mono text-emerald-700 mt-1">{Math.round(todayRevenue).toLocaleString('fr-FR')} FCFA</h3>
            <p className="text-[9px] text-emerald-600/80 font-medium mt-0.5">● Encaissé aujourd'hui</p>
          </div>
        </div>

        {/* Dépenses du jour */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 border-l-4 border-l-rose-500 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dépenses du Jour</p>
            <h3 className="text-xl font-bold font-mono text-rose-700 mt-1">{Math.round(todayExpenses).toLocaleString('fr-FR')} FCFA</h3>
            <p className="text-[9px] text-rose-600/80 font-medium mt-0.5">● Charges opérationnelles</p>
          </div>
        </div>

        {/* Ventes du Jour */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 border-l-4 border-l-sky-500 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventes du Jour</p>
            <h3 className="text-xl font-bold font-mono text-sky-700 mt-1">{todaySalesCount} {todaySalesCount > 1 ? 'ventes' : 'vente'}</h3>
            <p className="text-[9px] text-sky-600/80 font-medium mt-0.5">● Enregistrées aujourd'hui</p>
          </div>
        </div>

        {/* Factures Générées */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 border-l-4 border-l-indigo-500 flex items-center gap-4 relative overflow-hidden shadow-xs">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Factures Générées</p>
            <h3 className="text-xl font-bold font-mono text-indigo-700 mt-1">{sales.length} {sales.length > 1 ? 'factures' : 'facture'}</h3>
            <p className="text-[9px] text-indigo-600/80 font-medium mt-0.5">● Total (Caisse active)</p>
          </div>
        </div>

        {/* État Général du Stock */}
        <div className={`bg-white p-5 rounded-xl border flex items-center gap-4 relative overflow-hidden transition-colors shadow-xs ${
          lowStockProducts.length > 0 
            ? 'border-amber-200 border-l-4 border-l-amber-500' 
            : 'border-slate-100 border-l-4 border-l-slate-300'
        }`}>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
          }`}>
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">État Général du Stock</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">{totalPhysicalStock.toLocaleString('fr-FR')} {totalPhysicalStock > 1 ? 'unités' : 'unité'}</h3>
            <p className={`text-[9px] mt-0.5 font-medium ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              ● {totalProductsCount} articles référencés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
