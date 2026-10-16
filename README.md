# 🦊 VitrineFox

> Loja virtual de cards com painel administrativo secreto, banco de dados persistente, links de afiliados Shopee e controle de estoque em tempo real.

---

## 🚀 Sobre a VitrineFox

A **VitrineFox** é uma aplicação completa e pronta para produção construída com React 19, TypeScript, Vite, Tailwind CSS e Node.js/Express, com suporte nativo e migração pronta para **Supabase (PostgreSQL)** e implantação descomplicada no **GitHub** e **Vercel**.

### ✨ Principais Funcionalidades

1. **Vitrine Pública Responsiva**:
   - Totalmente acessível sem login para qualquer visitante.
   - Grade com **exatamente 2 cards por linha no celular** (`grid-cols-2`) e expansão fluida para tablets e desktops.
   - Imagens em proporção quadrada perfeita (`aspect-square`), sem distorção.
   - Destaque para preços atuais e anteriores com cálculo automático de `% OFF`.
   - Selos de disponibilidade em tempo real: *Em estoque* (verde), *Poucas unidades* (amarelo) e *Esgotado* (vermelho).
   - Busca em tempo real e filtro por categorias.
   - Estado vazio profissional quando o banco de dados não possui produtos.

2. **Sacola de Compras Flutuante**:
   - Botão fixo no **canto inferior esquerdo** da tela (`fixed bottom-5 left-5 z-40`).
   - Contador de itens com animação.
   - Painel lateral com lista de produtos, controle de quantidade (`+` / `-`), remoção e subtotais.
   - **Validação de estoque no servidor**: antes de qualquer compra, o estoque de cada item é verificado para evitar compras de produtos esgotados.
   - Persistência no `localStorage` do navegador para sobreviver a recarregamentos de página.

3. **Links Oficiais de Afiliados Shopee**:
   - Validação estrita de URLs oficiais (`https://shopee.com.br`, `https://shope.ee`, etc.).
   - Redirecionamento seguro com `rel="noopener noreferrer"`.
   - Rastreamento transparente de cliques de saída sem confundir com vendas concluídas.

4. **Painel Administrativo Secreto do Dono**:
   - **Mecanismo Discreto**: acessado clicando **15 vezes consecutivas na logo da VitrineFox** no cabeçalho.
   - Intervalo máximo de 2.5s entre cliques; caso contrário, a contagem reinicia.
   - **Segurança Real no Servidor**: A senha inicial `felipe123!` é validada via hash criptográfico HMAC SHA-256 no backend, com controle de taxa de tentativas (Rate Limiting de 5 tentativas).
   - Sessão segura por token (12 horas). Não requer os 15 cliques enquanto a sessão for válida.
   - Botão para sair do painel (Logout) a qualquer momento.

5. **Gerenciamento Completo no Painel**:
   - **Dashboard com Métricas Reais**: Total de produtos, ativos, categorias, cliques Shopee, pedidos confirmados, produtos com estoque baixo e produtos esgotados.
   - **Gerenciador de Produtos**: Criar com upload de imagem da galeria (JPG, PNG, WebP), editar, excluir com confirmação, ajuste rápido de estoque e toggle de ativo/inativo.
   - **Gerenciador de Categorias**: Criar, editar e excluir com proteção contra exclusão acidental de categorias com produtos vinculados.
   - **Relatório de Vendas**: Histórico de saídas para a Shopee vs. Vendas confirmadas manualmente pelo proprietário com base no painel de afiliados.
   - **Botão para Carregar Catálogo Inicial**: Permite ao dono carregar um catálogo demonstrativo com 7 achadinhos reais com um clique se o banco estiver vazio.

---

## 🔐 Acesso Administrativo Inicial

- **Como abrir**: Dê **15 cliques rápidos na logo da VitrineFox** no cabeçalho.
- **Senha inicial**: `felipe123!`
- **Segurança**: A senha nunca é transmitida ou salva em texto puro e não existe em variáveis públicas `VITE_*`.

---

## 🗄️ Banco de Dados (Supabase / PostgreSQL)

O arquivo `supabase-migration.sql` contém a estrutura completa para o seu banco:

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. No menu lateral, acesse **SQL Editor**.
3. Copie todo o conteúdo de `supabase-migration.sql` e clique em **Run**.
4. Acesse **Project Settings > API** e copie:
   - `Project URL`
   - `Project API anon key`
5. Adicione no seu arquivo `.env` ou nas configurações da Vercel:
   ```bash
   VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
   VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
   ```

---

## 📦 Como Publicar no GitHub e na Vercel

### 1. Enviar para o GitHub
```bash
git init
git add .
git commit -m "feat: VitrineFox completa e funcional"
git branch -M main
git remote add origin https://github.com/seu-usuario/vitrinefox.git
git push -u origin main
```

### 2. Conectar e Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **Add New Project** e selecione o repositório da `vitrinefox`.
3. Em **Framework Preset**, a Vercel detectará **Vite**.
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` (se estiver usando Supabase)
   - `VITE_SUPABASE_ANON_KEY` (se estiver usando Supabase)
5. Clique em **Deploy**.
6. O arquivo `vercel.json` incluído no projeto já configura os redirecionamentos para SPA sem erros de página 404 ao atualizar.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Express, Node.js Crypto (HMAC SHA-256), Vite Middlewares.
- **Banco de Dados**: Persistência local atômica em JSON + Migração pronta para PostgreSQL / Supabase com RLS.
- **Hospedagem**: Compatível com Vercel, Netlify, Cloud Run e VPS.
