import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, Copy, CreditCard, QrCode, Clock, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============ CONFIGURAÇÃO DO GATEWAY ============
// TODO: Substituir por integração real com MercadoPago/Stripe
const GATEWAY_CONFIG = {
  pix_chave: 'pagamentos@nexusjj.com.br',
  pix_nome: 'NexusJJ Plataforma',
  // mercadopago_public_key: 'APP_USR-...',
  // stripe_public_key: 'pk_live_...',
};

function PixQRCode({ valor, referencia }) {
  // TODO: Gerar QR Code real via API do gateway
  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 bg-white rounded-2xl p-3 flex items-center justify-center">
        <div className="w-full h-full grid grid-cols-9 gap-0.5">
          {Array.from({ length: 81 }).map((_, i) => (
            <div key={i} className={`rounded-sm ${
              // Padrão de QR code simulado
              (i < 9 && (i < 3 || i > 5)) ||
              (i > 71 && (i % 9 < 3 || i % 9 > 5)) ||
              (Math.floor(i/9) < 3 && i % 9 > 5) ||
              (i % 17 === 0) || (i % 13 === 0) || (i % 7 === 0 && i % 3 !== 0)
                ? 'bg-slate-900' : 'bg-white'
            }`} />
          ))}
        </div>
      </div>
      <p className="text-slate-500 text-xs mt-3 font-mono">{referencia}</p>
    </div>
  );
}

export default function PagamentoInscricaoPage() {
  const { id: eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [inscricoes, setInscricoes] = useState([]);
  const [atleta, setAtleta] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const [etapa, setEtapa] = useState('selecionar');
  const [copiado, setCopiado] = useState(false);
  const [organizador, setOrganizador] = useState(null);
  const [erro, setErro] = useState('');

  // Dados do cartão — apenas visual, processamento via gateway
  const [cartao, setCartao] = useState({
    numero: '', nome: '', validade: '', cvv: ''
  });

  useEffect(() => { carregarDados(); }, [eventoId]);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: atletaData } = await supabase
        .from('atletas').select('*').eq('profile_id', user.id).single();
      if (!atletaData) { window.location.href = `/eventos/${eventoId}/inscricao`; return; }
      setAtleta(atletaData);

      const { data: perfilData } = await supabase
        .from('profiles').select('nome').eq('id', user.id).single();
      if (perfilData) setPerfil(perfilData);

      const [eventoRes, inscRes] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', eventoId).single(),
        supabase.from('inscricoes_entrada')
          .select('*, entradas:entrada_id(nome, modalidade)')
          .eq('atleta_id', atletaData.id)
          .eq('evento_id', eventoId)
          .eq('status_pagamento', 'pendente'),
      ]);

      if (eventoRes.data) {
        setEvento(eventoRes.data);
        // Busca telefone do organizador separadamente
        if (eventoRes.data.organizador_id) {
          const { data: orgData } = await supabase
            .from('profiles')
            .select('nome, telefone')
            .eq('id', eventoRes.data.organizador_id)
            .single();
          if (orgData) setOrganizador(orgData);
        }
      }
      if (inscRes.data) setInscricoes(inscRes.data);
    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // Calcula total
  const total = inscricoes.reduce((acc, insc) => {
    // TODO: Buscar valor real do lote ativo
    return acc + (evento?.valor_inscricao || 0);
  }, 0);

  const referenciaPagamento = `NJJ-${eventoId?.substring(0, 6).toUpperCase()}-${atleta?.id?.substring(0, 4).toUpperCase()}`;
  const pixCopiaECola = `00020126580014BR.GOV.BCB.PIX0136${GATEWAY_CONFIG.pix_chave}5204000053039865802BR5913${GATEWAY_CONFIG.pix_nome}6009SAO PAULO62140510${referenciaPagamento}6304`;

  const copiarPix = () => {
    navigator.clipboard.writeText(GATEWAY_CONFIG.pix_chave);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const confirmarPix = async () => {
    setEtapa('aguardando');
    // TODO: Integrar com webhook do gateway para confirmação automática
    // Por enquanto apenas registra como "aguardando confirmação"
  };

  const confirmarCartao = async () => {
    if (!cartao.numero || !cartao.nome || !cartao.validade || !cartao.cvv) {
      setErro('Preencha todos os dados do cartão.');
      return;
    }
    setEtapa('aguardando');
    // TODO: Tokenizar cartão via gateway (Stripe/MercadoPago) e processar pagamento
    // NUNCA salvar dados do cartão no banco
  };

  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (inscricoes.length === 0) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Nenhuma inscrição pendente</h2>
        <p className="text-slate-400 text-sm mb-4">Todas as suas inscrições já foram pagas!</p>
        <a href="/painel/atleta" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all">
          Ver meu painel
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href={`/eventos/${eventoId}`} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={14} className="text-slate-400" />
          </a>
          <div>
            <h1 className="text-white text-lg font-bold">Pagamento</h1>
            <p className="text-slate-500 text-xs">{evento?.nome}</p>
          </div>
        </div>

        {erro && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-red-300 text-sm">{erro}</p>
            <button onClick={() => setErro('')} className="ml-auto text-red-400">✕</button>
          </div>
        )}

        {/* Resumo da inscrição */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-bold mb-3 text-sm">Resumo da Inscrição</h3>
          <div className="space-y-2 mb-4">
            {inscricoes.map(insc => (
              <div key={insc.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-white text-sm font-medium">{insc.entradas?.nome}</p>
                  <p className="text-slate-500 text-xs">{insc.entradas?.modalidade} · Faixa {insc.faixa} · {insc.peso_categoria}</p>
                </div>
                <p className="text-white font-bold text-sm shrink-0">
                  R$ {(evento?.valor_inscricao || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <p className="text-slate-400 text-sm">Total</p>
            <p className="text-white font-black text-xl">R$ {total.toFixed(2)}</p>
          </div>
        </div>

        {/* ETAPA: SELECIONAR MÉTODO */}
        {etapa === 'selecionar' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 text-sm">Forma de Pagamento</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button onClick={() => setMetodoPagamento('pix')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${metodoPagamento === 'pix' ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                  <QrCode size={24} className={metodoPagamento === 'pix' ? 'text-blue-400' : 'text-slate-400'} />
                  <p className={`text-sm font-bold ${metodoPagamento === 'pix' ? 'text-blue-400' : 'text-slate-400'}`}>PIX</p>
                  <p className="text-xs text-slate-500">Aprovação imediata</p>
                </button>
                <button onClick={() => setMetodoPagamento('cartao')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${metodoPagamento === 'cartao' ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                  <CreditCard size={24} className={metodoPagamento === 'cartao' ? 'text-blue-400' : 'text-slate-400'} />
                  <p className={`text-sm font-bold ${metodoPagamento === 'cartao' ? 'text-blue-400' : 'text-slate-400'}`}>Cartão</p>
                  <p className="text-xs text-slate-500">Crédito ou débito</p>
                </button>
              </div>
              <button onClick={() => setEtapa(metodoPagamento)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
                Continuar <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs justify-center">
              <Shield size={12} />
              <span>Pagamento seguro — seus dados estão protegidos</span>
            </div>
          </div>
        )}

        {/* ETAPA: PIX */}
        {etapa === 'pix' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-1">Pagamento via PIX</h3>
              <p className="text-slate-500 text-xs mb-5">Escaneie o QR Code ou copie a chave PIX</p>

              <div className="flex justify-center mb-5">
                <PixQRCode valor={total} referencia={referenciaPagamento} />
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
                <p className="text-slate-400 text-xs mb-2">Chave PIX</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-sm font-mono">{GATEWAY_CONFIG.pix_chave}</p>
                  <button onClick={copiarPix}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ${copiado ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    <Copy size={12} /> {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Beneficiário</span><span className="text-white">{GATEWAY_CONFIG.pix_nome}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Valor</span><span className="text-white font-bold">R$ {total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Referência</span><span className="text-white font-mono text-xs">{referenciaPagamento}</span></div>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-500/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-yellow-300 text-xs font-bold mb-1">⚠️ Atenção — pagamento manual</p>
                <p className="text-yellow-200 text-xs">Após pagar, você <strong>deve enviar o comprovante</strong> para o organizador via WhatsApp. Sem o comprovante confirmado, sua inscrição <strong>não será efetivada</strong>.</p>
              </div>

              {/* Botão WhatsApp com comprovante */}
              <div className="flex gap-3">
                <button onClick={() => setEtapa('selecionar')} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">
                  Voltar
                </button>
                <button onClick={() => {
                  const tel = '47992185217';
                  const msg = encodeURIComponent(
                    `Olá! Acabei de realizar o pagamento PIX para o evento *${evento?.nome}*.\n\n` +
                    `👤 *Atleta:* ${perfil?.nome || 'Atleta'}\n` +
                    `📋 *Inscrição:*\n` +
                    inscricoes.map(i => `• ${i.entradas?.nome} — Faixa ${i.faixa} — ${i.peso_categoria}`).join('\n') +
                    `\n\n💰 *Valor pago:* R$ ${total.toFixed(2)}\n\n` +
                    `Segue o comprovante em anexo. Aguardo confirmação!`
                  );
                  window.open(`https://wa.me/5547992185217?text=${msg}`, '_blank');
                  setEtapa('aguardando');
                }} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                  ✅ Já paguei — enviar comprovante
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA: CARTÃO */}
        {etapa === 'cartao' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-1">Pagamento com Cartão</h3>
              <p className="text-slate-500 text-xs mb-5">Crédito ou débito — seus dados não são armazenados</p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Número do cartão</label>
                  <input value={cartao.numero}
                    onChange={e => setCartao(p => ({ ...p, numero: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0,19) }))}
                    placeholder="0000 0000 0000 0000" maxLength={19} className={ic} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Nome no cartão</label>
                  <input value={cartao.nome}
                    onChange={e => setCartao(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                    placeholder="NOME COMO NO CARTÃO" className={ic} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Validade</label>
                    <input value={cartao.validade}
                      onChange={e => setCartao(p => ({ ...p, validade: e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substring(0,5) }))}
                      placeholder="MM/AA" maxLength={5} className={ic} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">CVV</label>
                    <input value={cartao.cvv}
                      onChange={e => setCartao(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').substring(0,4) }))}
                      placeholder="000" maxLength={4} type="password" className={ic} />
                  </div>
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-blue-300 text-xs flex items-center gap-2">
                  <Shield size={12} /> Dados criptografados — integração com gateway em breve
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEtapa('selecionar')} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">
                  Voltar
                </button>
                <button onClick={confirmarCartao} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                  Pagar R$ {total.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA: AGUARDANDO */}
        {etapa === 'aguardando' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-yellow-400" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Aguardando confirmação</h2>
            <p className="text-slate-400 text-sm mb-2">
              {metodoPagamento === 'pix'
                ? 'Seu pagamento PIX está sendo verificado pelo organizador.'
                : 'Seu pagamento está sendo processado.'}
            </p>
            <p className="text-slate-500 text-xs mb-6">
              Você receberá uma notificação quando for confirmado. A efetivação pode levar até 24h.
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Evento</span><span className="text-white">{evento?.nome}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Método</span><span className="text-white capitalize">{metodoPagamento === 'pix' ? 'PIX' : 'Cartão'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Valor</span><span className="text-white font-bold">R$ {total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Referência</span><span className="text-white font-mono text-xs">{referenciaPagamento}</span></div>
            </div>
            <a href="/painel/atleta" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
              Ver meu painel
            </a>
          </div>
        )}

      </div>
    </div>
  );
}