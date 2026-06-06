/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  TrendingUp,
  Search,
  Check,
  X,
  FileDown,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { Product, Category } from '../types';

export default function StockView() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    addStockEntry
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'restock' | 'categories'>('articles');

  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('all');

  // Modes
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // -- Forms states --
  // New Product
  const [newProdName, setNewProdName] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState('5');
  const [newProdInitialStock, setNewProdInitialStock] = useState('10');
  const [newProdProvider, setNewProdProvider] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Edit Product
  const [editName, setEditName] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editProvider, setEditProvider] = useState('');

  // New Category
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New Restock entry
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockPurchasePrice, setRestockPurchasePrice] = useState('');
  const [restockProvider, setRestockProvider] = useState('');

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchesCategory = categoryIdFilter === 'all' || p.categoryId === categoryIdFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryIdFilter]);

  // -- Handlers --
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdCategoryId) {
      alert('Veuillez associer une catégorie pour cette référence d\'article.');
      return;
    }

    const initialStock = parseInt(newProdInitialStock) || 0;

    addProduct({
      name: newProdName,
      barcode: newProdBarcode || undefined,
      categoryId: newProdCategoryId,
      stock: initialStock,
      minStock: parseInt(newProdMinStock) || 5,
      purchasePrice: parseFloat(newProdPurchasePrice) || 0,
      sellingPrice: parseFloat(newProdSellingPrice) || 0,
      provider: newProdProvider || undefined,
    });

    // Reset fields
    setNewProdName('');
    setNewProdBarcode('');
    setNewProdPurchasePrice('');
    setNewProdSellingPrice('');
    setNewProdMinStock('5');
    setNewProdInitialStock('10');
    setNewProdProvider('');
    setShowAddProductModal(false);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditName(prod.name);
    setEditBarcode(prod.barcode || '');
    setEditCategoryId(prod.categoryId);
    setEditPurchasePrice(prod.purchasePrice.toString());
    setEditSellingPrice(prod.sellingPrice.toString());
    setEditMinStock(prod.minStock.toString());
    setEditStock(prod.stock.toString());
    setEditProvider(prod.provider || '');
  };

  const handleUpdateProductSubmit = (id: string) => {
    updateProduct(id, {
      name: editName,
      barcode: editBarcode || undefined,
      categoryId: editCategoryId,
      purchasePrice: parseFloat(editPurchasePrice) || 0,
      sellingPrice: parseFloat(editSellingPrice) || 0,
      minStock: parseInt(editMinStock) || 0,
      stock: parseInt(editStock) || 0,
      provider: editProvider || undefined,
    });
    setEditingProductId(null);
  };

  const handleDeleteProductClick = (id: string, name: string) => {
    if (confirm(`Êtes-vous certain de vouloir archiver et supprimer définitivement l'article "${name}" ?`)) {
      deleteProduct(id);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory(newCatName, newCatDesc || undefined);
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleDeleteCategoryClick = (id: string, name: string) => {
    // Check if category has items
    const hasItems = products.some((p) => p.categoryId === id);
    if (hasItems) {
      alert("Cette catégorie contient des produits associés. Veuillez les réassigner avant de la supprimer.");
      return;
    }

    if (confirm(`Confirmer la suppression définitive de la catégorie "${name}" ?`)) {
      deleteCategory(id);
    }
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductId) {
      alert('Veuillez sélectionner un produit à commander.');
      return;
    }

    const qty = parseInt(restockQty) || 0;
    const price = parseFloat(restockPurchasePrice) || 0;
    if (qty <= 0) {
      alert('Veuillez saisir une quantité supérieure à 0.');
      return;
    }

    addStockEntry(restockProductId, qty, price, restockProvider);
    alert('Le réapprovisionnement a été enregistré. Le stock a été incrémenté !');

    // Reset fields
    setRestockProductId('');
    setRestockQty('');
    setRestockPurchasePrice('');
    setRestockProvider('');
  };

  // Pre-fill restock purchase price when selecting a product
  const handleRestockProductChange = (id: string) => {
    setRestockProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setRestockPurchasePrice(prod.purchasePrice.toString());
      setRestockProvider(prod.provider || '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab bar header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Stocks</h2>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activeSubTab === 'articles' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="h-3.5 w-3.5 inline mr-1" />
            Articles
          </button>
          <button
            onClick={() => setActiveSubTab('restock')}
            className={`text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activeSubTab === 'restock' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 inline mr-1" />
            Approvisionner (Réappro)
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all ${
              activeSubTab === 'categories' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5 inline mr-1" />
            Catégories
          </button>
        </div>
      </div>

      {/* --- TAB 1: ARTICLES DATATABLE --- */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-3xs">
            {/* Left filter options */}
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par référence, code-barre..."
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={categoryIdFilter}
                onChange={(e) => setCategoryIdFilter(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white text-slate-700 font-sans focus:outline-none"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CTA Add Product */}
            <button
              onClick={() => setShowAddProductModal(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-slate-800/10"
            >
              <Plus className="h-4 w-4" />
              Créer un Article
            </button>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Désignation de l'Article</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Prix Achat HT</th>
                    <th className="py-3 px-4">Prix Vente TTC</th>
                    <th className="py-3 px-4 text-center">Niveau de Stock</th>
                    <th className="py-3 px-4">Fournisseur</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.map((p) => {
                    const isEditing = editingProductId === p.id;
                    const isService = p.barcode?.startsWith('SERVICE-');
                    const isLow = !isService && p.stock <= p.minStock;

                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${isLow ? 'bg-amber-50/20' : ''}`}>
                        {/* Title & barcode block */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="block w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editBarcode}
                                placeholder="Code-barre ou identifiant de service"
                                onChange={(e) => setEditBarcode(e.target.value)}
                                className="block w-full rounded border border-slate-300 px-2 py-1 text-[10px] text-slate-400 focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                              {p.barcode && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 select-all">
                                  Cod: {p.barcode}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category badge */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              value={editCategoryId}
                              onChange={(e) => setEditCategoryId(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs bg-white text-slate-700"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {categories.find((c) => c.id === p.categoryId)?.name || 'Inconnu'}
                            </span>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              step="1"
                              value={editPurchasePrice}
                              onChange={(e) => setEditPurchasePrice(e.target.value)}
                              className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800"
                            />
                          ) : (
                            <span className="text-slate-500">{Math.round(p.purchasePrice).toLocaleString('fr-FR')} FCFA</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              step="1"
                              value={editSellingPrice}
                              onChange={(e) => setEditSellingPrice(e.target.value)}
                              className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-850"
                            />
                          ) : (
                            <span>{Math.round(p.sellingPrice).toLocaleString('fr-FR')} FCFA</span>
                          )}
                        </td>

                        {/* Stock Balance level */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              disabled={isService}
                              value={isService ? '99999' : editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-16 rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-800 text-center"
                            />
                          ) : isService ? (
                            <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">Service</span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs border ${
                                p.stock === 0
                                  ? 'bg-slate-50 text-red-600 border-red-200'
                                  : isLow
                                  ? 'bg-slate-50 text-amber-700 border-amber-250'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                {p.stock}
                              </span>
                              {isLow && (
                                <span className="text-[9px] text-slate-500 font-bold mt-1 flex items-center gap-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5 text-amber-650" /> Seuil {p.minStock}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-4 text-slate-500">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editProvider}
                              onChange={(e) => setEditProvider(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-800"
                            />
                          ) : (
                            <span>{p.provider || 'Non désigné'}</span>
                          )}
                        </td>

                        {/* Column CTA buttons */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleUpdateProductSubmit(p.id)}
                                className="p-1 px-1.5 bg-green-500 text-white rounded cursor-pointer transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="p-1 px-1.5 bg-slate-500 text-white rounded cursor-pointer transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1 bg-transparent opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 hover:bg-slate-200/80 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProductClick(p.id, p.name)}
                                className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-650 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: STOCK REPLENISHMENT ORDERS --- */}
      {activeSubTab === 'restock' && (
        <div className="grid gap-6 max-w-4xl mx-auto md:grid-cols-12 items-start">
          {/* New replenishment form column (5 cols) */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-blue-500" />
              Saisir un Arrivage / Réappro
            </h3>
            <p className="text-xs text-slate-400">
              Incrémentez la quantité physique en stock de vos articles électroniques et alimentaires de manière transparente.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              {/* Product */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Désignation du produit</label>
                <select
                  required
                  value={restockProductId}
                  onChange={(e) => handleRestockProductChange(e.target.value)}
                  className="rounded-lg border border-slate-300 py-2.5 px-3 text-xs bg-white text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choisissez l'article --</option>
                  {products
                    .filter((p) => !p.barcode?.startsWith('SERVICE-'))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Dispo: {p.stock})
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity Added */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Quantité additionnelle</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Ex: 50"
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono"
                />
              </div>

              {/* New Purchase Unit Cost */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Prix d'achat unitaire d'acquisition HT (FCFA)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-[10px]">CFA</span>
                  <input
                    type="number"
                    step="1"
                    required
                    value={restockPurchasePrice}
                    onChange={(e) => setRestockPurchasePrice(e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-slate-300 py-2 pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Supplier */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Fournisseur d'approvisionnement</label>
                <input
                  type="text"
                  value={restockProvider}
                  onChange={(e) => setRestockProvider(e.target.value)}
                  placeholder="Ex: Grossiste Bureau SARL"
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 text-xs rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                Valider l'entrée de Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 3: CATEGORIES --- */}
      {activeSubTab === 'categories' && (
        <div className="grid gap-6 md:grid-cols-5 max-w-5xl mx-auto">
          {/* Create category card (2 cols) */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <FolderPlus className="h-4.5 w-4.5 text-emerald-600" />
              Nouvelle Catégorie
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Nom de la catégorie</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Boissons & Cafétéria"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-xs"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-600 block">Brève description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Ex: Sodas frais, cafés expresso..."
                  rows={3}
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 text-xs rounded-lg transition-colors cursor-pointer text-center"
              >
                Créer la Catégorie locales
              </button>
            </form>
          </div>

          {/* Category listings card (3 cols) */}
          <div className="md:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">
              Catégories enregistrées dans la base ({categories.length})
            </h3>

            <div className="divide-y divide-slate-100 font-medium">
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.description && <p className="text-[10px] text-slate-400 mt-0.5">{c.description}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">
                        {count} articles
                      </span>
                      <button
                        onClick={() => handleDeleteCategoryClick(c.id, c.name)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT PANEL SLIDE OVER/ MODAL (Simulated beautifully) */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-105 rounded-full"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 pb-3">
              <Package className="h-5 w-5 text-blue-500" />
              Création d'un Article dans l'inventaire
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-600">Désignation de l'article *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ex: Rame Papier A4 80g"
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
                />
              </div>

              {/* Barcode & Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Code-barre (Optionnel)</label>
                  <input
                    type="text"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="Ex: 5449000131805"
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Laisser vide ou saisir SERVICE- pour services</span>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Catégorie d'association *</label>
                  <select
                    required
                    value={newProdCategoryId}
                    onChange={(e) => setNewProdCategoryId(e.target.value)}
                    className="rounded-lg border border-slate-300 py-2.5 px-3 text-xs bg-white text-slate-800 w-full"
                  >
                    <option value="">-- Choisissez --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cost & Sell price */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-50 pt-2">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Prix d'Achat unitaire (FCFA)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-[10px]">CFA</span>
                    <input
                      type="number"
                      step="1"
                      required
                      value={newProdPurchasePrice}
                      onChange={(e) => setNewProdPurchasePrice(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 pl-9 text-xs font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Prix de Vente unitaire (FCFA) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-[10px]">CFA</span>
                    <input
                      type="number"
                      step="1"
                      required
                      value={newProdSellingPrice}
                      onChange={(e) => setNewProdSellingPrice(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2 pl-9 text-xs font-mono"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Initial units and crit thresholds */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Stock initial disponible</label>
                  <input
                    type="number"
                    required
                    value={newProdInitialStock}
                    onChange={(e) => setNewProdInitialStock(e.target.value)}
                    placeholder="10"
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-600">Seuil d'alerte critique</label>
                  <input
                    type="number"
                    required
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Provider */}
              <div className="space-y-1 text-left border-t border-slate-50 pt-2">
                <label className="text-xs font-bold text-slate-600">Fournisseur d'approvisionnement défaut</label>
                <input
                  type="text"
                  value={newProdProvider}
                  onChange={(e) => setNewProdProvider(e.target.value)}
                  placeholder="Ex: Sodireg Grossiste"
                  className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer text-center"
                >
                  Enregistrer l'article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
