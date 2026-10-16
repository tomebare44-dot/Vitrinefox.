import { 
  Product, 
  Category, 
  CartItem, 
  ClickEventType, 
  ConfirmedOrder, 
  DashboardStats 
} from '../types';
import { getAdminSession } from '../lib/storage';

const API_BASE = '/api';

/**
 * Retorna os headers padrão para requisições, incluindo o token administrativo se houver
 */
function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const session = getAdminSession();
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
}

// ============================================================================
// SERVIÇOS PÚBLICOS
// ============================================================================

/**
 * Busca produtos da loja
 * Se all=true e o usuário for admin, busca também os inativos
 */
export async function fetchProducts(showAll = false): Promise<Product[]> {
  const url = `${API_BASE}/products${showAll ? '?all=true' : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar produtos do banco de dados.');
  }

  return response.json();
}

/**
 * Busca categorias ativas com quantidade de produtos
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories`, {
    headers: getHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar categorias.');
  }

  return response.json();
}

/**
 * Registra evento de clique em link de afiliado ou saída para a Shopee
 */
export async function trackShopeeClick(productId: string, eventType: ClickEventType = 'shopee_click', metadata?: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}/events/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        eventType,
        metadata: {
          userAgent: navigator.userAgent,
          screen: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Erro silencioso ao registrar clique da Shopee:', err);
  }
}

/**
 * Validação de estoque em tempo real para os itens da sacola
 */
export async function verifyCartStock(items: CartItem[]): Promise<{
  valid: boolean;
  errors: string[];
  verifiedItems: Array<{
    productId: string;
    available: boolean;
    currentStock: number;
    currentPrice: number;
    productName: string;
    affiliateUrl: string;
  }>;
}> {
  const response = await fetch(`${API_BASE}/cart/verify-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        name: i.product.name,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao verificar estoque no servidor.');
  }

  return response.json();
}

// ============================================================================
// SERVIÇOS ADMINISTRATIVOS
// ============================================================================

/**
 * Realiza autenticação com a senha administrativa no backend
 */
export async function adminLogin(password: string): Promise<{
  success: boolean;
  token: string;
  expiresAt: string;
}> {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Credenciais inválidas.');
  }

  return data;
}

/**
 * Verifica se o token atual é válido
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const session = getAdminSession();
    if (!session) return false;

    const response = await fetch(`${API_BASE}/admin/session`, {
      headers: getHeaders(false),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Realiza logout administrativo
 */
export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: getHeaders(false),
    });
  } catch (err) {
    console.warn('Erro ao notificar logout:', err);
  }
}

/**
 * Criação de produto
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao salvar produto no banco de dados.');
  }

  return data;
}

/**
 * Edição de produto existente
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar produto.');
  }

  return data;
}

/**
 * Exclusão de produto
 */
export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao excluir produto.');
  }
}

/**
 * Ajuste rápido de estoque
 */
export async function updateProductStock(id: string, stock: number): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PATCH',
    headers: getHeaders(true),
    body: JSON.stringify({ stock }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Falha ao atualizar estoque.');
  }
}

/**
 * Alternar status ativo/inativo
 */
export async function toggleProductActive(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}/toggle-active`, {
    method: 'PATCH',
    headers: getHeaders(false),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Falha ao alternar visibilidade.');
  }
}

/**
 * Criação de categoria
 */
export async function createCategory(categoryData: {
  name: string;
  description?: string;
  image_path?: string;
  is_active?: boolean;
}): Promise<Category> {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(categoryData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao criar categoria.');
  }

  return data;
}

/**
 * Edição de categoria
 */
export async function updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
  const response = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(categoryData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao atualizar categoria.');
  }

  return data;
}

/**
 * Exclusão de categoria (com bloqueio se houver produtos)
 */
export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao excluir categoria.');
  }
}

/**
 * Estatísticas do Dashboard Administrativo
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE}/admin/dashboard-stats`, {
    headers: getHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Falha ao obter métricas do dashboard.');
  }

  return response.json();
}

/**
 * Listagem de vendas e pedidos registrados
 */
export async function fetchOrders(): Promise<ConfirmedOrder[]> {
  const response = await fetch(`${API_BASE}/orders`, {
    headers: getHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Falha ao listar vendas e pedidos.');
  }

  return response.json();
}

/**
 * Registro manual de venda confirmada
 */
export async function recordConfirmedOrder(orderData: {
  customer_name?: string;
  total_amount: number;
  commission_earned?: number;
  notes?: string;
  items?: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}): Promise<ConfirmedOrder> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      ...orderData,
      source: 'manual_admin',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao registrar venda manual.');
  }

  return data;
}

/**
 * Upload de imagem de produto
 */
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: getHeaders(true),
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao enviar imagem.');
        }

        resolve(data.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Carregar catálogo de demonstração inicial
 */
export async function seedDemoProducts(): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/seed-demo`, {
    method: 'POST',
    headers: getHeaders(false),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao carregar produtos de demonstração.');
  }
}
