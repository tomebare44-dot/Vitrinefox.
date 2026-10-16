import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Diretórios de persistência de dados e uploads
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vitrinefox_db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ============================================================================
// CONFIGURAÇÃO DE SEGURANÇA E SENHA DO PROPRIETÁRIO
// ============================================================================
// A senha inicial solicitada pelo proprietário é "felipe123!".
// Armazenamos o hash criptográfico seguro (SHA-256 + Salt fixo de servidor).
// NUNCA expomos a senha em variáveis de frontend ou código cliente.
const SERVER_SALT = process.env.ADMIN_SALT || 'vitrinefox_secure_salt_2026';
function hashPassword(pass: string): string {
  return crypto.createHmac('sha256', SERVER_SALT).update(pass).digest('hex');
}

// Hash da senha inicial "felipe123!"
const INITIAL_ADMIN_HASH = hashPassword('felipe123!');

// Controle de tentativas de login (Rate Limiting contra ataques de força bruta)
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

// Armazenamento em memória das sessões ativas com expiração (12 horas)
interface SessionData {
  token: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, SessionData>();

// ============================================================================
// BANCO DE DADOS LOCAL PERSISTENTE (JSON ATÔMICO)
// ============================================================================
interface DatabaseSchema {
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    image_path?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    previous_price?: number | null;
    category_id: string;
    stock: number;
    image_path: string;
    affiliate_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  click_events: Array<{
    id: string;
    product_id: string;
    product_name?: string;
    event_type: 'shopee_click' | 'shopee_redirect' | 'view_product';
    metadata?: Record<string, unknown>;
    created_at: string;
  }>;
  orders: Array<{
    id: string;
    customer_name?: string;
    source: 'shopee_manual' | 'manual_admin' | 'external_import';
    status: 'pending' | 'completed' | 'cancelled';
    total_amount: number;
    commission_earned?: number;
    notes?: string;
    created_at: string;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }>;
  }>;
  admin_config: {
    password_hash: string;
    updated_at: string;
  };
}

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-eletronicos',
    name: 'Eletrônicos & Acessórios',
    description: 'Gadgets, fones de ouvido, carregadores e cabos',
    image_path: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-casa',
    name: 'Casa & Decoração',
    description: 'Organizadores, iluminação e utilidades práticas',
    image_path: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-moda',
    name: 'Moda & Estilo',
    description: 'Roupas, relógios, bolsas e acessórios elegantes',
    image_path: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-beleza',
    name: 'Beleza & Cuidados',
    description: 'Skincare, organizadores de maquiagem e autocuidado',
    image_path: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Erro ao ler vitrinefox_db.json, recriando:', err);
  }

  // Inicializa sem produtos (conforme solicitado pelo dono: "Não exiba produtos de demonstração quando o banco estiver vazio")
  const initialDb: DatabaseSchema = {
    categories: DEFAULT_CATEGORIES,
    products: [],
    click_events: [],
    orders: [],
    admin_config: {
      password_hash: INITIAL_ADMIN_HASH,
      updated_at: new Date().toISOString(),
    },
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Falha ao gravar banco de dados:', err);
  }
}

// ============================================================================
// MIDDLEWARES DE AUTENTICAÇÃO E SEGURANÇA
// ============================================================================
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso não autorizado. Sessão administrativa necessária.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Sessão administrativa inválida ou expirada.' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'Sessão administrativa expirada. Faça login novamente.' });
    return;
  }

  next();
}

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR EXPRESS + VITE
// ============================================================================
async function bootstrap() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares de requisição
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Servir arquivos de uploads estáticos
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --------------------------------------------------------------------------
  // ROTAS DE AUTENTICAÇÃO
  // --------------------------------------------------------------------------
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Verificação de bloqueio por tentativas excessivas
    const attempt = loginAttempts.get(clientIp);
    if (attempt && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      res.status(429).json({ 
        error: `Muitas tentativas incorretas. Aguarde ${waitSeconds} segundos antes de tentar novamente.` 
      });
      return;
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Senha não informada.' });
      return;
    }

    const db = loadDatabase();
    const providedHash = hashPassword(password);
    const targetHash = db.admin_config?.password_hash || INITIAL_ADMIN_HASH;

    // Comparação de hash segura em tempo constante
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(providedHash, 'utf-8'),
      Buffer.from(targetHash, 'utf-8')
    );

    if (!isMatch) {
      const currentCount = (attempt ? attempt.count : 0) + 1;
      const lockTime = currentCount >= 5 ? now + 5 * 60 * 1000 : 0; // 5 minutos de bloqueio
      loginAttempts.set(clientIp, { count: currentCount, lockedUntil: lockTime });

      res.status(401).json({ 
        error: 'Credencial inválida. Acesso negado.',
        attemptsRemaining: Math.max(0, 5 - currentCount),
      });
      return;
    }

    // Sucesso: reseta tentativas e cria sessão
    loginAttempts.delete(clientIp);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 12 * 60 * 60 * 1000; // 12 horas

    activeSessions.set(token, {
      token,
      createdAt: now,
      expiresAt,
    });

    res.json({
      success: true,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      message: 'Autenticação administrativa realizada com sucesso.',
    });
  });

  app.get('/api/admin/session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ valid: false });
      return;
    }

    const token = authHeader.substring(7).trim();
    const session = activeSessions.get(token);

    if (session && Date.now() < session.expiresAt) {
      res.json({ valid: true, expiresAt: new Date(session.expiresAt).toISOString() });
    } else {
      res.status(401).json({ valid: false });
    }
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // --------------------------------------------------------------------------
  // ROTAS DE PRODUTOS
  // --------------------------------------------------------------------------
  // Listagem pública (somente ativos) ou administrativa (todos)
  app.get('/api/products', (req: Request, res: Response) => {
    const db = loadDatabase();
    const showAll = req.query.all === 'true';

    // Cria mapa de categorias para anexar o nome da categoria
    const categoryMap = new Map(db.categories.map(c => [c.id, c.name]));

    let products = db.products.map(p => ({
      ...p,
      category_name: categoryMap.get(p.category_id) || 'Sem categoria',
    }));

    if (!showAll) {
      products = products.filter(p => p.is_active);
    }

    // Ordenação: mais recentes primeiro
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(products);
  });

  // Buscar produto específico por ID
  app.get('/api/products/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    const cat = db.categories.find(c => c.id === product.category_id);
    res.json({ ...product, category_name: cat?.name });
  });

  // Criar novo produto (Protegido por Admin)
  app.post('/api/products', requireAdminAuth, (req: Request, res: Response) => {
    const { name, description, price, previous_price, category_id, stock, image_path, affiliate_url, is_active } = req.body;

    if (!name || typeof price !== 'number' || !category_id || typeof stock !== 'number' || !affiliate_url || !image_path) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes ou em formato inválido.' });
      return;
    }

    const db = loadDatabase();

    // Verifica se a categoria existe
    const categoryExists = db.categories.some(c => c.id === category_id);
    if (!categoryExists) {
      res.status(400).json({ error: 'A categoria selecionada não existe.' });
      return;
    }

    const newProduct = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      price: Math.max(0, Number(price)),
      previous_price: previous_price ? Math.max(0, Number(previous_price)) : null,
      category_id: String(category_id),
      stock: Math.max(0, Math.floor(Number(stock))),
      image_path: String(image_path).trim(),
      affiliate_url: String(affiliate_url).trim(),
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.products.push(newProduct);
    saveDatabase(db);

    const cat = db.categories.find(c => c.id === newProduct.category_id);
    res.status(201).json({ ...newProduct, category_name: cat?.name });
  });

  // Editar produto existente (Protegido por Admin)
  app.put('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, previous_price, category_id, stock, image_path, affiliate_url, is_active } = req.body;

    const db = loadDatabase();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Produto não encontrado para edição.' });
      return;
    }

    const existing = db.products[index];
    const updatedProduct = {
      ...existing,
      name: name !== undefined ? String(name).trim() : existing.name,
      description: description !== undefined ? String(description).trim() : existing.description,
      price: price !== undefined ? Math.max(0, Number(price)) : existing.price,
      previous_price: previous_price !== undefined ? (previous_price ? Math.max(0, Number(previous_price)) : null) : existing.previous_price,
      category_id: category_id !== undefined ? String(category_id) : existing.category_id,
      stock: stock !== undefined ? Math.max(0, Math.floor(Number(stock))) : existing.stock,
      image_path: image_path !== undefined ? String(image_path).trim() : existing.image_path,
      affiliate_url: affiliate_url !== undefined ? String(affiliate_url).trim() : existing.affiliate_url,
      is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
      updated_at: new Date().toISOString(),
    };

    db.products[index] = updatedProduct;
    saveDatabase(db);

    const cat = db.categories.find(c => c.id === updatedProduct.category_id);
    res.json({ ...updatedProduct, category_name: cat?.name });
  });

  // Atualizar estoque rapidamente (Protegido por Admin)
  app.patch('/api/products/:id/stock', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'O estoque deve ser um número inteiro maior ou igual a zero.' });
      return;
    }

    const db = loadDatabase();
    const product = db.products.find(p => p.id === id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }

    product.stock = Math.floor(stock);
    product.updated_at = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, product });
  });

  // Alternar status ativo/inativo (Protegido por Admin)
  app.patch('/api/products/:id/toggle-active', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const product = db.products.find(p => p.id === id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }

    product.is_active = !product.is_active;
    product.updated_at = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, product });
  });

  // Excluir produto com confirmação (Protegido por Admin)
  app.delete('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }

    const removed = db.products.splice(index, 1);
    saveDatabase(db);

    res.json({ success: true, message: 'Produto excluído com sucesso.', removed: removed[0] });
  });

  // --------------------------------------------------------------------------
  // ROTAS DE CATEGORIAS
  // --------------------------------------------------------------------------
  app.get('/api/categories', (req: Request, res: Response) => {
    const db = loadDatabase();
    
    // Contagem de produtos por categoria
    const counts = new Map<string, number>();
    for (const p of db.products) {
      counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
    }

    const categories = db.categories.map(c => ({
      ...c,
      products_count: counts.get(c.id) || 0,
    }));

    res.json(categories);
  });

  // Criar categoria (Protegido por Admin)
  app.post('/api/categories', requireAdminAuth, (req: Request, res: Response) => {
    const { name, description, image_path, is_active } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'O nome da categoria é obrigatório (mínimo 2 letras).' });
      return;
    }

    const db = loadDatabase();
    const newCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      description: description ? String(description).trim() : '',
      image_path: image_path ? String(image_path).trim() : '',
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.categories.push(newCategory);
    saveDatabase(db);

    res.status(201).json({ ...newCategory, products_count: 0 });
  });

  // Editar categoria (Protegido por Admin)
  app.put('/api/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, image_path, is_active } = req.body;

    const db = loadDatabase();
    const category = db.categories.find(c => c.id === id);

    if (!category) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }

    if (name) category.name = String(name).trim();
    if (description !== undefined) category.description = String(description).trim();
    if (image_path !== undefined) category.image_path = String(image_path).trim();
    if (is_active !== undefined) category.is_active = Boolean(is_active);
    category.updated_at = new Date().toISOString();

    saveDatabase(db);

    const count = db.products.filter(p => p.category_id === id).length;
    res.json({ ...category, products_count: count });
  });

  // Excluir categoria com verificação de dependência de produtos (Protegido por Admin)
  app.delete('/api/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();

    // Verificação estrita de integridade referencial:
    const linkedProducts = db.products.filter(p => p.category_id === id);
    if (linkedProducts.length > 0) {
      res.status(400).json({ 
        error: `Não é possível excluir esta categoria porque existem ${linkedProducts.length} produto(s) vinculados a ela. Mova os produtos para outra categoria primeiro.` 
      });
      return;
    }

    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Categoria não encontrada.' });
      return;
    }

    const removed = db.categories.splice(index, 1);
    saveDatabase(db);

    res.json({ success: true, message: 'Categoria excluída com sucesso.', removed: removed[0] });
  });

  // --------------------------------------------------------------------------
  // ROTAS DA SACOLA: VALIDAÇÃO DE ESTOQUE EM TEMPO REAL
  // --------------------------------------------------------------------------
  app.post('/api/cart/verify-stock', (req: Request, res: Response) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Lista de itens inválida.' });
      return;
    }

    const db = loadDatabase();
    const errors: string[] = [];
    const verifiedItems: Array<{
      productId: string;
      available: boolean;
      currentStock: number;
      currentPrice: number;
      productName: string;
      affiliateUrl: string;
    }> = [];

    for (const item of items) {
      const prod = db.products.find(p => p.id === item.productId);
      if (!prod || !prod.is_active) {
        errors.push(`O produto "${item.name || item.productId}" não está mais disponível na loja.`);
        verifiedItems.push({
          productId: item.productId,
          available: false,
          currentStock: 0,
          currentPrice: 0,
          productName: item.name || 'Produto indisponível',
          affiliateUrl: '',
        });
        continue;
      }

      if (prod.stock <= 0) {
        errors.push(`O produto "${prod.name}" está esgotado.`);
        verifiedItems.push({
          productId: prod.id,
          available: false,
          currentStock: 0,
          currentPrice: prod.price,
          productName: prod.name,
          affiliateUrl: prod.affiliate_url,
        });
      } else if (item.quantity > prod.stock) {
        errors.push(`Apenas ${prod.stock} unidade(s) de "${prod.name}" disponíveis em estoque.`);
        verifiedItems.push({
          productId: prod.id,
          available: true,
          currentStock: prod.stock,
          currentPrice: prod.price,
          productName: prod.name,
          affiliateUrl: prod.affiliate_url,
        });
      } else {
        verifiedItems.push({
          productId: prod.id,
          available: true,
          currentStock: prod.stock,
          currentPrice: prod.price,
          productName: prod.name,
          affiliateUrl: prod.affiliate_url,
        });
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      verifiedItems,
    });
  });

  // --------------------------------------------------------------------------
  // EVENTOS DE CLIQUES / SAÍDAS PARA A SHOPEE
  // --------------------------------------------------------------------------
  app.post('/api/events/click', (req: Request, res: Response) => {
    const { productId, eventType, metadata } = req.body;
    if (!productId) {
      res.status(400).json({ error: 'ID do produto é obrigatório.' });
      return;
    }

    const db = loadDatabase();
    const prod = db.products.find(p => p.id === productId);

    const event = {
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod?.name || 'Desconhecido',
      event_type: (eventType === 'shopee_redirect' ? 'shopee_redirect' : 'shopee_click') as 'shopee_click' | 'shopee_redirect',
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    db.click_events.push(event);
    saveDatabase(db);

    res.status(201).json({ success: true, eventId: event.id });
  });

  // --------------------------------------------------------------------------
  // ROTAS DE PEDIDOS E VENDAS CONFIRMADAS (ÁREA ADMINISTRATIVA)
  // --------------------------------------------------------------------------
  app.get('/api/orders', requireAdminAuth, (req: Request, res: Response) => {
    const db = loadDatabase();
    // Ordenar do mais novo para o mais antigo
    const orders = [...db.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(orders);
  });

  app.post('/api/orders', requireAdminAuth, (req: Request, res: Response) => {
    const { customer_name, total_amount, commission_earned, notes, items, source } = req.body;

    if (typeof total_amount !== 'number' || total_amount < 0) {
      res.status(400).json({ error: 'O valor total deve ser um número positivo.' });
      return;
    }

    const db = loadDatabase();
    const order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      customer_name: customer_name ? String(customer_name).trim() : 'Cliente Shopee',
      source: (source || 'manual_admin') as 'shopee_manual' | 'manual_admin' | 'external_import',
      status: 'completed' as const,
      total_amount: Number(total_amount),
      commission_earned: commission_earned ? Number(commission_earned) : 0,
      notes: notes ? String(notes).trim() : '',
      created_at: new Date().toISOString(),
      items: Array.isArray(items) ? items : [],
    };

    db.orders.push(order);
    saveDatabase(db);

    res.status(201).json(order);
  });

  // --------------------------------------------------------------------------
  // DASHBOARD KPI STATS (ÁREA ADMINISTRATIVA)
  // --------------------------------------------------------------------------
  app.get('/api/admin/dashboard-stats', requireAdminAuth, (req: Request, res: Response) => {
    const db = loadDatabase();

    const totalProducts = db.products.length;
    const activeProducts = db.products.filter(p => p.is_active).length;
    const totalCategories = db.categories.length;
    const totalShopeeClicks = db.click_events.length;
    const totalOrders = db.orders.length;
    const totalConfirmedSalesAmount = db.orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const lowStockProductsCount = db.products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockProductsCount = db.products.filter(p => p.stock === 0).length;

    res.json({
      totalProducts,
      activeProducts,
      totalCategories,
      totalShopeeClicks,
      totalOrders,
      totalConfirmedSalesAmount,
      lowStockProductsCount,
      outOfStockProductsCount,
    });
  });

  // --------------------------------------------------------------------------
  // UPLOAD DE IMAGEM DO PRODUTO (LOCAL / SERVIDOR)
  // --------------------------------------------------------------------------
  app.post('/api/upload', requireAdminAuth, (req: Request, res: Response) => {
    const { imageBase64, filename, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      return;
    }

    // Validação de formato (apenas imagens comuns JPG, PNG, WEBP)
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    const detectedMime = mimeType || 'image/jpeg';
    if (!allowedMime.includes(detectedMime)) {
      res.status(400).json({ error: 'Formato não suportado. Aceitamos apenas JPG, PNG ou WebP.' });
      return;
    }

    try {
      // Remove header do data URL se presente
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Limite de tamanho: 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'A imagem deve ter no máximo 5MB.' });
        return;
      }

      const extension = detectedMime === 'image/png' ? 'png' : (detectedMime === 'image/webp' ? 'webp' : 'jpg');
      const uniqueName = `prod_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      res.json({ 
        success: true, 
        url: publicUrl,
        filename: uniqueName,
      });
    } catch (err) {
      console.error('Erro no upload de imagem:', err);
      res.status(500).json({ error: 'Falha ao processar e salvar a imagem.' });
    }
  });

  // --------------------------------------------------------------------------
  // CARREGAR CATÁLOGO DEMONSTRATIVO INICIAL (RECURSO FACILITADOR NO PAINEL)
  // --------------------------------------------------------------------------
  app.post('/api/admin/seed-demo', requireAdminAuth, (req: Request, res: Response) => {
    const db = loadDatabase();
    
    // Se o dono pedir para carregar o catálogo de exemplo inicial:
    const sampleProducts = [
      {
        id: crypto.randomUUID(),
        name: 'Fone de Ouvido Bluetooth Sem Fio TWS com Display LED',
        description: 'Fone de ouvido estéreo de alta fidelidade, cancelamento de ruído passivo, estojo de carregamento com tela digital e bateria de até 20 horas.',
        price: 49.90,
        previous_price: 89.90,
        category_id: 'cat-eletronicos',
        stock: 35,
        image_path: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654321',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Smartwatch Esportivo Inteligente com Monitor Cardíaco',
        description: 'Relógio inteligente resistente a respingos, múltiplos modos de treino, medição de batimentos, notificações de mensagens e tela touch colorida.',
        price: 99.90,
        previous_price: 159.00,
        category_id: 'cat-eletronicos',
        stock: 18,
        image_path: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654322',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Luminária de Mesa Articulada LED com Carregamento USB',
        description: 'Design minimalista e moderno, 3 tons de luz reguláveis (quente, neutra e fria), controle touch e haste flexível 360° para estudo e trabalho.',
        price: 64.50,
        previous_price: 98.00,
        category_id: 'cat-casa',
        stock: 12,
        image_path: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654323',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Umidificador e Difusor de Aromas Ultrassônico com Efeito Chama',
        description: 'Simula efeito de chama realista com iluminação LED suave, silencioso, capacidade de 200ml e desliga automaticamente quando a água acaba.',
        price: 79.90,
        previous_price: 129.90,
        category_id: 'cat-casa',
        stock: 8,
        image_path: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654324',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Mochila Antifurto Impermeável para Notebook com Saída USB',
        description: 'Compartimento acolchoado para notebook até 15.6 polegadas, tecido impermeável oxford, zíper oculto e bolsos antifurto para viagens.',
        price: 119.90,
        previous_price: 189.90,
        category_id: 'cat-moda',
        stock: 15,
        image_path: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654325',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Organizador Giratório 360° de Cosméticos e Maquiagem em Acrílico',
        description: 'Bandejas ajustáveis em várias alturas, comporta até 30 pincéis e 20 frascos, acabamento cristal transparente de alta durabilidade.',
        price: 54.90,
        previous_price: 79.90,
        category_id: 'cat-beleza',
        stock: 4,
        image_path: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654326',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Mini Processador e Triturador Elétrico de Alimentos USB',
        description: '3 lâminas em aço inoxidável, acionamento por botão touch, bateria recarregável portátil e tigela de 250ml fácil de lavar.',
        price: 39.90,
        previous_price: 59.90,
        category_id: 'cat-casa',
        stock: 0, // Exemplo de produto esgotado para testar badge e desativação
        image_path: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80',
        affiliate_url: 'https://shopee.com.br/product/123456789/987654327',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    db.products = sampleProducts;
    saveDatabase(db);

    res.json({ success: true, count: sampleProducts.length, message: 'Produtos de demonstração carregados com sucesso.' });
  });

  // --------------------------------------------------------------------------
  // INTEGRAÇÃO COM VITE (DEV) OU ARQUIVOS ESTÁTICOS COMPILADOS (PROD)
  // --------------------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦊 VitrineFox Server rodando em http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Falha crítica ao iniciar servidor VitrineFox:', err);
  process.exit(1);
});
