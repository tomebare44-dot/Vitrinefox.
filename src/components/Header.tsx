import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, ShieldCheck, LogOut, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Category } from '../types';

interface HeaderProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onLogoutAdmin: () => void;
  onSecretTriggerSuccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  isAdmin,
  onOpenAdmin,
  onLogoutAdmin,
  onSecretTriggerSuccess,
}) => {
  // Controle do mecanismo discreto de 15 cliques na logo
  const [clickCount, setClickCount] = useState<number>(0);
  const lastClickRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    // Se já estiver autenticado como admin, abre o painel diretamente
    if (isAdmin) {
      onOpenAdmin();
      return;
    }

    const now = Date.now();
    const interval = now - lastClickRef.current;
    lastClickRef.current = now;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Se o clique for consecutivo dentro de 2.5 segundos
    if (interval <= 2500 || clickCount === 0) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);

      if (nextCount >= 15) {
        setClickCount(0);
        onSecretTriggerSuccess();
      } else {
        // Se parar de clicar por 2.5 segundos, reseta o contador
        clickTimeoutRef.current = setTimeout(() => {
          setClickCount(0);
        }, 2500);
      }
    } else {
      // Reinicia a contagem se clicou fora do intervalo
      setClickCount(1);
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100/80 shadow-xs">
      {/* Faixa superior de aviso de afiliados oficial */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
        <span>VitrineFox • Seleção de achadinhos oficiais da Shopee com frete grátis e cupons</span>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo Original da VitrineFox com mecanismo secreto de 15 cliques */}
          <button
            onClick={handleLogoClick}
            type="button"
            className="flex items-center gap-2.5 sm:gap-3 text-left group select-none focus:outline-hidden transition-transform active:scale-95"
            title={isAdmin ? 'Ir para o Painel do Dono' : 'VitrineFox'}
          >
            {/* Ícone estilizado original da Raposa (Fox) */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25 ring-2 ring-orange-200 group-hover:shadow-orange-500/40 transition-all">
              <svg 
                className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {/* Geometria moderna de Raposa */}
                <path d="M12 21l-8-6 3-11 5 4 5-4 3 11-8 6z" fill="currentColor" fillOpacity="0.2" />
                <path d="M4 15l8 6 8-6" />
                <path d="M4 15l3-11 5 4 5-4 3 11" />
                <circle cx="9" cy="13" r="1" fill="currentColor" />
                <circle cx="15" cy="13" r="1" fill="currentColor" />
                <path d="M12 17l-1-1h2l-1 1z" fill="currentColor" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  Vitrine<span className="text-orange-600">Fox</span>
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-wider uppercase">
                Achadinhos & Ofertas
              </p>
            </div>
          </button>

          {/* Barra de Busca de Produtos */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar produtos, marcas ou ofertas..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Ações do cabeçalho */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Se logado como Administrador, exibe atalho direto e logout */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 p-1 rounded-xl">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Painel do Dono</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="Sair da sessão administrativa"
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sacola no cabeçalho (em telas maiores) */}
            <button
              onClick={onOpenCart}
              type="button"
              className="relative p-2.5 text-slate-700 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors"
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white animate-in zoom-in-75">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Busca móvel (visível apenas em celulares) */}
        <div className="pb-3 sm:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar produtos na loja..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Barra de Categorias Horizontal com rolagem suave */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100">
            <button
              onClick={() => onSelectCategory(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-orange-600 text-white shadow-xs shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Todos os Produtos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-xs shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
