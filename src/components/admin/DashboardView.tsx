import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  MousePointerClick, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Sparkles,
  Loader2,
  TrendingUp,
  FolderGit2
} from 'lucide-react';
import { DashboardStats, Product } from '../../types';
import { formatBRL } from '../../lib/validation';

interface DashboardViewProps {
  stats: DashboardStats;
  onNavigateTab: (tab: 'products' | 'categories' | 'sales' | 'setup') => void;
  onOpenCreateProduct: () => void;
  onOpenCreateCategory: () => void;
  onSeedDemo: () => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigateTab,
  onOpenCreateProduct,
  onOpenCreateCategory,
  onSeedDemo,
}) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedDemo();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo do Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Visão Geral da VitrineFox
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Métricas calculadas em tempo real com base nos registros reais do banco de dados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.totalProducts === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-3.5 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Popula produtos de exemplo no banco de dados para testes"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{seedSuccess ? 'Catálogo Carregado!' : 'Carregar Catálogo Inicial'}</span>
            </button>
          )}

          {/* Botão para Criar Categoria */}
          <button
            onClick={onOpenCreateCategory}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95"
            title="Criar novo departamento ou categoria"
          >
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Criar Categoria</span>
          </button>

          {/* Botão para Criar Produto */}
          <button
            onClick={onOpenCreateProduct}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Produtos */}
        <div 
          onClick={() => onNavigateTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Produtos</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{stats.totalProducts}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stats.activeProducts} ativos</span>
          </div>
        </div>

        {/* Categorias Cadastradas */}
        <div 
          onClick={() => onNavigateTab('categories')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categorias</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{stats.totalCategories}</span>
            <span className="text-xs text-blue-600 font-semibold">Departamentos</span>
          </div>
        </div>

        {/* Cliques em Afiliados Shopee */}
        <div 
          onClick={() => onNavigateTab('sales')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Saídas Shopee</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{stats.totalShopeeClicks}</span>
            <span className="text-xs text-amber-600 font-semibold">Cliques rastreados</span>
          </div>
        </div>

        {/* Total de Vendas Confirmadas */}
        <div 
          onClick={() => onNavigateTab('sales')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas Confirmadas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{formatBRL(stats.totalConfirmedSalesAmount)}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stats.totalOrders} pedidos</span>
          </div>
        </div>
      </div>

      {/* Linha de Ações Rápidas em Destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Criar Categoria */}
        <div 
          onClick={onOpenCreateCategory}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                <span>Criar Nova Categoria</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200">
                  + Departamento
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Adicione um novo segmento para organizar seus achadinhos na vitrine.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
        </div>

        {/* Card Criar Produto */}
        <div 
          onClick={onOpenCreateProduct}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                <span>Cadastrar Novo Produto</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  + Oferta
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Insira foto, preço, estoque e link oficial de afiliado Shopee.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>

      {/* Linha de Alertas de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Produtos com Estoque Baixo */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Estoque Baixo (≤ 5 unidades)</h4>
              <p className="text-xs text-slate-500">Produtos que estão quase esgotando na vitrine.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-amber-600 block">{stats.lowStockProductsCount}</span>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              Revisar itens →
            </button>
          </div>
        </div>

        {/* Produtos Esgotados */}
        <div className="bg-white p-5 rounded-2xl border border-red-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Produtos Sem Estoque (0 un.)</h4>
              <p className="text-xs text-slate-500">O botão de compra é desativado automaticamente.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-red-600 block">{stats.outOfStockProductsCount}</span>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-[11px] font-bold text-red-700 hover:underline"
            >
              Repor estoque →
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Ações Rápidas e Ajuda */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-600/15">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <FolderGit2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base">Pronto para publicar no GitHub & Vercel?</h4>
            <p className="text-xs text-orange-100">
              Acesse a aba "Guia & Banco de Dados" para copiar a migração SQL do Supabase e as variáveis da Vercel.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('setup')}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs shadow-md transition-colors"
        >
          Ver Guia de Deploy
        </button>
      </div>
    </div>
  );
};
