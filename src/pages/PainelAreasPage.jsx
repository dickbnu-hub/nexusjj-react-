import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, X, ArrowLeft, GripVertical, CheckCircle, AlertCircle, Monitor, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PainelAreasPage() {
  const { id: eventoId } = useParams();
  const [areas, setAreas] = useState([]);
  const [areasColapsadas, setAreasColapsadas] = useState({});
  const [lutas, setLutas] = useState([]);
  const [lutasSemArea, setLutasSemArea] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [novaAreaHora, setNovaAreaHora] = useState('08:00');
  const [adicionandoArea, setAdicionandoArea] = useState(false);
  const [arrastandoLuta, setArrastandoLuta] = useState(null);
  const [arrastandoSobre, setArrastandoSobre] = useState(null);
  const [diaAtivo, setDiaAtivo] = useState(1);
  const [dias, setDias] = useState([1]);
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    carregarDados();

    // Realtime — atualiza lutas automaticamente quando status/resultado mudam
    const channel = supabase
      .channel('areas-lutas-' + eventoId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lutas',
        filter: 'evento_id=eq.' + eventoId,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setLutas(prev => prev.map(l =>
            l.id === payload.new.id ? { ...l, ...payload.new } : l
          ));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'areas',
        filter: 'evento_id=eq.' + eventoId,
      }, () => {
        carregarDados();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventoId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [eventoRes, areasRes, lutasRes] = await Promise.all([
        supabase.from('eventos').select('nome, data_evento, data_fim_evento').eq('id', eventoId).single(),
        supabase.from('areas').select('*').eq('evento_id', eventoId).order('dia').order('ordem'),
        supabase.from('lutas')
          .select('*, atleta1:atleta1_id(id, pesagem, atletas:atleta_id(id, academia, profiles:profile_id(nome))), atleta2:atleta2_id(id, pesagem, atletas:atleta_id(id, academia, profiles:profile_id(nome))), chaves:chave_id(entrada_id, entradas:entrada_id(nome))')
          .eq('evento_id', eventoId)
          .order('ordem_area'),
      ]);

      if (eventoRes.data) {
        setEvento(eventoRes.data);
        const inicio = new Date(eventoRes.data.data_evento);
        const fim = eventoRes.data.data_fim_evento ? new Date(eventoRes.data.data_fim_evento) : inicio;
        const diffDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        setDias(Array.from({ length: diffDias }, (_, i) => i + 1));
      }
      if (areasRes.data) setAreas(areasRes.data);
      if (lutasRes.data) {
        const lutasComNomes = lutasRes.data.map(l => ({
          ...l,
          atleta1: l.atleta1 ? {
            ...l.atleta1,
            nome: l.atleta1.atletas?.profiles?.nome || 'A definir',
            academia: l.atleta1.atletas?.academia || '',
            pesagem: l.atleta1.pesagem,
          } : null,
          atleta2: l.atleta2 ? {
            ...l.atleta2,
            nome: l.atleta2.atletas?.profiles?.nome || 'A definir',
            academia: l.atleta2.atletas?.academia || '',
            pesagem: l.atleta2.pesagem,
          } : null,
        }));
        setLutas(lutasComNomes.filter(l => l.area_id));
        setLutasSemArea(lutasComNomes.filter(l => !l.area_id));
      }
    } catch(e) { setErro('Erro ao carregar: ' + e.message); }
    finally { setLoading(false); }
  };

  const criarArea = async () => {
    if (!novaArea.trim()) return;
    if (!novaAreaHora) { alert('Defina o horário de início da área.'); return; }
    try {
      const { data } = await supabase.from('areas').insert({
        evento_id: eventoId, nome: novaArea.trim(),
        ordem: areas.filter(a => a.dia === diaAtivo).length,
        dia: diaAtivo,
        hora_inicio: novaAreaHora,
      }).select().single();
      if (data) setAreas(prev => [...prev, data]);
      setNovaArea('');
      setNovaAreaHora('08:00');
      setAdicionandoArea(false);
      setSucesso('Área criada!');
      setTimeout(() => setSucesso(''), 2000);
    } catch(e) { setErro('Erro: ' + e.message); }
  };

  const excluirArea = async (areaId) => {
    if (!window.confirm('Excluir esta área? As lutas voltarão para "Sem área".')) return;
    await supabase.from('lutas').update({ area_id: null, ordem_area: 0 }).eq('area_id', areaId);
    await supabase.from('areas').delete().eq('id', areaId);
    setAreas(prev => prev.filter(a => a.id !== areaId));
    await carregarDados();
  };

  const moverLutaParaArea = async (lutaId, areaId, ordemNova) => {
    await supabase.from('lutas').update({ area_id: areaId, ordem_area: ordemNova }).eq('id', lutaId);
    await carregarDados();
  };

  const removerLutaDaArea = async (lutaId) => {
    await supabase.from('lutas').update({ area_id: null, ordem_area: 0 }).eq('id', lutaId);
    await carregarDados();
  };

  const lutasDaArea = (areaId) => lutas.filter(l => l.area_id === areaId).sort((a,b) => a.ordem_area - b.ordem_area);
  const areasDoDia = areas.filter(a => (a.dia || 1) === diaAtivo);

  const dataFormatada = (dia) => {
    if (!evento?.data_evento) return `Dia ${dia}`;
    const d = new Date(evento.data_evento);
    d.setDate(d.getDate() + dia - 1);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const calcularTermino = (area) => {
    if (!area.hora_inicio) return null;
    const lutasArea = lutasDaArea(area.id);
    if (lutasArea.length === 0) return area.hora_inicio.slice(0, 5);
    // Soma tempo de luta + intervalo de cada luta
    const totalSeg = lutasArea.reduce((acc, l) => {
      const tempoLuta = l.chaves?.configuracao?.tempo_luta || 300;
      const intervalo = l.chaves?.configuracao?.intervalo || 120;
      return acc + tempoLuta + intervalo;
    }, 0);
    const [h, m] = area.hora_inicio.split(':').map(Number);
    const inicioMin = h * 60 + m;
    const terminoMin = inicioMin + Math.ceil(totalSeg / 60);
    const th = Math.floor(terminoMin / 60) % 24;
    const tm = terminoMin % 60;
    return `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`;
  };

  const handleDragStart = (luta) => setArrastandoLuta(luta);
  const handleDragOver = (e, areaId) => { e.preventDefault(); setArrastandoSobre(areaId); };
  const handleDrop = async (e, areaId) => {
    e.preventDefault();
    if (!arrastandoLuta) return;
    const lutasDestino = lutasDaArea(areaId);
    await moverLutaParaArea(arrastandoLuta.id, areaId, lutasDestino.length + 1);
    setArrastandoLuta(null);
    setArrastandoSobre(null);
  };

  const abrirPlacar = (areaId, areaNome) => {
    window.open(`/placar/mesa?area=${areaId}&evento=${eventoId}`, '_blank', 'width=1400,height=800');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href={`/eventos/${eventoId}/admin`}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={16} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white font-bold text-xl">Distribuição por Áreas</h1>
            <p className="text-slate-400 text-sm">Arraste as lutas para as áreas {dias.length > 1 ? `· Dia ${diaAtivo} — ${dataFormatada(diaAtivo)}` : ''}</p>
          </div>
          <button onClick={() => setAdicionandoArea(true)}
            className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus size={14}/> Nova Área
          </button>
        </div>

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Modal nova área */}
        {adicionandoArea && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5">
              <h3 className="text-white font-bold mb-4">Nova Área de Luta — Dia {diaAtivo}</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Nome da área *</label>
                  <input value={novaArea} onChange={e => setNovaArea(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && criarArea()}
                    placeholder="Ex: Área 1, Tatame A..." autoFocus
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Horário de início *</label>
                  <input type="time" value={novaAreaHora} onChange={e => setNovaAreaHora(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"/>
                  <p className="text-slate-600 text-xs mt-1">Usado para calcular o cronograma de lutas</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setAdicionandoArea(false); setNovaArea(''); setNovaAreaHora('08:00'); }} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
                <button onClick={criarArea} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all">Criar</button>
              </div>
            </div>
          </div>
        )}

        {/* Abas de dias */}
        {dias.length > 1 && (
          <div className="flex gap-2 mb-4">
            {dias.map(dia => (
              <button key={dia} onClick={() => setDiaAtivo(dia)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border text-sm font-bold transition-all ${diaAtivo === dia ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                <span className="text-xs opacity-70">Dia {dia}</span>
                <span className="text-xs font-normal">{dataFormatada(dia)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Lutas sem área */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-white font-bold text-sm">Lutas não distribuídas</p>
              <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded-full">{lutasSemArea.length}</span>
            </div>
            <div className="p-3 space-y-2 min-h-32">
              {lutasSemArea.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Todas as lutas foram distribuídas!</p>
              ) : lutasSemArea.map(luta => (
                <CardLuta key={luta.id} luta={luta} onDragStart={() => handleDragStart(luta)} semArea/>
              ))}
            </div>
          </div>

          {/* Áreas */}
          {areasDoDia.length === 0 ? (
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-slate-500 text-sm mb-3">Nenhuma área criada para o Dia {diaAtivo}</p>
                <button onClick={() => setAdicionandoArea(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all mx-auto">
                  <Plus size={14}/> Criar primeira área
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 flex gap-3 flex-wrap items-start">
              {areasDoDia.map(area => {
                const colapsada = areasColapsadas[area.id];
                return (
                <div key={area.id}
                  onDragOver={e => handleDragOver(e, area.id)}
                  onDrop={e => handleDrop(e, area.id)}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${arrastandoSobre === area.id ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800'}`}
                  style={{ width: colapsada ? 48 : 280, flexShrink: 0 }}>

                  {colapsada ? (
                    /* MODO RECOLHIDO — coluna estreita */
                    <div className="flex flex-col items-center py-4 px-2 gap-3 h-full cursor-pointer"
                      onClick={() => setAreasColapsadas(p => ({ ...p, [area.id]: false }))}>
                      <ChevronDown size={16} className="text-slate-400 rotate-[-90deg]"/>
                      <p className="text-slate-400 text-xs font-bold writing-mode-vertical"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', letterSpacing: 2, whiteSpace: 'nowrap', userSelect: 'none' }}>
                        {area.nome}
                      </p>
                      <span className="text-slate-600 text-xs">{lutasDaArea(area.id).length}</span>
                    </div>
                  ) : (
                    /* MODO EXPANDIDO */
                    <>
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div>
                            <p className="text-white font-bold text-sm">{area.nome}</p>
                            <p className="text-slate-500 text-xs">
                              {area.hora_inicio ? `⏰ ${area.hora_inicio.slice(0,5)}` : ''} · {lutasDaArea(area.id).length} luta(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => abrirPlacar(area.id, area.nome)}
                            className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all">
                            <Monitor size={11}/> Placar
                          </button>
                          <button onClick={() => setAreasColapsadas(p => ({ ...p, [area.id]: true }))}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            title="Recolher área">
                            <ChevronDown size={14} className="rotate-90"/>
                          </button>
                        </div>
                      </div>
                      <div className="p-3 space-y-2 min-h-24">
                        {lutasDaArea(area.id).length === 0 ? (
                          <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${arrastandoSobre === area.id ? 'border-blue-500/50' : 'border-slate-800'}`}>
                            <p className="text-slate-600 text-xs">Arraste lutas aqui</p>
                          </div>
                        ) : lutasDaArea(area.id).map((luta, idx) => (
                          <CardLuta key={luta.id} luta={luta} ordem={idx + 1}
                            onDragStart={() => handleDragStart(luta)}
                            onRemover={() => removerLutaDaArea(luta.id)}/>
                        ))}
                      </div>
                      {/* Rodapé com cronograma */}
                      {lutasDaArea(area.id).length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-500">⚔️ {lutasDaArea(area.id).length} combates</span>
                            {area.hora_inicio && (
                              <>
                                <span className="text-slate-700">·</span>
                                <span className="text-slate-500">🕐 {area.hora_inicio.slice(0,5)} → <span className="text-blue-400 font-bold">{calcularTermino(area)}</span></span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardLuta({ luta, ordem, onDragStart, onRemover, semArea }) {
  const a1Nome = luta.atleta1?.nome || 'A definir';
  const a2Nome = luta.atleta2?.nome || 'A definir';
  const categoria = luta.chaves?.entradas?.nome || luta.fase || '—';
  const a1Pesagem = luta.atleta1?.pesagem;
  const a2Pesagem = luta.atleta2?.pesagem;
  const ambosOk = a1Pesagem === 'ok' && a2Pesagem === 'ok';

  return (
    <div draggable onDragStart={onDragStart}
      className="bg-slate-800 border border-slate-700 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all select-none">
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-slate-600 mt-0.5 shrink-0"/>
        <div className="flex-1 min-w-0">
          {ordem && <span className="text-slate-500 text-xs font-mono">#{ordem}</span>}
          <p className="text-slate-400 text-xs truncate mb-1">{categoria} · {luta.fase}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-yellow-400 shrink-0"/>
              <p className="text-white text-xs font-medium truncate flex-1">{a1Nome}</p>
              {a1Pesagem === 'ok' && <span className="text-green-400 text-xs shrink-0">✓</span>}
              {a1Pesagem !== 'ok' && a1Pesagem && <span className="text-red-400 text-xs shrink-0">⚖</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-slate-500 shrink-0"/>
              <p className="text-white text-xs font-medium truncate flex-1">{a2Nome}</p>
              {a2Pesagem === 'ok' && <span className="text-green-400 text-xs shrink-0">✓</span>}
              {a2Pesagem !== 'ok' && a2Pesagem && <span className="text-red-400 text-xs shrink-0">⚖</span>}
            </div>
          </div>
          {ambosOk && <p className="text-green-400 text-xs mt-1">✅ Prontos para lutar</p>}
        </div>
        {onRemover && (
          <button onClick={onRemover} className="text-slate-600 hover:text-red-400 transition-colors shrink-0 p-0.5">
            <X size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}