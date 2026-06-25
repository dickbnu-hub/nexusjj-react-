import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEventoId } from '../hooks/useEventoId';
import { MapPin, Calendar, Clock, Users, ChevronRight, Share2, Heart, Trophy, Shield, Award, CheckCircle, AlertCircle, X, Check, ArrowLeft, Search, Timer, Zap, Radio, Youtube } from 'lucide-react';
import PainelLutasAoVivo from './PainelLutasAoVivo';
import { supabase } from '../lib/supabase';

const EVENTO = {
  id: 1,
  nome: 'Copa NexusJJ 2026',
  descricao: `A Copa NexusJJ 2026 é um evento oficial de Jiu-Jitsu Gi & NoGi aberto para atletas de todas as faixas e idades em todo o Brasil.

O evento seguirá as regras oficiais da CBJJ/IBJJF. Todos os atletas devem apresentar documento oficial com foto na pesagem.

Os campeões e vice-campeões receberão medalhas e troféus. A premiação por equipes será realizada ao final do evento.`,
  data: '28/06/2026', dataFim: '29/06/2026', hora: '08:00', horaFim: '18:00',
  local: 'Ginásio Municipal de Esportes',
  endereco: 'R. das Palmeiras, 500 — Moema, São Paulo/SP',
  cidade: 'São Paulo', estado: 'SP',
  modalidades: ['Gi', 'NoGi'],
  organizador: 'FJJ-SP Eventos',
  mostrarContador: true,
  inscritos: 142,
  status: 'inscricoes_abertas',
  prazo: '20/06/2026',
  ultimaEdicao: '18/06/2026',
  ultimoCancelamento: '15/06/2026',
  lotes: [
    { nome: 'Lote 1', inicio: '01/05/2026', fim: '31/05/2026', desconto: 20, ativo: false },
    { nome: 'Lote 2', inicio: '01/06/2026', fim: '20/06/2026', desconto: 0, ativo: true },
  ],
  categorias: [
    { id: 1, nome: 'Pre-Mirim Masculino', tipo: 'Gi', idade: '4-5 anos', faixa: 'Branca', peso: 'Galo (-22kg)', tempo: '2 min', valor: 80, horario: '08:00', area: 'Área 1' },
    { id: 2, nome: 'Pre-Mirim Feminino', tipo: 'Gi', idade: '4-5 anos', faixa: 'Branca', peso: 'Galo (-22kg)', tempo: '2 min', valor: 80, horario: '08:30', area: 'Área 2' },
    { id: 3, nome: 'Mirim Masculino', tipo: 'Gi', idade: '6-7 anos', faixa: 'Branca', peso: 'Galo (-25kg)', tempo: '2 min', valor: 80, horario: '09:00', area: 'Área 1' },
    { id: 4, nome: 'Juvenil Masculino', tipo: 'Gi', idade: '16-17 anos', faixa: 'Azul', peso: 'Pluma (-58kg)', tempo: '5 min', valor: 100, horario: '10:00', area: 'Área 2' },
    { id: 5, nome: 'Adulto Masculino', tipo: 'Gi', idade: '18-29 anos', faixa: 'Azul', peso: 'Pluma (-64kg)', tempo: '6 min', valor: 120, horario: '11:00', area: 'Área 1' },
    { id: 6, nome: 'Master 1 Masculino', tipo: 'Gi', idade: '30-35 anos', faixa: 'Azul', peso: 'Pluma (-64kg)', tempo: '5 min', valor: 120, horario: '13:00', area: 'Área 3' },
    { id: 7, nome: 'Adulto Masculino NoGi', tipo: 'NoGi', idade: '18-29 anos', faixa: 'Intermediário', peso: 'Médio (-79kg)', tempo: '6 min', valor: 100, horario: '14:00', area: 'Área 1' },
    { id: 8, nome: 'Adulto Feminino', tipo: 'Gi', idade: '18-29 anos', faixa: 'Azul', peso: 'Leve (-64kg)', tempo: '6 min', valor: 120, horario: '11:30', area: 'Área 2' },
  ],
  ranking: true,
  tipoRanking: 'Academia/Afiliação',
  pontuacao: { ouro: 9, prata: 3, bronze: 1 },
};

const ATLETAS_REGISTRADOS = [
  { id: 'NJJ-001', nome: 'Cristiano Villasboas', academia: 'Gracie Barra Blumenau', categoria: 'Adulto Masculino', faixa: 'Roxa', tipo: 'Gi', status: 'pago' },
  { id: 'NJJ-002', nome: 'Rafael Souza', academia: 'Alliance SP', categoria: 'Adulto Masculino', faixa: 'Azul', tipo: 'Gi', status: 'pago' },
  { id: 'NJJ-003', nome: 'Mariana Costa', academia: 'Checkmat Rio', categoria: 'Adulto Feminino', faixa: 'Roxa', tipo: 'Gi', status: 'pendente' },
  { id: 'NJJ-004', nome: 'Pedro Alves', academia: 'Nova União', categoria: 'Master 1 Masculino', faixa: 'Marrom', tipo: 'Gi', status: 'pago' },
  { id: 'NJJ-005', nome: 'Lucas Ferreira', academia: 'GF Team', categoria: 'Adulto Masculino NoGi', faixa: 'Intermediário', tipo: 'NoGi', status: 'pago' },
  { id: 'NJJ-006', nome: 'Ana Lima', academia: 'Gracie Barra SP', categoria: 'Adulto Feminino', faixa: 'Azul', tipo: 'Gi', status: 'pendente' },
  { id: 'NJJ-007', nome: 'Carlos Mendes', academia: 'Atos Jiu-Jitsu', categoria: 'Juvenil Masculino', faixa: 'Azul', tipo: 'Gi', status: 'pago' },
  { id: 'NJJ-008', nome: 'Fernanda Silva', academia: 'Fight Sports', categoria: 'Adulto Feminino', faixa: 'Roxa', tipo: 'Gi', status: 'pago' },
];

const RESULTADOS = {
  equipes: [
    { pos: 1, nome: 'Gracie Barra', tipo: 'afiliacao', pontos: 87, ouros: 4, pratas: 3, bronzes: 5 },
    { pos: 2, nome: 'Alliance', tipo: 'afiliacao', pontos: 72, ouros: 3, pratas: 4, bronzes: 2 },
    { pos: 3, nome: 'CT TMC', tipo: 'academia', pontos: 45, ouros: 2, pratas: 1, bronzes: 3 },
    { pos: 4, nome: 'Checkmat', tipo: 'afiliacao', pontos: 38, ouros: 1, pratas: 3, bronzes: 4 },
    { pos: 5, nome: 'Nova União', tipo: 'afiliacao', pontos: 21, ouros: 1, pratas: 0, bronzes: 2 },
  ],
  categorias: {
    gi: [
      { categoria: 'Pre-Mirim Masculino', idade: '4-5 anos', tipo: 'Gi', resultados: [{ pos: 1, nome: 'Marcos T.', academia: 'Soul Fighters', medalha: 'ouro' }, { pos: 2, nome: 'Bruno L.', academia: 'Atos', medalha: 'prata' }, { pos: 3, nome: 'Pedro R.', academia: 'Alliance', medalha: 'bronze' }, { pos: 3, nome: 'João S.', academia: 'Gracie Barra', medalha: 'bronze' }] },
      { categoria: 'Mirim Masculino', idade: '6-7 anos', tipo: 'Gi', resultados: [{ pos: 1, nome: 'Gabriel M.', academia: 'Infight', medalha: 'ouro' }, { pos: 2, nome: 'Henrique B.', academia: 'Zenith', medalha: 'prata' }] },
      { categoria: 'Adulto Masculino', idade: '18-29 anos', tipo: 'Gi', resultados: [{ pos: 1, nome: 'Cristiano V.', academia: 'Gracie Barra', medalha: 'ouro' }, { pos: 2, nome: 'Rafael S.', academia: 'Alliance', medalha: 'prata' }, { pos: 3, nome: 'Thiago S.', academia: 'Soul Fighters', medalha: 'bronze' }, { pos: 3, nome: 'Diego R.', academia: 'Fight Sports', medalha: 'bronze' }] },
      { categoria: 'Adulto Feminino', idade: '18-29 anos', tipo: 'Gi', resultados: [{ pos: 1, nome: 'Mariana C.', academia: 'Checkmat', medalha: 'ouro' }, { pos: 2, nome: 'Fernanda S.', academia: 'Fight Sports', medalha: 'prata' }] },
    ],
    nogi: [
      { categoria: 'Adulto Masculino NoGi', idade: '18-29 anos', tipo: 'NoGi', resultados: [{ pos: 1, nome: 'Lucas F.', academia: 'GF Team', medalha: 'ouro' }, { pos: 2, nome: 'Vitor H.', academia: 'Lotus Club', medalha: 'prata' }, { pos: 3, nome: 'Felipe A.', academia: 'Brasa', medalha: 'bronze' }, { pos: 3, nome: 'Carlos M.', academia: 'Checkmat', medalha: 'bronze' }] },
    ],
  },
};

const ABAS = ['Informação', 'Atletas', 'Cronograma', 'Lutas', 'Resultados', 'Transmissão'];

const medalhaConfig = {
  ouro: { cor: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', emoji: '🥇' },
  prata: { cor: 'text-slate-300', bg: 'bg-slate-700/50 border-slate-600', emoji: '🥈' },
  bronze: { cor: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', emoji: '🥉' },
};

function BannerEvento({ evento }) {
  const modalidades = evento?.modalidades || ['Gi'];
  const temImagem = !!evento?.logo_url;
  return (
    <div className="w-full h-56 md:h-72 relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900">
      {/* Imagem de fundo quando existir */}
      {temImagem && (
        <img
          src={evento.logo_url}
          alt={evento.nome}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Overlay escuro sempre presente para legibilidade */}
      <div className={`absolute inset-0 ${temImagem ? 'bg-black/50' : 'opacity-20'}`}>
        {!temImagem && (
          <>
            <div className="absolute top-4 left-8 w-32 h-32 rounded-full border-4 border-white" />
            <div className="absolute bottom-4 right-8 w-48 h-48 rounded-full border-4 border-white" />
          </>
        )}
      </div>
      <div className="text-center px-6 relative z-10 h-full flex flex-col items-center justify-center">
        <div className="flex justify-center gap-2 mb-3">
          {modalidades.map(m => (
            <span key={m} className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full">{m}</span>
          ))}
        </div>
        <h1 className="text-white font-bold text-2xl md:text-4xl drop-shadow-lg">{evento?.nome || 'Evento'}</h1>
        <p className="text-slate-200 mt-2 drop-shadow">
          {evento?.cidade}/{evento?.estado} · {evento?.data_evento ? new Date(evento.data_evento).toLocaleDateString('pt-BR') : ''}
        </p>
      </div>
    </div>
  );
}

export default function EventoDetalhePage() {
  const { eventoId } = useEventoId();
  const [evento, setEvento] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [aba, setAba] = useState('Informação');
  const [abaLutas, setAbaLutas] = useState('horario');
  const [abaCat, setAbaCat] = useState('Todos');
  const [abaResultados, setAbaResultados] = useState('equipes');
  const [abaModalidade, setAbaModalidade] = useState('gi');
  const [favoritado, setFavoritado] = useState(false);
  const [mostrarInscricao, setMostrarInscricao] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [inscricaoFeita, setInscricaoFeita] = useState(false);
  const [buscaAtleta, setBuscaAtleta] = useState('');
  const [buscaLuta, setBuscaLuta] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const [combosEvento, setCombosEvento] = useState([]);
  const [transmissao, setTransmissao] = useState(null);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    if (!eventoId) return;
    Promise.all([
      supabase.from('eventos').select('*, profiles:organizador_id(nome)').eq('id', eventoId).single(),
      supabase.from('entradas').select('*, blocos_classe(*, valores_bloco(*))').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
      supabase.from('inscricoes_entrada').select('*, atletas:atleta_id(*, profiles:profile_id(nome, avatar_url))').eq('evento_id', eventoId),
      supabase.from('lotes_evento').select('*').eq('evento_id', eventoId).order('data_inicio'),
      supabase.from('evento_precos').select('*, entradas:entrada_id(nome)').eq('evento_id', eventoId),
      supabase.from('evento_combos').select('*').eq('evento_id', eventoId).eq('ativo', true),
    ]).then(([ev, en, insc, lotes, precos, combos]) => {
      if (ev.data) setEvento({ ...ev.data, lotes_reais: lotes.data || [], precos_reais: precos.data || [] });
      if (en.data) setEntradas(en.data);
      if (insc.data) setInscricoes(insc.data);
      if (combos.data) setCombosEvento(combos.data);
      setLoadingEvento(false);
    }).catch(() => setLoadingEvento(false));

    // Busca config de transmissão e áreas
    supabase.from('transmissao_config').select('*').eq('evento_id', eventoId).maybeSingle()
      .then(({ data }) => { if (data) setTransmissao(data); });
    supabase.from('areas').select('id, nome, ordem').eq('evento_id', eventoId).order('ordem')
      .then(({ data }) => { if (data) setAreas(data); });
  }, [eventoId]);

  // Usa dados reais ou fallback para mock
  const eventoData = evento || EVENTO;
  const loteAtivo = eventoData.lotes?.find(l => l.ativo);

  const categoriasFiltradas = abaCat === 'Todos'
    ? entradas
    : entradas.filter(c => c.modalidade === abaCat);

  // Atletas reais das inscrições
  const atletasReais = inscricoes.map(i => ({
    id: i.id,
    nome: i.atletas?.profiles?.nome || 'Atleta',
    academia: i.atletas?.profiles?.academia || '—',
    categoria: i.faixa,
    faixa: i.faixa,
    tipo: entradas.find(e => e.id === i.entrada_id)?.modalidade || 'Gi',
    status: i.status_pagamento === 'pago' ? 'pago' : 'pendente',
  }));

  const atletasFiltrados = (atletasReais.length > 0 ? atletasReais : ATLETAS_REGISTRADOS).filter(a => {
    const buscaOk = a.nome.toLowerCase().includes(buscaAtleta.toLowerCase());
    const statusOk = filtroStatus === 'Todos' || a.status === filtroStatus;
    const tipoOk = filtroTipo === 'Todos' || a.tipo === filtroTipo;
    // Respeita configuração do organizador — só efetivados
    const efetivadoOk = !eventoData.mostrar_apenas_efetivados || a.status === 'pago';
    return buscaOk && statusOk && tipoOk && efetivadoOk;
  });

  // Agrupa atletas por entrada → bloco → valor_bloco (peso)
  const atletasPorCategoria = entradas.flatMap(entrada => {
    const blocos = entrada.blocos_classe || [];
    return blocos.flatMap(bloco => {
      const valores = bloco.valores_bloco || [];
      return valores.map(valor => {
        const chave_genero = valor.genero === 'Masculino' ? 'Masculino' : valor.genero === 'Feminino' ? 'Feminino' : null;
        const atletas = inscricoes.filter(i => {
          if (i.entrada_id !== entrada.id) return false;
          if (i.peso_categoria !== valor.nome) return false;
          const buscaOk = i.atletas?.profiles?.nome?.toLowerCase().includes(buscaAtleta.toLowerCase()) ?? true;
          const statusOk = filtroStatus === 'Todos' || i.status_pagamento === filtroStatus;
          const tipoOk = filtroTipo === 'Todos' || entrada.modalidade === filtroTipo;
          const efetivadoOk = !eventoData.mostrar_apenas_efetivados || i.status_pagamento === 'pago';
          return buscaOk && statusOk && tipoOk && efetivadoOk;
        }).map(i => ({
          id: i.id,
          nome: i.atletas?.profiles?.nome || 'Atleta',
          academia: i.atletas?.academia || '—',
          faixa: i.faixa || '—',
          status: i.status_pagamento,
        }));
        return {
          key: `${entrada.id}-${bloco.id}-${valor.id}`,
          entrada: entrada.nome,
          modalidade: entrada.modalidade,
          bloco: bloco.nome,
          peso: valor.nome,
          peso_max: valor.peso_max,
          atletas,
        };
      });
    });
  }).filter(g => g.atletas.length > 0);

  const [meusPerfis, setMeusPerfis] = useState([]);
  useEffect(() => {
    const carregarPerfis = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: atletasData } = await supabase
        .from('atletas')
        .select('id, faixa, academia, profiles:profile_id(nome)')
        .eq('profile_id', user.id);
      if (atletasData) {
        setMeusPerfis(atletasData.map(a => ({
          id: a.id,
          nome: a.profiles?.nome || 'Atleta',
          faixa: a.faixa || '—',
          academia: a.academia || '—',
        })));
      }
    };
    carregarPerfis();
  }, []);

  const confirmarInscricao = () => {
    if (!perfilSelecionado) return;
    window.location.href = `/eventos/${eventoId}/inscricao`;
  };

  return (
    <div className="min-h-screen bg-nexus-dark">
      <BannerEvento evento={eventoData} />

      {/* ABAS */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {ABAS.filter(a => a !== 'Atletas' || eventoData.mostrar_lista_atletas !== false).map(a => (
              <button key={a} onClick={() => setAba(a)}
                className={`shrink-0 px-4 py-4 text-sm font-medium border-b-2 transition-all ${aba === a ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                {a}
                {a === 'Atletas' && eventoData.mostrar_lista_atletas !== false && eventoData.mostrar_inscritos && (
                  <span className="ml-1.5 text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{atletasFiltrados.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <a href="/eventos" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <ArrowLeft size={14} /> Voltar para eventos
            </a>

            {/* ===== INFORMAÇÃO ===== */}
            {aba === 'Informação' && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-white font-bold text-xl">{eventoData.nome}</h2>
                      <p className="text-slate-400 text-sm mt-1">Organizado por <strong className="text-white">{eventoData.profiles?.nome || "Organizador"}</strong></p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setFavoritado(!favoritado)} className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${favoritado ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                        <Heart size={16} fill={favoritado ? 'currentColor' : 'none'} />
                      </button>
                      <button className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {[
                      { icon: Calendar, label: 'Data', valor: `${eventoData.data_evento?new Date(eventoData.data_evento).toLocaleDateString("pt-BR"):eventoData.data||""} — ${eventoData.dataFim||""}` },
                      { icon: Clock, label: 'Horário', valor: `${eventoData.hora||"08:00"} às ${eventoData.horaFim||"18:00"}` },
                      { icon: MapPin, label: 'Local', valor: eventoData.local },
                      { icon: Shield, label: 'Modalidades', valor: (eventoData.modalidades||["Gi"]).join(' & ') },
                    ].map(item => { const Icon = item.icon; return (
                      <div key={item.label} className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3">
                        <Icon size={16} className="text-blue-400 mt-0.5 shrink-0" />
                        <div><p className="text-slate-500 text-xs">{item.label}</p><p className="text-white text-sm font-medium">{item.valor}</p></div>
                      </div>
                    );})}
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line border-t border-slate-800 pt-5">{eventoData.descricao}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Clock size={16} className="text-blue-400" /> Prazos e Valores</h3>
                  <div className="space-y-3">

                    {/* Lotes reais do banco */}
                    {(eventoData.lotes_reais || eventoData.lotes || []).length > 0 && (
                      <div className="space-y-2">
                        {(eventoData.lotes_reais || eventoData.lotes || []).map((lote, i) => {
                          const hoje = new Date().toISOString().split('T')[0];
                          const ativo = lote.data_inicio <= hoje && lote.data_fim >= hoje;
                          return (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${ativo ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700 opacity-60'}`}>
                              <div>
                                <p className={`text-sm font-medium ${ativo ? 'text-white' : 'text-slate-400'}`}>
                                  {lote.nome || lote.nome}
                                  {ativo && <span className="text-green-400 text-xs ml-2">● Ativo</span>}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {lote.data_inicio ? new Date(lote.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : lote.inicio}
                                  {' — '}
                                  {lote.data_fim ? new Date(lote.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : lote.fim}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Resumo de preços por categoria */}
                    {(eventoData.precos_reais || []).length > 0 && (() => {
                      // Agrupa por categoria
                      const porCategoria = {};
                      eventoData.precos_reais.forEach(p => {
                        const nome = p.entradas?.nome || p.categoria;
                        if (!porCategoria[nome]) porCategoria[nome] = {};
                        const key = p.lote_nome === 'Inscrição Antecipada' ? 'ant'
                          : p.lote_nome === 'Inscrição Normal' ? 'nor' : 'tar';
                        porCategoria[nome][key] = parseFloat(p.valor);
                      });
                      const categorias = Object.entries(porCategoria);
                      if (categorias.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Valores por categoria</p>
                          <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
                            <div className="grid grid-cols-4 px-3 py-2 border-b border-slate-700/50">
                              <p className="text-slate-500 text-xs font-medium">Categoria</p>
                              <p className="text-green-400 text-xs font-medium text-center">Antecipada</p>
                              <p className="text-blue-400 text-xs font-medium text-center">Normal</p>
                              <p className="text-orange-400 text-xs font-medium text-center">Tardia</p>
                            </div>
                            {categorias.map(([nome, vals]) => (
                              <div key={nome} className="grid grid-cols-4 px-3 py-2 border-b border-slate-700/30 last:border-0 items-center">
                                <p className="text-white text-xs font-medium truncate">{nome}</p>
                                <p className="text-green-300 text-xs text-center">{vals.ant ? `R$ ${vals.ant.toFixed(0)}` : '—'}</p>
                                <p className="text-blue-300 text-xs text-center">{vals.nor ? `R$ ${vals.nor.toFixed(0)}` : '—'}</p>
                                <p className="text-orange-300 text-xs text-center">{vals.tar ? `R$ ${vals.tar.toFixed(0)}` : '—'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Prazos */}
                    <div className="grid grid-cols-2 gap-3">
                      {eventoData.data_inicio_inscricao && (
                        <div className="bg-slate-800/50 rounded-xl p-3">
                          <p className="text-slate-500 text-xs">Início das inscrições</p>
                          <p className="text-white text-sm font-medium">{new Date(eventoData.data_inicio_inscricao+'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {eventoData.data_fim_inscricao && (
                        <div className="bg-slate-800/50 rounded-xl p-3">
                          <p className="text-slate-500 text-xs">Fim das inscrições</p>
                          <p className="text-white text-sm font-medium">{new Date(eventoData.data_fim_inscricao+'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {eventoData.permite_cancelamento && eventoData.prazo_cancelamento && (
                        <div className="bg-orange-950/30 border border-orange-500/20 rounded-xl p-3">
                          <p className="text-orange-400 text-xs">Prazo de cancelamento</p>
                          <p className="text-white text-sm font-medium">{new Date(eventoData.prazo_cancelamento+'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {eventoData.permite_estorno && eventoData.prazo_estorno && (
                        <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3">
                          <p className="text-blue-400 text-xs">Prazo de estorno</p>
                          <p className="text-white text-sm font-medium">{new Date(eventoData.prazo_estorno+'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categorias reais */}
                {entradas.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold flex items-center gap-2"><Trophy size={16} className="text-blue-400"/> Categorias</h3>
                      <div className="flex bg-slate-800 rounded-lg p-0.5">
                        {['Todos', 'Gi', 'NoGi'].map(t => (
                          <button key={t} onClick={() => setAbaCat(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${abaCat === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoriasFiltradas.map(cat => (
                        <div key={cat.id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white text-sm font-medium">{cat.nome}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${cat.modalidade === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                {cat.modalidade || 'Gi'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combos de desconto */}
                {(eventoData.precos_reais || []).length > 0 && combosEvento.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">🎁 Combos e Descontos</h3>
                    <div className="space-y-2">
                      {combosEvento.map(combo => (
                        <div key={combo.id} className="flex items-center justify-between bg-green-950/30 border border-green-500/20 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">{combo.nome}</p>
                            <p className="text-slate-500 text-xs mt-0.5">Inscreva-se nas duas modalidades e economize</p>
                          </div>
                          <span className="text-green-400 font-black text-lg shrink-0">
                            {combo.tipo === 'percentual' ? `-${combo.valor}%` : `-R$ ${parseFloat(combo.valor).toFixed(0)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eventoData.ranking && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Award size={16} className="text-yellow-400" /> Pontuação</h3>
                    <div className="flex gap-3 mb-3">
                      {(() => {
                        const pts = eventoData.pontuacao || { ouro: 9, prata: 3, bronze: 1 };
                        return [
                          { lugar: '1º', pontos: pts.ouro, cor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                          { lugar: '2º', pontos: pts.prata, cor: 'text-slate-300 bg-slate-700/50 border-slate-600' },
                          { lugar: '3º', pontos: pts.bronze, cor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                        ].map(p => (
                        <div key={p.lugar} className={`flex-1 text-center p-3 rounded-xl border ${p.cor}`}>
                          <p className="text-sm font-bold">{p.lugar}</p>
                          <p className="text-lg font-bold mt-0.5">{p.pontos} pts</p>
                        </div>
                      ));})()} 
                    </div>
                    <p className="text-slate-400 text-xs">Ranking por equipe: <strong className="text-white">{eventoData.tipoRanking||"Academia"}</strong></p>
                  </div>
                )}
              </>
            )}

            {/* ===== ATLETAS ===== */}
            {aba === 'Atletas' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2"><Users size={16} className="text-blue-400" /> Atletas Registrados {eventoData.mostrar_inscritos && <span className="text-slate-500 text-sm font-normal">({atletasFiltrados.length})</span>}</h3>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3.5 text-slate-500" />
                  <input value={buscaAtleta} onChange={e => setBuscaAtleta(e.target.value)} placeholder="Buscar por nome ou academia..." className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex bg-slate-800 rounded-lg p-0.5">
                    {['Todos', 'Gi', 'NoGi'].map(t => <button key={t} onClick={() => setFiltroTipo(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filtroTipo === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>)}
                  </div>
                  <div className="flex bg-slate-800 rounded-lg p-0.5">
                    {['Todos', 'pago', 'pendente'].map(s => <button key={s} onClick={() => setFiltroStatus(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filtroStatus === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{s === 'Todos' ? 'Todos' : s === 'pago' ? 'Efetivado' : 'Não Efetivado'}</button>)}
                  </div>
                </div>
                {atletasPorCategoria.map(cat => (
                  <div key={cat.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-slate-300 text-sm font-semibold">{cat.entrada} · {cat.bloco} · {cat.peso}</p>
                      <span className={`text-xs px-2 py-0.5 rounded border ${cat.modalidade === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{cat.modalidade}</span>
                      <span className="text-slate-500 text-xs">{cat.atletas.length} atleta{cat.atletas.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-1.5">
                      {cat.atletas.map(a => (
                        <div key={a.id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">{a.nome.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{a.nome}</p>
                            <p className="text-slate-500 text-xs truncate">{a.academia} · Faixa {a.faixa}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${a.status === 'pago' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {a.status === 'pago' ? 'Efetivado' : 'Não Efetivado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== CRONOGRAMA ===== */}
            {aba === 'Cronograma' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Timer size={16} className="text-blue-400" /> Cronograma por Área</h3>
                {['Área 1', 'Área 2', 'Área 3'].map(area => {
                  const cats = (entradas).filter(c => c.area === area).sort((a, b) => a.horario.localeCompare(b.horario));
                  return (
                    <div key={area} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={14} className="text-blue-400" />
                        <p className="text-white font-semibold">{area}</p>
                        <span className="text-slate-500 text-xs">{cats.length} categorias</span>
                      </div>
                      <div className="space-y-2">
                        {cats.map(cat => (
                          <div key={cat.id} className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                            <div className="w-14 shrink-0 text-center">
                              <p className="text-blue-400 font-bold text-sm">{cat.horario}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-700" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{cat.nome}</p>
                              <p className="text-slate-500 text-xs">{cat.tipo} · {cat.idade} · {cat.faixa} · {cat.tempo}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${cat.tipo === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{cat.tipo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== LUTAS ===== */}
            {aba === 'Lutas' && (
              <div className="space-y-4">
                {/* Sub-menu */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button onClick={() => setAbaLutas('horario')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${abaLutas === 'horario' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    Que Horas Você Luta
                  </button>
                  <button onClick={() => setAbaLutas('aovivo')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${abaLutas === 'aovivo' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Próximas Lutas por Área
                  </button>
                </div>

                {/* Que horas você luta */}
                {abaLutas === 'horario' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4">Que Horas Você Luta?</h3>
                    <div className="relative mb-4">
                      <Search size={15} className="absolute left-3 top-3.5 text-slate-500" />
                      <input value={buscaLuta} onChange={e => setBuscaLuta(e.target.value)} placeholder="Buscar por nome, academia ou categoria..." className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      {ATLETAS_REGISTRADOS.filter(a => a.nome.toLowerCase().includes(buscaLuta.toLowerCase()) || a.academia.toLowerCase().includes(buscaLuta.toLowerCase()) || a.categoria.toLowerCase().includes(buscaLuta.toLowerCase())).map(a => {
                        const cat = (entradas).find(c => c.nome === a.categoria);
                        return (
                          <div key={a.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-white font-medium">{a.nome}</p>
                                <p className="text-slate-400 text-xs mt-0.5">{a.academia}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${a.status === 'pago' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {a.status === 'pago' ? 'Efetivado' : 'Não Efetivado'}
                              </span>
                            </div>
                            {cat && (
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 rounded-lg p-2 text-center">
                                  <p className="text-slate-500 text-xs">Horário prev.</p>
                                  <p className="text-blue-400 font-bold text-sm">{cat.horario}</p>
                                </div>
                                <div className="bg-slate-900 rounded-lg p-2 text-center">
                                  <p className="text-slate-500 text-xs">Área</p>
                                  <p className="text-white font-bold text-sm">{cat.area}</p>
                                </div>
                                <div className="bg-slate-900 rounded-lg p-2 text-center">
                                  <p className="text-slate-500 text-xs">Categoria</p>
                                  <p className="text-white font-bold text-xs">{a.categoria}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Painel ao vivo */}
                {abaLutas === 'aovivo' && <PainelLutasAoVivo />}
              </div>
            )}

            {/* ===== RESULTADOS ===== */}
            {aba === 'Resultados' && (
              <div className="space-y-4">
                {/* Sub-menu resultados */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button onClick={() => setAbaResultados('equipes')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${abaResultados === 'equipes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Por Equipes</button>
                  <button onClick={() => setAbaResultados('categorias')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${abaResultados === 'categorias' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Por Atletas/Categoria</button>
                </div>

                {/* Ranking equipes */}
                {abaResultados === 'equipes' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Trophy size={16} className="text-yellow-400" /> Ranking por Equipe</h3>
                    <div className="space-y-3">
                      {RESULTADOS.equipes.map(e => (
                        <div key={e.pos} className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${e.pos === 1 ? 'bg-yellow-500/5 border-yellow-500/20' : e.pos === 2 ? 'bg-slate-700/20 border-slate-600/30' : e.pos === 3 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                          <span className={`text-xl font-bold shrink-0 w-8 text-center ${e.pos === 1 ? 'text-yellow-400' : e.pos === 2 ? 'text-slate-300' : e.pos === 3 ? 'text-orange-400' : 'text-slate-500'}`}>
                            {e.pos === 1 ? '🥇' : e.pos === 2 ? '🥈' : e.pos === 3 ? '🥉' : `${e.pos}º`}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold">{e.nome}</p>
                            <p className="text-slate-500 text-xs capitalize">{e.tipo === 'afiliacao' ? 'Afiliação' : 'Academia'}</p>
                          </div>
                          <div className="flex gap-3 text-xs shrink-0">
                            <span className="text-yellow-400">🥇 {e.ouros}</span>
                            <span className="text-slate-300">🥈 {e.pratas}</span>
                            <span className="text-orange-400">🥉 {e.bronzes}</span>
                          </div>
                          <span className="text-white font-bold text-lg shrink-0">{e.pontos} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados por categoria */}
                {abaResultados === 'categorias' && (
                  <div className="space-y-4">
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                      <button onClick={() => setAbaModalidade('gi')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${abaModalidade === 'gi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Gi</button>
                      <button onClick={() => setAbaModalidade('nogi')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${abaModalidade === 'nogi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>NoGi</button>
                    </div>
                    {RESULTADOS.categorias[abaModalidade].map((cat, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-white font-semibold">{cat.categoria}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded border ${cat.tipo === 'Gi' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{cat.tipo}</span>
                          <span className="text-slate-500 text-xs">{cat.idade}</span>
                        </div>
                        <div className="space-y-2">
                          {cat.resultados.map((r, j) => {
                            const m = medalhaConfig[r.medalha];
                            return (
                              <div key={j} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${m.bg}`}>
                                <span className="text-xl shrink-0">{m.emoji}</span>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{r.nome}</p>
                                  <p className="text-slate-400 text-xs">{r.academia}</p>
                                </div>
                                <span className={`text-xs font-semibold ${r.pos === 3 ? 'text-slate-400' : ''}`}>
                                  {r.pos === 3 ? '3º (Bronze)' : `${r.pos}º lugar`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA TRANSMISSÃO */}
            {aba === 'Transmissão' && (
              <div className="space-y-4">
                {!transmissao || !transmissao.areas_transmitindo?.length ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Radio size={24} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">Nenhuma transmissão ao vivo configurada para este evento.</p>
                  </div>
                ) : (
                  <>
                    {/* Canal YouTube */}
                    {transmissao.canal_youtube && (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <Youtube size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">Canal oficial da transmissão</p>
                          <a href={transmissao.canal_youtube} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:text-blue-300 truncate block">{transmissao.canal_youtube}</a>
                        </div>
                        <a href={transmissao.canal_youtube} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>Assistir
                        </a>
                      </div>
                    )}

                    {/* Grid de áreas */}
                    <div className={`grid gap-4 ${transmissao.areas_transmitindo.length === 1 ? 'grid-cols-1' : transmissao.areas_transmitindo.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {areas.map(area => {
                        const transmitindo = transmissao.areas_transmitindo.includes(area.id);
                        const youtubeUrl = transmissao.canal_youtube;
                        const embedUrl = youtubeUrl
                          ? youtubeUrl.includes('watch?v=')
                            ? youtubeUrl.replace('watch?v=', 'embed/')
                            : youtubeUrl.includes('youtu.be/')
                              ? youtubeUrl.replace('youtu.be/', 'youtube.com/embed/')
                              : `${youtubeUrl.replace(/\/$/, '')}/live`
                          : null;

                        return (
                          <div key={area.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            {/* Header da área */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-blue-400" />
                                <span className="text-white text-sm font-bold">{area.nome}</span>
                              </div>
                              {transmitindo ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                                  <span className="text-red-400 text-xs font-bold">AO VIVO</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs">Aguardando</span>
                              )}
                            </div>

                            {/* Player ou thumbnail */}
                            {transmitindo && embedUrl ? (
                              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                  src={`${embedUrl}?autoplay=0&rel=0`}
                                  title={area.nome}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="absolute inset-0 w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="relative bg-slate-800/50" style={{ paddingBottom: '56.25%' }}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                  {eventoData.logo_url ? (
                                    <img src={eventoData.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover opacity-50" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
                                      <span className="text-slate-500 text-2xl font-black">N</span>
                                    </div>
                                  )}
                                  <p className="text-slate-500 text-sm">Transmissão não iniciada</p>
                                </div>
                              </div>
                            )}

                            {/* Link para YouTube */}
                            {transmitindo && youtubeUrl && (
                              <div className="px-4 py-3 border-t border-slate-800">
                                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 rounded-lg transition-all">
                                  <Youtube size={12} className="text-red-400"/>
                                  Abrir no YouTube
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-lg">{eventoData.nome}</p>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20 font-medium">Abertas</span>
              </div>
              {loteAtivo && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-blue-300 text-xs font-medium">{loteAtivo.nome} — até {loteAtivo.fim}</p>
                </div>
              )}
              <button onClick={() => window.location.href = `/eventos/${eventoId}/inscricao`} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mb-3">
                Inscrever-se <ChevronRight size={16} />
              </button>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><Clock size={11} /> Prazo: <strong className="text-white">{eventoData.prazo||"-"}</strong></div>
                <div className="flex items-center gap-2"><Shield size={11} /> Regras CBJJ/IBJJF</div>
                {true && <div className="flex items-center gap-2"><Users size={11} /> {(inscricoes.length)} atletas inscritos</div>}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Organizador</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">{eventoData.profiles?.nome || "Organizador".charAt(0)}</div>
                <div><p className="text-white text-sm font-medium">{eventoData.profiles?.nome || "Organizador"}</p><p className="text-green-400 text-xs">✓ Verificado pela NexusJJ</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL INSCRIÇÃO */}
      {mostrarInscricao && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-white font-semibold">Inscrever-se</h3>
              <button onClick={() => { setMostrarInscricao(false); setPerfilSelecionado(null); setCategoriaSelecionada(null); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            {inscricaoFeita ? (
              <div className="p-8 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                <h4 className="text-white font-bold text-lg mb-1">Inscrição realizada!</h4>
                <p className="text-slate-400 text-sm">Aguarde a efetivação pelo organizador.</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-3">Quem vai competir?</p>
                  <div className="space-y-2">
                    {meusPerfis.map(p => (
                      <button key={p.id} onClick={() => setPerfilSelecionado(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${perfilSelecionado?.id === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">{p.nome.charAt(0)}</div>
                        <div className="flex-1 text-left"><p className="text-white text-sm font-medium">{p.nome}</p><p className="text-slate-500 text-xs">{p.tipo} · {p.faixa} · {p.idade} anos</p></div>
                        {perfilSelecionado?.id === p.id && <Check size={16} className="text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
                {perfilSelecionado && (
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-3">Selecione a categoria</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(entradas).map(cat => (
                        <button key={cat.id} onClick={() => setCategoriaSelecionada(cat)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${categoriaSelecionada?.id === cat.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                          <div className="flex-1"><p className="text-white text-sm font-medium">{cat.nome}</p><p className="text-slate-500 text-xs">{cat.tipo} · {cat.idade} · {cat.faixa} · {cat.peso}</p></div>
                          <div className="text-right shrink-0"><p className="text-white text-sm font-semibold">R$ {cat.valor}</p>{categoriaSelecionada?.id === cat.id && <Check size={14} className="text-blue-400 ml-auto" />}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {perfilSelecionado && categoriaSelecionada && (
                  <div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Atleta</span><span className="text-white">{perfilSelecionado.nome}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Categoria</span><span className="text-white">{categoriaSelecionada.nome}</span></div>
                      <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-slate-400">Total</span><span className="text-white font-bold">R$ {categoriaSelecionada.valor}</span></div>
                    </div>
                    <button onClick={confirmarInscricao} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all">Confirmar e Pagar</button>
                  </div>
                )}
                {!perfilSelecionado && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
                    <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                    <p className="text-yellow-300 text-xs">Selecione quem vai competir para continuar.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}