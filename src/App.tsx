import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  ExternalLink, 
  CheckCircle2, 
  Truck, 
  Tag, 
  ArrowRight,
  Package,
  Layers
} from 'lucide-react';
import { Product, Category, CartItem, DashboardStats, ConfirmedOrder } from './types';
import { getSavedCart, saveCart, getAdminSession, clearAdminSession } from './lib/storage';
import { 
  fetchProducts, 
  fetchCategories, 
  fetchDashboardStats, 
  fetchOrders,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductActive, 
  updateProductStock,
  createCategory,
  updateCategory,
  deleteCategory,
  recordConfirmedOrder,
  seedDemoProducts,
  checkAdminSession,
  adminLogout
} from './services/api';

// Componentes da Vitrine Pública
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { ShopeeRedirectModal } from './components/ShopeeRedirectModal';
import { AdminLoginModal } from './components/AdminLoginModal';

// Componentes do Painel Administrativo
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { ProductsManager } from './components/admin/ProductsManager';
import { CategoriesManager } from './components/admin/CategoriesManager';
import { SalesReportsView } from './components/admin/SalesReportsView';
import { DatabaseSetupGuide } from './components/admin/DatabaseSetupGuide';
import { ProductFormModal } from './components/admin/ProductFormModal';
import { CategoryFormModal } from './components/admin/CategoryFormModal';

export default function App() {
  // Estado de Dados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getSavedCart());
  const [orders, setOrders] = useState<ConfirmedOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    totalShopeeClicks: 0,
    totalOrders: 0,
    totalConfirmedSalesAmount: 0,
    lowStockProductsCount: 0,
    outOfStockProductsCount: 0,
  });

  // Estados de Interface Pública
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [redirectProduct, setRedirectProduct] = useState<Product | null>(null);

  // Estados Administrativos e Mecanismo Secreto
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'products' | 'categories' | 'sales' | 'setup'>('dashboard');
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);

  // Salva sacola no localStorage sempre que alterada
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  // Carregamento inicial de produtos e categorias do banco
  const loadInitialData = useCallback(async (isAdm = isAdmin) => {
    setIsLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        fetchProducts(isAdm),
        fetchCategories(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);

      if (isAdm) {
        const [statsData, ordersData] = await Promise.all([
          fetchDashboardStats(),
          fetchOrders(),
        ]);
        setStats(statsData);
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do banco:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Validação da sessão administrativa no início
  useEffect(() => {
    const initAuth = async () => {
      const savedSession = getAdminSession();
      if (savedSession) {
        const isValid = await checkAdminSession();
        if (isValid) {
          setIsAdmin(true);
          loadInitialData(true);
          return;
        } else {
          clearAdminSession();
        }
      }
      loadInitialData(false);
    };

    initAuth();
  }, [loadInitialData]);

  // Ações da Sacola
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Redirecionamento Shopee do Card de Produto
  const handleBuyNow = (product: Product) => {
    setRedirectProduct(product);
  };

  // Ações Administrativas de Produtos
  const handleCreateProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const newProd = await createProduct(data);
    setProducts((prev) => [newProd, ...prev]);
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    const updated = await updateProduct(id, data);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    // Remove também da sacola se estava lá
    setCartItems((prev) => prev.filter((item) => item.product.id !== id));
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  const handleToggleProductActive = async (id: string) => {
    await toggleProductActive(id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateProductStock = async (id: string, stock: number) => {
    await updateProductStock(id, stock);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock } : p))
    );
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  // Ações de Categorias
  const handleCreateCategory = async (data: { name: string; description?: string; image_path?: string; is_active?: boolean }) => {
    const newCat = await createCategory(data);
    setCategories((prev) => [...prev, newCat]);
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  const handleUpdateCategory = async (id: string, data: Partial<Category>) => {
    const updated = await updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  // Registro de Venda Manual
  const handleRecordManualSale = async (data: any) => {
    const newOrder = await recordConfirmedOrder(data);
    setOrders((prev) => [newOrder, ...prev]);
    const updatedStats = await fetchDashboardStats();
    setStats(updatedStats);
  };

  // Carregar produtos de demonstração
  const handleSeedDemo = async () => {
    await seedDemoProducts();
    await loadInitialData(true);
  };

  // Autenticação e Logout do Dono
  const handleAdminLoginSuccess = async () => {
    setIsAdmin(true);
    setIsAdminMode(true);
    await loadInitialData(true);
  };

  const handleLogout = async () => {
    await adminLogout();
    clearAdminSession();
    setIsAdmin(false);
    setIsAdminMode(false);
    await loadInitialData(false);
  };

  // Filtragem na Vitrine Pública
  const displayedProducts = products.filter((p) => {
    if (!isAdmin && !p.is_active) return false;
    const matchesCat = selectedCategory === null || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Se o proprietário estiver visualizando o painel administrativo:
  if (isAdminMode && isAdmin) {
    return (
      <AdminLayout
        currentTab={activeAdminTab}
        onSelectTab={setActiveAdminTab}
        onExitAdmin={() => setIsAdminMode(false)}
        onLogout={handleLogout}
      >
        {activeAdminTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onNavigateTab={setActiveAdminTab}
            onOpenCreateProduct={() => setIsCreateProductModalOpen(true)}
            onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
            onSeedDemo={handleSeedDemo}
          />
        )}

        {activeAdminTab === 'products' && (
          <ProductsManager
            products={products}
            categories={categories}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleActive={handleToggleProductActive}
            onUpdateStock={handleUpdateProductStock}
            onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
          />
        )}

        {activeAdminTab === 'categories' && (
          <CategoriesManager
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeAdminTab === 'sales' && (
          <SalesReportsView
            orders={orders}
            totalShopeeClicks={stats.totalShopeeClicks}
            products={products}
            onRecordManualSale={handleRecordManualSale}
          />
        )}

        {activeAdminTab === 'setup' && <DatabaseSetupGuide />}

        {/* Modal de criação rápida de produtos */}
        <ProductFormModal
          isOpen={isCreateProductModalOpen}
          onClose={() => setIsCreateProductModalOpen(false)}
          onSubmit={handleCreateProduct}
          categories={categories}
          onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
        />

        {/* Modal de criação de categorias acessível em qualquer tela do painel */}
        <CategoryFormModal
          isOpen={isCreateCategoryModalOpen}
          onClose={() => setIsCreateCategoryModalOpen(false)}
          onSubmit={handleCreateCategory}
        />
      </AdminLayout>
    );
  }

  // Visualização da Vitrine Pública (Acessível a qualquer visitante sem login)
  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Cabeçalho com mecanismo de 15 cliques na logo */}
      <Header
        categories={categories.filter((c) => c.is_active)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminMode(true)}
        onLogoutAdmin={handleLogout}
        onSecretTriggerSuccess={() => setIsLoginModalOpen(true)}
      />

      {/* Hero Banner da VitrineFox */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white py-8 sm:py-12 px-4 shadow-sm relative overflow-hidden">
        {/* Detalhes de iluminação decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700/20 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-white mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seleção Verificada de Afiliados Shopee</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Os melhores achadinhos com <span className="underline decoration-white/40">preços imperdíveis</span>.
            </h1>

            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-orange-100 max-w-lg leading-relaxed">
              Curadoria especial de produtos de alta avaliação na Shopee. Navegue, adicione à sacola e aproveite os cupons oficiais de frete grátis!
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-white/90">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-white" />
                Links 100% Oficiais
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-white" />
                Entrega Garantida Shopee
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-white" />
                Cupons e Descontos
              </span>
            </div>
          </div>

          {/* Destaque visual lateral */}
          <div className="hidden lg:flex items-center gap-3 bg-white/15 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black shadow-md">
              Fox
            </div>
            <div className="text-left text-xs">
              <span className="font-bold block text-white text-sm">VitrineFox</span>
              <span className="text-orange-100">Atualizada diariamente com novidades</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Grade de Produtos */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-10">
        <ProductGrid
          products={displayedProducts}
          isLoading={isLoading}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onRefresh={() => loadInitialData(isAdmin)}
          isFiltered={selectedCategory !== null || searchQuery.trim() !== ''}
        />
      </main>

      {/* Sacola Flutuante no Canto Inferior Esquerdo da Tela */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(!isCartOpen)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Modal de Redirecionamento da Shopee */}
      <ShopeeRedirectModal
        product={redirectProduct}
        onClose={() => setRedirectProduct(null)}
      />

      {/* Modal Secreto de Autenticação Administrativa (15 cliques na logo) */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Rodapé da Loja com Transparência de Afiliados */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
              VF
            </div>
            <span className="font-extrabold text-slate-900 text-sm">VitrineFox</span>
          </div>

          <p className="max-w-md text-[11px] leading-relaxed text-slate-400">
            A VitrineFox é um portal de recomendação de produtos e participante do Programa de Afiliados Shopee. Ao comprar através dos nossos links, você é direcionado aos anúncios oficiais na plataforma Shopee com total segurança.
          </p>

          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} VitrineFox • Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
