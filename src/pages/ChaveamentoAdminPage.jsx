import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, Shuffle, AlertCircle, CheckCircle, ArrowLeftRight, RotateCcw, ChevronDown, ChevronUp, Clock, Users, Settings } from 'lucide-react';

const TEMPO_FAIXA = { Branca: 5, Azul: 6, Roxa: 7, Marrom: 8, Preta: 10 };

const FORMATOS_CHAVE = [
  { id: 'eliminacao', label: 'Eliminação Simples', desc: 'Padrão mata-mata com BYE automático' },
  { id: 'chave3_repescagem', label: 'Chave de 3 — Repescagem', desc: 'Perdedor tem chance de voltar e disputar o título' },
  { id: 'melhor_de_3', label: 'Melhor de 3 (Bo3)', desc: 'Apenas 2 atletas — vence quem ganhar 2 lutas' },
  { id: 'round_robin', label: 'Round Robin', desc: 'Todos contra todos, qualquer número de atletas' },
];

const OPCOES_TERCEIRO = [
  { id: 'dois_bronzes', label: 'Dois Bronzes (sem disputa)', desc: 'Ambos perdedores de semi são 3º — padrão IBJJF' },
  { id: 'um_bronze', label: 'Um Bronze (sem disputa)', desc: 'Só quem perdeu para o campeão na semi é 3º' },
  { id: 'com_disputa', label: 'Com disputa de 3º lugar', desc: 'Os dois perdedores de semi lutam pelo bronze' },
];

// Dados carregados do banco via useEffect

function detectarFormatoPadrao(n) {
  if (n === 2) return 'melhor_de_3';
  if (n === 3) return 'chave3_repescagem';
  return 'eliminacao';
}

function calcularByes(n) {
  if (n <= 1 || n === 3) return 0;
  let pot = 1;
  while (pot < n) pot *= 2;
  return pot - n;
}

function sortearAtletas(atletas) {
  const emb = [...atletas].sort(() => Math.random() - 0.5);
  const result = [];
  const usados = new Set();
  emb.forEach(a => {
    if (!usados.has(a.id)) {
      result.push(a);
      usados.add(a.id);
      const par = emb.find(b => !usados.has(b.id) && b.academia !== a.academia);
      if (par) { result.push(par); usados.add(par.id); }
      else {
        const qualquer = emb.find(b => !usados.has(b.id));
        if (qualquer) { result.push(qualquer); usados.add(qualquer.id); }
      }
    }
  });
  return result;
}

function gerarLutas(atletas, formato) {
  const sorted = sortearAtletas(atletas);
  if (formato === 'round_robin') {
    const lutas = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        lutas.push({ a1: sorted[i], a2: sorted[j], bye: false });
      }
    }
    return lutas;
  }
  if (formato === 'chave3_repescagem') {
    return [
      { a1: sorted[0], a2: sorted[1], bye: false, descricao: 'Luta 1 — Classificatória' },
      { a1: null, a2: sorted[2], bye: false, descricao: 'Luta 2 — Vencedor L1 vs ' + sorted[2]?.nome, tbd: true },
      { a1: null, a2: null, bye: false, descricao: 'Luta 3 — Final (se necessário)', tbd: true, condicional: true },
    ];
  }
  if (formato === 'melhor_de_3') {
    return [
      { a1: sorted[0], a2: sorted[1], bye: false, descricao: 'Partida 1' },
      { a1: sorted[0], a2: sorted[1], bye: false, descricao: 'Partida 2' },
      { a1: sorted[0], a2: sorted[1], bye: false, descricao: 'Partida 3 (se necessário)', condicional: true },
    ];
  }
  // Eliminação simples
  const lutas = [];
  for (let i = 0; i < sorted.length; i += 2) {
    if (i + 1 < sorted.length) {
      lutas.push({ a1: sorted[i], a2: sorted[i + 1], bye: false });
    } else {
      lutas.push({ a1: sorted[i], a2: null, bye: true });
    }
  }
  return lutas;
}

function temMesmaAcademia(lutas) {
  return lutas.some(l => !l.bye && l.a1 && l.a2 && l.a1.academia === l.a2.academia);
}

export default function ChaveamentoAdminPage() {
  const { id: eventoId } = useParams();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [configs, setConfigs] = useState({});

  useEffect(() => {
    if (!eventoId) return;
    carregarCategorias();
  }, [eventoId]);

  const carregarCategorias = async () => {
    setLoading(true);
    setErro('');
    try {
      // Busca chaves do evento com inscrições aprovadas
      const { data: chavesBanco, error } = await supabase
        .from('chaves')
        .select(`
          id,
          categoria_id,
          formato,
          terceiro_lugar,
          publicada,
          entradas:entrada_id(id, nome, modalidade),
          blocos_classe:categoria_id(
            id, tipo, nome,
            valores_bloco(id, nome, faixas, genero, peso_min, peso_max)
          )
        `)
        .eq('evento_id', eventoId);

      if (error) throw error;

      // Para cada chave, busca as inscrições aprovadas
      const cats = await Promise.all((chavesBanco || []).map(async (chave) => {
        const { data: inscricoes } = await supabase
          .from('inscricoes_entrada')
          .select(`
            id, faixa, peso_categoria, aprovado, status_pagamento,
            atletas:atleta_id(
              id, academia,
              profiles:profile_id(nome)
            )
          `)
          .eq('evento_id', eventoId)
          .eq('entrada_id', chave.entrada_id || chave.entradas?.id)
          .in('status_pagamento', ['aprovado', 'pago', 'confirmado']);

        const atletas = (inscricoes || []).map(i => ({
          id: i.id,
          atletaId: i.atletas?.id,
          nome: i.atletas?.profiles?.nome?.toUpperCase() || 'SEM NOME',
          academia: i.atletas?.academia || '—',
          faixa: i.faixa,
          efetivado: i.aprovado !== false,
        }));

        return {
          id: chave.id,
          nome: chave.entradas?.nome || `Categoria ${chave.id}`,
          tipo: chave.entradas?.modalidade || 'Gi',
          faixa: atletas[0]?.faixa || '—',
          peso: '—',
          publicada: chave.publicada,
          formato_salvo: chave.formato,
          terceiro_salvo: chave.terceiro_lugar,
          atletas,
        };
      }));

      setCategorias(cats);

      // Init configs
      const c = {};
      cats.forEach(cat => {
        const ef = cat.atletas.filter(a => a.efetivado);
        c[cat.id] = {
          formato: cat.formato_salvo || detectarFormatoPadrao(ef.length),
          terceiro: cat.terceiro_salvo || 'dois_bronzes',
        };
      });
      setConfigs(c);

    } catch(e) {
      setErro('Erro ao carregar categorias: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  const [chaves, setChaves] = useState({});
  const [geradas, setGeradas] = useState({});
  const [abertas, setAbertas] = useState({});
  const [confirmandoReset, setConfirmandoReset] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [trocando, setTrocando] = useState({ catId: null, posA: null });
  const [mostrarConfig, setMostrarConfig] = useState({});

  const toggleAberta = (id) => setAbertas(p => ({ ...p, [id]: !p[id] }));
  const toggleConfig = (id) => setMostrarConfig(p => ({ ...p, [id]: !p[id] }));

  const atualizarConfig = (catId, campo, valor) => {
    setConfigs(p => ({ ...p, [catId]: { ...p[catId], [campo]: valor } }));
    // Reset chave se mudar configuração
    if (geradas[catId]) {
      setGeradas(p => ({ ...p, [catId]: false }));
      setChaves(p => { const n = { ...p }; delete n[catId]; return n; });
    }
  };

  const gerarChave = async (catId) => {
    const cat = categorias.find(c => c.id === catId);
    const ef = cat.atletas.filter(a => a.efetivado);
    const formato = configs[catId]?.formato || 'eliminacao';
    const lutas = gerarLutas(ef, formato);
    setChaves(p => ({ ...p, [catId]: lutas }));
    setGeradas(p => ({ ...p, [catId]: true }));
    setSucesso(catId);
    setTimeout(() => setSucesso(null), 3000);
    // Salva formato no banco
    try {
      await supabase.from('chaves').update({
        formato: formato,
        terceiro_lugar: configs[catId]?.terceiro || 'dois_bronzes',
      }).eq('id', catId);
    } catch(e) { console.error('Erro ao salvar formato:', e); }
  };

  const resetarChave = (catId) => {
    setChaves(p => { const n = { ...p }; delete n[catId]; return n; });
    setGeradas(p => ({ ...p, [catId]: false }));
    setConfirmandoReset(null);
  };

  const trocarAtletas = (catId, posA, posB) => {
    setChaves(prev => {
      const lutas = [...(prev[catId] || [])];
      const [liA, lA] = posA;
      const [liB, lB] = posB;
      const atletaA = lA === 0 ? lutas[liA].a1 : lutas[liA].a2;
      const atletaB = lB === 0 ? lutas[liB].a1 : lutas[liB].a2;
      if (lA === 0) lutas[liA] = { ...lutas[liA], a1: atletaB };
      else lutas[liA] = { ...lutas[liA], a2: atletaB };
      if (lB === 0) lutas[liB] = { ...lutas[liB], a1: atletaA };
      else lutas[liB] = { ...lutas[liB], a2: atletaA };
      return { ...prev, [catId]: lutas };
    });
    setTrocando({ catId: null, posA: null });
  };

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-6">{erro}</div>
        )}
        {!loading && categorias.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">Nenhuma categoria encontrada para este evento.</p>
            <p className="text-sm mt-2">Configure as categorias em "Configurar Categorias" primeiro.</p>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-white font-bold text-2xl flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" /> Gerenciar Chaveamento
          </h1>
          <p className="text-slate-400 text-sm mt-1">Copa NexusJJ 2026 · Configure e gere as chaves por categoria</p>
        </div>

        <div className="space-y-3">
          {categorias.map(cat => {
            const ef = cat.atletas.filter(a => a.efetivado);
            const naoEf = cat.atletas.filter(a => !a.efetivado);
            const cfg = configs[cat.id] || {};
            const chave = chaves[cat.id] || [];
            const gerada = geradas[cat.id] || false;
            const aberta = abertas[cat.id] || false;
            const configAberta = mostrarConfig[cat.id] || false;
            const tempo = TEMPO_FAIXA[cat.faixa] || 5;
            const byes = cfg.formato === 'eliminacao' ? calcularByes(ef.length) : 0;
            const formatoLabel = FORMATOS_CHAVE.find(f => f.id === cfg.formato)?.label || '';
            const terceiroLabel = OPCOES_TERCEIRO.find(t => t.id === cfg.terceiro)?.label || '';

            return (
              <div key={cat.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${gerada ? 'border-green-500/20' : 'border-slate-800'}`}>

                {/* Header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/20 transition-all"
                  onClick={() => toggleAberta(cat.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded border ${cat.tipo === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{cat.tipo}</span>
                      <h3 className="text-white font-semibold">{cat.nome}</h3>
                      {gerada
                        ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={11} /> Gerada</span>
                        : <span className="text-slate-500 text-xs">Não gerada</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500">
                      <span>{cat.faixa} · {cat.peso}</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {ef.length} efetivados</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {tempo} min</span>
                      <span className="text-slate-400">{formatoLabel}</span>
                      {byes > 0 && <span className="text-yellow-400">{byes} BYE{byes > 1 ? 'S' : ''}</span>}
                      {naoEf.length > 0 && <span className="text-orange-400">⚠️ {naoEf.length} não efetivado(s)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div onClick={e => e.stopPropagation()}>
                      {!gerada ? (
                        <button onClick={() => gerarChave(cat.id)} disabled={ef.length < 2}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
                          <Shuffle size={13} /> Gerar Chave
                        </button>
                      ) : (
                        <button onClick={() => setConfirmandoReset(cat.id)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                          <RotateCcw size={13} /> Resetar
                        </button>
                      )}
                    </div>
                    {aberta ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </div>

                {/* Sucesso geração */}
                {sucesso === cat.id && (
                  <div className="mx-5 mb-3 bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle size={13} className="text-green-400" />
                    <p className="text-green-300 text-sm">Chave gerada! Revise e ajuste se necessário, depois publique.</p>
                  </div>
                )}
                {/* Sucesso publicação */}
                {sucesso === `pub_${cat.id}` && (
                  <div className="mx-5 mb-3 bg-blue-950/50 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <CheckCircle size={13} className="text-blue-400" />
                    <p className="text-blue-300 text-sm">✅ Chave publicada! Atletas e público já podem visualizar.</p>
                  </div>
                )}

                {/* Confirmação reset */}
                {confirmandoReset === cat.id && (
                  <div className="mx-5 mb-3 bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-red-300 text-sm">Resetar apaga a chave. Confirma?</p>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setConfirmandoReset(null)} className="text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800">Cancelar</button>
                      <button onClick={() => resetarChave(cat.id)} className="text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600">Resetar</button>
                    </div>
                  </div>
                )}

                {/* Corpo expandido */}
                {aberta && (
                  <div className="px-5 pb-5 border-t border-slate-800 space-y-4">

                    {/* CONFIGURAÇÕES */}
                    <div className="mt-4">
                      <button onClick={() => toggleConfig(cat.id)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors mb-3">
                        <Settings size={13} /> Configurações da Chave
                        {configAberta ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {configAberta && (
                        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 space-y-4">

                          {/* Formato da chave */}
                          <div>
                            <p className="text-slate-300 text-xs font-bold mb-2">Formato da chave</p>
                            <div className="space-y-1.5">
                              {FORMATOS_CHAVE.filter(f => {
                                if (f.id === 'melhor_de_3') return ef.length === 2;
                                if (f.id === 'chave3_repescagem') return ef.length === 3;
                                return true;
                              }).map(f => (
                                <button key={f.id} onClick={() => atualizarConfig(cat.id, 'formato', f.id)}
                                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${cfg.formato === f.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${cfg.formato === f.id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                                    {cfg.formato === f.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-semibold ${cfg.formato === f.id ? 'text-blue-300' : 'text-slate-300'}`}>{f.label}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3º lugar — só para eliminação simples */}
                          {(cfg.formato === 'eliminacao' && ef.length >= 4) && (
                            <div>
                              <p className="text-slate-300 text-xs font-bold mb-2">3º Lugar</p>
                              <div className="space-y-1.5">
                                {OPCOES_TERCEIRO.map(t => (
                                  <button key={t.id} onClick={() => atualizarConfig(cat.id, 'terceiro', t.id)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${cfg.terceiro === t.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${cfg.terceiro === t.id ? 'border-yellow-500 bg-yellow-500' : 'border-slate-600'}`}>
                                      {cfg.terceiro === t.id && <div className="w-2 h-2 rounded-full bg-black" />}
                                    </div>
                                    <div>
                                      <p className={`text-sm font-semibold ${cfg.terceiro === t.id ? 'text-yellow-300' : 'text-slate-300'}`}>{t.label}</p>
                                      <p className="text-slate-500 text-xs mt-0.5">{t.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CHAVE GERADA */}
                    {!gerada ? (
                      <div className="py-6 text-center border border-dashed border-slate-700 rounded-2xl">
                        <Shuffle size={28} className="text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Configure e clique em "Gerar Chave"</p>
                        {ef.length < 2 && <p className="text-red-400 text-xs mt-1">Mínimo de 2 atletas efetivados necessário.</p>}
                        {naoEf.length > 0 && <p className="text-yellow-400 text-xs mt-1">⚠️ {naoEf.length} não efetivado(s) não entrarão na chave.</p>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{formatoLabel}</p>
                          <p className="text-slate-500 text-xs flex items-center gap-1"><ArrowLeftRight size={11} /> Clique em dois atletas para trocar</p>
                        </div>

                        {/* Alerta troca em curso */}
                        {trocando.catId === cat.id && trocando.posA && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <AlertCircle size={13} className="text-blue-400" />
                            <p className="text-blue-300 text-xs flex-1">Selecione o atleta para trocar</p>
                            <button onClick={() => setTrocando({ catId: null, posA: null })} className="text-slate-500 hover:text-white text-xs">✕</button>
                          </div>
                        )}

                        {/* Alerta mesma academia */}
                        {temMesmaAcademia(chave) && (
                          <div className="bg-yellow-950/50 border border-yellow-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
                            <AlertCircle size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-yellow-300 text-xs">Atletas da mesma academia emparelhados. Troque-os manualmente se necessário.</p>
                          </div>
                        )}

                        {/* Lutas */}
                        <div className="space-y-2">
                          {chave.map((luta, li) => (
                            <div key={li} className={`border rounded-xl overflow-hidden ${luta.bye ? 'border-yellow-500/20 bg-yellow-950/10' : luta.condicional ? 'border-slate-700/40 bg-slate-900/20' : 'border-slate-800 bg-slate-800/30'}`}>
                              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50">
                                <span className="text-slate-500 text-xs font-mono">{luta.descricao || `Luta ${li + 1}`}</span>
                                {luta.bye && <span className="text-yellow-400 text-xs font-bold">BYE — Avança direto</span>}
                                {luta.condicional && <span className="text-slate-500 text-xs italic">Condicional</span>}
                              </div>
                              <div className="p-3 space-y-1.5">
                                {[
                                  { atleta: luta.a1, lado: 'Azul', pos: [li, 0] },
                                  ...(!luta.bye && luta.a2 !== undefined ? [{ atleta: luta.a2, lado: 'Branco', pos: [li, 1] }] : [])
                                ].map(({ atleta, lado, pos }) => {
                                  const selecionado = trocando.catId === cat.id && JSON.stringify(trocando.posA) === JSON.stringify(pos);
                                  const tbd = !atleta || luta.tbd;
                                  return (
                                    <button key={lado}
                                      disabled={tbd}
                                      onClick={() => {
                                        if (tbd) return;
                                        if (trocando.catId === cat.id && trocando.posA) trocarAtletas(cat.id, trocando.posA, pos);
                                        else setTrocando({ catId: cat.id, posA: pos });
                                      }}
                                      className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${tbd ? 'opacity-40 cursor-not-allowed bg-slate-900/40' : selecionado ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-slate-900/60 hover:bg-slate-700/50 border border-transparent hover:border-slate-600 cursor-pointer'}`}>
                                      <div className={`w-3 h-3 rounded-sm shrink-0 ${lado === 'Azul' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{tbd ? 'A definir (TBD)' : atleta?.nome}</p>
                                        {!tbd && <p className="text-slate-500 text-xs truncate">{atleta?.academia}</p>}
                                      </div>
                                      {!tbd && <ArrowLeftRight size={11} className="text-slate-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Resumo configuração */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="text-slate-400">Formato: <strong className="text-white">{formatoLabel}</strong></span>
                          {cfg.formato === 'eliminacao' && ef.length >= 4 && (
                            <span className="text-slate-400">3º Lugar: <strong className="text-white">{terceiroLabel}</strong></span>
                          )}
                          <span className="text-slate-400">Tempo: <strong className="text-white">{tempo} min</strong></span>
                          {byes > 0 && <span className="text-yellow-400 font-bold">{byes} BYE{byes > 1 ? 'S' : ''}</span>}
                        </div>

                        {/* Publicar */}
                        <button onClick={async () => {
                          try {
                            await supabase.from('chaves').update({
                              publicada: true,
                              formato: configs[cat.id]?.formato,
                              terceiro_lugar: configs[cat.id]?.terceiro,
                            }).eq('id', cat.id);
                          } catch(e) { console.error('Erro ao publicar:', e); }
                          setGeradas(p => ({ ...p, [cat.id]: true }));
                          setAbertas(p => ({ ...p, [cat.id]: false }));
                          setSucesso(`pub_${cat.id}`);
                          setTimeout(() => setSucesso(null), 3000);
                        }}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition-all">
                          <CheckCircle size={15} /> Confirmar e Publicar Chave
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}