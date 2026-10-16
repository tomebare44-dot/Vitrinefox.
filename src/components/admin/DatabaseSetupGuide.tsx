import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  GitBranch, 
  Globe, 
  ShieldCheck, 
  Key,
  Terminal,
  FileCode2,
  Sparkles,
  Download
} from 'lucide-react';

export const DatabaseSetupGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlMigrationCode = `-- =========================================================================
-- MIGRATION SQL - VITRINEFOX (PostgreSQL / Supabase)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    previous_price NUMERIC(10, 2) CHECK (previous_price >= 0),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_path TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Perfis Administrativos
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Eventos de Saída / Cliques Shopee
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('shopee_click', 'shopee_redirect', 'view_product')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Pedidos e Vendas Registradas
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    source VARCHAR(50) NOT NULL DEFAULT 'manual_admin' CHECK (source IN ('shopee_manual', 'manual_admin', 'external_import')),
    customer_name VARCHAR(150),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    commission_earned NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Leitura pública categorias ativas" ON public.categories FOR SELECT USING (is_active = TRUE OR auth.role() = 'authenticated');
CREATE POLICY "Leitura pública produtos ativos" ON public.products FOR SELECT USING (is_active = TRUE OR auth.role() = 'authenticated');
CREATE POLICY "Inserção pública cliques" ON public.click_events FOR INSERT TO public WITH CHECK (TRUE);

-- Políticas de Administração
CREATE POLICY "Admin total categorias" ON public.categories FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin total produtos" ON public.products FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin total eventos" ON public.click_events FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin total pedidos" ON public.orders FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Guia de Banco de Dados, GitHub & Vercel
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Tudo o que você precisa para conectar a VitrineFox ao seu próprio Supabase e implantar na Vercel.
        </p>
      </div>

      {/* Banner de Download do Projeto Completo em ZIP */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pacote Completo Pronto para o GitHub</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black">
            Baixar Todos os Arquivos da VitrineFox (.ZIP)
          </h3>
          <p className="text-xs text-orange-100 max-w-xl mt-1 leading-relaxed">
            Contém todos os 36 arquivos do projeto: código TypeScript, componentes da loja e painel, migração SQL do Supabase, estilos Tailwind, configuração da Vercel e package.json.
          </p>
        </div>

        <a
          href="/uploads/vitrinefox-complete.zip"
          download="vitrinefox-complete.zip"
          className="shrink-0 px-5 py-3 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Baixar ZIP Completo</span>
        </a>
      </div>

      {/* Cards de Etapas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Etapa 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs mb-3">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Criar Banco no Supabase</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crie um projeto em <strong>supabase.com</strong> e execute o script SQL abaixo no SQL Editor.
            </p>
          </div>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Ir para Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Etapa 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs mb-3">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Enviar ao GitHub</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Extraia o arquivo .ZIP e envie ao seu repositório <strong>tomebare44-dot/Vitrinefox</strong> via Git ou pelo botão "Upload files" no GitHub.
            </p>
          </div>
          <a
            href="https://github.com/tomebare44-dot/Vitrinefox"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Abrir Repositório GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Etapa 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mb-3">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Deploy na Vercel</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Importe o repositório na Vercel, adicione as variáveis de ambiente e o site estará no ar em segundos.
            </p>
          </div>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ir para Vercel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Caixa de Código SQL com botão Copiar */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-orange-400" />
            <div>
              <h4 className="font-bold text-white text-sm">Script SQL Completo (PostgreSQL / Supabase)</h4>
              <p className="text-xs text-slate-400">Inclui tabelas, relacionamentos, restrições e políticas de RLS.</p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto max-h-80 leading-relaxed scrollbar-thin">
          {sqlMigrationCode}
        </pre>
      </div>

      {/* Variáveis de Ambiente Necessárias */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Key className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-base">Variáveis de Ambiente na Vercel</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-orange-700 block mb-1">VITE_SUPABASE_URL</span>
            <p className="text-slate-600">A URL do seu projeto Supabase (ex: https://xyzcompany.supabase.co).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-mono font-bold text-orange-700 block mb-1">VITE_SUPABASE_ANON_KEY</span>
            <p className="text-slate-600">A chave pública (anon/public key) encontrada em Project Settings &gt; API no Supabase.</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Segurança da Senha:</strong> A senha de acesso administrativo <code>felipe123!</code> é verificada de forma criptográfica no backend da VitrineFox, garantindo que nunca seja exposta no navegador ou no pacote JavaScript público.
        </p>
      </div>
    </div>
  );
};
