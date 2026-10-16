import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle, 
  Check, 
  ExternalLink,
  DollarSign,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, Category } from '../../types';
import { validateProductData, isValidShopeeUrl } from '../../lib/validation';
import { uploadImage } from '../../services/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
  onOpenCreateCategory?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  categories,
  onOpenCreateCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [previousPrice, setPreviousPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('10');
  const [imagePath, setImagePath] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setPrice(String(productToEdit.price));
      setPreviousPrice(productToEdit.previous_price ? String(productToEdit.previous_price) : '');
      setCategoryId(productToEdit.category_id);
      setStock(String(productToEdit.stock));
      setImagePath(productToEdit.image_path);
      setAffiliateUrl(productToEdit.affiliate_url);
      setIsActive(productToEdit.is_active);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setPreviousPrice('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setStock('10');
      setImagePath('');
      setAffiliateUrl('');
      setIsActive(true);
    }
    setErrors({});
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Formato inválido. Use JPG, PNG ou WebP.' }));
      return;
    }

    // Valida tamanho máximo de 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'A imagem deve ter no máximo 5MB.' }));
      return;
    }

    setIsUploading(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });

    try {
      const url = await uploadImage(file);
      setImagePath(url);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, image: err.message || 'Falha no upload da imagem.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateProductData({
      name,
      price,
      previous_price: previousPrice,
      category_id: categoryId,
      stock,
      affiliate_url: affiliateUrl,
      image_path: imagePath,
    });

    if (!imagePath) {
      validation.errors.image = 'Envie uma imagem do produto ou insira um link.';
      validation.isValid = false;
    }

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        previous_price: previousPrice ? Number(previousPrice) : null,
        category_id: categoryId,
        stock: Math.floor(Number(stock)),
        image_path: imagePath.trim(),
        affiliate_url: affiliateUrl.trim(),
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Erro ao salvar produto no banco de dados.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isShopeeValid = affiliateUrl ? isValidShopeeUrl(affiliateUrl) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-8 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <p className="text-xs text-slate-500">
                Preencha os dados reais para sincronizar com a vitrine pública.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Produto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fone de Ouvido Bluetooth Sem Fio TWS"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-200'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do Produto <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, especificações e diferenciais do produto..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all resize-none"
            />
          </div>

          {/* Linha Dupla: Preço e Preço Anterior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preço de Venda (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49.90"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                    errors.price ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-200'
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Preço Anterior <span className="text-slate-400 font-normal">(Risco de desconto)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={previousPrice}
                  onChange={(e) => setPreviousPrice(e.target.value)}
                  placeholder="89.90"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Linha Dupla: Categoria e Estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Categoria <span className="text-red-500">*</span>
                </label>
                {onOpenCreateCategory && (
                  <button
                    type="button"
                    onClick={onOpenCreateCategory}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                  >
                    + Criar Categoria
                  </button>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                  errors.category_id ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-200'
                }`}
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estoque Disponível <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                  errors.stock ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-200'
                }`}
              />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Link de Afiliado Shopee com Validação em Tempo Real */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Link de Afiliado da Shopee <span className="text-red-500">*</span>
              </label>
              {affiliateUrl && (
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                  isShopeeValid ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {isShopeeValid ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Domínio Shopee Oficial
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Insira link shopee.com.br ou shope.ee
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://shope.ee/..."
                className={`w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                  errors.affiliate_url ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-200'
                }`}
              />
              <ExternalLink className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {errors.affiliate_url && <p className="text-xs text-red-500 mt-1">{errors.affiliate_url}</p>}
          </div>

          {/* Upload e Imagem do Produto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Imagem do Produto <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Botão de Upload de Arquivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 text-orange-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span>Enviando foto...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Enviar da galeria (JPG, PNG, WebP)</span>
                  </>
                )}
              </button>

              {/* Ou link direto */}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="Ou cole a URL direta da imagem..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Preview da foto se existir */}
              {imagePath && (
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                  <img
                    src={imagePath}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
          </div>

          {/* Toggle de Ativo/Inativo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Produto Ativo na Vitrine</span>
              <span className="text-[11px] text-slate-500">Se desativado, o produto ficará invisível para os visitantes.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-hidden ${
                isActive ? 'bg-orange-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isActive ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Botões do Formulário */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no banco...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{productToEdit ? 'Salvar Alterações' : 'Criar Produto'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
