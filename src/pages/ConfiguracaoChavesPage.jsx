import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, Save, CheckCircle, Clock, Shield, Trophy, Info, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FORMATOS_2 = [
  { id: 'simples', label: 'Chave simples', desc: '1 luta — quem ganhar é campeão' },
  { id: 'melhor_de_3', label: 'Melhor de 3', desc: 'Ganha quem vencer 2 lutas' },
];
const FORMATOS_3 = [
  { id: 'round_robin', label: 'Round Robin', desc: 'Todos contra todos — mais vitórias vence' },
  { id: 'round_robin_repescagem', label: 'Round Robin com Repescagem', desc: 'Perdedor tem chance de voltar' },
];
const FORMATOS_PADRAO = [
  { id: 'eliminacao', label: 'Eliminação Simples', desc: 'Padrão mata-mata com BYE automático' },
  { id: 'melhor_de_3', label: 'Melhor de 3 (Bo3)', desc: 'Vence quem ganhar 2 partidas' },
];
const OPCOES_BRONZE = [
  { id: 'duplo', label: 'Duplo Bronze', desc: 'Ambos perdedores de semi são 3º lugar — padrão IBJJF/CBJJF' },
  { id: 'perdeu_para_campeao', label: '3º lugar — perdeu para o campeão', desc: 'Apenas quem perdeu para o campeão na semi recebe bronze' },
];

export default function ConfiguracaoChavesPage() {
  const { id: eventoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');
  const [configId, setConfigId] = useState(null);
  const [entradas, setEntradas] = useState([]);

  const [config, setConfig] = useState({
    formato_2atletas: 'simples',
    formato_3atletas: 'round_robin_repescagem',
    formato_padrao: 'eliminacao',
    bronze: 'duplo',
    separar_academia: true,
    tempos: {},      // { [entrada_id]: segundos }
    intervalos: {},  // { [entrada_id]: segundos }
    descanso_minimo: 1,
    descanso_final: 2,
  });

  useEffect(() => { if (eventoId) carregarConfig(); }, [eventoId]);

  const carregarConfig = async () => {
    try {
      const [configRes, entradasRes] = await Promise.all([
        supabase.from('configuracoes_chaves').select('*').eq('evento_id', eventoId).single(),
        supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
      ]);
      if (entradasRes.data) setEntradas(entradasRes.data);
      if (configRes.data) {
        setConfigId(configRes.data.id);
        setConfig({
          formato_2atletas: configRes.data.formato_2atletas || 'simples',
          formato_3atletas: configRes.data.formato_3atletas || 'round_robin_repescagem',
          formato_padrao: configRes.data.formato_padrao || 'eliminacao',
          bronze: configRes.data.bronze || 'duplo',
          separar_academia: configRes.data.separar_academia !== false,
          tempos: configRes.data.tempos || {},
          intervalos: configRes.data.intervalos || {},
          descanso_minimo: configRes.data.descanso_minimo ?? 1,
          descanso_final: configRes.data.descanso_final ?? 2,
        });
      }
    } catch(e) { /* sem config ainda */ }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        formato_2atletas: config.formato_2atletas,
        formato_3atletas: config.formato_3atletas,
        formato_padrao: config.formato_padrao,
        bronze: config.bronze,
        separar_academia: config.separar_academia,
        tempos: config.tempos,
        intervalos: config.intervalos,
        descanso_minimo: config.descanso_minimo,
        descanso_final: config.descanso_final,
      };
      if (configId) {
        await supabase.from('configuracoes_chaves').update(payload).eq('id', configId);
      } else {
        const { data } = await supabase.from('configuracoes_chaves').insert({ evento_id: eventoId, ...payload }).select().single();
        if (data) setConfigId(data.id);
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch(e) { setErro('Erro ao salvar: ' + e.message); }
    finally { setSalvando(false); }
  };

  const set = (campo, valor) => setConfig(p => ({ ...p, [campo]: valor }));
  const setTempo = (id, seg) => setConfig(p => ({ ...p, tempos: { ...p.tempos, [id]: Number(seg) } }));
  const setIntervalo = (id, seg) => setConfig(p => ({ ...p, intervalos: { ...p.intervalos, [id]: Number(seg) } }));

  const RadioGroup = ({ opcoes, valor, onChange, cor = 'blue' }) => (
    <div className="space-y-2">
      {opcoes.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${valor === o.id ? `border-${cor}-500 bg-${cor}-500/10` : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
          <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${valor === o.id ? `border-${cor}-500 bg-${cor}-500` : 'border-slate-600'}`}>
            {valor === o.id && <div className="w-2 h-2 rounded-full bg-white"/>}
          </div>
          <div>
            <p className={`text-sm font-semibold ${valor === o.id ? `text-${cor}-300` : 'text-slate-300'}`}>{o.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{o.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );

  const TimeInput = ({ value, onChange, cor = 'blue' }) => {
    const mins = Math.floor(value / 60);
    const segs = value % 60;
    return (
      <div className="flex items-center gap-1.5">
        <input type="number" min="0" max="59" value={mins}
          onChange={e => onChange(parseInt(e.target.value || 0) * 60 + segs)}
          className={`w-14 bg-slate-900 border border-${cor}-500/30 text-white text-center font-bold rounded-lg py-1.5 text-sm focus:outline-none focus:border-${cor}-500`}/>
        <span className="text-slate-500 text-xs">min</span>
        <input type="number" min="0" max="59" value={segs}
          onChange={e => onChange(mins * 60 + parseInt(e.target.value || 0))}
          className={`w-14 bg-slate-900 border border-${cor}-500/30 text-white text-center font-bold rounded-lg py-1.5 text-sm focus:outline-none focus:border-${cor}-500`}/>
        <span className="text-slate-500 text-xs">seg</span>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href={`/eventos/${eventoId}/admin`}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
              <ArrowLeft size={16} className="text-slate-400"/>
            </a>
            <div>
              <h1 className="text-white font-bold text-xl flex items-center gap-2">
                <Settings size={20} className="text-blue-400"/> Configuração de Chaves
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Regras aplicadas ao gerar chaves neste evento</p>
            </div>
          </div>
          <button onClick={salvar} disabled={salvando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 disabled:opacity-50">
            <Save size={15}/> {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {salvo && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm font-semibold">Configurações salvas!</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-300 text-sm">{erro}</p></div>}

        <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={14} className="text-blue-400 mt-0.5 shrink-0"/>
          <p className="text-blue-300 text-xs">Configurações aplicadas automaticamente ao gerar chaves. Você pode ajustar individualmente cada categoria no chaveamento.</p>
        </div>

        {/* 1 ATLETA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Trophy size={16} className="text-yellow-400"/> 1 Atleta</h2>
          <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl px-4 py-3">
            <p className="text-yellow-300 text-sm font-medium">🥇 Campeão por W.O. automático</p>
            <p className="text-slate-500 text-xs mt-0.5">Aparece no pódio após pesagem OK.</p>
          </div>
        </div>

        {/* 2 ATLETAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><Trophy size={16} className="text-blue-400"/> 2 Atletas</h2>
          <p className="text-slate-500 text-xs mb-4">Formato com exatamente 2 atletas.</p>
          <RadioGroup opcoes={FORMATOS_2} valor={config.formato_2atletas} onChange={v => set('formato_2atletas', v)} cor="blue"/>
        </div>

        {/* 3 ATLETAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><Trophy size={16} className="text-green-400"/> 3 Atletas</h2>
          <p className="text-slate-500 text-xs mb-4">Formato com exatamente 3 atletas.</p>
          <RadioGroup opcoes={FORMATOS_3} valor={config.formato_3atletas} onChange={v => set('formato_3atletas', v)} cor="green"/>
        </div>

        {/* 4+ ATLETAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><Trophy size={16} className="text-purple-400"/> 4+ Atletas</h2>
          <p className="text-slate-500 text-xs mb-4">Formato padrão para 4 ou mais atletas.</p>
          <RadioGroup opcoes={FORMATOS_PADRAO} valor={config.formato_padrao} onChange={v => set('formato_padrao', v)} cor="purple"/>
        </div>

        {/* BRONZE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><span className="text-lg">🥉</span> Regra de Bronze</h2>
          <p className="text-slate-500 text-xs mb-4">Aplicada na eliminação simples com 4+ atletas.</p>
          <RadioGroup opcoes={OPCOES_BRONZE} valor={config.bronze} onChange={v => set('bronze', v)} cor="orange"/>
        </div>

        {/* SEPARAÇÃO POR ACADEMIA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2"><Shield size={16} className="text-blue-400"/> Separação por Academia</h2>
              <p className="text-slate-500 text-xs mt-1">Evita atletas da mesma academia na primeira rodada.</p>
            </div>
            <button onClick={() => set('separar_academia', !config.separar_academia)}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${config.separar_academia ? 'bg-blue-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.separar_academia ? 'left-7' : 'left-1'}`}/>
            </button>
          </div>
        </div>

        {/* TEMPO + INTERVALO POR CATEGORIA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><Clock size={16} className="text-blue-400"/> Tempo de Luta e Intervalo por Categoria</h2>
          <p className="text-slate-500 text-xs mb-4">Configure o tempo de luta e o intervalo entre lutas para cada categoria deste evento.</p>
          {entradas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">Nenhuma categoria cadastrada ainda.</p>
              <a href={`/eventos/${eventoId}/categorias`} className="text-blue-400 text-xs hover:text-blue-300 mt-1 block">Ir para Configuração de Categorias →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {entradas.map(entrada => {
                const tempoSeg = config.tempos[entrada.id] ?? 300;
                const intSeg = config.intervalos[entrada.id] ?? 120;
                return (
                  <div key={entrada.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4">
                    <div className="mb-3">
                      <p className="text-white text-sm font-medium">{entrada.nome}</p>
                      <p className="text-slate-500 text-xs">{entrada.modalidade}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">⏱ Tempo de luta</p>
                        <TimeInput value={tempoSeg} onChange={v => setTempo(entrada.id, v)} cor="blue"/>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">🔄 Intervalo entre lutas</p>
                        <TimeInput value={intSeg} onChange={v => setIntervalo(entrada.id, v)} cor="orange"/>
                        <p className="text-slate-600 text-xs mt-1">Troca de atletas entre lutas</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DESCANSO DO ATLETA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><Shield size={16} className="text-green-400"/> Regra de Descanso do Atleta</h2>
          <p className="text-slate-500 text-xs mb-4">Tempo mínimo de descanso calculado em múltiplos do tempo da categoria do atleta.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">Lutas normais</p>
                <p className="text-slate-500 text-xs mt-0.5">Ex: 1× = atleta em categoria de 6 min descansa no mínimo 6 min</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="number" min="1" max="5" value={config.descanso_minimo}
                  onChange={e => set('descanso_minimo', parseInt(e.target.value || 1))}
                  className="w-16 bg-slate-900 border border-slate-700 text-white text-center font-bold rounded-lg py-1.5 text-sm focus:outline-none focus:border-green-500"/>
                <span className="text-slate-500 text-xs">× tempo</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-800 border border-blue-500/20 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">Para a Final</p>
                <p className="text-slate-500 text-xs mt-0.5">Ex: 2× = atleta em categoria de 6 min descansa no mínimo 12 min antes da final</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="number" min="1" max="10" value={config.descanso_final}
                  onChange={e => set('descanso_final', parseInt(e.target.value || 2))}
                  className="w-16 bg-slate-900 border border-blue-500/30 text-white text-center font-bold rounded-lg py-1.5 text-sm focus:outline-none focus:border-blue-500"/>
                <span className="text-slate-500 text-xs">× tempo</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={salvar} disabled={salvando}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
          <Save size={16}/> {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}