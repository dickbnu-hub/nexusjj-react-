import { useState, useEffect, useRef } from 'react';
import { Search, Users, Calendar, Shield, Trophy, DollarSign, AlertCircle, CheckCircle, X, Edit3, Trash2, Plus, Eye, BarChart3, RefreshCw, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ABAS = ['Dashboard', 'Organizadores', 'Financeiro', 'Academias', 'Usuários', 'Eventos', 'Times', 'Unificar Perfis'];

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

  // Organizadores
  const [organizadores, setOrganizadores] = useState([]);
  const [modalOrg, setModalOrg] = useState(null);
  const [formOrg, setFormOrg] = useState({ aprovado: false, valor_token: '' });
  const [salvandoOrg, setSalvandoOrg] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);

  // Financeiro
  const [finEventos, setFinEventos] = useState([]);
  const [finResumo, setFinResumo] = useState({ total_tokens: 0, total_valor: 0, total_eventos: 0 });
  const [modalTokens, setModalTokens] = useState(null);
  const [formTokens, setFormTokens] = useState({ quantidade: '', observacao: '', desconto: false });
  const [adicionandoTokens, setAdicionandoTokens] = useState(false);

  // Academias
  const [academias, setAcademias] = useState([]);
  const [buscaAcademia, setBuscaAcademia] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAcademia, setModalAcademia] = useState(null);

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

  const carregarOrganizadores = async () => {
    const { data } = await supabase.from('profiles').select('id,nome,email,aprovado,aprovado_em,valor_token,created_at').eq('tipo', 'organizador').order('created_at', { ascending: false });
    setOrganizadores(data || []);
    const { data: notifs } = await supabase.from('notificacoes_admin').select('*').eq('lida', false).order('created_at', { ascending: false });
    setNotificacoes(notifs || []);
  };

  const salvarOrganizador = async () => {
    if (!modalOrg) return;
    setSalvandoOrg(true);
    try {
      await supabase.from('profiles').update({ aprovado: formOrg.aprovado, valor_token: parseFloat(formOrg.valor_token) || 0, aprovado_em: formOrg.aprovado ? new Date().toISOString() : null }).eq('id', modalOrg.id);
      await supabase.from('notificacoes_admin').update({ lida: true }).eq('referencia_id', modalOrg.id);
      setSucesso('Organizador atualizado!'); setTimeout(() => setSucesso(''), 3000);
      setModalOrg(null); carregarOrganizadores();
    } catch(e) { setErro('Erro: ' + e.message); }
    setSalvandoOrg(false);
  };

  const adicionarTokens = async () => {
    if (!modalTokens || !formTokens.quantidade) return;
    setAdicionandoTokens(true);
    try {
      const qtd = parseInt(formTokens.quantidade);
      const valorUnit = modalTokens.valor_token || 0;
      const jaComprou = modalTokens.total_comprado || 0;
      const descPct = formTokens.desconto && jaComprou < 100 ? 10 : 0;
      const valorTotal = qtd * valorUnit * (1 - descPct / 100);
      const { data: saldo } = await supabase.from('tokens_saldo').select('id').eq('organizador_id', modalTokens.id).single().catch(() => ({ data: null }));
      if (saldo) {
        await supabase.from('tokens_saldo').update({ saldo: (modalTokens.saldo || 0) + qtd, total_comprado: jaComprou + qtd, updated_at: new Date().toISOString() }).eq('organizador_id', modalTokens.id);
      } else {
        await supabase.from('tokens_saldo').insert({ organizador_id: modalTokens.id, saldo: qtd, total_comprado: qtd, total_usado: 0 });
      }
      await supabase.from('tokens_transacoes').insert({ organizador_id: modalTokens.id, tipo: 'manual', quantidade: qtd, valor_unitario: valorUnit, valor_total: valorTotal, desconto_pct: descPct, observacao: formTokens.observacao || 'Adicionado pelo admin', criado_por: (await supabase.auth.getUser()).data.user?.id });
      setSucesso(`${qtd} tokens adicionados!`); setTimeout(() => setSucesso(''), 3000);
      setModalTokens(null); setFormTokens({ quantidade: '', observacao: '', desconto: false });
      carregarOrganizadores(); carregarFinanceiro();
    } catch(e) { setErro('Erro: ' + e.message); }
    setAdicionandoTokens(false);
  };

  const carregarFinanceiro = async () => {
    const { data: evts } = await supabase.from('eventos').select('id,nome,created_at,organizador_id').order('created_at', { ascending: false });
    if (!evts) return;
    const resultado = [];
    let totalTokens = 0, totalValor = 0;
    for (const ev of evts) {
      const { count: atletas } = await supabase.from('inscricoes').select('id', { count: 'exact' }).eq('evento_id', ev.id).eq('status', 'confirmado');
      const { data: trans } = await supabase.from('tokens_transacoes').select('quantidade,valor_total').eq('evento_id', ev.id).eq('tipo', 'uso');
      const tokensUsados = Math.abs((trans || []).reduce((s, t) => s + (t.quantidade || 0), 0));
      const valorEv = (trans || []).reduce((s, t) => s + (parseFloat(t.valor_total) || 0), 0);
      const { data: org } = await supabase.from('profiles').select('nome,valor_token').eq('id', ev.organizador_id).single().catch(() => ({ data: null }));
      resultado.push({ ...ev, atletas: atletas || 0, tokens_usados: tokensUsados, valor_arrecadado: Math.abs(valorEv), organizador_nome: org?.nome || '—', valor_token: org?.valor_token || 0 });
      totalTokens += tokensUsados; totalValor += Math.abs(valorEv);
    }
    setFinEventos(resultado);
    setFinResumo({ total_tokens: totalTokens, total_valor: totalValor, total_eventos: evts.length });
  };

  const carregarAcademias = async () => {
    // Busca todos os professores
    const { data: profs } = await supabase.from('profiles').select('id,nome,email,telefone').eq('tipo', 'professor').order('nome');
    // Busca tabela academias
    const { data: acads } = await supabase.from('academias').select('*').order('nome');
    // Unifica
    const idsComAcademia = (acads || []).map(a => a.professor_id);
    const profsSeAcad = (profs || []).filter(p => !idsComAcademia.includes(p.id)).map(p => ({
      id: p.id, nome: p.nome, email: p.email, telefone: p.telefone,
      cidade: null, estado: null, responsavel: p.nome, _tipo: 'professor'
    }));
    let resultado = [...(acads || []), ...profsSeAcad];
    // Filtros no frontend
    if (buscaAcademia) resultado = resultado.filter(a => a.nome?.toLowerCase().includes(buscaAcademia.toLowerCase()));
    if (filtroEstado) resultado = resultado.filter(a => a.estado === filtroEstado);
    setAcademias(resultado);
  };

  const carregarUsuarios = async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (filtroTipo) query = query.eq('tipo', filtroTipo);
    if (buscaUsuario) query = query.ilike('nome', `%${buscaUsuario}%`);
    const { data } = await query;
    setUsuarios(data || []);
  };

  useEffect(() => { if (isAdmin && aba === 'Usuários') carregarUsuarios(); }, [aba, buscaUsuario, filtroTipo, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Organizadores') carregarOrganizadores(); }, [aba, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Financeiro') carregarFinanceiro(); }, [aba, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Academias') carregarAcademias(); }, [aba, buscaAcademia, filtroEstado, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Organizadores') carregarOrganizadores(); }, [aba, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Financeiro') carregarFinanceiro(); }, [aba, isAdmin]);
  useEffect(() => { if (isAdmin && aba === 'Academias') carregarAcademias(); }, [aba, buscaAcademia, filtroEstado, isAdmin]);

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
      await supabase.storage.from('logos-times').upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('logos-times').getPublicUrl(path);
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
        {aba === 'Organizadores' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">Organizadores {notificacoes.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notificacoes.length} pendente{notificacoes.length > 1 ? 's' : ''}</span>}</h2>
              <button onClick={carregarOrganizadores} className="text-slate-400 hover:text-white"><RefreshCw size={16}/></button>
            </div>
            {organizadores.length === 0 && <p className="text-slate-500 text-sm">Nenhum organizador cadastrado.</p>}
            {organizadores.map(org => (
              <div key={org.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white truncate">{org.nome || '—'}</p>
                    {org.aprovado ? <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Aprovado</span> : <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">Pendente</span>}
                  </div>
                  <p className="text-slate-400 text-sm truncate">{org.email}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Token: R$ {parseFloat(org.valor_token || 0).toFixed(2)} · Cadastro: {new Date(org.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => { setModalOrg(org); setFormOrg({ aprovado: org.aprovado || false, valor_token: org.valor_token || '' }); }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all shrink-0">
                  Editar
                </button>
              </div>
            ))}
            {modalOrg && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOrg(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Configurar Organizador</h3>
                    <button onClick={() => setModalOrg(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{modalOrg.nome} · {modalOrg.email}</p>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formOrg.aprovado} onChange={e => setFormOrg(p => ({ ...p, aprovado: e.target.checked }))} className="w-4 h-4 rounded"/>
                      <span className="text-white text-sm font-medium">Aprovar organizador</span>
                    </label>
                    <div>
                      <label className="text-slate-400 text-xs mb-1.5 block">Valor por token (R$)</label>
                      <input type="number" step="0.01" value={formOrg.valor_token} onChange={e => setFormOrg(p => ({ ...p, valor_token: e.target.value }))} placeholder="Ex: 2.50" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setModalOrg(null)} className="flex-1 border border-slate-700 text-slate-300 py-2.5 rounded-lg text-sm">Cancelar</button>
                    <button onClick={salvarOrganizador} disabled={salvandoOrg} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">{salvandoOrg ? 'Salvando...' : 'Salvar'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {aba === 'Financeiro' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">Painel Financeiro</h2>
              <button onClick={carregarFinanceiro} className="text-slate-400 hover:text-white"><RefreshCw size={16}/></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Total de Eventos</p>
                <p className="text-2xl font-bold text-white">{finResumo.total_eventos}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Tokens Consumidos</p>
                <p className="text-2xl font-bold text-blue-400">{finResumo.total_tokens}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-green-400">R$ {finResumo.total_valor.toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Por Evento</h3>
              {finEventos.length === 0 && <p className="text-slate-500 text-sm">Nenhum evento encontrado.</p>}
              {finEventos.map(ev => (
                <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{ev.nome}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{ev.organizador_nome} · Token: R$ {parseFloat(ev.valor_token || 0).toFixed(2)}</p>
                    </div>
                    <button onClick={() => { setModalTokens({ ...ev, saldo: 0 }); setFormTokens({ quantidade: '', observacao: '', desconto: false }); }} className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0">+ Tokens</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800">
                    <div className="text-center"><p className="text-slate-500 text-xs">Atletas</p><p className="text-white font-bold">{ev.atletas}</p></div>
                    <div className="text-center"><p className="text-slate-500 text-xs">Tokens</p><p className="text-blue-400 font-bold">{ev.tokens_usados}</p></div>
                    <div className="text-center"><p className="text-slate-500 text-xs">Receita</p><p className="text-green-400 font-bold">R$ {ev.valor_arrecadado.toFixed(2)}</p></div>
                  </div>
                </div>
              ))}
            </div>
            {modalTokens && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalTokens(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Adicionar Tokens</h3>
                    <button onClick={() => setModalTokens(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{modalTokens.organizador_nome} · {modalTokens.nome}</p>
                  <div className="space-y-4">
                    <div><label className="text-slate-400 text-xs mb-1.5 block">Quantidade de tokens</label>
                      <input type="number" value={formTokens.quantidade} onChange={e => setFormTokens(p => ({ ...p, quantidade: e.target.value }))} placeholder="Ex: 50" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                    <div><label className="text-slate-400 text-xs mb-1.5 block">Observação</label>
                      <input type="text" value={formTokens.observacao} onChange={e => setFormTokens(p => ({ ...p, observacao: e.target.value }))} placeholder="Ex: Pagamento PIX" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"/>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formTokens.desconto} onChange={e => setFormTokens(p => ({ ...p, desconto: e.target.checked }))} className="w-4 h-4 rounded"/>
                      <span className="text-white text-sm">Aplicar desconto 10% (primeiros 100 tokens)</span>
                    </label>
                    {formTokens.quantidade && <p className="text-slate-400 text-xs">Valor: R$ {(parseInt(formTokens.quantidade || 0) * parseFloat(modalTokens.valor_token || 0) * (formTokens.desconto ? 0.9 : 1)).toFixed(2)}</p>}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setModalTokens(null)} className="flex-1 border border-slate-700 text-slate-300 py-2.5 rounded-lg text-sm">Cancelar</button>
                    <button onClick={adicionarTokens} disabled={adicionandoTokens} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">{adicionandoTokens ? 'Adicionando...' : 'Confirmar'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {aba === 'Academias' && (
          <div className="space-y-4">
            <div className="flex gap-3 mb-2">
              <input value={buscaAcademia} onChange={e => setBuscaAcademia(e.target.value)} placeholder="Buscar academia..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"/>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                <option value="">Todos estados</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            {academias.length === 0 && <p className="text-slate-500 text-sm">Nenhuma academia encontrada.</p>}
            {academias.map(a => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{a._tipo === 'professor' ? <span className="text-yellow-400">[Sem academia cadastrada]</span> : a.nome}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{[a.cidade, a.estado].filter(Boolean).join(', ') || '—'}</p>
                  <p className="text-slate-500 text-xs mt-1">Resp: {a.responsavel || a.nome || '—'} {a.email ? '· ' + a.email : ''}</p>
                </div>
                <button onClick={() => setModalAcademia(a)} className="ml-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all">
                  Ver detalhes
                </button>
              </div>
            ))}

            {/* Modal detalhes academia */}
            {modalAcademia && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-white font-bold text-lg">
                      {modalAcademia._tipo === 'professor' ? 'Perfil do Professor' : 'Dados da Academia'}
                    </h3>
                    <button onClick={() => setModalAcademia(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="space-y-3 text-sm">
                    {modalAcademia._tipo !== 'professor' && (
                      <div><span className="text-slate-400">Nome da academia:</span> <span className="text-white font-semibold">{modalAcademia.nome || '—'}</span></div>
                    )}
                    <div><span className="text-slate-400">Responsável:</span> <span className="text-white">{modalAcademia.responsavel || '—'}</span></div>
                    <div><span className="text-slate-400">Email:</span> <span className="text-white">{modalAcademia.email || '—'}</span></div>
                    <div><span className="text-slate-400">Telefone:</span> <span className="text-white">{modalAcademia.telefone || '—'}</span></div>
                    {modalAcademia._tipo !== 'professor' && <>
                      <div><span className="text-slate-400">Endereço:</span> <span className="text-white">{[modalAcademia.logradouro, modalAcademia.numero, modalAcademia.bairro].filter(Boolean).join(', ') || '—'}</span></div>
                      <div><span className="text-slate-400">Cidade/Estado:</span> <span className="text-white">{[modalAcademia.cidade, modalAcademia.estado].filter(Boolean).join(' / ') || '—'}</span></div>
                      <div><span className="text-slate-400">CEP:</span> <span className="text-white">{modalAcademia.cep || '—'}</span></div>
                      {modalAcademia.site && <div><span className="text-slate-400">Site:</span> <a href={modalAcademia.site} target="_blank" className="text-blue-400">{modalAcademia.site}</a></div>}
                    </>}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button onClick={() => setModalAcademia(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg">Fechar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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