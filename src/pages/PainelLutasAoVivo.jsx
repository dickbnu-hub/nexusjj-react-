import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { Timer, Shield, CheckCircle, AlertCircle, Tv, X, Maximize2, ChevronDown } from 'lucide-react';

const FASES = { classificatoria: 'Classificatória', oitavas: 'Oitavas', quartas: 'Quartas', semi: 'Semifinal', final: 'Final' };

const TODAS_AREAS_MOCK = [
  {
    id: 1, nome: 'Área 1',
    lutas: [
      { id: 1, fase: 'final', categoria: 'Adulto Masculino Gi', atleta1: { nome: 'Cristiano V.', academia: 'Gracie Barra', pesagem: 'ok' }, atleta2: { nome: 'Rafael S.', academia: 'Alliance', pesagem: 'ok' }, status: 'lutando', tempo: 142, pontos1: 4, pontos2: 2, tempoTotal: 360 },
      { id: 2, fase: 'semi', categoria: 'Master 1 Masculino Gi', atleta1: { nome: 'Pedro A.', academia: 'Nova União', pesagem: 'ok' }, atleta2: { nome: 'Carlos M.', academia: 'Checkmat', pesagem: 'pendente' }, status: 'proxima', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 300 },
      { id: 3, fase: 'quartas', categoria: 'Juvenil Masculino Gi', atleta1: { nome: 'Lucas F.', academia: 'GF Team', pesagem: 'ok' }, atleta2: { nome: 'João P.', academia: 'Brasa', pesagem: 'ok' }, status: 'aguardando', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 300 },
      { id: 4, fase: 'classificatoria', categoria: 'Pre-Mirim Masculino Gi', atleta1: { nome: 'Marcos T.', academia: 'Soul Fighters', pesagem: 'pendente' }, atleta2: { nome: 'Bruno L.', academia: 'Atos', pesagem: 'pendente' }, status: 'aguardando', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 120 },
    ]
  },
  {
    id: 2, nome: 'Área 2',
    lutas: [
      { id: 5, fase: 'final', categoria: 'Adulto Feminino Gi', atleta1: { nome: 'Mariana C.', academia: 'Checkmat', pesagem: 'ok' }, atleta2: { nome: 'Ana L.', academia: 'Gracie Barra SP', pesagem: 'ok' }, status: 'lutando', tempo: 89, pontos1: 2, pontos2: 2, tempoTotal: 360 },
      { id: 6, fase: 'semi', categoria: 'Adulto Masculino NoGi', atleta1: { nome: 'Thiago S.', academia: 'Soul Fighters', pesagem: 'ok' }, atleta2: { nome: 'Diego R.', academia: 'Fight Sports', pesagem: 'ok' }, status: 'proxima', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 360 },
      { id: 7, fase: 'quartas', categoria: 'Mirim Masculino Gi', atleta1: { nome: 'Gabriel M.', academia: 'Infight', pesagem: 'ok' }, atleta2: { nome: 'Henrique B.', academia: 'Zenith', pesagem: 'pendente' }, status: 'aguardando', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 120 },
    ]
  },
  {
    id: 3, nome: 'Área 3',
    lutas: [
      { id: 9, fase: 'semi', categoria: 'Master 2 Masculino Gi', atleta1: { nome: 'Roberto N.', academia: 'Ribeiro JJ', pesagem: 'ok' }, atleta2: { nome: 'Alexandre F.', academia: 'Carlson Gracie', pesagem: 'ok' }, status: 'lutando', tempo: 203, pontos1: 6, pontos2: 0, tempoTotal: 300 },
      { id: 10, fase: 'quartas', categoria: 'Adulto Masculino Gi', atleta1: { nome: 'Vitor H.', academia: 'Lotus Club', pesagem: 'ok' }, atleta2: { nome: 'Felipe A.', academia: 'Brasa', pesagem: 'ok' }, status: 'proxima', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 360 },
      { id: 11, fase: 'classificatoria', categoria: 'Pre-Mirim Feminino Gi', atleta1: { nome: 'Isabela R.', academia: 'GF Team', pesagem: 'pendente' }, atleta2: { nome: 'Valentina S.', academia: 'Nova União', pesagem: 'pendente' }, status: 'aguardando', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 120 },
    ]
  },
  {
    id: 4, nome: 'Área 4',
    lutas: [
      { id: 12, fase: 'quartas', categoria: 'Juvenil Feminino Gi', atleta1: { nome: 'Sofia A.', academia: 'Alliance', pesagem: 'ok' }, atleta2: { nome: 'Camila P.', academia: 'Gracie Barra', pesagem: 'ok' }, status: 'lutando', tempo: 55, pontos1: 0, pontos2: 2, tempoTotal: 300 },
      { id: 13, fase: 'classificatoria', categoria: 'Master 3 Masculino Gi', atleta1: { nome: 'José M.', academia: 'Checkmat', pesagem: 'pendente' }, atleta2: { nome: 'Paulo R.', academia: 'Alliance', pesagem: 'pendente' }, status: 'proxima', tempo: 0, pontos1: 0, pontos2: 0, tempoTotal: 300 },
    ]
  },
];

// TVs pré-configuradas pelo organizador
const TVS_CONFIG = [
  { id: 1, nome: 'TV 1', areas: [1, 3] },
  { id: 2, nome: 'TV 2', areas: [2, 4] },
  { id: 3, nome: 'TV Geral', areas: [1, 2, 3, 4] },
];

function formatarTempo(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}


function BotaoAvisar({ lutaId }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const avisar = async () => {
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://dzzkhrkysuihzdzmmogp.supabase.co/functions/v1/notificar-lutas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ luta_id: String(lutaId) }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnviado(true);
        setTimeout(() => setEnviado(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <button onClick={avisar} disabled={enviando || enviado}
      className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${enviado ? 'bg-green-600/30 text-green-400' : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/40'} disabled:opacity-60`}>
      {enviado ? '✓ Avisados' : enviando ? '...' : '🔔 Avisar'}
    </button>
  );
}

function CardLutaCompacto({ luta }) {
  const [tempo, setTempo] = useState(luta.tempo);
  const [p1, setP1] = useState(luta.pontos1);
  const [p2, setP2] = useState(luta.pontos2);

  useEffect(() => {
    if (luta.status !== 'lutando') return;
    const i = setInterval(() => setTempo(t => t < luta.tempoTotal ? t + 1 : t), 1000);
    return () => clearInterval(i);
  }, [luta.status]);

  const duplaOk = luta.atleta1.pesagem === 'ok' && luta.atleta2.pesagem === 'ok';
  const progresso = luta.status === 'lutando' ? (tempo / luta.tempoTotal) * 100 : 0;

  const borderColor = luta.status === 'lutando' ? 'border-green-500/50' :
    luta.status === 'proxima' && duplaOk ? 'border-yellow-400/60' :
    luta.status === 'proxima' ? 'border-yellow-500/30' : 'border-slate-700/50';

  const bgColor = luta.status === 'lutando' ? 'bg-green-950/30' :
    luta.status === 'proxima' && duplaOk ? 'bg-yellow-950/20' : 'bg-slate-900/60';

  return (
    <div className={`border rounded-xl overflow-hidden ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          luta.fase === 'final' ? 'bg-yellow-500/20 text-yellow-400' :
          luta.fase === 'semi' ? 'bg-purple-500/20 text-purple-400' :
          luta.fase === 'quartas' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-700 text-slate-400'}`}>{FASES[luta.fase]}</span>
        {luta.status === 'lutando' && <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> AO VIVO</span>}
        {luta.status === 'proxima' && duplaOk && <span className="text-yellow-400 text-xs font-bold">⚡ PRONTA</span>}
        {luta.status === 'proxima' && !duplaOk && <span className="text-orange-400 text-xs">Aguard. pesagem</span>}
        {luta.status === 'aguardando' && <span className="text-slate-500 text-xs">Aguardando</span>}
        {luta.status === 'proxima' && <BotaoAvisar lutaId={luta.id} />}
      </div>
      <p className="text-slate-400 text-xs px-3 pt-1.5 truncate">{luta.categoria}</p>
      <div className="px-3 py-2 space-y-1.5">
        {[{ atleta: luta.atleta1, pontos: p1, lado: 'Azul' }, { atleta: luta.atleta2, pontos: p2, lado: 'Branco' }].map(({ atleta, pontos, lado }) => (
          <div key={lado} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${atleta.pesagem === 'ok' ? 'bg-slate-800/60' : 'bg-red-950/30 border border-red-500/10'}`}>
            <div className={`w-4 h-4 rounded-full shrink-0 border ${lado === 'Azul' ? 'bg-blue-600 border-blue-400' : 'bg-white border-slate-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{atleta.nome}</p>
              <div className="flex items-center gap-1">
                <p className="text-slate-500 text-xs truncate">{atleta.academia}</p>
                {atleta.pesagem === 'ok'
                  ? <CheckCircle size={9} className="text-green-400 shrink-0" />
                  : <AlertCircle size={9} className="text-red-400 shrink-0" />}
              </div>
            </div>
            {luta.status === 'lutando' && <span className={`text-base font-bold shrink-0 ${pontos > 0 ? 'text-white' : 'text-slate-600'}`}>{pontos}</span>}
          </div>
        ))}
      </div>
      {luta.status === 'lutando' && (
        <div className="px-3 pb-2">
          <div className="flex justify-between mb-1">
            <span className="text-green-400 text-xs font-mono font-bold"><Timer size={10} className="inline mr-1" />{formatarTempo(tempo)}</span>
            <span className="text-slate-500 text-xs">{formatarTempo(luta.tempoTotal)}</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CardLutaTV({ luta }) {
  const [tempo, setTempo] = useState(luta.tempo);
  const [p1] = useState(luta.pontos1);
  const [p2] = useState(luta.pontos2);

  useEffect(() => {
    if (luta.status !== 'lutando') return;
    const i = setInterval(() => setTempo(t => t < luta.tempoTotal ? t + 1 : t), 1000);
    return () => clearInterval(i);
  }, [luta.status]);

  const duplaOk = luta.atleta1.pesagem === 'ok' && luta.atleta2.pesagem === 'ok';
  const progresso = luta.status === 'lutando' ? (tempo / luta.tempoTotal) * 100 : 0;

  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${luta.status === 'lutando' ? 'border-green-500/60 bg-green-950/20' : luta.status === 'proxima' && duplaOk ? 'border-yellow-400/60 bg-yellow-950/20' : 'border-slate-700 bg-slate-900/60'}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50">
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${luta.fase === 'final' ? 'bg-yellow-500/20 text-yellow-400' : luta.fase === 'semi' ? 'bg-purple-500/20 text-purple-400' : luta.fase === 'quartas' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{FASES[luta.fase]}</span>
        {luta.status === 'lutando' && <span className="flex items-center gap-2 text-green-400 text-sm font-bold"><span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" /> AO VIVO</span>}
        {luta.status === 'proxima' && duplaOk && <span className="text-yellow-400 text-sm font-bold">⚡ PRÓXIMA — PRONTA</span>}
        {luta.status === 'proxima' && !duplaOk && <span className="text-orange-400 text-sm">Aguardando pesagem</span>}
      </div>
      <p className="text-slate-300 text-sm px-4 pt-2">{luta.categoria}</p>
      <div className="px-4 py-3 space-y-3">
        {[{ atleta: luta.atleta1, pontos: p1, lado: 'Azul' }, { atleta: luta.atleta2, pontos: p2, lado: 'Branco' }].map(({ atleta, pontos, lado }) => (
          <div key={lado} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${atleta.pesagem === 'ok' ? 'bg-slate-800/70' : 'bg-red-950/40 border border-red-500/20'}`}>
            <div className={`w-6 h-6 rounded-full shrink-0 border-2 ${lado === 'Azul' ? 'bg-blue-600 border-blue-400' : 'bg-white border-slate-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-lg font-bold truncate">{atleta.nome}</p>
              <div className="flex items-center gap-2">
                <p className="text-slate-400 text-sm truncate">{atleta.academia}</p>
                {atleta.pesagem === 'ok'
                  ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} /> Pesagem OK</span>
                  : <span className="flex items-center gap-1 text-red-400 text-xs"><AlertCircle size={12} /> Pesagem Pendente</span>}
              </div>
            </div>
            {luta.status === 'lutando' && <span className={`text-4xl font-black shrink-0 ${pontos > 0 ? 'text-white' : 'text-slate-700'}`}>{pontos}</span>}
          </div>
        ))}
      </div>
      {luta.status === 'lutando' && (
        <div className="px-4 pb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-green-400 text-lg font-mono font-black"><Timer size={16} className="inline mr-1" />{formatarTempo(tempo)}</span>
            <span className="text-slate-500 text-sm">{formatarTempo(luta.tempoTotal)}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PainelLutasAoVivo({ modoTV = false }) {
  const params = useParams();
  const eventoId = params?.id || params?.eventoId || null;
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const realtimeRef = useRef(null);

  // Converte luta do banco para formato do card
  const lutaBancoParaCard = (l) => ({
    id: l.id,
    numero: l.numero,
    fase: l.fase || 'classificatoria',
    categoria: l.chaves?.entradas?.nome || l.chaves?.categorias?.nome || '—',
    atleta1: {
      nome: l.atleta1?.nome || l.atleta1?.profiles?.nome || '—',
      academia: l.atleta1?.academia || '—',
      pesagem: 'ok',
    },
    atleta2: {
      nome: l.atleta2?.nome || l.atleta2?.profiles?.nome || '—',
      academia: l.atleta2?.academia || '—',
      pesagem: 'ok',
    },
    status: l.status || 'aguardando',
    pontos1: l.pontos_a1 || 0,
    pontos2: l.pontos_a2 || 0,
    tempo: l.tempo_luta || 0,
    tempoTotal: 300,
    area_id: l.area_id,
    ordem_area: l.ordem_area,
  });

  useEffect(() => {
    if (!eventoId) { setLoadingAreas(false); return; }

    const carregarLutas = async () => {
      setLoadingAreas(true);
      const { data: lutas } = await supabase
        .from('lutas')
        .select(`*, atleta1:atleta1_id(id,nome,academia,profiles(nome)), atleta2:atleta2_id(id,nome,academia,profiles(nome)), chaves(entradas(nome),categorias(nome))`)
        .eq('evento_id', eventoId)
        .in('status', ['lutando', 'proxima', 'aguardando'])
        .order('area_id').order('ordem_area');

      if (lutas) {
        // Agrupar por área
        const porArea = {};
        lutas.forEach(l => {
          const aId = l.area_id || 1;
          if (!porArea[aId]) porArea[aId] = { id: aId, nome: `Área ${aId}`, lutas: [] };
          porArea[aId].lutas.push(lutaBancoParaCard(l));
        });
        setAreas(Object.values(porArea).sort((a, b) => a.id - b.id));
      }
      setLoadingAreas(false);
    };

    carregarLutas();

    // Realtime subscription
    const channel = supabase.channel(`lutas-evento-${eventoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lutas', filter: `evento_id=eq.${eventoId}` },
        () => { carregarLutas(); }
      ).subscribe();
    realtimeRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [eventoId]);

  const TODAS_AREAS = eventoId ? areas : TODAS_AREAS_MOCK;
  const [tvSelecionada, setTvSelecionada] = useState(null);
  const [areasFiltro, setAreasFiltro] = useState([]);
  const [modoTelaCheia, setModoTelaCheia] = useState(modoTV);
  const [mostrarConfig, setMostrarConfig] = useState(false);

  const areasMostrar = tvSelecionada
    ? TODAS_AREAS.filter(a => TVS_CONFIG.find(t => t.id === tvSelecionada)?.areas.includes(a.id))
    : areasFiltro.length > 0
      ? TODAS_AREAS.filter(a => areasFiltro.includes(a.id))
      : TODAS_AREAS;

  const toggleArea = (id) => setAreasFiltro(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setModoTelaCheia(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const Wrapper = modoTelaCheia
    ? ({ children }) => <div className="fixed inset-0 z-[100] bg-nexus-dark overflow-auto">{children}</div>
    : ({ children }) => <div>{children}</div>;

  return (
    <Wrapper>
      <div className={`${modoTelaCheia ? 'p-6' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className={`text-white font-bold flex items-center gap-2 ${modoTelaCheia ? 'text-3xl' : 'text-lg'}`}>
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              Próximas Lutas — Ao Vivo
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">Copa NexusJJ 2026 · Atualiza automaticamente</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de TV */}
            <div className="relative">
              <button onClick={() => setMostrarConfig(!mostrarConfig)}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 text-sm font-medium px-3 py-2 rounded-lg transition-all">
                <Tv size={15} className="text-blue-400" />
                {tvSelecionada ? TVS_CONFIG.find(t => t.id === tvSelecionada)?.nome : 'Selecionar TV'}
                <ChevronDown size={14} />
              </button>
              {mostrarConfig && (
                <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-10 shadow-xl w-56">
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-slate-400 text-xs font-medium">TVs configuradas pelo organizador</p>
                  </div>
                  <button onClick={() => { setTvSelecionada(null); setAreasFiltro([]); setMostrarConfig(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all border-b border-slate-700/50 ${!tvSelecionada ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700'}`}>
                    Todas as Áreas
                  </button>
                  {TVS_CONFIG.map(tv => (
                    <button key={tv.id} onClick={() => { setTvSelecionada(tv.id); setAreasFiltro([]); setMostrarConfig(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all border-b border-slate-700/50 last:border-0 ${tvSelecionada === tv.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700'}`}>
                      <p className="font-medium">{tv.nome}</p>
                      <p className="text-slate-500 text-xs">Áreas: {tv.areas.join(', ')}</p>
                    </button>
                  ))}
                  <div className="px-3 py-2 border-t border-slate-700">
                    <p className="text-slate-500 text-xs mb-2">Ou selecione manualmente:</p>
                    <div className="flex gap-1 flex-wrap">
                      {TODAS_AREAS.map(a => (
                        <button key={a.id} onClick={() => { setTvSelecionada(null); toggleArea(a.id); }}
                          className={`px-2 py-1 rounded text-xs font-medium border transition-all ${areasFiltro.includes(a.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                          {a.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botão TV */}
            <button onClick={() => setModoTelaCheia(!modoTelaCheia)}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-all ${modoTelaCheia ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500'}`}>
              {modoTelaCheia ? <X size={15} /> : <Maximize2 size={15} />}
              {modoTelaCheia ? 'Sair da TV' : 'Ver na TV'}
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 mb-5 flex-wrap bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-slate-500 text-xs font-medium mr-1">Legenda:</p>
          <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" /> Lutando agora</span>
          <span className="flex items-center gap-1.5 text-xs text-yellow-400"><span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-400/50" /> Dupla pronta para lutar</span>
          <span className="flex items-center gap-1.5 text-xs text-orange-400"><span className="w-3 h-3 rounded-full bg-orange-500/30 border border-orange-400/50" /> Aguardando pesagem</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" /> Aguardando</span>
          <span className="flex items-center gap-1.5 text-xs"><CheckCircle size={11} className="text-green-400" /> <span className="text-slate-400">Pesagem OK</span></span>
          <span className="flex items-center gap-1.5 text-xs"><AlertCircle size={11} className="text-red-400" /> <span className="text-slate-400">Pesagem Pendente</span></span>
        </div>

        {/* Grade de áreas */}
        <div className={`grid gap-5 ${areasMostrar.length === 1 ? 'grid-cols-1 max-w-lg' : areasMostrar.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {areasMostrar.map(area => (
            <div key={area.id}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-blue-400" />
                <h3 className={`text-white font-bold ${modoTelaCheia ? 'text-xl' : 'text-base'}`}>{area.nome}</h3>
                <span className="text-slate-500 text-xs">{area.lutas.length} lutas</span>
              </div>
              <div className="space-y-3">
                {area.lutas.map(luta =>
                  modoTelaCheia
                    ? <CardLutaTV key={luta.id} luta={luta} />
                    : <CardLutaCompacto key={luta.id} luta={luta} />
                )}
              </div>
            </div>
          ))}
        </div>

        {modoTelaCheia && (
          <p className="text-center text-slate-700 text-xs mt-8">Pressione ESC para sair do modo TV · Copa NexusJJ 2026</p>
        )}
      </div>
    </Wrapper>
  );
}