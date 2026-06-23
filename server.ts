/**
 * Backend API Server for GEOPS
 * Express server with Prisma ORM for MySQL database
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'geops-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// ==================== AUTH MIDDLEWARE ====================

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check user role
const checkRole = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== CATEGORIES ====================

// Get all categories
app.get('/api/categories', authenticateToken, async (req: any, res) => {
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
app.post('/api/categories', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.put('/api/categories/:id', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.delete('/api/categories/:id', authenticateToken, checkRole('admin'), async (req: any, res) => {
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
app.get('/api/products', authenticateToken, async (req: any, res) => {
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
app.post('/api/products', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.put('/api/products/:id', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.delete('/api/products/:id', authenticateToken, checkRole('admin'), async (req: any, res) => {
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
app.get('/api/sales', authenticateToken, async (req: any, res) => {
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
app.post('/api/sales', authenticateToken, async (req: any, res) => {
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
app.delete('/api/sales/:id', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.get('/api/expenses', authenticateToken, async (req: any, res) => {
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
app.post('/api/expenses', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.delete('/api/expenses/:id', authenticateToken, checkRole('admin'), async (req: any, res) => {
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
app.get('/api/stock-entries', authenticateToken, async (req: any, res) => {
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
app.post('/api/stock-entries', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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

// ==================== USERS ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, checkRole('admin'), async (req: any, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
app.post('/api/users', authenticateToken, checkRole('admin'), async (req: any, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role: role || 'user'
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, checkRole('admin'), async (req: any, res) => {
  try {
    const { fullName, role, isActive, password } = req.body;
    const updateData: any = {
      fullName,
      role,
      isActive
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, checkRole('admin'), async (req: any, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== SESSIONS ====================

// Get all sessions
app.get('/api/sessions', authenticateToken, async (req: any, res) => {
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
app.post('/api/sessions', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
app.put('/api/sessions/:id/close', authenticateToken, checkRole('admin', 'manager'), async (req: any, res) => {
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
