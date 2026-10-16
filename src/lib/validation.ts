/**
 * Utilitários de validação e formatação para a VitrineFox
 */

// Domínios válidos e oficiais da Shopee e do programa de afiliados Shopee
const VALID_SHOPEE_DOMAINS = [
  'shopee.com.br',
  'shope.ee',
  's.shopee.com.br',
  'shopee.com',
  'br.shp.ee',
  'my.shp.ee',
  'shp.ee',
];

/**
 * Valida se uma URL é HTTPS e pertence aos domínios autorizados da Shopee
 */
export function isValidShopeeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();

  try {
    const parsed = new URL(cleanUrl);
    // Deve ser estritamente HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return VALID_SHOPEE_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Formata valores numéricos para a moeda brasileira (BRL)
 */
export function formatBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Calcula a porcentagem de desconto entre o preço anterior e o preço atual
 */
export function calculateDiscount(currentPrice: number, previousPrice?: number | null): number | null {
  if (!previousPrice || previousPrice <= currentPrice || previousPrice <= 0) {
    return null;
  }
  const discount = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
  return discount > 0 ? discount : null;
}

/**
 * Valida o formulário de cadastro/edição de produtos
 */
export interface ProductValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateProductData(data: {
  name: string;
  price: number | string;
  previous_price?: number | string | null;
  category_id: string;
  stock: number | string;
  affiliate_url: string;
  image_path?: string;
}): ProductValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'O nome do produto é obrigatório (mínimo de 2 caracteres).';
  }

  const numPrice = Number(data.price);
  if (isNaN(numPrice) || numPrice <= 0) {
    errors.price = 'O preço de venda deve ser maior que zero.';
  }

  if (data.previous_price !== undefined && data.previous_price !== null && data.previous_price !== '') {
    const numPrevPrice = Number(data.previous_price);
    if (isNaN(numPrevPrice) || numPrevPrice < 0) {
      errors.previous_price = 'O preço anterior deve ser um número positivo.';
    }
  }

  if (!data.category_id || data.category_id.trim() === '') {
    errors.category_id = 'Selecione uma categoria válida para o produto.';
  }

  const numStock = Number(data.stock);
  if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
    errors.stock = 'O estoque deve ser um número inteiro igual ou maior que zero.';
  }

  if (!data.affiliate_url || !isValidShopeeUrl(data.affiliate_url)) {
    errors.affiliate_url = 'Insira um link HTTPS oficial da Shopee (ex: https://shope.ee/... ou https://shopee.com.br/...).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
