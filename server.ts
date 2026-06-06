/**
 * Backend API Server for Gestion Boucherie Pro
 * Express server with Prisma ORM for MySQL database
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== CATEGORIES ====================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==================== PRODUCTS ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, barcode, categoryId, stock, minStock, purchasePrice, sellingPrice, provider } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        categoryId,
        stock: stock || 0,
        minStock: minStock || 5,
        purchasePrice,
        sellingPrice,
        provider
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, barcode, categoryId, stock, minStock, purchasePrice, sellingPrice, provider } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        barcode,
        categoryId,
        stock,
        minStock,
        purchasePrice,
        sellingPrice,
        provider
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== SALES ====================

// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: { items: true, session: true },
      orderBy: { createdAt: 'desc' }
    });
    // Add date field for filtering (YYYY-MM-DD format)
    const salesWithDate = sales.map(sale => ({
      ...sale,
      date: sale.createdAt.toISOString().split('T')[0]
    }));
    res.json(salesWithDate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create sale
app.post('/api/sales', async (req, res) => {
  try {
    const { total, received, change, paymentMethod, items, sessionId } = req.body;
    
    // Generate sale number
    const saleCount = await prisma.sale.count();
    const saleNumber = `VEN-${1000 + saleCount + 1}`;
    
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        total,
        received,
        change,
        paymentMethod,
        sessionId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: { items: true }
    });
    
    // Update product stocks
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (product && !product.barcode?.startsWith('SERVICE-')) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }
    
    // Add date field for consistency with GET endpoint
    const saleWithDate = {
      ...sale,
      date: sale.createdAt.toISOString().split('T')[0]
    };
    
    res.json(saleWithDate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Delete/Refund sale
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    
    if (sale) {
      // Restore product stocks
      for (const item of sale.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (product && !product.barcode?.startsWith('SERVICE-')) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }
    }
    
    await prisma.sale.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Sale refunded and deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refund sale' });
  }
});

// ==================== EXPENSES ====================

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const expense = await prisma.expense.create({
      data: { category, amount, description, date }
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ==================== STOCK ENTRIES ====================

// Get all stock entries
app.get('/api/stock-entries', async (req, res) => {
  try {
    const entries = await prisma.stockEntry.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock entries' });
  }
});

// Create stock entry
app.post('/api/stock-entries', async (req, res) => {
  try {
    const { productId, productName, quantityAdded, purchasePrice, provider } = req.body;
    
    const entry = await prisma.stockEntry.create({
      data: {
        productId,
        productName,
        quantityAdded,
        purchasePrice,
        provider
      }
    });
    
    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantityAdded } }
    });
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock entry' });
  }
});

// ==================== SESSIONS ====================

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: { sales: true },
      orderBy: { date: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session
app.post('/api/sessions', async (req, res) => {
  try {
    const { date, openingBalance } = req.body;
    const session = await prisma.session.create({
      data: {
        date,
        openingBalance
      }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Close session
app.put('/api/sessions/:id/close', async (req, res) => {
  try {
    const { closingBalance, notes } = req.body;
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        closingBalance,
        notes,
        isClosed: true,
        closedAt: new Date()
      }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close session' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
