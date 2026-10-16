import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatBRL, calculateDiscount } from '../lib/validation';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onBuyNow,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const discount = calculateDiscount(product.price, product.previous_price);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 overflow-hidden">
      {/* Topo do Card: Imagem e Selos */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        {/* Selo de Desconto */}
        {discount && discount > 0 && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-xs">
            -{discount}% OFF
          </span>
        )}

        {/* Selo de Disponibilidade de Estoque */}
        <span 
          className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 shadow-xs backdrop-blur-xs ${
            isOutOfStock 
              ? 'bg-red-500/90 text-white' 
              : product.stock <= 3 
                ? 'bg-amber-500/90 text-white' 
                : 'bg-emerald-600/90 text-white'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-white' : 'bg-white animate-pulse'}`} />
          {isOutOfStock ? 'Esgotado' : product.stock <= 3 ? `Resta ${product.stock}` : 'Em estoque'}
        </span>

        {/* Imagem do Produto com preservação estrita de proporção */}
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-50">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-1" />
            <span className="text-[11px]">Foto em atualização</span>
          </div>
        ) : (
          <img
            src={product.image_path}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>

      {/* Corpo do Card: Informações */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Categoria */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-semibold text-orange-600 uppercase tracking-wider line-clamp-1">
              {product.category_name || 'Geral'}
            </span>
          </div>

          {/* Nome do Produto */}
          <h3 
            className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug min-h-[2.2rem] sm:min-h-[2.5rem]" 
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Seção de Preços */}
          <div className="mt-2 flex flex-col">
            {product.previous_price && product.previous_price > product.price && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                {formatBRL(product.previous_price)}
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {formatBRL(product.price)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                na Shopee
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-1.5 sm:gap-2">
          {/* Botão de Adicionar à Sacola */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            type="button"
            className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/80'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Adicionado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Indisponível' : 'Adicionar à sacola'}</span>
              </>
            )}
          </button>

          {/* Botão de Compra Direta */}
          <button
            onClick={() => onBuyNow(product)}
            disabled={isOutOfStock}
            type="button"
            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20 hover:shadow-orange-500/35'
            }`}
          >
            <span>{isOutOfStock ? 'Esgotado' : 'Comprar na Shopee'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
