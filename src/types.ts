/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core types for the Multiservice Business Management Platform

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  categoryId: string;
  stock: number;
  minStock: number; // Low stock alert threshold
  purchasePrice: number; // Prix d'achat
  sellingPrice: number; // Prix de vente
  provider?: string; // Fournisseur
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: string;
  createdAt: string;
  total: number;
  received: number; // Montant reçu
  change: number; // Monnaie rendue
  items: SaleItem[];
  paymentMethod: 'Espèces' | 'Momo' | 'Carte' | 'Mobile Money' | 'Transfert';
  sessionId?: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  quantityAdded: number;
  purchasePrice: number;
  date: string;
  provider: string;
}

export interface Expense {
  id: string;
  category: string; // Ex: Loyer, Electricité, Fournitures, Salaires...
  amount: number;
  date: string;
  description: string;
}

export interface DailySession {
  id: string;
  date: string;
  openingBalance: number; // Fond de caisse initial
  closingBalance?: number; // Fond de caisse final
  expectedBalance?: number; // Fond de caisse attendu
  notes?: string;
  isClosed: boolean;
  openedAt: string;
  closedAt?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayExpenses: number;
  todayNetProfit: number;
  lowStockCount: number;
  stockValuationPurchase: number;
  stockValuationSelling: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: string;
}
