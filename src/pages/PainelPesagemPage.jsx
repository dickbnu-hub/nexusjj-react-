import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, AlertCircle, Scale, Clock, LogOut, Camera, X, ArrowLeftRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ===== LOGIN =====
function LoginPesagem({ onLogin, eventoNome }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { setErro('Preencha email e senha.'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) { setErro('Email ou senha inválidos.'); return; }
      onLogin(data.user);
    } catch(e) { setErro('Erro ao fazer login.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Scale size={24} className="text-blue-400"/>
          </div>
          <h1 className="text-white font-bold text-xl">Painel de Pesagem</h1>
          <p className="text-slate-500 text-sm mt-1">{eventoNome || 'Carregando...'}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" autoFocus
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}/>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1">Senha</label>
            <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}/>
          </div>
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MODAL PESAGEM =====
function ModalPesagem({ atleta, operador, onSalvar, onFechar, categoriasDisponiveis }) {
  const jaFoiPesado = atleta.pesagem === 'ok' || atleta.pesagem === 'desclassificado';
  const [confirmouEdicao, setConfirmouEdicao] = useState(!jaFoiPesado);
  const [peso, setPeso] = useState(atleta.peso ? String(atleta.peso) : '');
  const [acao, setAcao] = useState(atleta.pesagem === 'desclassificado' ? 'desclassificado' : 'ok');
  const [novaEntradaId, setNovaEntradaId] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const p = parseFloat(peso.replace(',', '.'));
    if (!peso || isNaN(p) || p <= 0) { setErro('Informe um peso válido.'); return; }
    if (acao === 'mudar_categoria' && !novaEntradaId) { setErro('Selecione a nova categoria.'); return; }
    setSalvando(true);
    try {
      await onSalvar({ atleta, acao, peso: p, novaEntradaId });
    } finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border-2 ${atleta.pesagem === 'desclassificado' ? 'border-red-500/60' : atleta.pesagem === 'ok' ? 'border-green-500/40' : 'border-slate-800'}`}>

        {atleta.pesagem === 'desclassificado' && (
          <div className="bg-red-950/80 border-b border-red-500/40 px-5 py-3 rounded-t-2xl flex items-center gap-3">
            <XCircle size={18} className="text-red-400 shrink-0"/>
            <div className="flex-1">
              <p className="text-red-300 font-black text-sm">⚠️ ATLETA JÁ DESCLASSIFICADO</p>
              <p className="text-red-400/70 text-xs mt-0.5">{atleta.peso}kg · por {atleta.staffP}</p>
            </div>
          </div>
        )}
        {atleta.pesagem === 'ok' && (
          <div className="bg-green-950/60 border-b border-green-500/30 px-5 py-3 rounded-t-2xl flex items-center gap-3">
            <CheckCircle size={18} className="text-green-400 shrink-0"/>
            <div className="flex-1">
              <p className="text-green-300 font-black text-sm">✅ ATLETA JÁ PESADO</p>
              <p className="text-green-400/70 text-xs mt-0.5">{atleta.peso}kg · por {atleta.staffP}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 p-5 border-b border-slate-800">
          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-black text-2xl shrink-0">
            {(atleta.nome || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight">{atleta.nome}</h3>
            <p className="text-slate-400 text-sm mt-0.5">{atleta.academia}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">Faixa {atleta.faixa}</span>
            </div>
          </div>
          <button onClick={onFechar} className="text-slate-500 hover:text-white shrink-0"><X size={18}/></button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
          <p className="text-slate-400 text-xs">Categoria</p>
          <p className="text-white text-sm font-semibold">{atleta.categoria}</p>
        </div>

        {jaFoiPesado && !confirmouEdicao ? (
          <div className="p-5 space-y-4">
            <div className="bg-yellow-950/50 border border-yellow-500/30 rounded-xl px-4 py-3">
              <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ Atleta já pesado</p>
              <p className="text-yellow-400/80 text-xs">Qualquer alteração ficará registrada com seu nome e horário.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onFechar} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => setConfirmouEdicao(true)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl text-sm">Confirmar Edição</button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-medium block mb-2">Peso aferido (kg)</label>
              <input value={peso} onChange={e => setPeso(e.target.value)} type="number" step="0.1"
                placeholder="ex: 75.4" autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-2xl font-black focus:outline-none focus:border-blue-500 text-center"/>
            </div>

            <div className="space-y-2">
              {[
                { id: 'ok', label: 'PESAGEM OK', desc: 'Dentro do peso — liberar para lutar', cor: 'green', icon: <CheckCircle size={18}/> },
                { id: 'desclassificado', label: 'DESCLASSIFICADO', desc: 'Acima do peso — adversário avança', cor: 'red', icon: <XCircle size={18}/> },
                { id: 'mudar_categoria', label: 'MUDAR CATEGORIA', desc: 'Atleta opta por categoria maior', cor: 'yellow', icon: <ArrowLeftRight size={18}/> },
              ].map(op => (
                <button key={op.id} onClick={() => setAcao(op.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${acao === op.id ? `border-${op.cor}-500 bg-${op.cor}-500/10` : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                  <span className={acao === op.id ? `text-${op.cor}-400` : 'text-slate-500'}>{op.icon}</span>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${acao === op.id ? `text-${op.cor}-400` : 'text-slate-300'}`}>{op.label}</p>
                    <p className="text-slate-500 text-xs">{op.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {acao === 'mudar_categoria' && (
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-2">Nova categoria</label>
                <select value={novaEntradaId} onChange={e => setNovaEntradaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500">
                  <option value="">Selecione...</option>
                  {categoriasDisponiveis.filter(c => c.id !== atleta.entrada_id).map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {erro && <p className="text-red-400 text-xs">{erro}</p>}

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-500">Operador</span>
              <span className="text-slate-300 font-medium">{operador?.user_metadata?.nome || operador?.email}</span>
            </div>

            <button onClick={salvar} disabled={salvando}
              className={`w-full font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 ${acao === 'ok' ? 'bg-green-600 hover:bg-green-500 text-white' : acao === 'desclassificado' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}>
              {salvando ? 'Salvando...' : 'Salvar Pesagem'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== PAINEL PRINCIPAL =====
export default function PainelPesagemPage() {
  const { eventoId } = useParams();
  const [operador, setOperador] = useState(null);
  const [autorizado, setAutorizado] = useState(false);
  const [evento, setEvento] = useState(null);
  const [inscricoes, setInscricoes] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [atletaModal, setAtletaModal] = useState(null);
  const [ultimaAcao, setUltimaAcao] = useState(null);
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [modoScanner, setModoScanner] = useState(false);
  const [codigoScanner, setCodigoScanner] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const i = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    carregarEvento();
    verificarSessao();
  }, [eventoId]);

  useEffect(() => {
    if (modoScanner && scannerRef.current) scannerRef.current.focus();
  }, [modoScanner]);

  const carregarEvento = async () => {
    const { data } = await supabase.from('eventos').select('id, nome').eq('id', eventoId).single();
    if (data) setEvento(data);
  };

  const verificarSessao = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setOperador(user);
      await verificarAutorizacao(user.id);
    }
    setLoading(false);
  };

  const verificarAutorizacao = async (userId) => {
    // Verifica se é organizador do evento ou colaborador cadastrado
    const [orgRes, colabRes] = await Promise.all([
      supabase.from('eventos').select('id').eq('id', eventoId).eq('organizador_id', userId).single(),
      supabase.from('colaboradores').select('id').eq('evento_id', eventoId).eq('profile_id', userId).eq('ativo', true).single(),
    ]);
    if (orgRes.data || colabRes.data) {
      setAutorizado(true);
      await carregarInscricoes();
    } else {
      setAutorizado(false);
    }
  };

  const carregarInscricoes = async () => {
    try {
      const [inscRes, entRes] = await Promise.all([
        supabase.from('inscricoes_entrada')
          .select('*, atletas:atleta_id(id, faixa, academia, pesagem, peso_pesagem, staff_pesagem, hora_pesagem, profile_id), entradas:entrada_id(id, nome, modalidade)')
          .eq('evento_id', eventoId)
          .eq('aprovado', true),
        supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true),
      ]);
      if (inscRes.data) {
        // Carrega nomes dos atletas e lutas separadamente
        const profileIds = [...new Set(inscRes.data.map(i => i.atletas?.profile_id).filter(Boolean))];
        const atletaIds = [...new Set(inscRes.data.map(i => i.atleta_id).filter(Boolean))];
        
        let nomes = {};
        if (profileIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, nome').in('id', profileIds);
          if (profilesData) nomes = Object.fromEntries(profilesData.map(p => [p.id, p.nome]));
        }

        let lutasMap = {};
        if (atletaIds.length > 0) {
          const { data: lutasData } = await supabase
            .from('lutas')
            .select('id, numero, fase, atleta1_id, atleta2_id, area_id, areas:area_id(nome)')
            .eq('evento_id', eventoId);
          if (lutasData) {
            lutasData.forEach(l => {
              if (l.atleta1_id) lutasMap[l.atleta1_id] = l;
              if (l.atleta2_id) lutasMap[l.atleta2_id] = l;
            });
          }
        }

        const inscComNomes = inscRes.data.map(i => ({
          ...i,
          atletas: i.atletas ? {
            ...i.atletas,
            nome: nomes[i.atletas.profile_id] || 'Sem nome',
            luta: lutasMap[i.atleta_id] || null,
          } : null,
        }));
        setInscricoes(inscComNomes);
      }
      if (entRes.data) setEntradas(entRes.data);
    } catch(e) { console.error(e); }
  };

  const handleLogin = async (user) => {
    setOperador(user);
    await verificarAutorizacao(user.id);
  };

  const handleSalvarPesagem = async ({ atleta, acao, peso, novaEntradaId }) => {
    const operadorNome = operador?.user_metadata?.nome || operador?.email || 'Operador';
    const hora = new Date().toISOString();
    const pesagemStatus = acao === 'ok' ? 'ok' : acao === 'desclassificado' ? 'desclassificado' : 'ok';

    // Atualiza estado local imediatamente
    setInscricoes(prev => prev.map(insc => {
      if (insc.atleta_id !== atleta.atleta_id) return insc;
      return {
        ...insc,
        atletas: {
          ...insc.atletas,
          pesagem: pesagemStatus,
          peso_pesagem: peso,
          staff_pesagem: operadorNome,
          hora_pesagem: hora,
        },
        entrada_id: acao === 'mudar_categoria' && novaEntradaId ? novaEntradaId : insc.entrada_id,
      };
    }));

    // Salva no banco
    await supabase.from('atletas').update({
      pesagem: pesagemStatus,
      peso_pesagem: peso,
      staff_pesagem: operadorNome,
      hora_pesagem: hora,
    }).eq('id', atleta.atleta_id);

    if (acao === 'mudar_categoria' && novaEntradaId) {
      await supabase.from('inscricoes_entrada').update({
        entrada_id: novaEntradaId,
      }).eq('id', atleta.id);
    }

    setUltimaAcao({ acao, nome: atleta.nome, peso, novaCategoria: entradas.find(e => e.id === novaEntradaId)?.nome });
    setTimeout(() => setUltimaAcao(null), 5000);
    setAtletaModal(null);
  };

  const handleScanner = (e) => {
    if (e.key === 'Enter') {
      const found = atletasFormatados.find(a =>
        a.id === codigoScanner.trim() ||
        a.nome?.toLowerCase().includes(codigoScanner.toLowerCase())
      );
      if (found) setAtletaModal(found);
      setCodigoScanner('');
    }
  };

  // Formata inscrições para exibição
  const atletasFormatados = inscricoes.map(insc => {
    const luta = insc.atletas?.luta;
    return {
      id: insc.id,
      atleta_id: insc.atleta_id,
      nome: insc.atletas?.nome || 'Sem nome',
      academia: insc.atletas?.academia || '—',
      faixa: insc.atletas?.faixa || 'Branca',
      categoria: insc.entradas?.nome || '—',
      entrada_id: insc.entrada_id,
      pesagem: insc.atletas?.pesagem || 'pendente',
      peso: insc.atletas?.peso_pesagem,
      staffP: insc.atletas?.staff_pesagem,
      horaP: insc.atletas?.hora_pesagem ? new Date(insc.atletas.hora_pesagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null,
      area: luta?.areas?.nome || 'Sem área',
      lutaId: luta ? `#${luta.numero}` : '—',
      fase: luta?.fase || '—',
    };
  });

  const atletasFiltrados = atletasFormatados.filter(a => {
    const buscaOk = !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.academia.toLowerCase().includes(busca.toLowerCase()) || a.categoria.toLowerCase().includes(busca.toLowerCase());
    const statusOk = filtroStatus === 'todos' || a.pesagem === filtroStatus;
    const areaOk = filtroArea === 'todas' || a.area === filtroArea;
    return buscaOk && statusOk && areaOk;
  });

  const areas = ['todas', ...new Set(atletasFormatados.map(a => a.area))];
  const totalOk = atletasFormatados.filter(a => a.pesagem === 'ok').length;
  const totalPendente = atletasFormatados.filter(a => a.pesagem === 'pendente').length;
  const totalDesc = atletasFormatados.filter(a => a.pesagem === 'desclassificado').length;
  const total = atletasFormatados.length;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!operador) return <LoginPesagem onLogin={handleLogin} eventoNome={evento?.nome}/>;

  if (!autorizado) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-400"/>
        </div>
        <p className="text-white font-bold text-lg mb-2">Acesso não autorizado</p>
        <p className="text-slate-400 text-sm mb-4">Você não tem permissão para acessar o painel de pesagem deste evento.</p>
        <button onClick={() => { supabase.auth.signOut(); setOperador(null); setAutorizado(false); }}
          className="bg-slate-800 border border-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm">
          Fazer login com outra conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
              <Scale size={18} className="text-blue-400"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Painel de Pesagem</h1>
              <p className="text-slate-500 text-xs">{evento?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={11}/>{horaAtual.toLocaleTimeString('pt-BR')}</span>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400"/>
              <p className="text-slate-300 text-xs font-medium">{operador?.user_metadata?.nome || operador?.email}</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); setOperador(null); setAutorizado(false); }}
              className="flex items-center gap-1 text-slate-500 hover:text-red-400 text-xs transition-colors">
              <LogOut size={12}/> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* STATS */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', valor: total, cor: 'text-white', bg: 'bg-slate-900 border-slate-800' },
            { label: 'Pesados', valor: totalOk, cor: 'text-green-400', bg: 'bg-green-950/30 border-green-500/20' },
            { label: 'Pendentes', valor: totalPendente, cor: 'text-red-400', bg: 'bg-red-950/30 border-red-500/20' },
            { label: 'Desc.', valor: totalDesc, cor: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-500/20' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-4 text-center ${s.bg}`}>
              <p className={`font-black text-3xl ${s.cor}`}>{s.valor}</p>
              <p className="text-slate-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progresso */}
        {total > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between mb-1.5">
              <p className="text-slate-400 text-xs">Progresso da pesagem</p>
              <p className="text-white text-xs font-bold">{Math.round((totalOk / total) * 100)}%</p>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${(totalOk / total) * 100}%` }}/>
            </div>
          </div>
        )}

        {/* BUSCA + SCANNER */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-3.5 text-slate-500"/>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, academia, categoria..."
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500"/>
          </div>
          <button onClick={() => setModoScanner(m => !m)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${modoScanner ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}>
            <Camera size={15}/> {modoScanner ? 'Scanner Ativo' : 'Usar Scanner'}
          </button>
        </div>

        {modoScanner && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Camera size={16} className="text-blue-400 shrink-0 animate-pulse"/>
            <p className="text-blue-300 text-sm flex-1">Scanner ativo — aponte o leitor para a credencial do atleta</p>
            <input ref={scannerRef} value={codigoScanner} onChange={e => setCodigoScanner(e.target.value)}
              onKeyDown={handleScanner} className="opacity-0 w-1 h-1 absolute"/>
            <button onClick={() => setModoScanner(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-0.5">
            {[{ id:'todos', label:'Todos' }, { id:'pendente', label:'🔴 Pendente' }, { id:'ok', label:'🟢 Pesado' }, { id:'desclassificado', label:'❌ Desc.' }].map(f => (
              <button key={f.id} onClick={() => setFiltroStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtroStatus === f.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none">
            {areas.map(a => <option key={a} value={a}>{a === 'todas' ? 'Todas as áreas' : a}</option>)}
          </select>
        </div>

        {/* NOTIFICAÇÃO ÚLTIMA AÇÃO */}
        {ultimaAcao && (
          <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${ultimaAcao.acao === 'ok' ? 'bg-green-950/50 border-green-500/30' : ultimaAcao.acao === 'desclassificado' ? 'bg-red-950/50 border-red-500/30' : 'bg-yellow-950/50 border-yellow-500/30'}`}>
            {ultimaAcao.acao === 'ok' ? <CheckCircle size={16} className="text-green-400 shrink-0"/> : ultimaAcao.acao === 'desclassificado' ? <XCircle size={16} className="text-red-400 shrink-0"/> : <ArrowLeftRight size={16} className="text-yellow-400 shrink-0"/>}
            <p className="text-white text-sm">
              <strong>{ultimaAcao.nome}</strong>
              {ultimaAcao.acao === 'ok' && ` — ✅ pesagem OK: ${ultimaAcao.peso}kg`}
              {ultimaAcao.acao === 'desclassificado' && ` — ❌ desclassificado (${ultimaAcao.peso}kg)`}
              {ultimaAcao.acao === 'mudar_categoria' && ` — movido para: ${ultimaAcao.novaCategoria}`}
            </p>
          </div>
        )}

        {/* LISTA DE ATLETAS */}
        <div className="space-y-2">
          {atletasFiltrados.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <Search size={32} className="text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-sm">Nenhum atleta encontrado.</p>
            </div>
          ) : atletasFiltrados.map(atleta => {
            const isOk = atleta.pesagem === 'ok';
            const isDesc = atleta.pesagem === 'desclassificado';
            return (
              <div key={atleta.id} className={`border rounded-2xl flex items-center gap-3 px-4 py-3 transition-all ${isOk ? 'border-green-500/20 bg-green-950/10' : isDesc ? 'border-orange-500/20 bg-orange-950/10' : 'border-slate-800 bg-slate-900'}`}>
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${isOk ? 'bg-green-950/50 border-green-500/40' : isDesc ? 'bg-orange-950/50 border-orange-500/40' : 'bg-red-950/30 border-red-500/20'}`}>
                  {isOk ? <CheckCircle size={16} className="text-green-400"/> : isDesc ? <XCircle size={16} className="text-orange-400"/> : <AlertCircle size={16} className="text-red-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{atleta.nome}</p>
                  <p className="text-slate-500 text-xs">{atleta.academia} · Faixa {atleta.faixa}</p>
                  <p className="text-slate-600 text-xs">{atleta.categoria} · {atleta.area}</p>
                  {(isOk || isDesc) && atleta.horaP && (
                    <p className="text-slate-600 text-xs">Pesado às {atleta.horaP} por {atleta.staffP}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {isOk && <p className="text-green-400 font-bold text-sm">{atleta.peso}kg</p>}
                  {isDesc && <p className="text-orange-400 font-bold text-sm">{atleta.peso}kg ⚠️</p>}
                  {!isOk && !isDesc && <p className="text-red-400 text-xs font-bold">Não pesou</p>}
                </div>
                <button onClick={() => setAtletaModal(atleta)}
                  className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all shrink-0 ${!isOk && !isDesc ? 'bg-green-600/20 hover:bg-green-600 border-green-500/30 hover:border-green-500 text-green-400 hover:text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'}`}>
                  {!isOk && !isDesc ? 'PESAR' : 'EDITAR'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {atletaModal && (
        <ModalPesagem
          atleta={atletaModal}
          operador={operador}
          onSalvar={handleSalvarPesagem}
          onFechar={() => setAtletaModal(null)}
          categoriasDisponiveis={entradas}
        />
      )}
    </div>
  );
}