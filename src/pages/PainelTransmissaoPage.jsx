import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Tv, Copy, Check, Youtube, Radio, Settings } from 'lucide-react';

export default function PainelTransmissaoPage() {
  const { id: eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [areas, setAreas] = useState([]);
  const [config, setConfig] = useState({
    canal_youtube: 'https://youtube.com/@blufight',
    areas_transmitindo: [],
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState({});
  const [sucesso, setSucesso] = useState('');

  const BASE_URL = window.location.origin;

  useEffect(() => { carregarDados(); }, [eventoId]);

  const carregarDados = async () => {
    try {
      const [evRes, areasRes, configRes] = await Promise.all([
        supabase.from('eventos').select('id, nome, logo_url, data_evento').eq('id', eventoId).single(),
        supabase.from('areas').select('id, nome, ordem, dia').eq('evento_id', eventoId).order('dia').order('ordem'),
        supabase.from('transmissao_config').select('*').eq('evento_id', eventoId).single(),
      ]);
      if (evRes.data) setEvento(evRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (configRes.data) setConfig({
        canal_youtube: configRes.data.canal_youtube || 'https://youtube.com/@blufight',
        areas_transmitindo: configRes.data.areas_transmitindo || [],
      });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleArea = (areaId) => {
    setConfig(prev => ({
      ...prev,
      areas_transmitindo: prev.areas_transmitindo.includes(areaId)
        ? prev.areas_transmitindo.filter(id => id !== areaId)
        : [...prev.areas_transmitindo, areaId],
    }));
  };

  const salvarConfig = async () => {
    setSalvando(true);
    try {
      const { data: existing } = await supabase
        .from('transmissao_config').select('id').eq('evento_id', eventoId).single();
      const payload = { evento_id: eventoId, ...config };
      if (existing) {
        await supabase.from('transmissao_config').update(payload).eq('evento_id', eventoId);
      } else {
        await supabase.from('transmissao_config').insert(payload);
      }
      setSucesso('Configuração salva!');
      setTimeout(() => setSucesso(''), 3000);
    } catch(e) { console.error(e); }
    finally { setSalvando(false); }
  };

  const copiarURL = (areaId) => {
    const url = `${BASE_URL}/ao-vivo/${eventoId}/${areaId}`;
    navigator.clipboard.writeText(url);
    setCopiado(prev => ({ ...prev, [areaId]: true }));
    setTimeout(() => setCopiado(prev => ({ ...prev, [areaId]: false })), 2000);
  };

  const areasSelecionadas = areas.filter(a => config.areas_transmitindo.includes(a.id));

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href={`/eventos/${eventoId}/admin`}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={16} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white text-xl font-bold flex items-center gap-2">
              <Radio size={18} className="text-red-400"/> Transmissão ao Vivo
            </h1>
            <p className="text-slate-500 text-sm">{evento?.nome}</p>
          </div>
        </div>

        {sucesso && (
          <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <Check size={16} className="text-green-400"/>
            <p className="text-green-300 text-sm">{sucesso}</p>
          </div>
        )}

        {/* Canal YouTube */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-1 flex items-center gap-2">
            <Youtube size={16} className="text-red-400"/> Canal de Transmissão
          </h2>
          <p className="text-slate-500 text-xs mb-4">URL padrão: BluFight. O organizador pode usar seu próprio canal.</p>
          <input value={config.canal_youtube}
            onChange={e => setConfig(p => ({ ...p, canal_youtube: e.target.value }))}
            placeholder="https://youtube.com/@seucanal"
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"/>
          <p className="text-slate-600 text-xs mt-2">Este link aparece na página pública do evento para o público acompanhar.</p>
        </div>

        {/* Seleção de áreas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-1 flex items-center gap-2">
            <Tv size={16} className="text-blue-400"/> Áreas a Transmitir
          </h2>
          <p className="text-slate-500 text-xs mb-4">Selecione as áreas que terão overlay de placar para o OBS.</p>

          {areas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">Nenhuma área criada ainda.</p>
              <a href={`/eventos/${eventoId}/areas`} className="text-blue-400 text-xs hover:text-blue-300 mt-1 block">Criar áreas →</a>
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map(area => {
                const selecionada = config.areas_transmitindo.includes(area.id);
                return (
                  <div key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selecionada ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-600'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selecionada ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                      {selecionada && <Check size={12} className="text-white"/>}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{area.nome}</p>
                      <p className="text-slate-500 text-xs">Dia {area.dia}</p>
                    </div>
                    {selecionada && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                        <span className="text-red-400 text-xs font-bold">AO VIVO</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão salvar */}
        <button onClick={salvarConfig} disabled={salvando}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          <Settings size={16}/> {salvando ? 'Salvando...' : 'Salvar Configuração'}
        </button>

        {/* URLs geradas */}
        {areasSelecionadas.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-white font-bold mb-1 flex items-center gap-2">
                <Radio size={16} className="text-red-400"/> URLs para o OBS
              </h2>
              <p className="text-slate-500 text-xs">Adicione cada URL como <strong className="text-slate-400">Browser Source</strong> no OBS. Resolução recomendada: 1920×1080.</p>
            </div>

            <div className="space-y-3">
              {areasSelecionadas.map(area => {
                const url = `${BASE_URL}/ao-vivo/${eventoId}/${area.id}`;
                return (
                  <div key={area.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-bold">{area.nome}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                        <span className="text-red-400 text-xs font-bold">AO VIVO</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-blue-300 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 truncate">
                        {url}
                      </code>
                      <button onClick={() => copiarURL(area.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${copiado[area.id] ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                        {copiado[area.id] ? <><Check size={12}/> Copiado</> : <><Copy size={12}/> Copiar</>}
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 rounded-lg transition-all">
                        👁 Visualizar overlay
                      </a>
                      <a href={`/placar/mesa?area=${area.id}&evento=${eventoId}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold py-2 rounded-lg transition-all">
                        🎮 Mesa de placar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instrução OBS */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
              <p className="text-white text-xs font-bold uppercase tracking-wider">Como configurar no OBS</p>
              {[
                '1. Abra o OBS Studio',
                '2. Na cena, clique em "+" nas Fontes',
                '3. Selecione "Navegador" (Browser Source)',
                '4. Cole a URL acima no campo URL',
                '5. Defina largura 1920 e altura 1080',
                '6. Marque "Controlar áudio via OBS" se necessário',
                '7. Clique OK — o placar aparece em tempo real',
              ].map((s, i) => (
                <p key={i} className="text-slate-400 text-xs">{s}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}