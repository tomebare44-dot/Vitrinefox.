import React, { useState } from 'react';
import { 
  TrendingUp, 
  ExternalLink, 
  MousePointerClick, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Clock, 
  DollarSign, 
  Info,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { ConfirmedOrder, Product } from '../../types';
import { formatBRL } from '../../lib/validation';

interface SalesReportsViewProps {
  orders: ConfirmedOrder[];
  totalShopeeClicks: number;
  products: Product[];
  onRecordManualSale: (data: {
    customer_name?: string;
    total_amount: number;
    commission_earned?: number;
    notes?: string;
    items?: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }>;
  }) => Promise<void>;
}

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  orders,
  totalShopeeClicks,
  products,
  onRecordManualSale,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Métricas reais
  const confirmedSalesCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.commission_earned || 0), 0);

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(totalAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Informe um valor de venda válido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedProd = products.find(p => p.id === selectedProductId);
      await onRecordManualSale({
        customer_name: customerName || 'Venda Confirmada Shopee',
        total_amount: val,
        commission_earned: commission ? Number(commission) : 0,
        notes: notes || 'Registrado manualmente pelo dono após conciliação no painel de afiliados Shopee.',
        items: selectedProd ? [{
          product_id: selectedProd.id,
          product_name: selectedProd.name,
          quantity: 1,
          unit_price: selectedProd.price,
        }] : [],
      });

      setIsModalOpen(false);
      setCustomerName('');
      setTotalAmount('');
      setCommission('');
      setNotes('');
      setSelectedProductId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo e Botão */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Relatório de Vendas & Tráfego de Afiliados
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Diferenciação precisa entre tráfego de saída (Shopee) e vendas confirmadas pelo dono.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venda Confirmada</span>
        </button>
      </div>

      {/* Caixa de Transparência sobre a Shopee */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">Aviso sobre Métricas e Afiliados Shopee:</strong>
          <p>
            Um clique no botão "Comprar" ou "Finalizar" é registrado como <strong>Evento de Saída / Redirecionamento</strong>, e não como venda concluída. Como o pagamento ocorre diretamente nos servidores da Shopee, o valor de <strong>Vendas Confirmadas</strong> é informado manualmente pelo proprietário com base no relatório oficial do seu Programa de Afiliados Shopee.
          </p>
        </div>
      </div>

      {/* Cards de Métricas Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Saídas para Shopee */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cliques na Shopee</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalShopeeClicks}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Eventos de redirecionamento</span>
          </div>
        </div>

        {/* Vendas Registradas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas Confirmadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{confirmedSalesCount}</span>
            <span className="text-xs text-emerald-600 font-medium block mt-0.5">Registros manuais do dono</span>
          </div>
        </div>

        {/* Volume Total Confirmado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volume de Vendas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatBRL(totalRevenue)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Baseado em relatórios</span>
          </div>
        </div>

        {/* Comissões Estimadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Comissão Estimada</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600">{formatBRL(totalCommission)}</span>
            <span className="text-xs text-purple-500 font-medium block mt-0.5">Ganhos informados</span>
          </div>
        </div>
      </div>

      {/* Histórico de Vendas Registradas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Histórico de Vendas Confirmadas</h3>
            <p className="text-xs text-slate-500">Registros validados pelo proprietário.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
            {orders.length} registros
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">Nenhuma venda manual registrada até o momento.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Quando seus clientes concluírem compras na Shopee e as comissões aparecerem no painel da Shopee, registre aqui para manter seu histórico sincronizado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-3">Origem</th>
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Valor da Venda</th>
                  <th className="py-3 px-3">Comissão</th>
                  <th className="py-3 px-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                      {ord.id.slice(0, 14)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                        {ord.source === 'shopee_manual' ? 'Shopee Afiliados' : 'Registro Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {new Date(ord.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatBRL(ord.total_amount)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      {formatBRL(ord.commission_earned || 0)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={ord.notes}>
                      {ord.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro de Venda Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Registrar Venda Confirmada</h3>
            <p className="text-xs text-slate-500 mb-4">
              Insira os dados obtidos no seu extrato de comissões do painel de afiliados Shopee.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitSale} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Valor Total da Compra (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Ex: 149.90"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Comissão Recebida (R$) <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Ex: 14.99"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Produto Associado <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                >
                  <option value="">Selecione o produto (opcional)...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observações / ID do Pedido Shopee
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pedido #230914Shopee - Comprado com cupom 10%"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Gravando...' : 'Salvar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
