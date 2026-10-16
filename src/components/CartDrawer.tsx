import React, { useState } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ExternalLink, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { CartItem } from '../types';
import { formatBRL } from '../lib/validation';
import { verifyCartStock, trackShopeeClick } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [verifiedList, setVerifiedList] = useState<any[]>([]);

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

  // Verificação estrita de estoque no servidor antes do redirecionamento
  const handleProceedToShopee = async () => {
    if (items.length === 0) return;
    setIsVerifying(true);
    setStockErrors([]);

    try {
      const result = await verifyCartStock(items);

      if (!result.valid) {
        setStockErrors(result.errors);
      }

      setVerifiedList(result.verifiedItems);
      setCheckoutModalOpen(true);
    } catch (err: any) {
      setStockErrors(['Não foi possível validar o estoque no momento. Tente novamente.']);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenShopeeProduct = (productId: string, url: string, name: string) => {
    // Registra evento de saída no servidor
    trackShopeeClick(productId, 'shopee_redirect', {
      source: 'cart_drawer',
      productName: name,
    });
    // Abre a URL oficial cadastrada na Shopee
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Botão Flutuante Fixo no Canto Inferior Esquerdo da Tela */}
      <button
        onClick={onClose} // Se já estiver aberto ou fechado, alterna
        type="button"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-4 py-3 rounded-full shadow-xl shadow-orange-600/30 ring-2 ring-white hover:scale-105 active:scale-95 transition-all"
        aria-label="Sacola de compras"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-orange-600 text-[11px] font-black flex items-center justify-center shadow-xs">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-xs font-bold block leading-none">Sacola</span>
          <span className="text-[10px] text-orange-100 font-medium">
            {totalItems === 0 ? 'Vazia' : formatBRL(subtotal)}
          </span>
        </div>
      </button>

      {/* Backdrop e Painel da Sacola */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Fundo escurecido */}
          <div 
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Cabeçalho da Sacola */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sua Sacola</h2>
                    <p className="text-xs text-slate-500">
                      {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Itens na Sacola */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">Sua sacola está vazia</h3>
                    <p className="text-xs text-slate-500 max-w-xs mb-6">
                      Explore os achadinhos da VitrineFox e adicione produtos para comprar na Shopee.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-full bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors shadow-xs"
                    >
                      Ver produtos
                    </button>
                  </div>
                ) : (
                  items.map(({ product, quantity }) => (
                    <div key={product.id} className="py-4 flex gap-3 sm:gap-4 group">
                      {/* Imagem */}
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={product.image_path}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Dados do produto */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                              {product.name}
                            </h4>
                            <button
                              onClick={() => onRemoveItem(product.id)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                              title="Remover produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[11px] text-orange-600 font-medium">
                            {product.category_name}
                          </span>
                        </div>

                        {/* Preço e controle de quantidade */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-slate-900">
                            {formatBRL(product.price * quantity)}
                          </span>

                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded-l-md transition-colors"
                              aria-label="Diminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800">
                              {quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded-r-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rodapé da Sacola com Totais e Ações */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
                  {stockErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Aviso de estoque:</strong>
                        <ul className="list-disc list-inside space-y-0.5 mt-1">
                          {stockErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal estimado</span>
                      <span className="font-semibold text-slate-800">{formatBRL(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete e cupons</span>
                      <span className="text-emerald-600 font-semibold">Aplicados na Shopee</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total estimado</span>
                      <span className="text-base text-orange-600">{formatBRL(subtotal)}</span>
                    </div>
                  </div>

                  {/* Botão de Finalizar Redirecionando para Shopee */}
                  <button
                    onClick={handleProceedToShopee}
                    disabled={isVerifying}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-98 transition-all disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando estoque no servidor...</span>
                      </>
                    ) : (
                      <>
                        <span>Finalizar Compra na Shopee</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <button
                      onClick={onClose}
                      className="hover:text-slate-800 underline decoration-slate-300"
                    >
                      Continuar navegando
                    </button>
                    <button
                      onClick={onClearCart}
                      className="text-red-500 hover:text-red-700"
                    >
                      Esvaziar sacola
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conclusão / Redirecionamento Shopee dos Itens da Sacola */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-orange-600">
                <ExternalLink className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Comprar Itens na Shopee</h3>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3">
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 text-xs text-orange-800 leading-relaxed">
                <span className="font-bold block mb-1">Como funciona a compra na Shopee:</span>
                Como a VitrineFox direciona para a loja oficial do vendedor na Shopee através de links de afiliados certificados, você pode abrir o anúncio de cada produto com segurança para adicionar ao seu carrinho na Shopee e aproveitar cupons de desconto e frete grátis da plataforma.
              </div>

              <div className="divide-y divide-slate-100">
                {verifiedList.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {item.productName}
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        {formatBRL(item.currentPrice)} {item.available ? '• Disponível' : '• Esgotado'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenShopeeProduct(item.productId, item.affiliateUrl, item.productName)}
                      disabled={!item.available}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Abrir na Shopee</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
