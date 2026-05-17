import { useState, useEffect } from 'react';
import { Plus, Calendar, Trophy, Settings, LogOut, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listarEventosOrganizador } from '../api/eventosService';

export default function PainelOrganizadorPage() {
  const [perfil, setPerfil] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [eventosColaborador, setEventosColaborador] = useState([]);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }

      const [perfilRes, eventosRes, tokensRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        listarEventosOrganizador(user.id),
        supabase.from('organizador_tokens').select('saldo').eq('organizador_id', user.id).single(),
      ]);

      if (perfilRes.data) setPerfil(perfilRes.data);
      if (eventosRes) setEventos(eventosRes);

      // Busca eventos onde o usuário é colaborador
      const { data: colabData } = await supabase
        .from('colaboradores_evento')
        .select('permissoes, eventos(id, nome, data_evento, cidade, estado, status)')
        .eq('profile_id', user.id);
      if (colabData) setEventosColaborador(colabData);
      if (tokensRes.data) setTokens(tokensRes.data.saldo);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Olá, {perfil?.nome?.split(' ')[0] || 'Organizador'}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Bem-vindo ao seu painel</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${tokens > 0 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <Coins size={12} /> {tokens} token{tokens !== 1 ? 's' : ''}
            </span>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Trophy size={20} className="text-blue-400 mb-2" />
            <p className="text-white text-2xl font-bold">{eventos.length}</p>
            <p className="text-slate-500 text-xs">Total de Eventos</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Calendar size={20} className="text-green-400 mb-2" />
            <p className="text-white text-2xl font-bold">{eventos.filter(e => e.status === 'aberto').length}</p>
            <p className="text-slate-500 text-xs">Eventos Ativos</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Coins size={20} className="text-yellow-400 mb-2" />
            <p className="text-white text-2xl font-bold">{tokens}</p>
            <p className="text-slate-500 text-xs">Tokens Disponíveis</p>
          </div>
        </div>

        {/* Eventos */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Meus Eventos</h2>
          <a href="/eventos/novo"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus size={16} /> Criar Evento
          </a>
        </div>

        {eventos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <Trophy size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhum evento ainda</p>
            <p className="text-slate-600 text-sm mt-1">Crie seu primeiro evento!</p>
            <a href="/eventos/novo"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
              <Plus size={16} /> Criar primeiro evento
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map(e => (
              <div key={e.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{e.nome}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${e.status === 'aberto' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {e.status === 'aberto' ? 'Aberto' : e.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {e.data_evento ? new Date(e.data_evento).toLocaleDateString('pt-BR') : '—'}
                    {e.cidade ? ` · ${e.cidade}/${e.estado}` : ''}
                    {e.valor_inscricao ? ` · R$ ${e.valor_inscricao}` : ''}
                  </p>
                </div>
                <a href={`/eventos/${e.id}/admin`}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shrink-0">
                  <Settings size={12} /> Gerenciar
                </a>
              </div>
            ))}
          </div>
        )}

      {/* Eventos como Colaborador */}
      {eventosColaborador.length > 0 && (
        <div className="mt-8">
          <h2 className="text-white font-bold text-lg mb-4">🤝 Eventos como Colaborador</h2>
          <div className="space-y-3">
            {eventosColaborador.map(colab => (
              <div key={colab.eventos?.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{colab.eventos?.nome || '—'}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {colab.eventos?.data_evento ? new Date(colab.eventos.data_evento).toLocaleDateString('pt-BR') : '—'}
                    {colab.eventos?.cidade ? ` · ${colab.eventos.cidade}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {colab.permissoes?.includes('tudo') ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🔑 Acesso Total</span>
                    ) : (
                      (colab.permissoes || []).map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">{p}</span>
                      ))
                    )}
                  </div>
                </div>
                <a href={`/eventos/${colab.eventos?.id}/admin`}
                  className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all shrink-0">
                  <Settings size={12} /> Acessar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}