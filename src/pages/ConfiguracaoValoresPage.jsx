import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Tag, Gift, DollarSign, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ConfiguracaoValoresPage() {
  const { id: eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [lotes, setLotes] = useState([
    { id: null, nome: 'Inscrição Antecipada', dataInicio: '', dataFim: '' },
    { id: null, nome: 'Inscrição Normal', dataInicio: '', dataFim: '' },
    { id: null, nome: 'Inscrição Tardia', dataInicio: '', dataFim: '' },
  ]);
  const [prazos, setPrazos] = useState({ dataInicioInscricao: '', dataFimInscricao: '' });
  const [precos, setPrecos] = useState({});
  const [combos, setCombos] = useState([]);
  const [cupons, setCupons] = useState([]);
  const [todosEventos, setTodosEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('lotes');
  const [novoCombo, setNovoCombo] = useState({ nome: 'Combo Gi + NoGi', tipo: 'percentual', valor: '' });
  const [novoCupom, setNovoCupom] = useState({ codigo: '', tipo: 'percentual', valor: '', dataLimite: '', usosMaximos: '', eventosIds: [] });

  useEffect(() => { carregarDados(); }, [eventoId]);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [eventoRes, entradasRes, lotesRes, precosRes, combosRes, cuponsRes, eventosRes] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', eventoId).single(),
        supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
        supabase.from('lotes_evento').select('*').eq('evento_id', eventoId).order('data_inicio'),
        supabase.from('evento_precos').select('*').eq('evento_id', eventoId),
        supabase.from('evento_combos').select('*').eq('evento_id', eventoId),
        supabase.from('cupons').select('*, cupons_eventos(evento_id)').eq('organizador_id', user.id).order('created_at', { ascending: false }),
        supabase.from('eventos').select('id, nome').eq('organizador_id', user.id).order('data_evento', { ascending: false }),
      ]);

      if (eventoRes.data) {
        setEvento(eventoRes.data);
        setPrazos({
          dataInicioInscricao: eventoRes.data.data_inicio_inscricao?.split('T')[0] || '',
          dataFimInscricao: eventoRes.data.data_fim_inscricao?.split('T')[0] || '',
        });
      }
      if (entradasRes.data) setEntradas(entradasRes.data);
      if (combosRes.data) setCombos(combosRes.data);
      if (cuponsRes.data) setCupons(cuponsRes.data);
      if (eventosRes.data) setTodosEventos(eventosRes.data);

      if (lotesRes.data && lotesRes.data.length > 0) {
        const nomes = ['Inscrição Antecipada', 'Inscrição Normal', 'Inscrição Tardia'];
        setLotes(nomes.map(nome => {
          const found = lotesRes.data.find(l => l.nome === nome);
          return found
            ? { id: found.id, nome, dataInicio: found.data_inicio || '', dataFim: found.data_fim || '' }
            : { id: null, nome, dataInicio: '', dataFim: '' };
        }));
      }

      if (precosRes.data && entradasRes.data) {
        const map = {};
        entradasRes.data.forEach(e => {
          map[e.id] = { antecipada: '', normal: '', tardia: '', ids: {} };
        });
        precosRes.data.forEach(p => {
          if (map[p.entrada_id]) {
            const key = p.lote_nome === 'Inscrição Antecipada' ? 'antecipada'
              : p.lote_nome === 'Inscrição Normal' ? 'normal' : 'tardia';
            map[p.entrada_id][key] = p.valor?.toString() || '';
            map[p.entrada_id].ids[key] = p.id;
          }
        });
        setPrecos(map);
      }
    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const mostrarSucesso = (msg) => { setSucesso(msg); setTimeout(() => setSucesso(''), 3000); setErro(''); };

  const salvarLotes = async () => {
    setSalvando(true);
    try {
      await supabase.from('eventos').update({
        data_inicio_inscricao: prazos.dataInicioInscricao || null,
        data_fim_inscricao: prazos.dataFimInscricao || null,
      }).eq('id', eventoId);

      const novosLotes = [...lotes];
      for (let i = 0; i < novosLotes.length; i++) {
        const lote = novosLotes[i];
        if (!lote.dataInicio || !lote.dataFim) continue;
        const payload = {
          evento_id: eventoId, nome: lote.nome,
          data_inicio: lote.dataInicio, data_fim: lote.dataFim,
          valor: 0, ativo: true,
        };
        if (lote.id) {
          await supabase.from('lotes_evento').update(payload).eq('id', lote.id);
        } else {
          const { data } = await supabase.from('lotes_evento').insert(payload).select().single();
          if (data) novosLotes[i] = { ...lote, id: data.id };
        }
      }
      setLotes(novosLotes);
      mostrarSucesso('Lotes e prazos salvos!');
    } catch(e) { setErro('Erro ao salvar lotes.'); }
    finally { setSalvando(false); }
  };

  const salvarPrecos = async () => {
    setSalvando(true);
    try {
      const lotesNomes = ['Inscrição Antecipada', 'Inscrição Normal', 'Inscrição Tardia'];
      const keys = ['antecipada', 'normal', 'tardia'];

      for (const entrada of entradas) {
        const p = precos[entrada.id] || {};
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const valor = p[key];
          if (!valor) continue;
          const payload = {
            evento_id: eventoId,
            entrada_id: entrada.id,
            lote_nome: lotesNomes[i],
            valor: parseFloat(valor),
            modalidade: entrada.modalidade || '',
            categoria: entrada.nome,
          };
          if (p.ids?.[key]) {
            await supabase.from('evento_precos').update(payload).eq('id', p.ids[key]);
          } else {
            const { data } = await supabase.from('evento_precos').insert(payload).select().single();
            if (data) {
              setPrecos(prev => ({
                ...prev,
                [entrada.id]: { ...prev[entrada.id], ids: { ...prev[entrada.id]?.ids, [key]: data.id } }
              }));
            }
          }
        }
      }
      mostrarSucesso('Preços salvos com sucesso!');
    } catch(e) { setErro('Erro ao salvar preços: ' + e.message); }
    finally { setSalvando(false); }
  };

  const adicionarCombo = async () => {
    if (!novoCombo.valor) { setErro('Informe o valor do combo.'); return; }
    setSalvando(true);
    try {
      const { data, error } = await supabase.from('evento_combos').insert({
        evento_id: eventoId, nome: novoCombo.nome,
        tipo: novoCombo.tipo, valor: parseFloat(novoCombo.valor), ativo: true,
      }).select().single();
      if (error) throw error;
      setCombos(prev => [...prev, data]);
      mostrarSucesso('Combo adicionado!');
    } catch(e) { setErro('Erro ao adicionar combo.'); }
    finally { setSalvando(false); }
  };

  const removerCombo = async (id) => {
    await supabase.from('evento_combos').delete().eq('id', id);
    setCombos(prev => prev.filter(c => c.id !== id));
  };

  const adicionarCupom = async () => {
    if (!novoCupom.codigo || !novoCupom.valor) { setErro('Informe o código e valor.'); return; }
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: cupomData, error } = await supabase.from('cupons').insert({
        organizador_id: user.id,
        codigo: novoCupom.codigo.toUpperCase(),
        tipo: novoCupom.tipo,
        valor: parseFloat(novoCupom.valor),
        data_limite: novoCupom.dataLimite || null,
        usos_maximos: novoCupom.usosMaximos ? parseInt(novoCupom.usosMaximos) : null,
      }).select().single();
      if (error) throw error;
      if (novoCupom.eventosIds.length > 0) {
        await supabase.from('cupons_eventos').insert(novoCupom.eventosIds.map(eId => ({ cupom_id: cupomData.id, evento_id: eId })));
      }
      setCupons(prev => [...prev, { ...cupomData, cupons_eventos: novoCupom.eventosIds.map(eId => ({ evento_id: eId })) }]);
      setNovoCupom({ codigo: '', tipo: 'percentual', valor: '', dataLimite: '', usosMaximos: '', eventosIds: [] });
      mostrarSucesso('Cupom criado!');
    } catch(e) { setErro('Erro ao criar cupom.'); }
    finally { setSalvando(false); }
  };

  const removerCupom = async (id) => {
    await supabase.from('cupons').delete().eq('id', id);
    setCupons(prev => prev.filter(c => c.id !== id));
  };

  const ic = 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';
  const sc = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <a href={`/eventos/${eventoId}/admin`}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={16} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white text-lg font-bold">Configuração de Valores</h1>
            <p className="text-slate-500 text-sm">{evento?.nome}</p>
          </div>
        </div>

        {sucesso && (
          <div className="mb-4 bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400 shrink-0"/>
            <p className="text-green-300 text-sm">{sucesso}</p>
          </div>
        )}
        {erro && (
          <div className="mb-4 bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0"/>
            <p className="text-red-300 text-sm">{erro}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { id: 'lotes', label: 'Lotes', icon: Calendar },
            { id: 'precos', label: 'Preços', icon: DollarSign },
            { id: 'combos', label: 'Combos', icon: Gift, count: combos.length },
            { id: 'cupons', label: 'Cupons', icon: Tag, count: cupons.length },
          ].map(t => (
            <button key={t.id} onClick={() => setAbaAtiva(t.id)}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (abaAtiva === t.id ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white')}>
              <t.icon size={14}/> {t.label}
              {t.count > 0 && <span className="bg-white/20 text-xs w-5 h-5 rounded-full flex items-center justify-center">{t.count}</span>}
            </button>
          ))}
        </div>

        {abaAtiva === 'lotes' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-1">Prazo de Inscrições</h3>
              <p className="text-slate-500 text-xs mb-4">Período geral em que as inscrições ficam abertas</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Início das inscrições</label>
                  <input type="date" value={prazos.dataInicioInscricao}
                    onChange={e => setPrazos(p => ({ ...p, dataInicioInscricao: e.target.value }))}
                    className={ic + ' w-full'}/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Fim das inscrições</label>
                  <input type="date" value={prazos.dataFimInscricao}
                    onChange={e => setPrazos(p => ({ ...p, dataFimInscricao: e.target.value }))}
                    className={ic + ' w-full'}/>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-white font-bold mb-1">Lotes de Inscrição</h3>
                <p className="text-slate-500 text-xs">Defina os períodos de cada lote. Os valores por categoria são configurados na aba Preços.</p>
              </div>

              {lotes.map((lote, idx) => (
                <div key={idx} className={`border rounded-xl p-4 space-y-3 ${lote.dataInicio && lote.dataFim ? 'border-slate-700 bg-slate-800/50' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-bold">{lote.nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${idx === 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : idx === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {idx === 0 ? 'Mais barato' : idx === 2 ? 'Mais caro' : 'Padrão'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Data início</label>
                      <input type="date" value={lote.dataInicio}
                        onChange={e => setLotes(prev => prev.map((l,i) => i === idx ? { ...l, dataInicio: e.target.value } : l))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Data fim</label>
                      <input type="date" value={lote.dataFim}
                        onChange={e => setLotes(prev => prev.map((l,i) => i === idx ? { ...l, dataFim: e.target.value } : l))}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"/>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={salvarLotes} disabled={salvando}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all">
                {salvando ? 'Salvando...' : '💾 Salvar Lotes e Prazos'}
              </button>
            </div>

            <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3">
              <p className="text-blue-300 text-xs">💡 Ao virar o lote, todos os atletas com pagamento pendente terão o valor atualizado automaticamente para o lote ativo.</p>
            </div>
          </div>
        )}

        {abaAtiva === 'precos' && (
          <div className="space-y-4">
            {entradas.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
                <DollarSign size={32} className="text-slate-700 mx-auto mb-2"/>
                <p className="text-slate-500 text-sm mb-2">Nenhuma categoria criada ainda</p>
                <a href={`/eventos/${eventoId}/categorias`} className="text-blue-400 text-xs hover:text-blue-300">Criar categorias →</a>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-slate-800 bg-slate-800/50">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Categoria</p>
                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider text-center">Antecipada</p>
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-wider text-center">Normal</p>
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-wider text-center">Tardia</p>
                  </div>
                  {entradas.map(entrada => (
                    <div key={entrada.id} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 items-center">
                      <div>
                        <p className="text-white text-sm font-medium truncate">{entrada.nome}</p>
                        {entrada.modalidade && <p className="text-slate-500 text-xs">{entrada.modalidade}</p>}
                      </div>
                      {['antecipada', 'normal', 'tardia'].map((key, i) => (
                        <div key={key} className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={precos[entrada.id]?.[key] || ''}
                            onChange={e => setPrecos(prev => ({
                              ...prev,
                              [entrada.id]: { ...prev[entrada.id], [key]: e.target.value }
                            }))}
                            placeholder="0,00"
                            className={`w-full bg-slate-800 border text-white rounded-lg pl-8 pr-2 py-2 text-sm text-center focus:outline-none ${i === 0 ? 'border-green-500/30 focus:border-green-500' : i === 1 ? 'border-blue-500/30 focus:border-blue-500' : 'border-orange-500/30 focus:border-orange-500'}`}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button onClick={salvarPrecos} disabled={salvando}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all">
                  {salvando ? 'Salvando...' : '💾 Salvar Preços'}
                </button>
                {lotes.every(l => !l.dataInicio) && (
                  <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl px-4 py-3">
                    <p className="text-yellow-300 text-xs">⚠️ Configure os lotes primeiro para que o sistema saiba qual valor cobrar em cada período.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {abaAtiva === 'combos' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">Adicionar Combo</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className="text-slate-400 text-xs mb-1.5 block">Nome</label>
                  <input value={novoCombo.nome} onChange={e => setNovoCombo(p => ({...p, nome: e.target.value}))} className={ic + ' w-full'} placeholder="Combo Gi + NoGi"/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Tipo</label>
                  <select value={novoCombo.tipo} onChange={e => setNovoCombo(p => ({...p, tipo: e.target.value}))} className={sc + ' w-full'}>
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Fixo (R$)</option>
                  </select></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Desconto</label>
                  <input type="number" value={novoCombo.valor} onChange={e => setNovoCombo(p => ({...p, valor: e.target.value}))} placeholder={novoCombo.tipo === 'percentual' ? '10' : '20'} min="0" className={ic + ' w-full'}/></div>
              </div>
              <button onClick={adicionarCombo} disabled={salvando} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                <Plus size={14}/> Adicionar
              </button>
            </div>
            {combos.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-4 text-slate-500 text-xs font-medium">
                  <span>Nome</span><span>Tipo</span><span>Desconto</span><span></span>
                </div>
                {combos.map(c => (
                  <div key={c.id} className="px-5 py-3 grid grid-cols-4 items-center border-b border-slate-800/50 last:border-0">
                    <span className="text-white text-sm">{c.nome}</span>
                    <span className="text-slate-400 text-sm capitalize">{c.tipo}</span>
                    <span className="text-green-400 font-bold text-sm">{c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${parseFloat(c.valor).toFixed(2)}`}</span>
                    <button onClick={() => removerCombo(c.id)} className="text-slate-600 hover:text-red-400 justify-self-end"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                <Gift size={32} className="text-slate-700 mx-auto mb-2"/>
                <p className="text-slate-500 text-sm">Nenhum combo configurado</p>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'cupons' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold">Criar Cupom</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-400 text-xs mb-1.5 block">Código *</label>
                  <input value={novoCupom.codigo} onChange={e => setNovoCupom(p => ({...p, codigo: e.target.value.toUpperCase()}))} placeholder="NEXUS20" className={ic + ' w-full font-mono'}/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Tipo</label>
                  <select value={novoCupom.tipo} onChange={e => setNovoCupom(p => ({...p, tipo: e.target.value}))} className={sc + ' w-full'}>
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Fixo (R$)</option>
                  </select></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Valor *</label>
                  <input type="number" value={novoCupom.valor} onChange={e => setNovoCupom(p => ({...p, valor: e.target.value}))} placeholder="20" min="0" className={ic + ' w-full'}/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Data limite</label>
                  <input type="date" value={novoCupom.dataLimite} onChange={e => setNovoCupom(p => ({...p, dataLimite: e.target.value}))} className={ic + ' w-full'}/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Usos máximos</label>
                  <input type="number" value={novoCupom.usosMaximos} onChange={e => setNovoCupom(p => ({...p, usosMaximos: e.target.value}))} placeholder="Ilimitado" min="1" className={ic + ' w-full'}/></div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Válido para eventos</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {todosEventos.map(ev => (
                    <label key={ev.id} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-all">
                      <input type="checkbox" checked={novoCupom.eventosIds.includes(ev.id)}
                        onChange={e => setNovoCupom(p => ({
                          ...p,
                          eventosIds: e.target.checked ? [...p.eventosIds, ev.id] : p.eventosIds.filter(id => id !== ev.id)
                        }))}
                        className="w-4 h-4 accent-blue-600"/>
                      <span className="text-white text-sm">{ev.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={adicionarCupom} disabled={salvando} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">
                <Plus size={14}/> Criar Cupom
              </button>
            </div>
            {cupons.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-4 text-slate-500 text-xs font-medium">
                  <span>Código</span><span>Desconto</span><span>Validade</span><span></span>
                </div>
                {cupons.map(c => (
                  <div key={c.id} className="px-5 py-3 grid grid-cols-4 items-center border-b border-slate-800/50 last:border-0">
                    <span className="text-white text-sm font-mono font-bold">{c.codigo}</span>
                    <span className="text-green-400 font-bold text-sm">{c.tipo === 'percentual' ? `${c.valor}%` : `R$ ${parseFloat(c.valor).toFixed(2)}`}</span>
                    <span className="text-slate-400 text-sm">{c.data_limite ? new Date(c.data_limite).toLocaleDateString('pt-BR') : '—'}</span>
                    <button onClick={() => removerCupom(c.id)} className="text-slate-600 hover:text-red-400 justify-self-end"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                <Tag size={32} className="text-slate-700 mx-auto mb-2"/>
                <p className="text-slate-500 text-sm">Nenhum cupom criado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}