import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Package, 
  Eye, 
  EyeOff,
  Filter,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, Category } from '../../types';
import { formatBRL } from '../../lib/validation';
import { ProductFormModal } from './ProductFormModal';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onToggleActive: (id: string) => Promise<void>;
  onUpdateStock: (id: string, stock: number) => Promise<void>;
  onOpenCreateCategory?: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  categories,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleActive,
  onUpdateStock,
  onOpenCreateCategory,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'out_of_stock'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Confirmação de exclusão
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtragem
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category_id === selectedCat;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.is_active;
    if (statusFilter === 'inactive') matchesStatus = !p.is_active;
    if (statusFilter === 'out_of_stock') matchesStatus = p.stock === 0;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, data);
    } else {
      await onCreateProduct(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo: Título e Botão de Adicionar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gerenciamento de Produtos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadastre, edite, controle estoque e mantenha sua vitrine sincronizada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateCategory && (
            <button
              onClick={onOpenCreateCategory}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
              title="Criar nova categoria para seus produtos"
            >
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Nova Categoria</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Busca */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou detalhes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Somente Ativos</option>
            <option value="inactive">Somente Inativos</option>
            <option value="out_of_stock">Esgotados (Estoque 0)</option>
          </select>
        </div>
      </div>

      {/* Lista de Produtos (Tabela em desktop, Cards em celular) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">Nenhum produto cadastrado com esses critérios.</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "Adicionar Produto" acima para cadastrar novos itens.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3">Preço</th>
                  <th className="py-3 px-3 text-center">Estoque</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Imagem e Nome */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_path}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate" title={p.name}>
                            {p.name}
                          </p>
                          <a
                            href={p.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-orange-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <span>Link Shopee</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                        {p.category_name || 'Sem categoria'}
                      </span>
                    </td>

                    {/* Preço */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{formatBRL(p.price)}</div>
                      {p.previous_price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatBRL(p.previous_price)}
                        </div>
                      )}
                    </td>

                    {/* Estoque com ajuste rápido */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                          className="w-5 h-5 rounded-md hover:bg-white text-slate-600 flex items-center justify-center font-bold"
                          title="Diminuir estoque"
                        >
                          -
                        </button>
                        <span className={`px-1.5 font-bold text-xs ${
                          p.stock === 0 ? 'text-red-600' : p.stock <= 5 ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {p.stock}
                        </span>
                        <button
                          onClick={() => onUpdateStock(p.id, p.stock + 1)}
                          className="w-5 h-5 rounded-md hover:bg-white text-slate-600 flex items-center justify-center font-bold"
                          title="Aumentar estoque"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Status Ativo/Inativo */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleActive(p.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar visibilidade"
                      >
                        {p.is_active ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                          title="Editar produto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        productToEdit={editingProduct}
        categories={categories}
        onOpenCreateCategory={onOpenCreateCategory}
      />

      {/* Modal de Confirmação de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Tem certeza de que deseja excluir o produto <strong>"{productToDelete.name}"</strong>? Esta ação removerá o produto do banco de dados e da vitrine pública.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
