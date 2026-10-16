import { CartItem, AdminSession } from '../types';

const CART_STORAGE_KEY = 'vitrinefox_cart_v1';
const ADMIN_SESSION_KEY = 'vitrinefox_admin_session';

/**
 * Carrega itens da sacola persistidos localmente
 */
export function getSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && item.product && typeof item.quantity === 'number');
    }
    return [];
  } catch (error) {
    console.error('Falha ao ler carrinho do armazenamento:', error);
    return [];
  }
}

/**
 * Salva a sacola atualizada no navegador
 */
export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Falha ao gravar carrinho no armazenamento:', error);
  }
}

/**
 * Limpa a sacola do cliente
 */
export function clearSavedCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Falha ao limpar carrinho:', error);
  }
}

/**
 * Recupera sessão administrativa salva (se existir e não tiver expirado)
 */
export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    
    if (session && session.expiresAt) {
      if (new Date(session.expiresAt).getTime() > Date.now()) {
        return session;
      }
    }
    // Expirou
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

/**
 * Armazena a sessão administrativa válida
 */
export function saveAdminSession(session: AdminSession): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Falha ao salvar sessão administrativa:', error);
  }
}

/**
 * Remove a sessão administrativa (logout)
 */
export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {
    console.error('Falha ao encerrar sessão:', error);
  }
}
