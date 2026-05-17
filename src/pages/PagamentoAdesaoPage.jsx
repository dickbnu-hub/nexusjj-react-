import { useState } from 'react';
import { CreditCard, QrCode, CheckCircle, Lock, ChevronDown, AlertCircle, Copy, Check } from 'lucide-react';

const GATEWAYS = [
  { valor: 'mercadopago', label: 'Mercado Pago' },
  { valor: 'pagseguro', label: 'PagSeguro' },
  { valor: 'safe2pay', label: 'Safe2Pay' },
  { valor: 'stripe', label: 'Stripe' },
];

const PIX_CHAVE = '11.222.333/0001-44'; // Chave Pix da NexusJJ
const PIX_NOME = 'NexusJJ Plataforma LTDA';
const VALOR = 500;

export default function PagamentoAdesaoPage() {
  const [metodoPag, setMetodoPag] = useState('cartao');
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erros, setErros] = useState({});
  const [comprovantePreview, setComprovantePreview] = useState(null);

  const [cartao, setCartao] = useState({
    numero: '', nome: '', validade: '', cvv: '', parcelas: '1',
  });

  const formatarCartao = (v) =>
    v.replace(/\D/g, '').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1 $2').slice(0, 19);

  const formatarValidade = (v) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);

  const inputClass = (campo) =>
    `w-full bg-slate-800 border ${erros[campo] ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors`;

  const copiarPix = () => {
    navigator.clipboard.writeText(PIX_CHAVE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const validarCartao = () => {
    const e = {};
    if (!cartao.numero || cartao.numero.length < 19) e.numero = 'Número do cartão inválido.';
    if (!cartao.nome.trim()) e.nome = 'Nome do titular é obrigatório.';
    if (!cartao.validade || cartao.validade.length < 5) e.validade = 'Validade inválida.';
    if (!cartao.cvv || cartao.cvv.length < 3) e.cvv = 'CVV inválido.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (metodoPag === 'cartao') {
      const novosErros = validarCartao();
      if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }
    }
    if (metodoPag === 'comprovante' && !comprovantePreview) {
      setErros({ comprovante: 'Envie o comprovante de pagamento.' });
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSucesso(true); }, 1800);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {metodoPag === 'comprovante' ? 'Comprovante enviado!' : 'Pagamento realizado!'}
          </h2>
          <p className="text-slate-400 mb-2">
            {metodoPag === 'comprovante'
              ? 'A NexusJJ irá verificar seu comprovante e ativar seu perfil em até 24 horas.'
              : 'Seu pagamento está sendo processado. A NexusJJ irá verificar e ativar seu perfil em breve.'}
          </p>
          <p className="text-slate-500 text-sm mb-6">Você receberá uma confirmação por email.</p>
          <a href="/" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
            Ir para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">Nexus<span className="text-blue-500">JJ</span></span>
          </a>
          <h1 className="text-2xl font-bold text-white">Taxa de Adesão</h1>
          <p className="text-slate-400 text-sm mt-1">Pagamento único para ativar seu perfil de organizador</p>
        </div>

        {/* Resumo do valor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Taxa de adesão — Organizador</p>
            <p className="text-white font-semibold mt-0.5">Acesso vitalício à plataforma NexusJJ</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">R$ {VALOR}</p>
            <p className="text-slate-500 text-xs">pagamento único</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">

          {/* MÉTODO DE PAGAMENTO */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
              Forma de Pagamento
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { valor: 'cartao', label: 'Cartão', icon: <CreditCard size={18} /> },
                { valor: 'pix', label: 'Pix', icon: <QrCode size={18} /> },
                { valor: 'comprovante', label: 'Comprovante', icon: <Copy size={18} /> },
              ].map(m => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => { setMetodoPag(m.valor); setErros({}); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${metodoPag === m.valor ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* CARTÃO DE CRÉDITO */}
          {metodoPag === 'cartao' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-2">
                <p className="text-slate-400 text-xs mb-3">Selecione o gateway de pagamento:</p>
                <div className="grid grid-cols-2 gap-2">
                  {GATEWAYS.map(g => (
                    <button key={g.valor} type="button"
                      className="py-2 px-3 bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all">
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Número do Cartão *</label>
                <input
                  value={cartao.numero}
                  onChange={e => setCartao(p => ({ ...p, numero: formatarCartao(e.target.value) }))}
                  placeholder="0000 0000 0000 0000"
                  className={inputClass('numero')}
                />
                {erros.numero && <p className="text-red-400 text-xs mt-1">{erros.numero}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome no Cartão *</label>
                <input
                  value={cartao.nome}
                  onChange={e => setCartao(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                  placeholder="NOME COMO NO CARTÃO"
                  className={inputClass('nome')}
                />
                {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Validade *</label>
                  <input
                    value={cartao.validade}
                    onChange={e => setCartao(p => ({ ...p, validade: formatarValidade(e.target.value) }))}
                    placeholder="MM/AA"
                    className={inputClass('validade')}
                  />
                  {erros.validade && <p className="text-red-400 text-xs mt-1">{erros.validade}</p>}
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CVV *</label>
                  <input
                    value={cartao.cvv}
                    onChange={e => setCartao(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="000"
                    className={inputClass('cvv')}
                  />
                  {erros.cvv && <p className="text-red-400 text-xs mt-1">{erros.cvv}</p>}
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Parcelas</label>
                  <div className="relative">
                    <select
                      value={cartao.parcelas}
                      onChange={e => setCartao(p => ({ ...p, parcelas: e.target.value }))}
                      className={`${inputClass('parcelas')} appearance-none pr-8`}
                    >
                      <option value="1">1x R$ 500</option>
                      <option value="2">2x R$ 250</option>
                      <option value="5">5x R$ 100</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Lock size={12} />
                <span>Pagamento seguro e criptografado</span>
              </div>
            </div>
          )}

          {/* PIX */}
          {metodoPag === 'pix' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center">
                {/* QR Code simulado */}
                <div className="w-40 h-40 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-400 text-xs mb-3">Ou copie a chave Pix abaixo:</p>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5">
                  <span className="text-white text-sm flex-1 text-left">{PIX_CHAVE}</span>
                  <button type="button" onClick={copiarPix} className="text-purple-400 hover:text-purple-300 transition-colors">
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {copiado && <p className="text-green-400 text-xs mt-2">Chave copiada!</p>}
                <p className="text-slate-500 text-xs mt-3">Beneficiário: <strong className="text-slate-300">{PIX_NOME}</strong></p>
                <p className="text-slate-500 text-xs">Valor: <strong className="text-white">R$ {VALOR},00</strong></p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 flex gap-3">
                <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">
                  Após realizar o pagamento via Pix, clique em <strong>"Confirmar Pagamento"</strong> abaixo. A NexusJJ irá verificar e ativar seu perfil em até 2 horas úteis.
                </p>
              </div>
            </div>
          )}

          {/* COMPROVANTE MANUAL */}
          {metodoPag === 'comprovante' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <p className="text-white text-sm font-medium mb-1">Dados para transferência manual:</p>
                <div className="space-y-2 mt-3">
                  {[
                    { label: 'Banco', valor: 'Nubank' },
                    { label: 'Chave Pix (CNPJ)', valor: PIX_CHAVE },
                    { label: 'Beneficiário', valor: PIX_NOME },
                    { label: 'Valor', valor: 'R$ 500,00' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-white font-medium">{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Envie o comprovante *</label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${erros.comprovante ? 'border-red-500' : 'border-slate-700 hover:border-purple-500'}`}>
                  <label className="cursor-pointer">
                    {comprovantePreview ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <Check size={20} />
                        <span className="text-sm font-medium">Comprovante enviado</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Copy size={24} className="text-slate-500" />
                        <p className="text-slate-300 text-sm font-medium">Clique para enviar o comprovante</p>
                        <p className="text-slate-500 text-xs">PDF, JPG ou PNG</p>
                      </div>
                    )}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { if (e.target.files[0]) setComprovantePreview(e.target.files[0].name); setErros(er => ({ ...er, comprovante: '' })); }} className="hidden" />
                  </label>
                </div>
                {erros.comprovante && <p className="text-red-400 text-xs mt-1">{erros.comprovante}</p>}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 flex gap-3">
                <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">
                  Após enviar o comprovante, a NexusJJ irá verificar e ativar seu perfil em até <strong>24 horas úteis</strong>.
                </p>
              </div>
            </div>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </span>
            ) : metodoPag === 'cartao' ? `Pagar R$ ${VALOR},00` : metodoPag === 'pix' ? 'Confirmar Pagamento' : 'Enviar Comprovante'}
          </button>

          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
            <Lock size={11} />
            <span>Transação segura e protegida pela NexusJJ</span>
          </div>
        </form>
      </div>
    </div>
  );
}