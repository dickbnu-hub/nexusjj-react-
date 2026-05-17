import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Shuffle, CheckCircle, AlertCircle, ChevronDown, Clock, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DistribuicaoChavesPage() {
  const { id: eventoId } = useParams();
  const [chaves, setChaves] = useState([]);
  const [areas, setAreas] = useState([]);
  const [config, setConfig] = useState(null);
  const [chavesSelecionadas, setChavesSelecionadas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distribuindo, setDistribuindo] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [diaAtivo, setDiaAtivo] = useState(1);
  const [dias, setDias] = useState([1]);
  const [preview, setPreview] = useState(null);
  const [areasColapsadas, setAreasColapsadas] = useState({}); // preview da distribuição

  useEffect(() => { carregarDados(); }, [eventoId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [eventoRes, chavesRes, areasRes, configRes] = await Promise.all([
        supabase.from('eventos').select('data_evento, data_fim_evento').eq('id', eventoId).single(),
        supabase.from('chaves')
          .select('*, entradas:entrada_id(id, nome, modalidade), lutas(id, status)')
          .eq('evento_id', eventoId),
        supabase.from('areas').select('*').eq('evento_id', eventoId).order('dia').order('ordem'),
        supabase.from('configuracoes_chaves').select('*').eq('evento_id', eventoId).single(),
      ]);

      if (eventoRes.data) {
        const inicio = new Date(eventoRes.data.data_evento);
        const fim = eventoRes.data.data_fim_evento ? new Date(eventoRes.data.data_fim_evento) : inicio;
        const diffDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        setDias(Array.from({ length: diffDias }, (_, i) => i + 1));
      }
      if (chavesRes.data) setChaves(chavesRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (configRes.data) setConfig(configRes.data);
    } catch(e) { setErro('Erro ao carregar: ' + e.message); }
    finally { setLoading(false); }
  };

  // Calcula tempo total de uma chave em segundos
  const calcularTempoChave = (chave) => {
    const totalLutas = chave.lutas?.filter(l => l.status !== 'finalizada').length || 0;
    const tempoLuta = config?.tempos?.[chave.entrada_id] || 300;
    const intervalo = config?.intervalos?.[chave.entrada_id] || 120;
    return totalLutas * (tempoLuta + intervalo);
  };

  const formatarTempo = (seg) => {
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? m + 'min' : ''}`;
    return `${m}min`;
  };

  const calcularTermino = (horaInicio, totalSeg) => {
    if (!horaInicio) return '—';
    const [h, m] = horaInicio.split(':').map(Number);
    const terminoMin = h * 60 + m + Math.ceil(totalSeg / 60);
    const th = Math.floor(terminoMin / 60) % 24;
    const tm = terminoMin % 60;
    return `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`;
  };

  // Algoritmo de distribuição balanceada
  // Objetivo: todas as áreas terminam na mesma hora
  const distribuirBalanceado = () => {
    if (chavesSelecionadas.length === 0) { setErro('Selecione pelo menos uma chave.'); return; }
    if (areasSelecionadas.length === 0) { setErro('Selecione pelo menos uma área.'); return; }

    const chavesParaDistribuir = chaves
      .filter(c => chavesSelecionadas.includes(c.id))
      .map(c => ({ ...c, tempo: calcularTempoChave(c) }))
      .sort((a, b) => b.tempo - a.tempo); // maiores primeiro

    const areasParaDistribuir = areas
      .filter(a => areasSelecionadas.includes(a.id))
      .map(a => ({ ...a, tempoAcumulado: 0, chaves: [] }));

    // Greedy: coloca cada chave na área com menor tempo acumulado
    chavesParaDistribuir.forEach(chave => {
      const areaMenor = areasParaDistribuir.reduce((min, a) =>
        a.tempoAcumulado < min.tempoAcumulado ? a : min
      );
      areaMenor.chaves.push(chave);
      areaMenor.tempoAcumulado += chave.tempo;
    });

    setPreview(areasParaDistribuir);
  };

  const confirmarDistribuicao = async () => {
    if (!preview) return;
    setDistribuindo(true);
    try {
      for (const area of preview) {
        for (let i = 0; i < area.chaves.length; i++) {
          const chave = area.chaves[i];
          // Atualiza todas as lutas desta chave com area_id e ordem
          const lutasDaChave = chave.lutas || [];
          for (let j = 0; j < lutasDaChave.length; j++) {
            await supabase.from('lutas').update({
              area_id: area.id,
              ordem_area: i * 100 + j + 1,
            }).eq('id', lutasDaChave[j].id);
          }
        }
      }
      setSucesso('Chaves distribuídas com sucesso!');
      setPreview(null);
      setChavesSelecionadas([]);
      setAreasSelecionadas([]);
      setTimeout(() => setSucesso(''), 3000);
      await carregarDados();
    } catch(e) { setErro('Erro ao distribuir: ' + e.message); }
    finally { setDistribuindo(false); }
  };

  const areasDoDia = areas.filter(a => (a.dia || 1) === diaAtivo);
  const chavesSemArea = chaves.filter(c =>
    !c.lutas?.length || !c.lutas.some(l => l.area_id)
  );

  const toggleChave = (id) => setChavesSelecionadas(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
  const toggleArea = (id) => setAreasSelecionadas(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href={`/eventos/${eventoId}/areas`}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={16} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white font-bold text-xl">Distribuição de Chaves</h1>
            <p className="text-slate-400 text-sm">Selecione chaves e áreas para distribuir automaticamente</p>
          </div>
        </div>

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Abas de dias */}
        {dias.length > 1 && (
          <div className="flex gap-2 mb-4">
            {dias.map(dia => (
              <button key={dia} onClick={() => setDiaAtivo(dia)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${diaAtivo === dia ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                Dia {dia}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Chaves disponíveis */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-white font-bold text-sm">Chaves disponíveis</p>
              <div className="flex gap-2">
                <button onClick={() => setChavesSelecionadas(chaves.map(c => c.id))}
                  className="text-blue-400 text-xs hover:text-blue-300">Todas</button>
                <span className="text-slate-700">|</span>
                <button onClick={() => setChavesSelecionadas([])}
                  className="text-slate-500 text-xs hover:text-white">Nenhuma</button>
              </div>
            </div>
            {chaves.length === 0 ? (
              <div className="text-center py-8">
                <Swords size={28} className="text-slate-700 mx-auto mb-2"/>
                <p className="text-slate-500 text-sm">Nenhuma chave gerada ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-80 overflow-y-auto">
                {chaves.map(chave => {
                  const selecionada = chavesSelecionadas.includes(chave.id);
                  const tempo = calcularTempoChave(chave);
                  const totalLutas = chave.lutas?.filter(l => l.status !== 'finalizada').length || 0;
                  return (
                    <div key={chave.id} onClick={() => toggleChave(chave.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${selecionada ? 'bg-blue-500/10' : 'hover:bg-slate-800/50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selecionada ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                        {selecionada && <div className="w-2 h-2 rounded-sm bg-white"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{chave.entradas?.nome}</p>
                        <p className="text-slate-500 text-xs">{chave.entradas?.modalidade} · {totalLutas} lutas</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-blue-400 text-xs font-bold">{formatarTempo(tempo)}</p>
                        <p className="text-slate-600 text-xs">estimado</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Áreas do dia */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-white font-bold text-sm">Áreas — Dia {diaAtivo}</p>
              <div className="flex gap-2">
                <button onClick={() => setAreasSelecionadas(areasDoDia.map(a => a.id))}
                  className="text-blue-400 text-xs hover:text-blue-300">Todas</button>
                <span className="text-slate-700">|</span>
                <button onClick={() => setAreasSelecionadas([])}
                  className="text-slate-500 text-xs hover:text-white">Nenhuma</button>
              </div>
            </div>
            {areasDoDia.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">Nenhuma área criada para o Dia {diaAtivo}</p>
                <a href={`/eventos/${eventoId}/areas`} className="text-blue-400 text-xs hover:text-blue-300 mt-1 block">Criar áreas →</a>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap p-3">
                {areasDoDia.map(area => {
                  const selecionada = areasSelecionadas.includes(area.id);
                  const colapsada = areasColapsadas[area.id];
                  return (
                    <div key={area.id}
                      className={`bg-slate-800 border rounded-xl overflow-hidden transition-all duration-300 ${selecionada ? 'border-blue-500' : 'border-slate-700'}`}
                      style={{ width: colapsada ? 40 : 160, flexShrink: 0 }}>
                      {colapsada ? (
                        <div className="flex flex-col items-center py-3 px-1 gap-2 cursor-pointer"
                          onClick={() => setAreasColapsadas(p => ({ ...p, [area.id]: false }))}>
                          <ChevronDown size={12} className="text-slate-500 -rotate-90"/>
                          <p className="text-slate-400 text-xs font-bold"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', userSelect: 'none', fontSize: 10 }}>
                            {area.nome}
                          </p>
                        </div>
                      ) : (
                        <div onClick={() => toggleArea(area.id)} className="cursor-pointer">
                          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-700">
                            <p className={`text-xs font-bold truncate flex-1 ${selecionada ? 'text-blue-300' : 'text-white'}`}>{area.nome}</p>
                            <button onClick={e => { e.stopPropagation(); setAreasColapsadas(p => ({ ...p, [area.id]: true })); }}
                              className="text-slate-600 hover:text-white ml-1 shrink-0">
                              <ChevronDown size={12} className="rotate-90"/>
                            </button>
                          </div>
                          <div className="px-2.5 py-2">
                            <div className={`w-3 h-3 rounded border-2 mb-1.5 flex items-center justify-center ${selecionada ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                              {selecionada && <div className="w-1.5 h-1.5 rounded-sm bg-white"/>}
                            </div>
                            <p className="text-slate-500 text-xs">{area.hora_inicio ? area.hora_inicio.slice(0,5) : '—'}</p>
                            {!area.hora_inicio && <p className="text-yellow-500 text-xs">⚠ sem hora</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botão distribuir */}
        <div className="flex gap-3 mb-4">
          <button onClick={distribuirBalanceado}
            disabled={chavesSelecionadas.length === 0 || areasSelecionadas.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Shuffle size={16}/> Distribuir automaticamente ({chavesSelecionadas.length} chaves em {areasSelecionadas.length} áreas)
          </button>
        </div>

        {/* Preview da distribuição */}
        {preview && (
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-white font-bold text-sm">Preview da distribuição</p>
              <p className="text-blue-400 text-xs">Revise antes de confirmar</p>
            </div>
            <div className="p-4 space-y-3">
              {preview.map(area => (
                <div key={area.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{area.nome}</p>
                      <p className="text-slate-500 text-xs">{area.chaves.length} chave(s) · {area.chaves.reduce((a,c) => a + (c.lutas?.filter(l=>l.status!=='finalizada').length||0), 0)} lutas</p>
                    </div>
                    <div className="text-right">
                      {area.hora_inicio && (
                        <p className="text-blue-400 text-xs font-bold">
                          {area.hora_inicio.slice(0,5)} → {calcularTermino(area.hora_inicio, area.tempoAcumulado)}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs">{formatarTempo(area.tempoAcumulado)}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {area.chaves.map((chave, idx) => (
                      <div key={chave.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-slate-600 text-xs font-mono w-4">{idx+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{chave.entradas?.nome}</p>
                          <p className="text-slate-500 text-xs">{chave.lutas?.filter(l=>l.status!=='finalizada').length||0} lutas · {formatarTempo(chave.tempo)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button onClick={() => setPreview(null)}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">
                Cancelar
              </button>
              <button onClick={confirmarDistribuicao} disabled={distribuindo}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                <CheckCircle size={14}/> {distribuindo ? 'Distribuindo...' : 'Confirmar Distribuição'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}