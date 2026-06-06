/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  History,
  Coins,
  CheckCircle2,
  X,
  Phone,
  Copy
} from 'lucide-react';
import { Sale } from '../types';

export default function CaisseView() {
  const {
    products,
    addSale,
    sales,
    refundSale
  } = useAppStore();

  // Cash Register Form States
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantityKg, setQuantityKg] = useState<string>('1');
  const [customCart, setCustomCart] = useState<{ productId: string; name: string; quantity: number; price: number }[]>([]);
  const [receivedValInput, setReceivedValInput] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<Sale['paymentMethod']>('Espèces');

  // Search input for product autocomplete
  const [prodSearchText, setProdSearchText] = useState<string>('');
  const [showProdDropdown, setShowProdDropdown] = useState<boolean>(false);

  // Duration selection for sales records
  const [durationFilter, setDurationFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Printed Receipt
  const [printedReceipt, setPrintedReceipt] = useState<Sale | null>(null);

  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  // Solde de caisse (cumul des ventes en espèces)
  const registerBalance = useMemo(() => {
    return sales
      .filter((s) => s.paymentMethod === 'Espèces')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Autocomplete products filtered list
  const autocompleteProducts = useMemo(() => {
    if (!prodSearchText) {
      return products.slice(0, 8);
    }
    return products.filter((p) =>
      p.name.toLowerCase().includes(prodSearchText.toLowerCase()) ||
      (p.barcode && p.barcode.includes(prodSearchText))
    );
  }, [products, prodSearchText]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Auto-fill price when product is selected
  const mappedUnitPrice = useMemo(() => {
    return selectedProduct ? selectedProduct.sellingPrice : 0;
  }, [selectedProduct]);

  const temporaryLineTotal = useMemo(() => {
    const qty = parseFloat(quantityKg) || 0;
    return mappedUnitPrice * qty;
  }, [mappedUnitPrice, quantityKg]);

  // Cart Subtotal
  const cartSubtotal = useMemo(() => {
    return customCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [customCart]);

  // Calculated Change
  const calculatedChange = useMemo(() => {
    const receivedVal = parseFloat(receivedValInput) || 0;
    const diff = receivedVal - cartSubtotal;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }, [receivedValInput, cartSubtotal]);

  // Add Item to sale cart
  const handleAddItemToCart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProduct) {
      alert("Veuillez sélectionner un produit valide.");
      return;
    }
    const qty = parseFloat(quantityKg) || 0;
    if (qty <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }

    const isService = selectedProduct?.barcode && selectedProduct.barcode.startsWith('SERVICE-');
    if (!isService && qty > selectedProduct.stock) {
      alert(`Stock insuffisant. Quantité disponible : ${selectedProduct.stock} kg/unités.`);
      return;
    }

    const existingIndex = customCart.findIndex((item) => item.productId === selectedProduct.id);
    if (existingIndex > -1) {
      const updatedCart = [...customCart];
      const newQty = updatedCart[existingIndex].quantity + qty;
      if (!isService && newQty > selectedProduct.stock) {
        alert(`Le stock disponible (${selectedProduct.stock} kg) est inférieur au cumul dans le panier.`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      setCustomCart(updatedCart);
    } else {
      setCustomCart([
        ...customCart,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: qty,
          price: selectedProduct.sellingPrice
        }
      ]);
    }

    // Reset autocomplete values
    setSelectedProductId('');
    setProdSearchText('');
    setQuantityKg('1');
    setShowProdDropdown(false);
  };

  // Remove from custom cart
  const handleRemoveFromCart = (productId: string) => {
    setCustomCart(customCart.filter((item) => item.productId !== productId));
  };

  // Validate the composed sale & trigger Print Modal
  const handleValidateSale = () => {
    if (customCart.length === 0) {
      alert("Le panier est vide. Veuillez d'abord ajouter un article.");
      return;
    }

    const receivedVal = parseFloat(receivedValInput) || 0;
    if (salePaymentMethod === 'Espèces' && receivedVal < cartSubtotal) {
      alert("Le montant encaissé doit être supérieur ou égal au total à payer.");
      return;
    }

    const soldItems = customCart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const finalSale = addSale(
      soldItems,
      salePaymentMethod === 'Espèces' ? receivedVal : cartSubtotal,
      salePaymentMethod
    );

    if (finalSale) {
      setPrintedReceipt(finalSale);
      setCustomCart([]);
      setReceivedValInput('');
      setSelectedProductId('');
      setProdSearchText('');
    }
  };

  // Dynamic filter of records/transactions history
  const filteredSalesHistory = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sales.filter((s) => {
      if (!s.date) return false;
      
      const saleDate = new Date(s.date);
      const diffTime = now.getTime() - saleDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (durationFilter === 'today') {
        return s.date && s.date.startsWith(todayStr);
      } else if (durationFilter === 'week') {
        return diffDays <= 7;
      } else if (durationFilter === 'month') {
        return diffDays <= 30;
      } else {
        return true;
      }
    });
  }, [sales, durationFilter]);

  const triggerPrintReceipt = () => {
    window.print();
  };

  const copyReceiptText = () => {
    if (!printedReceipt) return;
    const itemsText = printedReceipt.items.map(it => ` - ${it.productName} : x ${it.quantity} kg | ${Math.round(it.totalPrice).toLocaleString('fr-FR')} FCFA`).join('\n');
    const text = `
LA GRANDE BOUCHERIE PRO
Marché Central - Abidjan - Côte d'Ivoire
Tél: +225 07 45 87 90 23
------------------------------------------
REÇU N° : ${printedReceipt.saleNumber}
DATE : ${new Date(printedReceipt.date).toLocaleString('fr-FR')}
PAIEMENT : ${printedReceipt.paymentMethod === 'Mobile Money' ? 'Mobile Money (Momo)' : printedReceipt.paymentMethod}
------------------------------------------
DÉSIGNATION | QTÉ | MONTANT
${itemsText}
------------------------------------------
TOTAL : ${Math.round(printedReceipt.total).toLocaleString('fr-FR')} FCFA
${printedReceipt.paymentMethod === 'Espèces' ? `REÇU : ${Math.round(printedReceipt.received).toLocaleString('fr-FR')} FCFA\nRENDU : ${Math.round(printedReceipt.change).toLocaleString('fr-FR')} FCFA` : ''}
------------------------------------------
Merci de votre confiance !
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      alert("Contenu du ticket copié dans le presse-papiers !");
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert("Contenu du ticket copié dans le presse-papiers !");
      } catch (err) {
        alert("Impossible de copier automatiquement le texte.");
      }
      document.body.removeChild(textarea);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Caisse Enregistreuse</h2>
        </div>
      </div>

      {/* Active Cash Register App */}
      <div className="space-y-6">
        {/* Availability and Stats banner (Single card showing Solde) */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-4 border-l-4 border-l-emerald-500 shadow-xs w-full max-w-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solde</p>
              <p className="text-xl font-bold text-emerald-800 font-mono mt-0.5">{Math.round(registerBalance).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* LEFT COLUMN: Fast validation & Mapped receipt creation form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-slate-605" />
                Saisie Facturation Boucherie
              </h3>
              <span className="text-[9px] font-mono bg-emerald-55 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">Prix mappés</span>
            </div>

            {/* Form elements */}
            <form onSubmit={handleAddItemToCart} className="space-y-4">
              {/* Product Search Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-605 uppercase tracking-wider mb-1 px-1">
                  Saisir le nom d'un produit (ou code-barre)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-404">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
                    placeholder="Ex: Eau Minérale, Filet de Boeuf..."
                    value={prodSearchText}
                    onFocus={() => setShowProdDropdown(true)}
                    onChange={(e) => {
                      setProdSearchText(e.target.value);
                      setShowProdDropdown(true);
                    }}
                  />
                  {prodSearchText && (
                    <button
                      type="button"
                      onClick={() => {
                        setProdSearchText('');
                        setSelectedProductId('');
                        setShowProdDropdown(false);
                      }}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Autocomplete interactive drop-list */}
                {showProdDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {autocompleteProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-xs font-medium flex items-center justify-between"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setProdSearchText(p.name);
                          setShowProdDropdown(false);
                        }}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 tracking-wider">Stock: {p.stock} kg</p>
                        </div>
                        <p className="font-mono font-bold text-slate-900 bg-slate-50 border px-2 py-0.5 rounded">
                          {p.sellingPrice.toLocaleString('fr-FR')} FCFA / kg
                        </p>
                      </button>
                    ))}
                    {autocompleteProducts.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400 uppercase">Aucun article trouvé</div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid for Quantity and Automatic unit price mapping */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Quantity in kg */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 px-1">
                    Quantité (Nombre de kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm font-mono font-bold text-slate-800 focus:border-slate-800 focus:outline-none"
                  />
                </div>

                {/* Directly Mapped Price Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                    Prix de Vente (unité/kg)
                  </label>
                  <div className="w-full rounded-lg border border-slate-100 bg-slate-50 py-2.5 px-3 text-sm font-mono font-bold text-slate-600 flex items-center justify-between">
                    <span>{mappedUnitPrice.toLocaleString('fr-FR')}</span>
                    <span>FCFA / kg</span>
                  </div>
                </div>
              </div>

              {/* Fast pricing overview */}
              {selectedProduct && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-605 flex justify-between items-center whitespace-nowrap">
                  <span>Sous-total de la ligne</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{Math.round(temporaryLineTotal).toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}

              {/* Form submit key actions */}
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Ajouter au Panier Actuel
              </button>
            </form>

            {/* Composed Draft Bill list */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs pb-2">
                <span className="font-bold text-slate-700">Panier en cours d'encaissement</span>
                {customCart.length > 0 && (
                  <button
                    onClick={() => setCustomCart([])}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Tout vider
                  </button>
                )}
              </div>

              {/* Custom list of products in Draft cart */}
              <div className="max-h-[170px] overflow-y-auto divide-y divide-slate-100 min-h-[80px] bg-slate-50/50 rounded-xl border border-slate-100 p-2 space-y-1.5">
                {customCart.map((item) => (
                  <div key={item.productId} className="py-1.5 flex items-center justify-between text-xs font-sans">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-404 font-mono">
                        {item.price.toLocaleString('fr-FR')} FCFA x {item.quantity} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-850">{Math.round(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                      <button
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {customCart.length === 0 && (
                  <div className="py-8 text-center text-slate-404 flex flex-col justify-center items-center gap-1.5">
                    <ShoppingCart className="h-6 w-6 text-slate-300" />
                    <p className="text-[11px]">Aucun article facturé pour le moment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial inputs for invoice validation */}
            {customCart.length > 0 && (
              <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-150">
                {/* Select Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-605 uppercase tracking-wider mb-2">
                    Moyen de Règlement (Modes de paiement)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Espèces', 'Momo'] as const).map((method) => {
                      const active = salePaymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setSalePaymentMethod(method);
                            if (method !== 'Espèces') {
                              setReceivedValInput(cartSubtotal.toFixed(0));
                            }
                          }}
                          className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 leading-none h-11 ${
                            active
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'Espèces' && <Coins className="h-3.5 w-3.5" />}
                          {method === 'Momo' && <Phone className="h-3.5 w-3.5" />}
                          <span>{method === 'Momo' ? 'Momo' : 'Espèces'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash collected calculator */}
                {salePaymentMethod === 'Espèces' && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-slate-200/50 items-center">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Montant Reçu (FCFA)
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={receivedValInput}
                        onChange={(e) => setReceivedValInput(e.target.value)}
                        className="block w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs font-mono font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
                        placeholder="Cumul client"
                      />
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200/80 text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rendu de Caisse</p>
                      <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                        +{Math.round(calculatedChange).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                )}

                {/* Validate single invoice */}
                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs pb-3">
                    <span className="font-extrabold text-slate-500 uppercase tracking-wider">CUMUL DU PANIER (Net TTC)</span>
                    <span className="font-black text-lg text-slate-900 font-mono">{Math.round(cartSubtotal).toLocaleString('fr-FR')} FCFA</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateSale}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3.5 rounded-xl shadow cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Valider la Vente & Imprimer le Ticket
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Daily registrations history log & duration filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <History className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Enregistrements de Caisse
                </h3>
              </div>

              {/* Duration select menu */}
              <select
                value={durationFilter}
                onChange={(e: any) => setDurationFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800 cursor-pointer"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Filtre: 7 Jours (Semaine)</option>
                <option value="month">Filtre: 30 Jours (Mois)</option>
                <option value="all">Tout l'historique</option>
              </select>
            </div>

            {/* Transactions grid */}
            {filteredSalesHistory.length === 0 ? (
              <div className="py-20 text-center text-slate-404 flex flex-col justify-center items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-slate-250" />
                <p className="text-xs">Aucune transaction enregistrée pour cette durée.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-404 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3"># Facture</th>
                      <th className="py-2.5 px-2">Instant</th>
                      <th className="py-2.5 px-2">Total Net</th>
                      <th className="py-2.5 px-2">Mode</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSalesHistory.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{sale.saleNumber}</td>
                        <td className="py-3 px-2 text-[10px] text-slate-404">
                          {new Date(sale.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-900 font-mono">{Math.round(sale.total).toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                            sale.paymentMethod === 'Espèces' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            sale.paymentMethod === 'Momo' || sale.paymentMethod === 'Mobile Money' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                            sale.paymentMethod === 'Carte' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {sale.paymentMethod === 'Mobile Money' ? 'Momo' : sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintedReceipt(sale)}
                            className="p-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded cursor-pointer transition-all"
                            title="Réimprimer ticket"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Voulez-vous annuler et rembourser la vente ${sale.saleNumber} ? Les stocks seront réajustés.`)) {
                                refundSale(sale.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded cursor-pointer transition-all"
                            title="Rembourser"
                          >
                            <X className="h-3.5 w-3.5" />
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

      {/* Modern Thermal Receipt Simulation Popup */}
      {printedReceipt && (
        <div className="receipt-modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="receipt-modal-content bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between print:shadow-none print:p-0 print:border-none print:w-full print:max-w-none print:bg-white">
            {/* Close */}
            <button
               onClick={() => setPrintedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors print:hidden"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Layout */}
            <div id="thermal-receipt" className="font-mono text-xs text-left text-slate-800 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-lg font-bold">🛒</p>
                <h4 className="font-extrabold text-sm uppercase tracking-wide">LA GRANDE BOUCHERIE PRO</h4>
                <p className="text-[10px] text-slate-500">
                  Marché Central - Abidjan - Côte d'Ivoire<br />
                  Viandes fraîches de qualité supérieure<br />
                  Tél: +225 07 45 87 90 23
                </p>
                <div className="border-b border-dashed border-slate-300 py-1" />
              </div>

              {/* Order Meta details */}
              <div className="space-y-1 text-[10px]">
                <p className="flex justify-between">
                  <span>Nº REÇU :</span>
                  <span className="font-bold">{printedReceipt.saleNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span>DATE :</span>
                  <span>{new Date(printedReceipt.date).toLocaleString('fr-FR')}</span>
                </p>
                <p className="flex justify-between">
                  <span>REGLEMENT :</span>
                  <span className="font-bold uppercase">{printedReceipt.paymentMethod === 'Mobile Money' ? 'Momo' : printedReceipt.paymentMethod}</span>
                </p>
                <div className="border-b border-dashed border-slate-300 py-1" />
              </div>

              {/* Items detail */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 font-bold text-[10px] border-b border-slate-200 pb-1">
                  <span className="col-span-6 text-left">Désignation</span>
                  <span className="col-span-2 text-center">Qté</span>
                  <span className="col-span-4 text-right">Montant</span>
                </div>

                <div className="space-y-1.5">
                  {printedReceipt?.items?.map((it) => (
                    <div key={it.id} className="grid grid-cols-12 text-[10px] leading-tight">
                      <span className="col-span-6 truncate">{it.productName}</span>
                      <span className="col-span-2 text-center">x {it.quantity} kg</span>
                      <span className="col-span-4 text-right font-bold">{Math.round(it.totalPrice).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
                <div className="border-b border-dashed border-slate-300 py-1" />
              </div>

              {/* Financial calculations */}
              <div className="space-y-1 text-xs">
                <p className="flex justify-between text-[11px]">
                  <span>TOTAL TOUT COMPRIS :</span>
                  <span className="font-extrabold text-sm">{Math.round(printedReceipt.total).toLocaleString('fr-FR')} FCFA</span>
                </p>
                {printedReceipt.paymentMethod === 'Espèces' && (
                  <>
                    <p className="flex justify-between text-[10px] text-slate-500">
                      <span>ESPECES ENCAISSEES :</span>
                      <span>{Math.round(printedReceipt.received).toLocaleString('fr-FR')} FCFA</span>
                    </p>
                    <p className="flex justify-between text-[10px] text-slate-600 border-t border-slate-100 pt-1">
                      <span>MONNAIE RENDUE :</span>
                      <span className="font-bold text-green-700">+{Math.round(printedReceipt.change).toLocaleString('fr-FR')} FCFA</span>
                    </p>
                  </>
                )}
                <div className="border-b border-dashed border-slate-300 py-1" />
              </div>

              {/* Footer */}
              <div className="text-center space-y-1 text-[9px] text-slate-500 pt-2">
                <p className="font-semibold uppercase tracking-wider">Merci de votre confiance !</p>
                <p>Les meilleurs morceaux de boucherie certifiée.</p>
              </div>
            </div>

            {/* Print Isolation / Sandbox Help message */}
            {isInIframe && (
              <div className="mt-4 bg-amber-50 border border-amber-205 text-amber-900 rounded-xl p-3 text-[10.5px] font-sans leading-relaxed space-y-1 print:hidden select-none">
                <p className="font-bold text-amber-950 flex items-center gap-1">
                  ⚠️ Limitation d'enregistrement PDF / Impression
                </p>
                <p className="text-slate-700">
                  Les navigateurs bloquent l'impression directe au sein des fenêtres d'aperçu de l'éditeur. Pour sauvegarder en PDF ou imprimer :
                </p>
                <ol className="list-decimal pl-4.5 space-y-1 mt-1 text-slate-700 font-medium">
                  <li>Cliquez sur le bouton <span className="bg-amber-100 font-bold px-1 py-0.5 rounded border border-amber-300">Ouvrir</span> (tout en haut à droite, au-dessus du visualiseur).</li>
                  <li>Une fois dans le nouvel onglet, cliquez sur <strong className="font-bold">Imprimer</strong> pour enregistrer en PDF !</li>
                  <li><em>Ou copiez le texte brut ci-dessous si besoin.</em></li>
                </ol>
              </div>
            )}

            {/* Print Trigger CTA */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5 print:hidden">
              <button
                onClick={() => setPrintedReceipt(null)}
                className="py-2 px-3 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer text-center transition-colors"
              >
                Fermer
              </button>
              
              <button
                onClick={copyReceiptText}
                className="flex-1 py-2 px-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                title="Copier le texte du ticket"
              >
                <Copy className="h-4 w-4" />
                Copier le texte
              </button>

              <button
                onClick={triggerPrintReceipt}
                className="flex-1 py-2 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimer (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
