import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronUp, Download, Mail, Scale, CheckCircle, DollarSign, Edit3, Trash2, X, AlertCircle, FileText, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { buscarEvento } from '../api/eventosService';

// ============ COMPONENTES ============

function ModalComentario({ atleta, onSalvar, onFechar }) {
  const [texto, setTexto] = useState(atleta.comentarioAdmin || '');
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md">
        <h3 className="text-white font-bold mb-1">Comentário — {atleta.nome}</h3>
        <p className="text-slate-500 text-xs mb-3">Sua resposta aparecerá na ficha de inscrição do atleta.</p>
        {atleta.comentarioAtleta && (
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-blue-400 text-xs font-bold mb-1">💬 Mensagem do atleta:</p>
            <p className="text-slate-300 text-xs italic">"{atleta.comentarioAtleta}"</p>
          </div>
        )}
        <div className="mb-3">
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Sua resposta (organização)</label>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={3}
            placeholder="Escreva uma observação ou resposta para o atleta..."
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={() => onSalvar(atleta.id, texto)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ModalEncerrarPesagem({ grupos, gruposSelecionados, onConfirmar, onFechar }) {
  const atletasSemPesar = grupos
    .filter(g => gruposSelecionados.includes(g.id))
    .flatMap(g => g.atletas.filter(a => a.pesagem === 'pendente'));

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Scale size={16} className="text-red-400" /> Encerrar Pesagem</h3>
        <p className="text-slate-400 text-sm mb-4">Os atletas abaixo não pesaram e serão marcados como NO-SHOW:</p>
        {atletasSemPesar.length === 0 ? (
          <div className="bg-green-950/50 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-green-300 text-sm">✅ Todos os atletas já pesaram!</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {atletasSemPesar.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{a.nome}</p>
                  <p className="text-slate-500 text-xs">{a.academia}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onFechar} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
          {atletasSemPesar.length > 0 && (
            <button onClick={() => { onConfirmar(); onFechar(); }} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm">Confirmar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ PÁGINA PRINCIPAL ============


// ============ COMPONENTE ABA LUTA RAPIDA ============
const FAIXAS_ORDEM = ['Branca','Cinza','Amarela','Laranja','Verde','Azul','Roxa','Marrom','Preta'];

function AbaLutaRapida({ eventoId }) {
  const [grupos, setGrupos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [lutasCache, setLutasCache] = useState([]);

  useEffect(() => {
    if (!eventoId) return;
    Promise.all([
      supabase.from('grupos_luta_rapida').select('*').eq('evento_id', eventoId).order('ordem'),
      supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
      // Busca lutas do evento via chaves
      supabase.from('lutas')
        .select('id, tempo_luta, vencedor_id, resultado, chave_id, atleta1_id, atleta2_id, chaves(evento_id, categoria_id)')
        .not('tempo_luta', 'is', null)
        .order('tempo_luta', { ascending: true }),
    ]).then(async ([gr, en, lt]) => {
      if (gr.data) setGrupos(gr.data);
      if (en.data) setEntradas(en.data);

      // Filtra lutas deste evento
      const lutasEvento = (lt.data || []).filter(l => l.chaves?.evento_id === eventoId);

      if (lutasEvento.length > 0) {
        // Busca dados dos atletas vencedores
        const atletaIds = [...new Set([
          ...lutasEvento.map(l => l.vencedor_id),
          ...lutasEvento.map(l => l.atleta1_id),
          ...lutasEvento.map(l => l.atleta2_id),
        ].filter(Boolean))];

        const { data: atletasData } = await supabase
          .from('atletas')
          .select('id, faixa, sexo, academia, profile_id')
          .in('id', atletaIds);

        const { data: profilesData } = atletasData?.length
          ? await supabase.from('profiles').select('id, nome').in('id', atletasData.map(a => a.profile_id).filter(Boolean))
          : { data: [] };

        const atletasMap = {};
        (atletasData || []).forEach(a => {
          const perfil = (profilesData || []).find(p => p.id === a.profile_id);
          atletasMap[a.id] = { ...a, nome: perfil?.nome || 'Atleta' };
        });

        const lutasComDados = lutasEvento.map(l => ({
          ...l,
          vencedor: atletasMap[l.vencedor_id] || null,
          atleta1: atletasMap[l.atleta1_id] || null,
          atleta2: atletasMap[l.atleta2_id] || null,
        }));

        setLutasCache(lutasComDados);
      }
      setLoading(false);
    });
  }, [eventoId]);

  const criarGrupo = async () => {
    if (!novoNome.trim()) return;
    const { data } = await supabase.from('grupos_luta_rapida')
      .insert({ evento_id: eventoId, nome: novoNome.trim(), entradas_ids: [], faixas: [], sexo: 'todos', ativo: true, ordem: grupos.length })
      .select().single();
    if (data) { setGrupos(p => [...p, data]); setNovoNome(''); }
  };

  const removerGrupo = async (id) => {
    if (!window.confirm('Remover este grupo?')) return;
    await supabase.from('grupos_luta_rapida').delete().eq('id', id);
    setGrupos(p => p.filter(g => g.id !== id));
  };

  const atualizarGrupo = async (grupo, campo, valor) => {
    await supabase.from('grupos_luta_rapida').update({ [campo]: valor }).eq('id', grupo.id);
    setGrupos(p => p.map(g => g.id === grupo.id ? { ...g, [campo]: valor } : g));
  };

  const toggleFaixa = async (grupo, faixa) => {
    const atual = grupo.faixas || [];
    const novo = atual.includes(faixa) ? atual.filter(f => f !== faixa) : [...atual, faixa];
    await atualizarGrupo(grupo, 'faixas', novo);
  };

  const toggleEntrada = async (grupo, entradaId) => {
    const atual = grupo.entradas_ids || [];
    const novo = atual.includes(entradaId) ? atual.filter(e => e !== entradaId) : [...atual, entradaId];
    await atualizarGrupo(grupo, 'entradas_ids', novo);
  };

  const calcularRanking = (grupo) => {
    const faixasFiltro = grupo.faixas || [];
    const sexoFiltro = grupo.sexo || 'todos';

    return lutasCache
      .filter(l => {
        if (!l.vencedor) return false;
        // Filtro faixa
        if (faixasFiltro.length > 0 && !faixasFiltro.includes(l.vencedor.faixa)) return false;
        // Filtro sexo
        if (sexoFiltro !== 'todos' && l.vencedor.sexo !== sexoFiltro) return false;
        return true;
      })
      .sort((a, b) => a.tempo_luta - b.tempo_luta);
  };

  const formatarTempo = (seg) => {
    if (!seg && seg !== 0) return '—';
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const ic = 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-red-500';
  const sc = 'bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-red-500';

  if (loading) return <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-bold text-base mb-1">⚡ Luta Mais Rápida</h2>
        <p className="text-slate-500 text-xs mb-4">Crie grupos com filtros opcionais. O ranking é ordenado automaticamente pelo menor tempo de luta.</p>
        <div className="flex gap-2">
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && criarGrupo()}
            placeholder="Nome do grupo (ex: Masculino Adulto, Faixa Azul...)" className={ic + ' flex-1'} />
          <button onClick={criarGrupo} className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shrink-0">+ Criar</button>
        </div>
      </div>

      {grupos.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-500 text-sm">Nenhum grupo criado ainda.</p>
          <p className="text-slate-600 text-xs mt-1">Crie um grupo acima. Sem filtros = considera todas as lutas do evento.</p>
        </div>
      )}

      {grupos.map(grupo => {
        const ranking = calcularRanking(grupo);
        return (
          <div key={grupo.id} className="bg-slate-900 border border-red-500/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800">
              <span className="text-red-400 text-base">⚡</span>
              <p className="text-white font-bold text-sm flex-1">{grupo.nome}</p>
              <span className="text-slate-500 text-xs">{ranking.length} luta(s)</span>
              <button onClick={() => removerGrupo(grupo.id)} className="text-slate-600 hover:text-red-400 text-xs transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-0 divide-x divide-slate-800">
              {/* Filtros */}
              <div className="p-4 space-y-4">
                {/* Entradas / Categorias */}
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Categorias <span className="text-slate-600 font-normal">(vazio = todas)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entradas.map(e => {
                      const ativo = (grupo.entradas_ids || []).includes(e.id);
                      return (
                        <button key={e.id} onClick={() => toggleEntrada(grupo, e.id)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-all border ${ativo ? 'bg-red-600/20 border-red-500/40 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                          {e.nome}
                          <span className={`ml-1 opacity-60 ${e.modalidade === 'Gi' ? 'text-blue-400' : 'text-purple-400'}`}>·{e.modalidade}</span>
                        </button>
                      );
                    })}
                    {entradas.length === 0 && <p className="text-slate-600 text-xs">Nenhuma entrada no evento</p>}
                  </div>
                </div>

                {/* Sexo */}
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sexo</p>
                  <div className="flex gap-2">
                    {['todos','Masculino','Feminino'].map(s => (
                      <button key={s} onClick={() => atualizarGrupo(grupo, 'sexo', s)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${grupo.sexo === s ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                        {s === 'todos' ? 'Todos' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Faixas */}
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Faixas <span className="text-slate-600 font-normal">(vazio = todas)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FAIXAS_ORDEM.map(fx => {
                      const ativo = (grupo.faixas || []).includes(fx);
                      return (
                        <button key={fx} onClick={() => toggleFaixa(grupo, fx)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-all border ${ativo ? 'bg-red-600/20 border-red-500/40 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                          {fx}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ranking */}
              <div className="p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Ranking ⚡ Menor Tempo
                </p>
                {ranking.length === 0 ? (
                  <p className="text-slate-600 text-xs">Nenhuma luta finalizada encontrada com esses filtros.</p>
                ) : (
                  <div className="space-y-2">
                    {ranking.slice(0, 10).map((l, idx) => (
                      <div key={l.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${idx === 0 ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800'}`}>
                        <span className="text-sm font-black w-6 text-center shrink-0 text-slate-400">{idx + 1}º</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{l.vencedor?.nome || '—'}</p>
                          <p className="text-slate-500 text-xs truncate">{l.vencedor?.academia || ''} · {l.vencedor?.faixa || ''}</p>
                        </div>
                        <span className={`text-sm font-black shrink-0 ${idx === 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          ⏱ {formatarTempo(l.tempo_luta)}
                        </span>
                      </div>
                    ))}
                    {ranking.length > 10 && (
                      <p className="text-slate-600 text-xs text-center pt-1">+ {ranking.length - 10} lutas</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ============ COMPONENTE ABA COLABORADORES ============
const PERMISSOES_OPCOES = [
  { id: 'pesagem', label: '⚖️ Pesagem', desc: 'Painel de pesagem' },
  { id: 'transmissao', label: '📡 Transmissão', desc: 'Painel de transmissão' },
  { id: 'areas', label: '🗺️ Áreas', desc: 'Painel de áreas de luta' },
  { id: 'chaveamento', label: '🏅 Chaveamento', desc: 'Chaveamento admin' },
  { id: 'financeiro', label: '💰 Financeiro', desc: 'Aba financeiro' },
  { id: 'atletas', label: '👥 Atletas', desc: 'Gerenciar atletas inscritos' },
  { id: 'tudo', label: '🔑 Acesso Total', desc: 'Todos os poderes do organizador' },
];

function AbaColaboradores({ eventoId }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [perfilEncontrado, setPerfilEncontrado] = useState(null);
  const [erroBusca, setErroBusca] = useState('');
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  useEffect(() => { carregarColaboradores(); }, [eventoId]);

  const carregarColaboradores = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('colaboradores_evento')
      .select('id, profile_id, permissoes, created_at, profiles(nome, email)')
      .eq('evento_id', eventoId)
      .order('created_at');
    setColaboradores(data || []);
    setLoading(false);
  };

  const buscarPorEmail = async () => {
    if (!email.trim()) return;
    setBuscando(true);
    setErroBusca('');
    setPerfilEncontrado(null);
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .eq('email', email.trim().toLowerCase())
      .single();
    if (data) {
      const jaExiste = colaboradores.some(c => c.profile_id === data.id);
      if (jaExiste) {
        setErroBusca('Este usuário já é colaborador deste evento.');
      } else {
        setPerfilEncontrado(data);
      }
    } else {
      setErroBusca('Nenhum usuário encontrado com este e-mail.');
    }
    setBuscando(false);
  };

  const togglePermissao = (id) => {
    if (id === 'tudo') {
      setPermissoesSelecionadas(p => p.includes('tudo') ? [] : ['tudo']);
      return;
    }
    setPermissoesSelecionadas(p => {
      const sem = p.filter(x => x !== 'tudo');
      return sem.includes(id) ? sem.filter(x => x !== id) : [...sem, id];
    });
  };

  const adicionarColaborador = async () => {
    if (!perfilEncontrado || permissoesSelecionadas.length === 0) return;
    setSalvando(true);
    await supabase.from('colaboradores_evento').insert({
      evento_id: eventoId,
      profile_id: perfilEncontrado.id,
      permissoes: permissoesSelecionadas,
    });
    setEmail('');
    setPerfilEncontrado(null);
    setPermissoesSelecionadas([]);
    await carregarColaboradores();
    setSalvando(false);
  };

  const removerColaborador = async (id) => {
    if (!confirm('Remover este colaborador?')) return;
    setRemovendo(id);
    await supabase.from('colaboradores_evento').delete().eq('id', id);
    await carregarColaboradores();
    setRemovendo(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <p className="text-white font-bold text-sm">🤝 Adicionar Colaborador</p>
        <div className="flex gap-2">
          <input value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarPorEmail()}
            placeholder="E-mail do usuário cadastrado"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          <button onClick={buscarPorEmail} disabled={buscando}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50">
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
        {erroBusca && <p className="text-red-400 text-xs">{erroBusca}</p>}
        {perfilEncontrado && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                {perfilEncontrado.nome?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{perfilEncontrado.nome}</p>
                <p className="text-slate-400 text-xs">{perfilEncontrado.email}</p>
              </div>
              <span className="ml-auto text-green-400 text-xs font-bold">✓ Encontrado</span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Permissões</p>
              <div className="grid grid-cols-1 gap-2">
                {PERMISSOES_OPCOES.map(p => {
                  const ativo = permissoesSelecionadas.includes(p.id);
                  const bloqueado = permissoesSelecionadas.includes('tudo') && p.id !== 'tudo';
                  return (
                    <button key={p.id} onClick={() => togglePermissao(p.id)} disabled={bloqueado}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${ativo ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'} ${bloqueado ? 'opacity-40' : ''}`}>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${ativo ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                        {ativo && <span className="text-white text-xs">✓</span>}
                      </span>
                      <div>
                        <p className="text-white text-xs font-medium">{p.label}</p>
                        <p className="text-slate-500 text-xs">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={adicionarColaborador} disabled={salvando || permissoesSelecionadas.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-all">
              {salvando ? 'Adicionando...' : '+ Adicionar Colaborador'}
            </button>
          </div>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <p className="text-white font-bold text-sm">Colaboradores <span className="text-slate-500 font-normal text-xs">({colaboradores.length})</span></p>
        {loading ? (
          <p className="text-slate-500 text-sm text-center py-4">Carregando...</p>
        ) : colaboradores.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Nenhum colaborador adicionado ainda.</p>
        ) : (
          colaboradores.map(colab => (
            <div key={colab.id} className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-3 bg-slate-800/40">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
                  {colab.profiles?.nome?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{colab.profiles?.nome || '—'}</p>
                  <p className="text-slate-400 text-xs truncate">{colab.profiles?.email || '—'}</p>
                </div>
                <button onClick={() => removerColaborador(colab.id)} disabled={removendo === colab.id}
                  className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all shrink-0">
                  {removendo === colab.id ? '...' : 'Remover'}
                </button>
              </div>
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {colab.permissoes?.includes('tudo') ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">🔑 Acesso Total</span>
                ) : (
                  (colab.permissoes || []).map(p => {
                    const op = PERMISSOES_OPCOES.find(o => o.id === p);
                    return op ? (
                      <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">{op.label}</span>
                    ) : null;
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ COMPONENTE ABA EQUIPES ============
function AbaEquipes({ eventoId, grupos, evento }) {
  const [gruposEquipe, setGruposEquipe] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [academiasMap, setAcademiasMap] = useState({}); // academia nome -> afiliacao
  const [novoNome, setNovoNome] = useState('');
  const [novoModo, setNovoModo] = useState('academia');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) return;
    Promise.all([
      supabase.from('grupos_resultado_equipe').select('*').eq('evento_id', eventoId).order('ordem'),
      supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
      supabase.from('academias').select('nome, afiliacao'),
    ]).then(([ge, en, ac]) => {
      if (ge.data) setGruposEquipe(ge.data);
      if (en.data) setEntradas(en.data);
      if (ac.data) {
        const m = {};
        ac.data.forEach(a => { if (a.nome) m[a.nome] = a.afiliacao || null; });
        setAcademiasMap(m);
      }
      setLoading(false);
    });
  }, [eventoId]);

  const criarGrupo = async () => {
    if (!novoNome.trim()) return;
    const { data } = await supabase.from('grupos_resultado_equipe')
      .insert({ evento_id: eventoId, nome: novoNome.trim(), entradas_ids: [], ativo: true, ordem: gruposEquipe.length, modo_agrupamento: novoModo })
      .select().single();
    if (data) { setGruposEquipe(p => [...p, data]); setNovoNome(''); }
  };

  const removerGrupo = async (id) => {
    if (!window.confirm('Remover este grupo de resultado?')) return;
    await supabase.from('grupos_resultado_equipe').delete().eq('id', id);
    setGruposEquipe(p => p.filter(g => g.id !== id));
  };

  const toggleEntrada = async (grupo, entradaId) => {
    const atual = grupo.entradas_ids || [];
    const novo = atual.includes(entradaId) ? atual.filter(e => e !== entradaId) : [...atual, entradaId];
    await supabase.from('grupos_resultado_equipe').update({ entradas_ids: novo }).eq('id', grupo.id);
    setGruposEquipe(p => p.map(g => g.id === grupo.id ? { ...g, entradas_ids: novo } : g));
  };

  const alterarModo = async (grupo, novoModoValor) => {
    await supabase.from('grupos_resultado_equipe').update({ modo_agrupamento: novoModoValor }).eq('id', grupo.id);
    setGruposEquipe(p => p.map(g => g.id === grupo.id ? { ...g, modo_agrupamento: novoModoValor } : g));
  };

  const calcularRanking = (grupo) => {
    const pts = evento?.pontuacao || { ouro: 9, prata: 3, bronze: 1 };
    const entradasIds = grupo.entradas_ids || [];
    const modo = grupo.modo_agrupamento || 'academia';
    const atletasDoGrupo = grupos.filter(g => entradasIds.includes(g.id)).flatMap(g => g.atletas);
    const rankMap = {};
    atletasDoGrupo.forEach(a => {
      const acadNome = a.academia || '—';
      // Chave de agrupamento: se modo=time e tem afiliacao, usa afiliacao; senão usa academia
      const chave = modo === 'time' && academiasMap[acadNome]
        ? academiasMap[acadNome]
        : acadNome;
      if (!rankMap[chave]) rankMap[chave] = { nome: chave, tipo: modo === 'time' && academiasMap[acadNome] ? 'time' : 'academia', ouro: 0, prata: 0, bronze: 0, total: 0 };
      if (a.podio === 1) { rankMap[chave].ouro++; rankMap[chave].total += pts.ouro; }
      if (a.podio === 2) { rankMap[chave].prata++; rankMap[chave].total += pts.prata; }
      if (a.podio === 3) { rankMap[chave].bronze++; rankMap[chave].total += pts.bronze; }
    });
    return Object.values(rankMap).sort((a, b) => b.total - a.total || b.ouro - a.ouro);
  };

  const ic = 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500';
  const sc = 'bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500';

  if (loading) return <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Header criar grupo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-white font-bold text-base mb-1">🏆 Resultado por Equipes</h2>
        <p className="text-slate-500 text-xs mb-4">Crie grupos de resultado selecionando quais entradas e o modo de agrupamento.</p>
        <div className="flex gap-2 flex-wrap">
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && criarGrupo()}
            placeholder="Nome do grupo (ex: Kids, Juvenil a Master...)" className={ic + ' flex-1 min-w-48'} />
          <select value={novoModo} onChange={e => setNovoModo(e.target.value)} className={sc + ' shrink-0'}>
            <option value="academia">Por Academia</option>
            <option value="time">Por Time / Afiliação</option>
          </select>
          <button onClick={criarGrupo} className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shrink-0">+ Criar</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <p className="text-white text-xs font-bold mb-1">🏫 Por Academia</p>
            <p className="text-slate-500 text-xs">Cada academia pontua separada. Ex: evento Gracie Barra onde "Gracie Barra Jaraguá" e "Gracie Barra Blumenau" são tratadas individualmente.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <p className="text-white text-xs font-bold mb-1">🏆 Por Time / Afiliação</p>
            <p className="text-slate-500 text-xs">Academias do mesmo time somam pontos juntas. Ex: "Jack / Nova União" e "Smith / Nova União" pontuam para "Nova União". Acadêmias sem afiliação pontuam individualmente.</p>
          </div>
        </div>
      </div>

      {gruposEquipe.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-500 text-sm">Nenhum grupo criado ainda.</p>
        </div>
      )}

      {gruposEquipe.map(grupo => {
        const ranking = calcularRanking(grupo);
        const modo = grupo.modo_agrupamento || 'academia';
        return (
          <div key={grupo.id} className="bg-slate-900 border border-yellow-500/20 rounded-2xl overflow-hidden">
            {/* Header do grupo */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800">
              <span className="text-yellow-400 text-base">🏆</span>
              <p className="text-white font-bold text-sm flex-1">{grupo.nome}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${modo === 'time' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {modo === 'time' ? '🏆 Por Time' : '🏫 Por Academia'}
              </span>
              <select value={modo} onChange={e => alterarModo(grupo, e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-500">
                <option value="academia">Por Academia</option>
                <option value="time">Por Time</option>
              </select>
              <span className="text-slate-500 text-xs">{(grupo.entradas_ids || []).length} entradas</span>
              <button onClick={() => removerGrupo(grupo.id)} className="text-slate-600 hover:text-red-400 text-xs transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-0 divide-x divide-slate-800">
              {/* Configuração de entradas */}
              <div className="p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Entradas incluídas</p>
                <div className="space-y-1.5">
                  {entradas.map(e => {
                    const ativo = (grupo.entradas_ids || []).includes(e.id);
                    return (
                      <label key={e.id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" checked={ativo} onChange={() => toggleEntrada(grupo, e.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-yellow-500" />
                        <span className={`text-xs font-medium transition-colors ${ativo ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{e.nome}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${e.modalidade === 'Gi' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{e.modalidade}</span>
                      </label>
                    );
                  })}
                  {entradas.length === 0 && <p className="text-slate-600 text-xs">Nenhuma entrada disponível</p>}
                </div>
              </div>

              {/* Ranking */}
              <div className="p-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Ranking {modo === 'time' ? 'por Time' : 'por Academia'}
                </p>
                {ranking.length === 0 ? (
                  <p className="text-slate-600 text-xs">Nenhum resultado ainda. Registre pódios nos atletas.</p>
                ) : (
                  <div className="space-y-2">
                    {ranking.map((r, idx) => (
                      <div key={r.nome} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${idx === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : idx === 1 ? 'border-slate-500/30 bg-slate-700/20' : idx === 2 ? 'border-orange-500/30 bg-orange-500/5' : 'border-slate-800'}`}>
                        <span className="text-sm font-black w-6 text-center shrink-0">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}º`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{r.nome}</p>
                          {r.tipo === 'time' && <p className="text-yellow-400/60 text-xs">Time</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          {r.ouro > 0 && <span className="text-yellow-400">🥇{r.ouro}</span>}
                          {r.prata > 0 && <span className="text-slate-300">🥈{r.prata}</span>}
                          {r.bronze > 0 && <span className="text-orange-400">🥉{r.bronze}</span>}
                          <span className="text-white font-bold ml-1">{r.total}pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PainelOrganizadorEventoPage() {
  const { id: eventoId } = useParams();
  const [grupos, setGrupos] = useState([]);
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lixeira, setLixeira] = useState([]);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);

  // Filtros simples
  const [busca, setBusca] = useState('');
  const [filtroAprovado, setFiltroAprovado] = useState('');
  const [filtroPago, setFiltroPago] = useState('');
  const [filtroPesagem, setFiltroPesagem] = useState('');

  // Filtros avançados — múltiplos blocos OR, cada campo é array (multi-seleção)
  const [filtrosAvancados, setFiltrosAvancados] = useState([]);
  const novoFiltroBloco = () => ({ id: Date.now(), modalidade: [], sexo: [], categoria: [], faixa: [] });
  const adicionarFiltro = () => setFiltrosAvancados(prev => [...prev, novoFiltroBloco()]);
  const removerFiltro = (id) => setFiltrosAvancados(prev => prev.filter(f => f.id !== id));
  const toggleFiltroOpcao = (id, campo, valor) => setFiltrosAvancados(prev => prev.map(f => {
    if (f.id !== id) return f;
    const arr = f[campo];
    return { ...f, [campo]: arr.includes(valor) ? arr.filter(v => v !== valor) : [...arr, valor] };
  }));
  const limparFiltros = () => { setBusca(''); setFiltroAprovado(''); setFiltroPago(''); setFiltroPesagem(''); setFiltrosAvancados([]); };
  const [dropFiltro, setDropFiltro] = useState(null);

  // UI
  const [gruposAbertos, setGruposAbertos] = useState({});
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [atletasSelecionados, setAtletasSelecionados] = useState([]);
  const [modalComentario, setModalComentario] = useState(null);
  const [modalPerfil, setModalPerfil] = useState(null);
  const [modalEncerrarPesagem, setModalEncerrarPesagem] = useState(false);
  const [modalEmail, setModalEmail] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('atletas');
  const [gruposEquipe, setGruposEquipe] = useState([]);
  const [loadingEquipes, setLoadingEquipes] = useState(false);
  const [novoGrupoEquipeNome, setNovoGrupoEquipeNome] = useState('');
  const [entradas, setEntradas] = useState([]);
  const [sidebarAberto, setSidebarAberto] = useState(false);

  // ============ CARREGAR DADOS ============
  const carregarDados = useCallback(async () => {
    if (!eventoId) return;
    setLoading(true);
    try {
      const [eventoData, inscRes, entradasRes] = await Promise.all([
        buscarEvento(eventoId),
        supabase.from('inscricoes_entrada')
          .select('*, atletas:atleta_id(id, faixa, academia, profile_id), entradas:entrada_id(id, nome, modalidade)')
          .eq('evento_id', eventoId)
          .neq('status_pagamento', 'cancelado'),
        supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
      ]);

      setEvento(eventoData);

      if (!inscRes.data) return;

      // Busca nomes dos perfis
      const profileIds = [...new Set(inscRes.data.map(i => i.atletas?.profile_id).filter(Boolean))];
      let nomes = {};
      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, nome').in('id', profileIds);
        if (profilesData) nomes = Object.fromEntries(profilesData.map(p => [p.id, p.nome]));
      }

      // Agrupa inscrições por entrada
      const gruposMap = {};
      (entradasRes.data || []).forEach(entrada => {
        gruposMap[entrada.id] = {
          id: entrada.id,
          nome: entrada.nome,
          modalidade: entrada.modalidade || 'Gi',
          atletas: [],
        };
      });

      inscRes.data.forEach(insc => {
        const entradaId = insc.entrada_id;
        if (!gruposMap[entradaId]) {
          gruposMap[entradaId] = {
            id: entradaId,
            nome: insc.entradas?.nome || 'Sem categoria',
            modalidade: insc.entradas?.modalidade || 'Gi',
            atletas: [],
          };
        }
        const nome = nomes[insc.atletas?.profile_id] || 'Atleta';
        gruposMap[entradaId].atletas.push({
          id: insc.id,           // id da inscrição
          atletaId: insc.atleta_id,
          nome,
          academia: insc.atletas?.academia || '—',
          faixa: insc.faixa || insc.atletas?.faixa || '—',
          pago: insc.status_pagamento === 'pago',
          pesagem: insc.pesagem || 'pendente',
          aprovado: insc.aprovado || false,
          podio: insc.podio || null,
          comentarioAtleta: insc.observacao_atleta || '',
          comentarioAdmin: insc.observacao_admin || '',
        });
      });

      setGrupos(Object.values(gruposMap));
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ============ AÇÕES COM BANCO ============
  const atualizarInscricao = async (inscricaoId, dados) => {
    await supabase.from('inscricoes_entrada').update(dados).eq('id', inscricaoId);
  };

  const togglePago = async (atletaId) => {
    const grupo = grupos.find(g => g.atletas.some(a => a.id === atletaId));
    const atleta = grupo?.atletas.find(a => a.id === atletaId);
    if (!atleta) return;
    const novoStatus = atleta.pago ? 'pendente' : 'pago';
    await atualizarInscricao(atletaId, { status_pagamento: novoStatus });
    setGrupos(prev => prev.map(g => ({ ...g, atletas: g.atletas.map(a => a.id === atletaId ? { ...a, pago: !a.pago } : a) })));
  };

  const toggleAprovado = async (atletaId) => {
    const grupo = grupos.find(g => g.atletas.some(a => a.id === atletaId));
    const atleta = grupo?.atletas.find(a => a.id === atletaId);
    if (!atleta) return;
    await atualizarInscricao(atletaId, { aprovado: !atleta.aprovado });
    setGrupos(prev => prev.map(g => ({ ...g, atletas: g.atletas.map(a => a.id === atletaId ? { ...a, aprovado: !a.aprovado } : a) })));
  };

  const togglePesagem = async (atletaId) => {
    const grupo = grupos.find(g => g.atletas.some(a => a.id === atletaId));
    const atleta = grupo?.atletas.find(a => a.id === atletaId);
    if (!atleta) return;

    let novaPesagem;
    if (atleta.pesagem === 'ok') {
      if (!window.confirm('Reverter pesagem para pendente?')) return;
      novaPesagem = 'pendente';
    } else if (atleta.pesagem === 'desclassificado' || atleta.pesagem === 'no_show') {
      if (!window.confirm('Reverter status de pesagem para pendente?')) return;
      novaPesagem = 'pendente';
    } else {
      novaPesagem = 'ok';
    }
    await atualizarInscricao(atletaId, { pesagem: novaPesagem });
    setGrupos(prev => prev.map(g => ({ ...g, atletas: g.atletas.map(a => a.id === atletaId ? { ...a, pesagem: novaPesagem } : a) })));
  };

  const salvarComentario = async (atletaId, texto) => {
    await atualizarInscricao(atletaId, { observacao_admin: texto });
    setGrupos(prev => prev.map(g => ({ ...g, atletas: g.atletas.map(a => a.id === atletaId ? { ...a, comentarioAdmin: texto } : a) })));
    setModalComentario(null);
  };

  const excluirAtleta = async (atletaId, grupoId) => {
    if (!window.confirm('Remover esta inscrição? O atleta irá para a lixeira.')) return;
    const grupo = grupos.find(g => g.id === grupoId);
    const atleta = grupo?.atletas.find(a => a.id === atletaId);
    if (!atleta) return;
    await supabase.from('inscricoes_entrada').update({ status_pagamento: 'cancelado' }).eq('id', atletaId);
    setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, atletas: g.atletas.filter(a => a.id !== atletaId) } : g));
    setLixeira(prev => [...prev, { ...atleta, grupoId, grupoNome: grupo.nome, excluidoEm: new Date().toLocaleString('pt-BR') }]);
  };

  const restaurarAtleta = async (atletaId) => {
    const atleta = lixeira.find(a => a.id === atletaId);
    if (!atleta) return;
    await supabase.from('inscricoes_entrada').update({ status_pagamento: 'pendente' }).eq('id', atletaId);
    setLixeira(prev => prev.filter(a => a.id !== atletaId));
    setGrupos(prev => prev.map(g => g.id === atleta.grupoId
      ? { ...g, atletas: [...g.atletas, { ...atleta, grupoId: undefined, grupoNome: undefined, excluidoEm: undefined }] }
      : g
    ));
  };

  const encerrarPesagem = async () => {
    const atletasParaNoShow = grupos
      .filter(g => gruposSelecionados.includes(g.id))
      .flatMap(g => g.atletas.filter(a => a.pesagem === 'pendente').map(a => a.id));

    if (atletasParaNoShow.length > 0) {
      await supabase.from('inscricoes_entrada')
        .update({ pesagem: 'no_show' })
        .in('id', atletasParaNoShow);
    }
    setGrupos(prev => prev.map(g => {
      if (!gruposSelecionados.includes(g.id)) return g;
      return { ...g, atletas: g.atletas.map(a => a.pesagem === 'pendente' ? { ...a, pesagem: 'no_show' } : a) };
    }));
    setGruposSelecionados([]);
    setAtletasSelecionados([]);
  };

  // ============ SELEÇÃO ============
  const toggleGrupo = (id) => setGruposAbertos(p => ({ ...p, [id]: !p[id] }));

  const toggleGrupoSelecionado = (id) => {
    setGruposSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const grupo = grupos.find(g => g.id === id);
    const ids = grupo?.atletas.map(a => a.id) || [];
    setAtletasSelecionados(prev => {
      const jaTemTodos = ids.every(i => prev.includes(i));
      return jaTemTodos ? prev.filter(i => !ids.includes(i)) : [...new Set([...prev, ...ids])];
    });
  };

  const toggleAtleta = (atletaId) => {
    setAtletasSelecionados(prev => prev.includes(atletaId) ? prev.filter(i => i !== atletaId) : [...prev, atletaId]);
  };

  const selecionarTudo = () => {
    if (gruposSelecionados.length === gruposFiltrados.length) {
      setGruposSelecionados([]);
      setAtletasSelecionados([]);
    } else {
      setGruposSelecionados(gruposFiltrados.map(g => g.id));
      setAtletasSelecionados(gruposFiltrados.flatMap(g => g.atletas.map(a => a.id)));
    }
  };

  // ============ EXPORTAR CSV ============
  const baixarCSV = () => {
    const atletasFiltrados = grupos.flatMap(g =>
      g.atletas.filter(a => atletasSelecionados.includes(a.id)).map(a => ({
        nome: a.nome, academia: a.academia, faixa: a.faixa,
        pago: a.pago ? 'Sim' : 'Não', pesagem: a.pesagem,
        aprovado: a.aprovado ? 'Sim' : 'Não',
        podio: a.podio || '', grupo: g.nome,
      }))
    );
    const headers = ['Nome', 'Academia', 'Faixa', 'Pago', 'Pesagem', 'Aprovado', 'Pódio', 'Grupo'];
    const rows = atletasFiltrados.map(a => Object.values(a).map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'atletas_nexusjj.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============ FILTROS ============
  const gruposFiltrados = grupos.filter(g => {
    const texto = busca.toLowerCase();
    const matchBusca = !busca || g.nome.toLowerCase().includes(texto) || g.atletas.some(a => a.nome.toLowerCase().includes(texto) || a.academia.toLowerCase().includes(texto));
    const matchAprovado = !filtroAprovado || (filtroAprovado === 'aprovado' ? g.atletas.some(a => a.aprovado) : g.atletas.some(a => !a.aprovado));
    const matchPago = !filtroPago || (filtroPago === 'pago' ? g.atletas.some(a => a.pago) : g.atletas.some(a => !a.pago));
    const matchPesagem = !filtroPesagem || g.atletas.some(a => a.pesagem === filtroPesagem);

    // Filtros avançados — cada bloco é um AND interno, blocos entre si são OR
    const matchAvancado = filtrosAvancados.length === 0 || filtrosAvancados.some(f => {
      const nome = g.nome.toLowerCase();
      const matchMod = f.modalidade.length === 0 || f.modalidade.some(v => nome.includes(v.toLowerCase()));
      const matchSexo = f.sexo.length === 0 || f.sexo.some(v => nome.includes(v.toLowerCase()));
      const matchCat = f.categoria.length === 0 || f.categoria.some(v => nome.includes(v.toLowerCase()));
      const matchFaixa = f.faixa.length === 0 || f.faixa.some(v =>
        nome.includes(v.toLowerCase()) || g.atletas.some(a => a.faixa?.toLowerCase().includes(v.toLowerCase()))
      );
      return matchMod && matchSexo && matchCat && matchFaixa;
    });

    return matchBusca && matchAprovado && matchPago && matchPesagem && matchAvancado;
  });

  const totalAtletas = grupos.reduce((acc, g) => acc + g.atletas.length, 0);
  const totalPagos = grupos.reduce((acc, g) => acc + g.atletas.filter(a => a.pago).length, 0);
  const totalAprovados = grupos.reduce((acc, g) => acc + g.atletas.filter(a => a.aprovado).length, 0);
  const totalPendentes = totalAtletas - totalPagos;
  const temSelecao = gruposSelecionados.length > 0 || atletasSelecionados.length > 0;

  if (loading) return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const toggleConfig = async (campo) => {
    const novo = !evento?.[campo];
    await supabase.from('eventos').update({ [campo]: novo }).eq('id', eventoId);
    setEvento(prev => ({ ...prev, [campo]: novo }));
  };

  return (
    <div className="min-h-screen bg-nexus-dark pb-32 flex">

      {/* SIDEBAR CONFIGURAÇÕES */}
      <div className={`shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden ${sidebarAberto ? 'w-64' : 'w-0'}`}>
        <div className="w-64 h-full flex flex-col">
          {/* Header sidebar */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
            <p className="text-white font-bold text-sm">Configurações</p>
            <button onClick={() => setSidebarAberto(false)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Visibilidade */}
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Visibilidade pública</p>
              <div className="space-y-2">
                {[
                  { campo: 'mostrar_inscritos', ativo: evento?.mostrar_inscritos, label: 'Mostrar nº de inscritos', desc: 'Exibe o contador na página pública' },
                  { campo: 'mostrar_lista_atletas', ativo: evento?.mostrar_lista_atletas !== false, label: 'Lista de atletas pública', desc: 'Atletas visíveis na aba Atletas' },
                  { campo: 'mostrar_apenas_efetivados', ativo: evento?.mostrar_apenas_efetivados, label: 'Só mostrar efetivados', desc: 'Oculta atletas com pagamento pendente' },
                ].map(item => (
                  <button key={item.campo} onClick={() => toggleConfig(item.campo)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all text-left">
                    <div className={`w-9 h-5 rounded-full shrink-0 mt-0.5 relative transition-all ${item.ativo ? 'bg-blue-600' : 'bg-slate-600'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.ativo ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Navegar</p>
              <div className="space-y-1">
                {[
                  { label: '👥 Atletas', aba: 'atletas' },
                  { label: '💰 Financeiro', aba: 'financeiro' },
                  { label: '🏆 Equipes', aba: 'equipes' },
                  { label: '⚡ Luta Rápida', aba: 'luta_rapida' },
                  { label: '🤝 Colaboradores', aba: 'colaboradores' },
                ].map(item => (
                  <button key={item.aba} onClick={() => { setAbaAtiva(item.aba); setSidebarAberto(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${abaAtiva === item.aba ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    {item.label}
                  </button>
                ))}
                <a href={`/eventos/${eventoId}/categorias`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  ⚙️ Configurar Categorias
                </a>
                <a href={`/eventos/${eventoId}/valores`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  🏷️ Valores & Lotes
                </a>
                <a href={`/eventos/${eventoId}/transmissao`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  📡 Transmissão
                </a>
                <a href={`/eventos/${eventoId}/areas`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  🗺️ Áreas de Luta
                </a>
                <a href={`/eventos/${eventoId}/chaves/configuracao`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  🔧 Config. Chaves
                </a>
                <a href={`/eventos/${eventoId}/chaves/distribuicao`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  🎯 Distribuição de Chaves
                </a>
                <a href={`/eventos/${eventoId}/chaves/admin`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  🏅 Chaveamento Admin
                </a>
                <a href={`/pesagem/${eventoId}`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  ⚖️ Pesagem
                </a>
                <a href={`/eventos/${eventoId}/chaves`} target="_blank"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  👁️ Chaveamento Público ↗
                </a>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Outros</p>
              <button onClick={() => { setMostrarLixeira(true); setSidebarAberto(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all relative text-left">
                <Trash2 size={14} /> Lixeira
                {lixeira.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">{lixeira.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Botão Configurações */}
            <button onClick={() => setSidebarAberto(s => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${sidebarAberto ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
              ⚙️ Configurações
            </button>
            <div>
              <h1 className="text-white font-bold text-base">{evento?.nome || 'Painel do Evento'}</h1>
              <p className="text-slate-500 text-xs">Painel do Organizador</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setAbaAtiva('atletas')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${abaAtiva === 'atletas' ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
              👥 Atletas
            </button>
            <button onClick={() => setAbaAtiva('equipes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${abaAtiva === 'equipes' ? 'bg-yellow-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
              🏆 Equipes
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ===== ABA COLABORADORES ===== */}
        {abaAtiva === 'colaboradores' && (
          <AbaColaboradores eventoId={eventoId} />
        )}

        {/* ===== ABA LUTA RAPIDA ===== */}
        {abaAtiva === 'luta_rapida' && (
          <AbaLutaRapida eventoId={eventoId} />
        )}

        {/* ===== ABA EQUIPES ===== */}
        {abaAtiva === 'equipes' && (
          <AbaEquipes eventoId={eventoId} grupos={grupos} evento={evento} />
        )}

        {/* ===== ABA FINANCEIRO ===== */}
        {abaAtiva === 'financeiro' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Inscritos', valor: totalAtletas, cor: 'text-white', bg: 'bg-slate-900 border-slate-800' },
                { label: 'Efetivados', valor: totalAprovados, cor: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-500/20' },
                { label: 'Pagamentos OK', valor: totalPagos, cor: 'text-green-400', bg: 'bg-green-950/30 border-green-500/20' },
                { label: 'Pendentes', valor: totalPendentes, cor: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-500/20' },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 text-center ${s.bg}`}>
                  <p className={`font-black text-2xl ${s.cor}`}>{s.valor}</p>
                  <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Extrato por Atleta</h3>
                <button onClick={baixarCSV} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5">
                  <Download size={12} /> Exportar CSV
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {grupos.flatMap(g => g.atletas.map(a => ({ ...a, grupo: g.nome }))).map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{a.nome}</p>
                      <p className="text-slate-500 text-xs truncate">{a.academia} · {a.grupo}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${a.pago ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {a.pago ? 'Pago' : 'Pendente'}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${a.aprovado ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                      {a.aprovado ? 'Efetivado' : 'Não efetivado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== ABA ATLETAS ===== */}
        {abaAtiva === 'atletas' && (
          <>
            {/* Filtros */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-blue-400" />
                <p className="text-white font-semibold text-sm">Filtros</p>
                <button onClick={limparFiltros}
                  className="ml-auto flex items-center gap-1 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors">
                  <X size={12} /> Limpar
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-3 text-slate-500" />
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, academia..."
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                {[
                  { label: '- Efetivado -', value: filtroAprovado, set: setFiltroAprovado, opts: [['', '- Efetivado -'], ['aprovado', 'Efetivado'], ['nao_aprovado', 'Não Efetivado']] },
                  { label: '- Pagamento -', value: filtroPago, set: setFiltroPago, opts: [['', '- Pagamento -'], ['pago', 'Pago'], ['pendente', 'Pendente']] },
                  { label: '- Pesagem -', value: filtroPesagem, set: setFiltroPesagem, opts: [['', '- Pesagem -'], ['ok', 'Pesou'], ['pendente', 'Não Pesou'], ['no_show', 'NO-SHOW'], ['desclassificado', 'Eliminado']] },
                ].map(f => (
                  <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}
              </div>
              {filtrosAvancados.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider pt-1">Filtros de categoria</p>
                  {filtrosAvancados.map((f, idx) => {
                    const campos = [
                      { key: 'modalidade', label: 'Modalidade', opts: ['Gi', 'NoGi'] },
                      { key: 'sexo', label: 'Sexo', opts: ['Masculino', 'Feminino'] },
                      { key: 'categoria', label: 'Categoria', opts: ['Pré Mirim', 'Mirim', 'Infantil A', 'Infantil B', 'Infanto', 'Juvenil', 'Adulto', 'Master 1', 'Master 2', 'Master 3', 'Master 4'] },
                      { key: 'faixa', label: 'Faixa', opts: ['Branca', 'Coloridas', 'Azul', 'Roxa', 'Marrom', 'Preta'] },
                    ];
                    return (
                      <div key={f.id} className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-500 text-xs font-bold">{idx === 0 ? 'FILTRO' : `OU FILTRO ${idx + 1}`}</span>
                          <button onClick={() => removerFiltro(f.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {campos.map(campo => {
                            const selecionados = f[campo.key];
                            const aberto = dropFiltro?.blocoId === f.id && dropFiltro?.campo === campo.key;
                            return (
                              <div key={campo.key} className="relative">
                                <button
                                  onClick={() => setDropFiltro(aberto ? null : { blocoId: f.id, campo: campo.key })}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${selecionados.length > 0 ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                                  {campo.label}
                                  {selecionados.length > 0 && <span className="bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-black">{selecionados.length}</span>}
                                  <ChevronDown size={11} />
                                </button>
                                {aberto && (
                                  <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 min-w-36 py-1">
                                    {campo.opts.map(opt => (
                                      <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 cursor-pointer transition-colors">
                                        <input type="checkbox"
                                          checked={selecionados.includes(opt)}
                                          onChange={() => toggleFiltroOpcao(f.id, campo.key, opt)}
                                          className="w-3.5 h-3.5 accent-blue-500 shrink-0" />
                                        <span className="text-white text-xs">{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {campos.some(c => f[c.key].length > 0) && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {campos.flatMap(c => f[c.key].map(v => (
                              <span key={c.key + v} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                                {v}
                                <button onClick={() => toggleFiltroOpcao(f.id, c.key, v)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
                              </span>
                            )))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botão adicionar filtro */}
              <button onClick={adicionarFiltro}
                className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                <span className="text-base leading-none">+</span> Filtrar categoria
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={gruposSelecionados.length === gruposFiltrados.length && gruposFiltrados.length > 0}
                    onChange={selecionarTudo}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500" />
                  <span className="text-slate-300 text-sm font-medium">Selecionar tudo</span>
                </label>
                <span className="text-slate-500 text-sm">
                  <strong className="text-white bg-slate-700 px-2 py-0.5 rounded-full text-xs">{totalAtletas}</strong> atletas em <strong className="text-white bg-slate-700 px-2 py-0.5 rounded-full text-xs">{grupos.length}</strong> categorias
                </span>
              </div>
              <button onClick={carregarDados} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                ↻ Atualizar
              </button>
            </div>
            <div className="space-y-3">
              {gruposFiltrados.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                  <p className="text-slate-500 text-sm">Nenhum resultado encontrado.</p>
                </div>
              )}
              {gruposFiltrados.map(grupo => {
                const aberto = gruposAbertos[grupo.id] !== false;
                const selecionado = gruposSelecionados.includes(grupo.id);

                return (
                  <div key={grupo.id} className={`border rounded-2xl overflow-hidden transition-all ${selecionado ? 'border-blue-500/50' : 'border-slate-800'} bg-slate-900`}>

                    {/* Header grupo */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input type="checkbox" checked={selecionado} onChange={() => toggleGrupoSelecionado(grupo.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500 shrink-0" />
                      <p className="flex-1 text-white text-sm font-semibold truncate cursor-pointer" onClick={() => toggleGrupo(grupo.id)}>
                        {grupo.nome}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded border ${grupo.modalidade === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {grupo.modalidade}
                        </span>
                      </p>
                      <span className="text-slate-500 text-xs shrink-0">{grupo.atletas.length} atleta(s)</span>
                      <button onClick={() => toggleGrupo(grupo.id)} className="text-slate-500 hover:text-white ml-1 transition-colors">
                        {aberto ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                    {aberto && (
                      <div className="border-t border-slate-800">
                        {grupo.atletas.length === 0 ? (
                          <div className="px-4 py-4 text-slate-600 text-xs text-center">Nenhum atleta nesta categoria.</div>
                        ) : (
                          <>
                            {/* Cabeçalho */}
                            <div className="grid px-4 py-2 bg-slate-800/50 text-slate-500 text-xs font-medium" style={{ gridTemplateColumns: '24px 1fr 140px 80px 90px' }}>
                              <span></span>
                              <span>Nome / Academia</span>
                              <span>Faixa</span>
                              <span>Pódio</span>
                              <span className="text-right">Ações</span>
                            </div>

                            {grupo.atletas.map(atleta => (
                              <div key={atleta.id}
                                className={`grid items-center px-4 py-3 border-t border-slate-800/50 hover:bg-slate-800/20 transition-all ${atletasSelecionados.includes(atleta.id) ? 'bg-blue-500/5' : ''}`}
                                style={{ gridTemplateColumns: '24px 1fr 140px 80px 90px' }}>

                                <input type="checkbox" checked={atletasSelecionados.includes(atleta.id)} onChange={() => toggleAtleta(atleta.id)}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500" />

                                {/* Nome */}
                                <div className="min-w-0 pr-2">
                                  <button onClick={() => setModalPerfil(atleta)}
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium truncate text-left transition-colors hover:underline block">
                                    {atleta.nome}
                                  </button>
                                  <p className="text-slate-500 text-xs truncate">{atleta.academia}</p>
                                  {atleta.comentarioAtleta && (
                                    <p className="text-blue-400 text-xs truncate italic">💬 {atleta.comentarioAtleta}</p>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs">{atleta.faixa}</p>

                                {/* Pódio */}
                                <p className="text-slate-400 text-xs">
                                  {atleta.podio === 1 ? '🥇' : atleta.podio === 2 ? '🥈' : atleta.podio === 3 ? '🥉' : '—'}
                                </p>

                                {/* Ações */}
                                <div className="flex items-center gap-1 justify-end">
                                  {/* Pago */}
                                  <div title={atleta.pago ? 'Pago ✓' : 'Não pago — clique para marcar'}
                                    onClick={() => togglePago(atleta.id)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer ${atleta.pago ? 'bg-green-500/20 border-green-500/40' : 'bg-slate-800 border-slate-700 opacity-40 hover:opacity-80'}`}>
                                    <DollarSign size={11} className={atleta.pago ? 'text-green-400' : 'text-slate-500'} />
                                  </div>
                                  <div title={atleta.pesagem === 'ok' ? 'Pesagem OK' : atleta.pesagem === 'no_show' ? 'NO-SHOW — clique para reverter' : atleta.pesagem === 'desclassificado' ? 'Eliminado — clique para reverter' : 'Não pesou — clique para confirmar'}
                                    onClick={() => togglePesagem(atleta.id)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer ${atleta.pesagem === 'ok' ? 'bg-green-500/20 border-green-500/40' : atleta.pesagem === 'desclassificado' ? 'bg-orange-500/20 border-orange-500/40' : atleta.pesagem === 'no_show' ? 'bg-red-500/20 border-red-500/40' : 'bg-slate-800 border-slate-700 opacity-40 hover:opacity-80'}`}>
                                    <Scale size={11} className={atleta.pesagem === 'ok' ? 'text-green-400' : atleta.pesagem === 'desclassificado' ? 'text-orange-400' : atleta.pesagem === 'no_show' ? 'text-red-400' : 'text-slate-500'} />
                                  </div>
                                  <div title={atleta.aprovado ? 'Efetivado — clique para desefetivar' : 'Efetivar atleta'}
                                    onClick={() => toggleAprovado(atleta.id)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer ${atleta.aprovado ? 'bg-blue-500/20 border-blue-500/40' : 'bg-slate-800 border-slate-700 opacity-40 hover:opacity-80'}`}>
                                    <CheckCircle size={11} className={atleta.aprovado ? 'text-blue-400' : 'text-slate-500'} />
                                  </div>
                                  <div title="Comentário"
                                    onClick={() => setModalComentario(atleta)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer relative ${atleta.comentarioAtleta ? 'bg-blue-500/20 border-blue-500/40' : atleta.comentarioAdmin ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-slate-800 border-slate-700 opacity-40 hover:opacity-80'}`}>
                                    <Edit3 size={11} className={atleta.comentarioAtleta ? 'text-blue-400' : atleta.comentarioAdmin ? 'text-yellow-400' : 'text-slate-500'} />
                                    {atleta.comentarioAtleta && !atleta.comentarioAdmin && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />}
                                  </div>
                                  <div title="Remover"
                                    onClick={() => excluirAtleta(atleta.id, grupo.id)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-700 bg-slate-800 opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer">
                                    <Trash2 size={11} className="text-slate-500" />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Totais do grupo */}
                            <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/30 border-t border-slate-800/50 text-xs">
                              <span className="text-slate-500">Total: {grupo.atletas.length}</span>
                              <span className="text-blue-400">Efetivados: {grupo.atletas.filter(a => a.aprovado).length}</span>
                              <span className="text-green-400">Pagos: {grupo.atletas.filter(a => a.pago).length}</span>
                              <span className="text-green-400">Pesaram: {grupo.atletas.filter(a => a.pesagem === 'ok').length}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {temSelecao && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <p className="text-slate-400 text-xs shrink-0">
              {gruposSelecionados.length > 0 && <span className="text-white font-bold">{gruposSelecionados.length} categoria(s) </span>}
              {atletasSelecionados.length > 0 && <span className="text-white font-bold">{atletasSelecionados.length} atleta(s) </span>}
              selecionado(s)
            </p>
            <div className="flex gap-2 flex-wrap flex-1">
              {gruposSelecionados.length > 0 && (
                <button onClick={() => setModalEncerrarPesagem(true)}
                  className="flex items-center gap-1.5 bg-red-700/80 hover:bg-red-700 border border-red-500/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
                  <Scale size={12} /> Encerrar pesagem
                </button>
              )}
              {atletasSelecionados.length > 0 && (
                <>
                  <button onClick={() => {
                    if (atletasSelecionados.length === 1) {
                      window.open(`/credencial/${atletasSelecionados[0]}/${eventoId}`, '_blank');
                    } else {
                      alert(`Credenciais para ${atletasSelecionados.length} atletas`);
                    }
                  }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                    <FileText size={12} /> Credencial
                  </button>
                  <button onClick={baixarCSV}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                    <Download size={12} /> CSV
                  </button>
                  <button onClick={() => setModalEmail(true)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                    <Mail size={12} /> Email
                  </button>
                </>
              )}
            </div>
            <button onClick={() => { setGruposSelecionados([]); setAtletasSelecionados([]); }}
              className="text-slate-500 hover:text-white transition-colors shrink-0"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {modalPerfil && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Perfil do Atleta</h3>
              <button onClick={() => setModalPerfil(null)}><X size={18} className="text-slate-500 hover:text-white" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-slate-400">
                  {modalPerfil.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-base">{modalPerfil.nome}</p>
                  <p className="text-slate-400 text-sm">{modalPerfil.academia}</p>
                  <p className="text-slate-500 text-xs">Faixa: {modalPerfil.faixa}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pagamento', valor: modalPerfil.pago ? '✅ Pago' : '⏳ Pendente' },
                  { label: 'Efetivado', valor: modalPerfil.aprovado ? '✅ Sim' : '❌ Não' },
                  { label: 'Pesagem', valor: modalPerfil.pesagem },
                  { label: 'Pódio', valor: modalPerfil.podio ? `${modalPerfil.podio}º lugar` : '—' },
                ].map(i => (
                  <div key={i.label} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                    <p className="text-slate-500 text-xs">{i.label}</p>
                    <p className="text-white text-sm font-medium capitalize">{i.valor}</p>
                  </div>
                ))}
              </div>
              {modalPerfil.comentarioAtleta && (
                <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3">
                  <p className="text-blue-400 text-xs font-bold mb-1">💬 Mensagem do atleta</p>
                  <p className="text-slate-300 text-xs italic">"{modalPerfil.comentarioAtleta}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIXEIRA */}
      {mostrarLixeira && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold flex items-center gap-2"><Trash2 size={16} className="text-red-400" /> Lixeira</h3>
              <button onClick={() => setMostrarLixeira(false)}><X size={18} className="text-slate-500 hover:text-white" /></button>
            </div>
            <div className="p-4">
              {lixeira.length === 0 ? (
                <div className="text-center py-10">
                  <Trash2 size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Lixeira vazia</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lixeira.map(atleta => (
                    <div key={atleta.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{atleta.nome}</p>
                        <p className="text-slate-500 text-xs truncate">{atleta.grupoNome}</p>
                        <p className="text-slate-600 text-xs">Removido em {atleta.excluidoEm}</p>
                      </div>
                      <button onClick={() => restaurarAtleta(atleta.id)}
                        className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shrink-0">
                        <RotateCcw size={12} /> Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMAIL */}
      {modalEmail && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Mail size={16} className="text-blue-400" /> Enviar Email</h3>
              <button onClick={() => setModalEmail(false)}><X size={18} className="text-slate-500 hover:text-white" /></button>
            </div>
            <p className="text-slate-400 text-sm mb-3">Para <strong className="text-white">{atletasSelecionados.length} atleta(s)</strong> selecionado(s).</p>
            <div className="space-y-3">
              <input placeholder="Assunto" className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              <textarea rows={4} placeholder="Mensagem..." className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalEmail(false)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => { alert(`Email enviado para ${atletasSelecionados.length} atleta(s)!`); setModalEmail(false); }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS */}
      {modalComentario && <ModalComentario atleta={modalComentario} onSalvar={salvarComentario} onFechar={() => setModalComentario(null)} />}
      {modalEncerrarPesagem && <ModalEncerrarPesagem grupos={grupos} gruposSelecionados={gruposSelecionados} onConfirmar={encerrarPesagem} onFechar={() => setModalEncerrarPesagem(false)} />}
      </div>
    </div>
  );
}