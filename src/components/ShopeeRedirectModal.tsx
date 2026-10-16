import React from 'react';
import { ExternalLink, X, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../lib/validation';
import { trackShopeeClick } from '../services/api';

interface ShopeeRedirectModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ShopeeRedirectModal: React.FC<ShopeeRedirectModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const handleConfirmRedirect = () => {
    // 1. Registra evento de saída no servidor
    trackShopeeClick(product.id, 'shopee_redirect', {
      source: 'buy_now_modal',
      productName: product.name,
      price: product.price,
    });

    // 2. Abre o link oficial de afiliado da Shopee em nova aba de forma segura
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    
    // 3. Fecha modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-100 flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-2.5 text-orange-600 mb-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Redirecionamento Shopee</h3>
            <span className="text-[11px] text-slate-500 font-medium">Link de afiliado verificado</span>
          </div>
        </div>

        {/* Card do Produto Selecionado */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5 my-2">
          <img
            src={product.image_path}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
              {product.name}
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-extrabold text-orange-600">
                {formatBRL(product.price)}
              </span>
              {product.previous_price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatBRL(product.previous_price)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Explicação de Transparência e Segurança */}
        <div className="my-3 space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Você será direcionado diretamente para o anúncio oficial do vendedor dentro da Shopee.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p>
              Pagamento, cálculo de frete e garantia de entrega são gerenciados com total segurança pela plataforma Shopee.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirmRedirect}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
          >
            <span>Ir para a Shopee</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
