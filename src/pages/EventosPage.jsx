import { useState, useEffect } from 'react';
import { listarEventos } from '../api/eventosService';
import { Search, MapPin, Calendar, Filter, ChevronRight, Star, Clock, Users, X, Map } from 'lucide-react';

const EVENTOS = [
  {
    id: 1,
    nome: 'Copa NexusJJ 2026',
    banner: null,
    data: '28/06/2026',
    dataFim: '29/06/2026',
    hora: '08:00',
    local: 'Ginásio Municipal',
    cidade: 'São Paulo',
    estado: 'SP',
    modalidades: ['Gi', 'NoGi'],
    organizador: 'FJJ-SP Eventos',
    inscritos: 142,
    status: 'inscricoes_abertas',
    prazo: '20/06/2026',
    destaque: true,
    categorias: 24,
    valor_min: 80,
  },
  {
    id: 2,
    nome: 'Open Sul de Jiu-Jitsu 2026',
    banner: null,
    data: '15/08/2026',
    dataFim: '15/08/2026',
    hora: '09:00',
    local: 'Centro de Eventos',
    cidade: 'Porto Alegre',
    estado: 'RS',
    modalidades: ['Gi'],
    organizador: 'Open Sul Eventos',
    inscritos: 67,
    status: 'inscricoes_abertas',
    prazo: '08/08/2026',
    destaque: false,
    categorias: 18,
    valor_min: 100,
  },
  {
    id: 3,
    nome: '3ª Etapa Circuito Catarinense 2026',
    banner: null,
    data: '23/05/2026',
    dataFim: '24/05/2026',
    hora: '08:00',
    local: 'Ginásio Manoel Sertório',
    cidade: 'São João Batista',
    estado: 'SC',
    modalidades: ['Gi', 'NoGi'],
    organizador: 'FJJ-SC',
    inscritos: 310,
    status: 'encerrado',
    prazo: '20/05/2026',
    destaque: false,
    categorias: 32,
    valor_min: 90,
  },
  {
    id: 4,
    nome: 'Campeonato Paranaense 2026',
    banner: null,
    data: '12/07/2026',
    dataFim: '13/07/2026',
    hora: '08:00',
    local: 'Arena Curitiba',
    cidade: 'Curitiba',
    estado: 'PR',
    modalidades: ['Gi'],
    organizador: 'FJJ-PR',
    inscritos: 89,
    status: 'inscricoes_abertas',
    prazo: '05/07/2026',
    destaque: true,
    categorias: 28,
    valor_min: 110,
  },
  {
    id: 5,
    nome: 'Open Rio NoGi Championship',
    banner: null,
    data: '20/09/2026',
    dataFim: '21/09/2026',
    hora: '09:00',
    local: 'Ginásio da Tijuca',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    modalidades: ['NoGi'],
    organizador: 'Rio NoGi Events',
    inscritos: 54,
    status: 'em_breve',
    prazo: '13/09/2026',
    destaque: false,
    categorias: 16,
    valor_min: 120,
  },
];

const MODALIDADES = ['Todos', 'Gi', 'NoGi'];
const ESTADOS = ['Todos', 'SP', 'RJ', 'MG', 'RS', 'SC', 'PR', 'BA', 'CE'];

const statusConfig = {
  aberto: { label: 'Inscrições Abertas', cor: 'bg-green-500/10 text-green-400 border-green-500/20' },
  inscricoes_abertas: { label: 'Inscrições Abertas', cor: 'bg-green-500/10 text-green-400 border-green-500/20' },
  em_breve: { label: 'Em Breve', cor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  encerrado: { label: 'Encerrado', cor: 'bg-slate-700 text-slate-400 border-slate-600' },
  cancelado: { label: 'Cancelado', cor: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function BannerEvento({ evento, grande }) {
  const cores = [
    'from-blue-900 to-slate-900',
    'from-purple-900 to-slate-900',
    'from-cyan-900 to-slate-900',
    'from-indigo-900 to-slate-900',
    'from-violet-900 to-slate-900',
  ];
  const cor = cores[Math.abs(evento.nome?.charCodeAt(0) || 0) % cores.length];
  return (
    <div className={`w-full ${grande ? 'h-48' : 'h-32'} bg-gradient-to-br ${cor} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-4 w-20 h-20 rounded-full border-4 border-white" />
        <div className="absolute bottom-2 right-4 w-32 h-32 rounded-full border-4 border-white" />
      </div>
      <div className="text-center px-4 relative z-10">
        <p className="text-white font-bold text-lg leading-tight">{evento.nome}</p>
        <p className="text-slate-300 text-sm mt-1">{evento.cidade}/{evento.estado}</p>
      </div>
    </div>
  );
}

function CardEvento({ evento, destaque }) {
  const dataFormatada = evento.data_evento
    ? new Date(evento.data_evento).toLocaleDateString('pt-BR')
    : evento.data || '';
  const statusAtual = evento.status || 'aberto';
  const statusCfg = statusConfig[statusAtual] || statusConfig['aberto'];

  return (
    <div className={`bg-slate-900 border rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 group ${destaque ? 'border-yellow-500/30' : 'border-slate-800'}`}>
      {destaque && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 flex items-center gap-1.5">
          <Star size={12} className="text-yellow-400" />
          <span className="text-yellow-400 text-xs font-medium">Evento em Destaque</span>
        </div>
      )}
      <BannerEvento evento={evento} grande={destaque} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-blue-400 transition-colors">{evento.nome}</h3>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusCfg.cor}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="space-y-1.5 mb-4">
          <p className="text-slate-400 text-xs flex items-center gap-1.5">
            <Calendar size={11} className="shrink-0" />
            {dataFormatada}
          </p>
          <p className="text-slate-400 text-xs flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0" />
            {evento.local || ''} — {evento.cidade || ''}/{evento.estado || ''}
          </p>
          {evento.mostrar_inscritos && (
          <p className="text-slate-400 text-xs flex items-center gap-1.5">
            <Users size={11} className="shrink-0" />
            {evento.inscritos || 0} inscritos
          </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {(evento.modalidades || ['Gi']).map(m => (
              <span key={m} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">{m}</span>
            ))}
          </div>
        </div>

        <a href={`/eventos/${evento.id}`}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-all">
          Ver evento <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}

export default function EventosPage() {
  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('Todos');
  const [estado, setEstado] = useState('Todos');
  const [status, setStatus] = useState('Todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [visuMapa, setVisuMapa] = useState(false);
  const [eventos, setEventos] = useState(EVENTOS);
  const [loadingEventos, setLoadingEventos] = useState(true);

  useEffect(() => {
    listarEventos()
      .then(data => { if (data?.length) setEventos(data); })
      .catch(e => console.error('Erro ao carregar eventos:', e))
      .finally(() => setLoadingEventos(false));
  }, []);

  const eventosFiltrados = eventos.filter(e => {
    const buscaOk = e.nome.toLowerCase().includes(busca.toLowerCase()) || e.cidade.toLowerCase().includes(busca.toLowerCase());
    const modalOk = modalidade === 'Todos' || (e.modalidades || []).includes(modalidade) || modalidade === 'Todos';
    const estadoOk = estado === 'Todos' || e.estado === estado;
    const statusOk = status === 'Todos' || e.status === status;
    return buscaOk && modalOk && estadoOk && statusOk;
  });

  const destaques = eventosFiltrados.filter(e => e.destaque || false).slice(0, 2);
  const outros = eventosFiltrados.filter(e => !e.destaque);
  const proximos = eventos.filter(e => e.status === 'inscricoes_abertas' || e.status === 'em_breve' || e.status === 'aberto').slice(0, 3);

  return (
    <div className="min-h-screen bg-nexus-dark">
      {/* HERO */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Eventos de Artes Marciais
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Encontre competições de Jiu-Jitsu, Judô, MMA e muito mais em todo o Brasil
          </p>

          {/* Barra de busca */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar evento ou cidade..."
                className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 backdrop-blur"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-3 top-3.5 text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${mostrarFiltros ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
              <Filter size={16} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button
              onClick={() => setVisuMapa(!visuMapa)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${visuMapa ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
              <Map size={16} />
              <span className="hidden sm:inline">Mapa</span>
            </button>
          </div>

          {/* Filtros expandidos */}
          {mostrarFiltros && (
            <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 max-w-2xl mx-auto backdrop-blur">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Modalidade</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MODALIDADES.map(m => (
                      <button key={m} onClick={() => setModalidade(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${modalidade === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Estado</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ESTADOS.slice(0, 5).map(e => (
                      <button key={e} onClick={() => setEstado(e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${estado === e ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Todos', 'inscricoes_abertas', 'em_breve', 'encerrado'].map(s => (
                      <button key={s} onClick={() => setStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${status === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                        {s === 'Todos' ? 'Todos' : s === 'inscricoes_abertas' ? 'Abertas' : s === 'em_breve' ? 'Em Breve' : 'Encerrado'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* MAPA (simulado) */}
        {visuMapa && (
          <div className="mb-10 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-800/50 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
              <p className="text-white text-sm font-medium flex items-center gap-2"><Map size={16} className="text-blue-400" /> Mapa de Eventos</p>
              <button onClick={() => setVisuMapa(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                {eventos.map((e, i) => (
                  <div key={e.id} className="absolute" style={{ left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 25}%` }}>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {i + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center relative z-10">
                <Map size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Mapa interativo disponível em breve</p>
                <p className="text-slate-600 text-xs mt-1">{eventos.length} eventos no Brasil</p>
              </div>
            </div>
          </div>
        )}

        {/* PRÓXIMOS EVENTOS */}
        {!busca && modalidade === 'Todos' && estado === 'Todos' && status === 'Todos' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Clock size={20} className="text-blue-400" /> Próximos Eventos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {proximos.map(e => {
                const dataEvento = e.data_evento || e.data || '';
                const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : '';
                const partes = dataFormatada.split('/');
                return (
                <a key={e.id} href={`/eventos/${e.id}`} className="bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-xl p-4 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-blue-400 text-xs font-bold">{partes[1] || ''}</span>
                      <span className="text-white text-lg font-bold leading-none">{partes[0] || ''}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors truncate">{e.nome}</p>
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} /> {e.cidade || ''}/{e.estado || ''}</p>
                      <div className="flex gap-1 mt-1.5">
                        {(e.modalidades || ['Gi']).map(m => (
                          <span key={m} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </a>
                );
              })}
            </div>
          </div>
        )}

        {/* DESTAQUES */}
        {destaques.length > 0 && (
          <div className="mb-10">
            <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-5">
              <Star size={20} className="text-yellow-400" /> Em Destaque
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {destaques.map(e => <CardEvento key={e.id} evento={e} destaque />)}
            </div>
          </div>
        )}

        {/* TODOS OS EVENTOS */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-xl">
              {busca || modalidade !== 'Todos' || estado !== 'Todos' || status !== 'Todos'
                ? `${eventosFiltrados.length} resultado${eventosFiltrados.length !== 1 ? 's' : ''}`
                : 'Todos os Eventos'}
            </h2>
            <p className="text-slate-500 text-sm">{eventosFiltrados.length} eventos</p>
          </div>

          {eventosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">Nenhum evento encontrado.</p>
              <p className="text-sm mt-1">Tente ajustar os filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(destaques.length > 0 ? outros : eventosFiltrados).map(e => (
                <CardEvento key={e.id} evento={e} destaque={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}