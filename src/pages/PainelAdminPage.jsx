import { useState, useEffect, useRef } from 'react';
import { Search, Users, Calendar, Shield, Trophy, DollarSign, AlertCircle, CheckCircle, X, Edit3, Trash2, Plus, Eye, BarChart3, RefreshCw, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ABAS = ['Dashboard', 'Usuários', 'Eventos', 'Times', 'Unificar Perfis'];

export default function PainelAdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('Dashboard');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Dashboard
  const [stats, setStats] = useState({ atletas: 0, professores: 0, organizadores: 0, eventos: 0, inscricoes: 0, receita: 0 });

  // Usuários
  const [usuarios, setUsuarios] = useState([]);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [pagUsuarios, setPagUsuarios] = useState(1);
  const POR_PAGINA = 20;

  // Eventos
  const [eventos, setEventos] = useState([]);
  const [buscaEvento, setBuscaEvento] = useState('');

  // Times
  const [times, setTimes] = useState([]);
  const [modalTime, setModalTime] = useState(null); // null | 'novo' | {id, nome, logo_url}
  const [formTime, setFormTime] = useState({ nome: '', logo_url: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef(null);

  // Unificar perfis
  const [perfilA, setPerfilA] = useState('');
  const [perfilB, setPerfilB] = useState('');
  const [dadosA, setDadosA] = useState(null);
  const [dadosB, setDadosB] = useState(null);
  const [unificando, setUnificando] = useState(false);

  useEffect(() => { verificarAdmin(); }, []);

  const verificarAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!data?.is_admin) { window.location.href = '/'; return; }
      setIsAdmin(true);
      await carregarDados();
    } catch(e) {
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    const [atletas, professores, organizadores, eventosData, inscricoes, timesData] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('tipo', 'atleta'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('tipo', 'professor'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('tipo', 'organizador'),
      supabase.from('eventos').select('*').order('created_at', { ascending: false }),
      supabase.from('inscricoes_entrada').select('id', { count: 'exact' }),
      supabase.from('times').select('*').order('nome'),
    ]);

    setStats({
      atletas: atletas.count || 0,
      professores: professores.count || 0,
      organizadores: organizadores.count || 0,
      eventos: eventosData.data?.length || 0,
      inscricoes: inscricoes.count || 0,
      receita: 0,
    });
    if (eventosData.data) setEventos(eventosData.data);
    if (timesData.data) setTimes(timesData.data);
  };

  const carregarUsuarios = async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (filtroTipo) query = query.eq('tipo', filtroTipo);
    if (buscaUsuario) query = query.ilike('nome', `%${buscaUsuario}%`);
    const { data } = await query;
    setUsuarios(data || []);
  };

  useEffect(() => { if (isAdmin && aba === 'Usuários') carregarUsuarios(); }, [aba, buscaUsuario, filtroTipo, isAdmin]);

  const suspenderUsuario = async (userId, ativo) => {
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', userId);
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, ativo: !ativo } : u));
    setSucesso(ativo ? 'Usuário suspenso.' : 'Usuário reativado.');
    setTimeout(() => setSucesso(''), 3000);
  };

  const suspenderEvento = async (eventoId, status) => {
    const novoStatus = status === 'suspenso' ? 'aberto' : 'suspenso';
    await supabase.from('eventos').update({ status: novoStatus }).eq('id', eventoId);
    setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, status: novoStatus } : e));
    setSucesso(`Evento ${novoStatus === 'suspenso' ? 'suspenso' : 'reativado'}.`);
    setTimeout(() => setSucesso(''), 3000);
  };

  const salvarTime = async () => {
    if (!formTime.nome.trim()) { setErro('Nome do time é obrigatório.'); return; }
    try {
      if (modalTime === 'novo') {
        const { data } = await supabase.from('times').insert({ nome: formTime.nome, logo_url: formTime.logo_url || null }).select().single();
        if (data) setTimes(prev => [...prev, data]);
      } else {
        await supabase.from('times').update({ nome: formTime.nome, logo_url: formTime.logo_url || null }).eq('id', modalTime.id);
        setTimes(prev => prev.map(t => t.id === modalTime.id ? { ...t, ...formTime } : t));
      }
      setModalTime(null);
      setFormTime({ nome: '', logo_url: '' });
      setSucesso('Time salvo!');
      setTimeout(() => setSucesso(''), 3000);
    } catch(e) { setErro('Erro: ' + e.message); }
  };

  const uploadLogoTime = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `times/${Date.now()}.${ext}`;
      await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setFormTime(p => ({ ...p, logo_url: publicUrl }));
    } catch(e) { setErro('Erro no upload: ' + e.message); }
    finally { setUploadingLogo(false); }
  };

  const excluirTime = async (timeId) => {
    if (!window.confirm('Excluir este time?')) return;
    await supabase.from('times').delete().eq('id', timeId);
    setTimes(prev => prev.filter(t => t.id !== timeId));
    setSucesso('Time excluído.');
    setTimeout(() => setSucesso(''), 3000);
  };

  const buscarPerfil = async (email, setter) => {
    if (!email.trim()) return;
    const { data } = await supabase.from('profiles').select('*, atletas(id, faixa, academia)').eq('email', email.trim()).single();
    if (data) setter(data);
    else { setErro('Perfil não encontrado: ' + email); setTimeout(() => setErro(''), 3000); }
  };

  const unificarPerfis = async () => {
    if (!dadosA || !dadosB) { setErro('Busque os dois perfis antes de unificar.'); return; }
    if (!window.confirm(`Unificar perfil de "${dadosA.nome}" com "${dadosB.nome}"?\n\nTodos os dados do perfil A serão migrados para o perfil B. O perfil A será desativado.\n\nEsta ação não pode ser desfeita.`)) return;
    setUnificando(true);
    try {
      const atletaA = dadosA.atletas?.[0];
      const atletaB = dadosB.atletas?.[0];

      if (atletaA) {
        // Migra inscrições
        await supabase.from('inscricoes_entrada').update({ atleta_id: atletaB?.id || atletaA.id }).eq('atleta_id', atletaA.id);
        // Migra histórico de faixas
        await supabase.from('historico_faixas').update({ atleta_id: atletaB?.id || atletaA.id }).eq('atleta_id', atletaA.id);
      }

      // Desativa perfil A
      await supabase.from('profiles').update({ ativo: false, nome: `[DESATIVADO] ${dadosA.nome}` }).eq('id', dadosA.id);

      setSucesso(`Perfis unificados! "${dadosA.nome}" foi desativado e seus dados migrados para "${dadosB.nome}".`);
      setTimeout(() => setSucesso(''), 5000);
      setDadosA(null); setDadosB(null);
      setPerfilA(''); setPerfilB('');
    } catch(e) {
      setErro('Erro ao unificar: ' + e.message);
    } finally {
      setUnificando(false);
    }
  };

  const usuariosFiltrados = usuarios.slice((pagUsuarios - 1) * POR_PAGINA, pagUsuarios * POR_PAGINA);
  const totalPaginas = Math.ceil(usuarios.length / POR_PAGINA);
  const eventosFiltrados = eventos.filter(e => !buscaEvento || e.nome?.toLowerCase().includes(buscaEvento.toLowerCase()));

  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
              <Shield size={24} className="text-blue-400"/>
            </div>
            <div>
              <h1 className="text-white font-black text-xl">Painel Admin NexusJJ</h1>
              <p className="text-slate-400 text-sm">Gestão da plataforma</p>
            </div>
          </div>
        </div>

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Abas */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {ABAS.map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${aba === a ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {a}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {aba === 'Dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Atletas', valor: stats.atletas, icon: Users, cor: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                { label: 'Professores', valor: stats.professores, icon: Shield, cor: 'text-green-400 bg-green-500/10 border-green-500/20' },
                { label: 'Organizadores', valor: stats.organizadores, icon: Calendar, cor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                { label: 'Eventos', valor: stats.eventos, icon: Trophy, cor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                { label: 'Inscrições', valor: stats.inscricoes, icon: BarChart3, cor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                { label: 'Times', valor: times.length, icon: Shield, cor: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-4 ${s.cor}`}>
                  <div className="flex items-center gap-3">
                    <s.icon size={20}/>
                    <div>
                      <p className="font-black text-2xl">{s.valor}</p>
                      <p className="text-xs opacity-70">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Últimos eventos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">Eventos Recentes</h3>
              <div className="space-y-2">
                {eventos.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ev.nome}</p>
                      <p className="text-slate-500 text-xs">{ev.cidade}/{ev.estado} · {ev.data_evento ? new Date(ev.data_evento).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ev.status === 'aberto' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ev.status === 'suspenso' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USUÁRIOS */}
        {aba === 'Usuários' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-3.5 text-slate-500"/>
                <input value={buscaUsuario} onChange={e => { setBuscaUsuario(e.target.value); setPagUsuarios(1); }}
                  placeholder="Buscar por nome..." className={ic + ' pl-9'}/>
              </div>
              <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagUsuarios(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="">Todos os tipos</option>
                <option value="atleta">Atletas</option>
                <option value="professor">Professores</option>
                <option value="organizador">Organizadores</option>
              </select>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-white font-bold text-sm">{usuarios.length} usuários</p>
                <button onClick={carregarUsuarios} className="text-slate-400 hover:text-white">
                  <RefreshCw size={14}/>
                </button>
              </div>
              <div className="divide-y divide-slate-800/50">
                {usuariosFiltrados.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(u.nome || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${u.ativo === false ? 'text-slate-500 line-through' : 'text-white'}`}>{u.nome}</p>
                      <p className="text-slate-500 text-xs truncate">{u.email} · {u.tipo}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {u.is_admin && <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Admin</span>}
                      <button onClick={() => suspenderUsuario(u.id, u.ativo !== false)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${u.ativo === false ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600' : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600'} hover:text-white`}>
                        {u.ativo === false ? 'Reativar' : 'Suspender'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <button disabled={pagUsuarios === 1} onClick={() => setPagUsuarios(p => p-1)}
                    className="text-slate-400 hover:text-white disabled:opacity-30 text-sm">← Anterior</button>
                  <span className="text-slate-500 text-xs">{pagUsuarios} / {totalPaginas}</span>
                  <button disabled={pagUsuarios === totalPaginas} onClick={() => setPagUsuarios(p => p+1)}
                    className="text-slate-400 hover:text-white disabled:opacity-30 text-sm">Próxima →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENTOS */}
        {aba === 'Eventos' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3.5 text-slate-500"/>
              <input value={buscaEvento} onChange={e => setBuscaEvento(e.target.value)}
                placeholder="Buscar evento..." className={ic + ' pl-9'}/>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-white font-bold text-sm">{eventosFiltrados.length} eventos</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {eventosFiltrados.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{ev.nome}</p>
                      <p className="text-slate-500 text-xs">{ev.cidade}/{ev.estado} · {ev.data_evento ? new Date(ev.data_evento).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ev.status === 'aberto' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ev.status === 'suspenso' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {ev.status}
                      </span>
                      <button onClick={() => window.open(`/eventos/${ev.id}`, '_blank')}
                        className="text-slate-500 hover:text-white transition-colors"><Eye size={14}/></button>
                      <button onClick={() => suspenderEvento(ev.id, ev.status)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${ev.status === 'suspenso' ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600' : 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600'} hover:text-white`}>
                        {ev.status === 'suspenso' ? 'Reativar' : 'Suspender'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TIMES */}
        {aba === 'Times' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setModalTime('novo'); setFormTime({ nome: '', logo_url: '' }); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                <Plus size={14}/> Novo Time
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {times.length === 0 ? (
                <div className="text-center py-10">
                  <Trophy size={32} className="text-slate-700 mx-auto mb-2"/>
                  <p className="text-slate-500 text-sm">Nenhum time cadastrado ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {times.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" alt=""/> : <Trophy size={16} className="text-slate-500"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{t.nome}</p>
                        <p className="text-slate-500 text-xs">{t.ativo ? 'Ativo' : 'Inativo'}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setModalTime(t); setFormTime({ nome: t.nome, logo_url: t.logo_url || '' }); }}
                          className="text-slate-400 hover:text-blue-400 transition-colors"><Edit3 size={14}/></button>
                        <button onClick={() => excluirTime(t.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UNIFICAR PERFIS */}
        {aba === 'Unificar Perfis' && (
          <div className="space-y-4">
            <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-yellow-300 text-sm font-bold mb-1">⚠️ Atenção</p>
              <p className="text-yellow-200 text-xs">Esta operação migra todos os dados do Perfil A para o Perfil B e desativa o Perfil A. Não pode ser desfeita.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Perfil A */}
              <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-red-400 font-bold text-sm mb-3">Perfil A — será desativado</h3>
                <div className="flex gap-2 mb-3">
                  <input value={perfilA} onChange={e => setPerfilA(e.target.value)}
                    placeholder="Email do perfil A" className={ic}/>
                  <button onClick={() => buscarPerfil(perfilA, setDadosA)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 rounded-xl text-sm">Buscar</button>
                </div>
                {dadosA && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <p className="text-white font-medium text-sm">{dadosA.nome}</p>
                    <p className="text-slate-500 text-xs">{dadosA.email} · {dadosA.tipo}</p>
                    <p className="text-slate-600 text-xs mt-0.5">ID: {dadosA.id.substring(0,8)}...</p>
                  </div>
                )}
              </div>

              {/* Perfil B */}
              <div className="bg-slate-900 border border-green-500/20 rounded-2xl p-5">
                <h3 className="text-green-400 font-bold text-sm mb-3">Perfil B — permanece ativo</h3>
                <div className="flex gap-2 mb-3">
                  <input value={perfilB} onChange={e => setPerfilB(e.target.value)}
                    placeholder="Email do perfil B" className={ic}/>
                  <button onClick={() => buscarPerfil(perfilB, setDadosB)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 rounded-xl text-sm">Buscar</button>
                </div>
                {dadosB && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <p className="text-white font-medium text-sm">{dadosB.nome}</p>
                    <p className="text-slate-500 text-xs">{dadosB.email} · {dadosB.tipo}</p>
                    <p className="text-slate-600 text-xs mt-0.5">ID: {dadosB.id.substring(0,8)}...</p>
                  </div>
                )}
              </div>
            </div>

            {dadosA && dadosB && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-3">Resumo da unificação</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-red-400 font-bold">{dadosA.nome}</span>
                    <span>→ será desativado</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>Inscrições e histórico migram para</span>
                    <span className="text-green-400 font-bold">{dadosB.nome}</span>
                  </div>
                </div>
                <button onClick={unificarPerfis} disabled={unificando}
                  className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={14}/> {unificando ? 'Unificando...' : 'Confirmar Unificação'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TIME */}
      {modalTime && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">{modalTime === 'novo' ? 'Novo Time' : 'Editar Time'}</h3>
              <button onClick={() => setModalTime(null)}><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {formTime.logo_url ? <img src={formTime.logo_url} className="w-full h-full object-cover" alt=""/> : <Trophy size={24} className="text-slate-500"/>}
                </div>
                <div>
                  <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                    className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-700 transition-all">
                    <Camera size={12}/> {uploadingLogo ? 'Enviando...' : 'Upload Logo'}
                  </button>
                  <input ref={logoRef} type="file" accept="image/*" onChange={uploadLogoTime} className="hidden"/>
                  <p className="text-slate-600 text-xs mt-1">PNG ou JPG recomendado</p>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Nome do Time *</label>
                <input value={formTime.nome} onChange={e => setFormTime(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Gracie Barra" className={ic}/>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalTime(null)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">Cancelar</button>
                <button onClick={salvarTime} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}