import React from 'react';
import { PackageOpen, Sparkles, RefreshCw, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onRefresh?: () => void;
  isFiltered?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onAddToCart,
  onBuyNow,
  onRefresh,
  isFiltered,
}) => {
  // Estado de carregamento com esqueletos de cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 animate-pulse flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square w-full bg-slate-200 rounded-xl mb-3" />
              <div className="h-3 w-16 bg-slate-200 rounded-sm mb-2" />
              <div className="h-4 w-full bg-slate-200 rounded-sm mb-1" />
              <div className="h-4 w-3/4 bg-slate-200 rounded-sm mb-3" />
              <div className="h-6 w-24 bg-slate-200 rounded-sm" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-full bg-slate-200 rounded-xl" />
              <div className="h-8 w-full bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Estado Vazio quando o banco de dados não tem produtos
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-orange-200 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs my-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 border border-orange-100">
          <PackageOpen className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
          {isFiltered ? 'Nenhum produto encontrado' : 'Nenhum produto disponível no momento'}
        </h3>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {isFiltered
            ? 'Não encontramos produtos correspondentes ao seu filtro ou busca. Tente buscar por outros termos ou categorias.'
            : 'Nossa vitrine está sendo abastecida com novas ofertas e achadinhos da Shopee. Volte em breve para conferir!'}
        </p>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Vitrine
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Informações da lista */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Mostrando <span className="font-bold text-slate-800">{products.length}</span> {products.length === 1 ? 'produto' : 'produtos'}
        </p>
        <span className="text-xs text-orange-600 font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Links verificados
        </span>
      </div>

      {/* Grade com exatamente 2 cards por linha no celular e expansão progressiva */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>
    </div>
  );
};
