/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Category, Product, Sale, SaleItem, StockEntry, Expense, DailySession } from '../types';
import * as api from '../services/api';

interface AppState {
  categories: Category[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockEntries: StockEntry[];
  sessions: DailySession[];
  passwordHash: string;
  isLocked: boolean;
  currentSessionId: string | null;
  isLoading: boolean;

  // Data fetching
  fetchData: () => Promise<void>;

  // Categories CRUD
  addCategory: (name: string, description?: string) => Promise<void>;
  updateCategory: (id: string, name: string, description?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Products CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Sales CRUD
  addSale: (items: { productId: string; quantity: number }[], received: number, paymentMethod: Sale['paymentMethod']) => Promise<Sale | null>;
  refundSale: (id: string) => Promise<void>;

  // Expenses CRUD
  addExpense: (category: string, amount: number, description: string, date: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Stock Entries CRUD
  addStockEntry: (productId: string, quantity: number, purchasePrice: number, provider: string) => Promise<void>;

  // Daily Sessions Management
  openSession: (openingBalance: number) => Promise<void>;
  closeSession: (closingBalance: number, notes?: string) => Promise<void>;

  // Auth / Security
  unlock: (password: string) => boolean;
  lock: () => void;
  changePassword: (oldP: string, newP: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  categories: [],
  products: [],
  sales: [],
  expenses: [],
  stockEntries: [],
  sessions: [],
  passwordHash: 'admin',
  isLocked: true,
  currentSessionId: null,
  isLoading: false,

  // Fetch all data from API
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [categories, products, sales, expenses, stockEntries, sessions] = await Promise.all([
        api.categoriesAPI.getAll(),
        api.productsAPI.getAll(),
        api.salesAPI.getAll(),
        api.expensesAPI.getAll(),
        api.stockEntriesAPI.getAll(),
        api.sessionsAPI.getAll(),
      ]);

      const activeSessionId = sessions.find((s: any) => !s.isClosed)?.id || null;

      set({
        categories,
        products,
        sales,
        expenses,
        stockEntries,
        sessions,
        currentSessionId: activeSessionId,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      set({ isLoading: false });
    }
  },

  // Categories CRUD
  addCategory: async (name, description) => {
    try {
      const newCategory = await api.categoriesAPI.create({ name, description });
      set((state) => ({ categories: [...state.categories, newCategory] }));
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  },

  updateCategory: async (id, name, description) => {
    try {
      const updatedCategory = await api.categoriesAPI.update(id, { name, description });
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updatedCategory : c)),
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.categoriesAPI.delete(id);
      set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  },

  // Products CRUD
  addProduct: async (newProd) => {
    try {
      const formattedProd = await api.productsAPI.create(newProd);
      set((state) => ({ products: [...state.products, formattedProd] }));
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const updatedProduct = await api.productsAPI.update(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.productsAPI.delete(id);
      set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  },

  // Sales Process
  addSale: async (itemsToSell, received, paymentMethod) => {
    const { products } = get();

    const basketItems: SaleItem[] = [];
    let totalAmount = 0;

    // Formulate lines
    for (const item of itemsToSell) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const qty = item.quantity;
        const lineTotal = Number((prod.sellingPrice * qty).toFixed(2));
        totalAmount += lineTotal;

        basketItems.push({
          id: `li-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.sellingPrice,
          totalPrice: lineTotal,
        });
      }
    }

    const changeDue = Number((received - totalAmount).toFixed(2));

    try {
      const newSale = await api.salesAPI.create({
        total: Number(totalAmount.toFixed(2)),
        received,
        change: changeDue < 0 ? 0 : changeDue,
        paymentMethod,
        items: basketItems,
      });

      // Refresh sales from API to get latest data
      const updatedSales = await api.salesAPI.getAll();
      set((state) => ({
        sales: updatedSales,
      }));

      // Refresh products to get updated stock
      const updatedProducts = await api.productsAPI.getAll();
      set({ products: updatedProducts });

      return newSale;
    } catch (error) {
      console.error('Failed to create sale:', error);
      return null;
    }
  },

  refundSale: async (id) => {
    try {
      await api.salesAPI.delete(id);
      set((state) => ({ sales: state.sales.filter((s) => s.id !== id) }));

      // Refresh products to get restored stock
      const updatedProducts = await api.productsAPI.getAll();
      set({ products: updatedProducts });
    } catch (error) {
      console.error('Failed to refund sale:', error);
    }
  },

  // Expenses CRUD
  addExpense: async (category, amount, description, date) => {
    try {
      const newExp = await api.expensesAPI.create({ category, amount, description, date });
      set((state) => ({ expenses: [newExp, ...state.expenses] }));
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  },

  deleteExpense: async (id) => {
    try {
      await api.expensesAPI.delete(id);
      set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  },

  // Stock entries
  addStockEntry: async (productId, quantity, purchasePrice, provider) => {
    const { products } = get();
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const entry = await api.stockEntriesAPI.create({
        productId,
        productName: product.name,
        quantityAdded: quantity,
        purchasePrice,
        provider,
      });

      set((state) => ({
        stockEntries: [entry, ...state.stockEntries],
      }));

      // Refresh products to get updated stock
      const updatedProducts = await api.productsAPI.getAll();
      set({ products: updatedProducts });
    } catch (error) {
      console.error('Failed to add stock entry:', error);
    }
  },

  // Shift Cash Sessions
  openSession: async (openingBalance) => {
    const todayString = new Date().toISOString().split('T')[0];
    try {
      const newSession = await api.sessionsAPI.create({
        date: todayString,
        openingBalance,
      });

      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSessionId: newSession.id,
      }));
    } catch (error) {
      console.error('Failed to open session:', error);
    }
  },

  closeSession: async (closingBalance, notes) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    try {
      const updatedSession = await api.sessionsAPI.close(currentSessionId, {
        closingBalance,
        notes,
      });

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === currentSessionId ? updatedSession : s)),
        currentSessionId: null,
      }));
    } catch (error) {
      console.error('Failed to close session:', error);
    }
  },

  // Auth actions
  unlock: (password) => {
    const { passwordHash } = get();
    if (password === passwordHash) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  lock: () => {
    set({ isLocked: true });
  },

  changePassword: (oldP, newP) => {
    const { passwordHash } = get();
    if (oldP === passwordHash) {
      set({ passwordHash: newP });
      return true;
    }
    return false;
  },
}));
