-- =========================================================================
-- MIGRATION SQL - VITRINEFOX
-- Compatível com PostgreSQL / Supabase
-- Tabelas, Relacionamentos, Índices, Triggers e Row Level Security (RLS)
-- =========================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABELA DE CATEGORIAS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para busca e ordenação rápida
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories (is_active);

-- -------------------------------------------------------------------------
-- 2. TABELA DE PRODUTOS
-- -------------------------------------------------------------------------
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

-- Índices para buscas na vitrine
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products (stock);

-- -------------------------------------------------------------------------
-- 3. TABELA DE USUÁRIOS ADMINISTRADORES / PERFIS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 4. TABELA DE EVENTOS DE CLIQUES / SAÍDAS PARA A SHOPEE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('shopee_click', 'shopee_redirect', 'view_product')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_click_events_product ON public.click_events (product_id);
CREATE INDEX IF NOT EXISTS idx_click_events_created ON public.click_events (created_at DESC);

-- -------------------------------------------------------------------------
-- 5. TABELA DE PEDIDOS E VENDAS REGISTRADAS
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 6. ITENS DOS PEDIDOS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- -------------------------------------------------------------------------
-- 7. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON public.products;
CREATE TRIGGER trigger_update_products_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_categories_timestamp ON public.categories;
CREATE TRIGGER trigger_update_categories_timestamp
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- CATEGORIAS:
-- Visitantes anônimos podem visualizar categorias ativas
CREATE POLICY "Categorias ativas visíveis publicamente"
    ON public.categories
    FOR SELECT
    USING (is_active = TRUE OR auth.role() = 'authenticated');

-- Administrador autenticado pode criar, atualizar e excluir categorias
CREATE POLICY "Administradores gerenciam categorias"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- PRODUTOS:
-- Visitantes anônimos podem visualizar apenas produtos ativos
CREATE POLICY "Produtos ativos visíveis publicamente"
    ON public.products
    FOR SELECT
    USING (is_active = TRUE OR auth.role() = 'authenticated');

-- Administrador autenticado pode gerenciar produtos
CREATE POLICY "Administradores gerenciam produtos"
    ON public.products
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- CLIQUES:
-- Qualquer visitante pode registrar um clique (INSERT de telemetria)
CREATE POLICY "Público pode registrar evento de clique"
    ON public.click_events
    FOR INSERT
    TO public
    WITH CHECK (TRUE);

-- Somente administrador autenticado pode ler os relatórios de eventos
CREATE POLICY "Somente administradores visualizam eventos"
    ON public.click_events
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- PEDIDOS E ITENS:
-- Apenas administradores autenticados têm acesso a pedidos e vendas
CREATE POLICY "Somente administradores acessam pedidos"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Somente administradores acessam itens de pedidos"
    ON public.order_items
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- -------------------------------------------------------------------------
-- 9. CONFIGURAÇÃO DO BUCKET DO SUPABASE STORAGE (product-images)
-- -------------------------------------------------------------------------
-- Executar no console SQL do Supabase para criar o bucket de imagens de produtos:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública para imagens dos produtos
CREATE POLICY "Imagens públicas de produtos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');

-- Upload e exclusão restritos a usuários autenticados (admin)
CREATE POLICY "Administradores enviam imagens"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Administradores alteram imagens"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images');

CREATE POLICY "Administradores deletam imagens"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');
