import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MOTIVOS_ENDGAME = [
  { id: 'pontos', label: 'POR PONTOS' },
  { id: 'finalizacao', label: 'FINALIZAÇÃO' },
  { id: 'wo', label: 'W.O.' },
  { id: 'decisao', label: 'DECISÃO' },
  { id: 'desclassificacao', label: 'DESCLASSIFICAÇÃO' },
  { id: 'desc_indisciplina', label: 'DESC. INDISCIPLINA' },
  { id: 'no_show', label: 'NO-SHOW' },
];

const DUPLOS = [
  { id: 'duplo_wo', label: 'DUPLO W.O.' },
  { id: 'duplo_desc', label: 'DUPLO DQ' },
  { id: 'duplo_indisciplina', label: 'DUPLO INDISCIPLINA' },
  { id: 'duplo_no_show', label: 'DUPLO NO-SHOW' },
];

function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function LogoAtleta({ atleta, size = 44 }) {
  const nome = atleta?.time || atleta?.academia || '';
  const iniciais = nome.split(' ').slice(0, 2).map(w => w?.[0] || '').join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial Black, sans-serif', fontSize: size * 0.35, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
      {iniciais}
    </div>
  );
}

const CHANNEL_KEY = 'nexusjj_placar';

export default function PlacarMesa() {
  const params = new URLSearchParams(window.location.search);
  const areaId = params.get('area');
  const eventoId = params.get('evento');

  const [luta, setLuta] = useState(null);
  const [lutasPuladas, setLutasPuladas] = useState([]);
  const [todasLutas, setTodasLutas] = useState([]);
  const [listando, setListando] = useState(false);
  const [loadingLuta, setLoadingLuta] = useState(true);
  const [invertido, setInvertido] = useState(false);
  const [tempo, setTempo] = useState(300);
  const [rodando, setRodando] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tvAberta, setTvAberta] = useState(false);
  const [atletaAtivo, setAtletaAtivo] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [faseEndGame, setFaseEndGame] = useState('normal');
  const [vencedor, setVencedor] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [duplo, setDuplo] = useState(null);
  const [acoes, setAcoes] = useState([]);
  const [placar, setPlacar] = useState([
    { pontos: 0, vantagens: 0, penalidades: 0 },
    { pontos: 0, vantagens: 0, penalidades: 0 },
  ]);

  useEffect(() => { carregarProximaLuta(); }, [areaId]);

  useEffect(() => {
    if (!rodando || faseEndGame === 'salvo' || tempo <= 0) {
      if (tempo <= 0) setRodando(false);
      return;
    }
    const i = setInterval(() => setTempo(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(i);
  }, [rodando, faseEndGame, tempo]);

  useEffect(() => {
    if (luta) broadcast();
  }, [placar, tempo, rodando, invertido, vencedor, motivo, duplo, faseEndGame, luta]);

  useEffect(() => {
    const h = (e) => {
      if (e.code === 'Space' && faseEndGame === 'normal' && atletaAtivo === null && !menuAberto) {
        e.preventDefault(); setRodando(r => !r);
      }
      if (e.code === 'Escape') { setAtletaAtivo(null); setMenuAberto(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [faseEndGame, atletaAtivo, menuAberto]);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const carregarProximaLuta = async (lutaPuladaId = null) => {
    if (!areaId) return;
    setLoadingLuta(true);
    try {
      // Se tem luta pulada prioritária, carrega ela
      if (lutaPuladaId) {
        const { data } = await supabase
          .from('lutas')
          .select('*, atleta1:atleta1_id(id, academia, pesagem, profiles:profile_id(nome)), atleta2:atleta2_id(id, academia, pesagem, profiles:profile_id(nome)), chaves:chave_id(entrada_id, configuracao, entradas:entrada_id(nome, modalidade)), areas:area_id(nome)')
          .eq('id', lutaPuladaId).single();
        if (data) inicializarLuta(data);
        setLoadingLuta(false);
        return;
      }

      // Busca todas as lutas da área ordenadas
      const { data: todasData } = await supabase
        .from('lutas')
        .select('*, atleta1:atleta1_id(id, academia, pesagem, profiles:profile_id(nome)), atleta2:atleta2_id(id, academia, pesagem, profiles:profile_id(nome)), chaves:chave_id(entrada_id, configuracao, entradas:entrada_id(nome, modalidade)), areas:area_id(nome)')
        .eq('area_id', areaId)
        .order('ordem_area');

      if (todasData) {
        setTodasLutas(todasData);
        // Próxima luta: puladas primeiro, depois aguardando/proxima
        const puladas = todasData.filter(l => l.status === 'pulada');
        const pendentes = todasData.filter(l => l.status === 'proxima' || l.status === 'aguardando');
        const proxima = puladas[0] || pendentes[0];
        if (proxima) inicializarLuta(proxima);
        else setLuta(null);
      }
    } catch(e) { console.error(e); }
    finally { setLoadingLuta(false); }
  };

  const inicializarLuta = (lutaData) => {
    setLuta(lutaData);
    setTempo(lutaData.chaves?.configuracao?.tempo_luta || 300);
    setRodando(false);
    setPlacar([{ pontos: 0, vantagens: 0, penalidades: 0 }, { pontos: 0, vantagens: 0, penalidades: 0 }]);
    setAcoes([]);
    setVencedor(null); setMotivo(null); setDuplo(null);
    setFaseEndGame('normal'); setInvertido(false); setAtletaAtivo(null);
  };

  const broadcast = () => {
    const motivoLabel = motivo ? MOTIVOS_ENDGAME.find(m => m.id === motivo)?.label : '';
    const duploLabel = duplo ? DUPLOS.find(d => d.id === duplo)?.label : '';
    const estado = {
      luta: luta ? {
        id: luta.id, categoria: luta.chaves?.entradas?.nome || '—',
        fase: luta.fase || '—', area: luta.areas?.nome || '—',
        tempoTotal: luta.chaves?.configuracao?.tempo_luta || 300,
        atleta1: { nome: luta.atleta1?.profiles?.nome || 'A definir', academia: luta.atleta1?.academia || '', logoUrl: luta.atleta1?.academia_logo || luta.atleta1?.time_logo || null, faixa: luta.atleta1?.faixa || 'Azul', time: null, pais: 'BRA' },
        atleta2: { nome: luta.atleta2?.profiles?.nome || 'A definir', academia: luta.atleta2?.academia || '', logoUrl: luta.atleta2?.academia_logo || luta.atleta2?.time_logo || null, faixa: luta.atleta2?.faixa || 'Branca', time: null, pais: 'BRA' },
      } : null,
      placar, tempo, rodando, invertido,
      vencedor: faseEndGame === 'salvo' ? vencedor : null,
      motivo: faseEndGame === 'salvo' ? motivo : null,
      duplo: faseEndGame === 'salvo' ? duplo : null,
      motivoLabel: faseEndGame === 'salvo' ? (motivoLabel || duploLabel) : null,
      salvo: faseEndGame === 'salvo',
    };
    // BroadcastChannel local (PlacarTV)
    try { const ch = new BroadcastChannel(CHANNEL_KEY); ch.postMessage(estado); ch.close(); }
    catch { localStorage.setItem(CHANNEL_KEY, JSON.stringify({ ...estado, _ts: Date.now() })); }
    // Supabase Realtime (PlacarAoVivo OBS)
    if (luta?.area_id) {
      const payload = {
        atleta1: estado.luta?.atleta1,
        atleta2: estado.luta?.atleta2,
        pts1: placar[0]?.pts || 0, van1: placar[0]?.van || 0, pen1: placar[0]?.pen || 0,
        pts2: placar[1]?.pts || 0, van2: placar[1]?.van || 0, pen2: placar[1]?.pen || 0,
        tempo: `${String(Math.floor(tempo/60)).padStart(2,'0')}:${String(tempo%60).padStart(2,'0')}`,
        categoria: estado.luta?.categoria,
        fase: estado.luta?.fase,
        vencedor: faseEndGame === 'salvo' ? (vencedor === 0 ? 'atleta1' : 'atleta2') : null,
      };
      supabase.channel(`placar-ao-vivo-${luta.area_id}`).send({ type: 'broadcast', event: 'placar', payload });
    }
  };

  const addPlacar = (idx, tipo, val) => {
    setAcoes(p => [...p, { idx, tipo, val, tempo }]);
    setPlacar(p => { const n = [...p]; n[idx] = { ...n[idx], [tipo]: Math.max(0, n[idx][tipo] + val) }; return n; });
    setAtletaAtivo(null);
  };

  const desfazer = () => {
    if (!acoes.length) return;
    const u = acoes[acoes.length - 1];
    setPlacar(p => { const n = [...p]; n[u.idx] = { ...n[u.idx], [u.tipo]: Math.max(0, n[u.idx][u.tipo] - u.val) }; return n; });
    setAcoes(p => p.slice(0, -1));
    setMenuAberto(false);
  };

  const pularLuta = async () => {
    if (!luta) return;
    await supabase.from('lutas').update({ status: 'pulada' }).eq('id', luta.id);
    setLutasPuladas(prev => [...prev, luta.id]);
    setMenuAberto(false);
    await carregarProximaLuta();
  };

  const salvarResultado = async () => {
    setRodando(false);
    setFaseEndGame('salvo');
    if (!luta) return;

    const vencedorId = vencedor !== null
      ? (vencedor === esq ? luta.atleta1_id : luta.atleta2_id)
      : null;
    const motivoLabel = motivo ? MOTIVOS_ENDGAME.find(m => m.id === motivo)?.label : DUPLOS.find(d => d.id === duplo)?.label;

    await supabase.from('lutas').update({
      status: 'finalizada',
      vencedor_id: vencedorId,
      resultado: motivoLabel,
    }).eq('id', luta.id);

    // Atualiza pódio
    if (luta.fase === 'Final' && vencedorId) {
      await supabase.from('inscricoes_entrada').update({ podio: 1 })
        .eq('atleta_id', vencedorId).eq('evento_id', eventoId);
      const perdedorId = luta.atleta1_id === vencedorId ? luta.atleta2_id : luta.atleta1_id;
      if (perdedorId) await supabase.from('inscricoes_entrada').update({ podio: 2 })
        .eq('atleta_id', perdedorId).eq('evento_id', eventoId);
    }
  };

  const proximaLuta = async () => {
    // Verifica se tem luta pulada pendente
    const puladas = todasLutas.filter(l => l.status === 'pulada' && l.id !== luta?.id);
    if (puladas.length > 0) {
      await carregarProximaLuta(puladas[0].id);
    } else {
      await carregarProximaLuta();
    }
  };

  const selecionarLutaDaLista = async (lutaSel) => {
    // Se luta atual não finalizou, marca como pulada
    if (luta && faseEndGame !== 'salvo') {
      await supabase.from('lutas').update({ status: 'pulada' }).eq('id', luta.id);
    }
    setListando(false);
    inicializarLuta(lutaSel);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const voltarEndGame = () => { setFaseEndGame('normal'); setVencedor(null); setMotivo(null); setDuplo(null); };

  const esq = invertido ? 1 : 0;
  const dir = invertido ? 0 : 1;

  const atletaEsq = invertido ? luta?.atleta2 : luta?.atleta1;
  const atletaDir = invertido ? luta?.atleta1 : luta?.atleta2;
  const atletaEsqNome = atletaEsq?.profiles?.nome || 'A definir';
  const atletaDirNome = atletaDir?.profiles?.nome || 'A definir';
  const motivoLabel = motivo ? MOTIVOS_ENDGAME.find(m => m.id === motivo)?.label : '';
  const duploLabel = duplo ? DUPLOS.find(d => d.id === duplo)?.label : '';
  const nomeVencedor = vencedor !== null ? (vencedor === esq ? atletaEsqNome : atletaDirNome) : '';

  const C = { bg: '#141414', card: '#1c1c1c', dark: '#080808', border: '#252525', yellow: '#f5d800', green: '#22c55e', red: '#ef4444', blue: '#2563eb', gray: '#555' };

  // Tela de carregamento
  if (loadingLuta) return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontFamily: 'Arial Black, sans-serif', color: '#444', fontSize: '0.8rem', letterSpacing: 2 }}>CARREGANDO LUTA...</p>
      </div>
    </div>
  );

  // Sem luta disponível
  if (!luta) return (
    <div style={{ background: C.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: '2rem', color: '#333', letterSpacing: 2 }}>NENHUMA LUTA DISPONÍVEL</p>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#444', fontSize: '0.9rem' }}>Todas as lutas desta área foram concluídas ou nenhuma foi distribuída ainda.</p>
      <button onClick={() => carregarProximaLuta()}
        style={{ background: C.blue, color: '#fff', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '0.85rem', padding: '0.6rem 1.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: 1 }}>
        RECARREGAR
      </button>
    </div>
  );

  // Lista de lutas da área
  if (listando) return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '2rem', fontFamily: 'Arial Black, sans-serif' }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ color: C.yellow, fontSize: '1.3rem', fontWeight: 900, letterSpacing: 2 }}>ORDEM DE LUTA — {luta.areas?.nome?.toUpperCase()}</h1>
          <button onClick={() => setListando(false)}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666', fontFamily: 'Arial Black, sans-serif', fontSize: '0.75rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: 4, cursor: 'pointer' }}>
            FECHAR
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {todasLutas.map((l, idx) => {
            const a1 = l.atleta1?.profiles?.nome || 'A definir';
            const a2 = l.atleta2?.profiles?.nome || 'A definir';
            const isCurrent = l.id === luta?.id;
            const isPulada = l.status === 'pulada';
            const isFinalizada = l.status === 'finalizada';
            const a1Ok = l.atleta1?.pesagem === 'ok';
            const a2Ok = l.atleta2?.pesagem === 'ok';
            return (
              <div key={l.id} onClick={() => !isFinalizada && selecionarLutaDaLista(l)}
                style={{ background: isCurrent ? '#1a2a1a' : isFinalizada ? '#111' : '#1a1a1a', border: `1px solid ${isCurrent ? '#22c55e40' : isPulada ? '#f5d80030' : '#2a2a2a'}`, borderRadius: 6, padding: '0.75rem 1rem', cursor: isFinalizada ? 'not-allowed' : 'pointer', opacity: isFinalizada ? 0.4 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#333', fontSize: '0.8rem', fontWeight: 900, minWidth: 24 }}>#{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#555', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, marginBottom: '0.25rem' }}>{l.chaves?.entradas?.nome} · {l.fase}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: C.yellow }}/>
                        <span style={{ color: a1Ok ? '#fff' : '#555', fontSize: '0.8rem', fontWeight: 700 }}>{a1}</span>
                        {a1Ok && <span style={{ color: C.green, fontSize: '0.7rem' }}>✓</span>}
                        {!a1Ok && <span style={{ color: C.red, fontSize: '0.7rem' }}>⚖</span>}
                      </div>
                      <span style={{ color: '#333', fontSize: '0.75rem' }}>vs</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#555' }}/>
                        <span style={{ color: a2Ok ? '#fff' : '#555', fontSize: '0.8rem', fontWeight: 700 }}>{a2}</span>
                        {a2Ok && <span style={{ color: C.green, fontSize: '0.7rem' }}>✓</span>}
                        {!a2Ok && <span style={{ color: C.red, fontSize: '0.7rem' }}>⚖</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isCurrent && <span style={{ background: C.green, color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: 3, letterSpacing: 1 }}>ATUAL</span>}
                    {isPulada && <span style={{ background: C.yellow + '30', color: C.yellow, fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: 3, letterSpacing: 1 }}>PULADA</span>}
                    {isFinalizada && <span style={{ color: '#333', fontSize: '0.6rem', fontWeight: 900, letterSpacing: 1 }}>FINALIZADA</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAtleta = (idx, atleta, corPlacar) => {
    const p = placar[idx];
    const isAtivo = atletaAtivo === idx;
    const venceuEste = faseEndGame === 'confirmacao' && vencedor === idx;
    const nome = atleta?.profiles?.nome || 'A DEFINIR';
    const academia = atleta?.academia || '';
    const pesagemOk = atleta?.pesagem === 'ok';

    return (
      <div onClick={() => { if (faseEndGame === 'normal' && !menuAberto) setAtletaAtivo(isAtivo ? null : idx); }}
        style={{ flex: 1, background: C.card, borderBottom: `3px solid ${C.dark}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', cursor: faseEndGame === 'normal' ? 'pointer' : 'default', padding: '0.6rem 1.2rem' }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          {faseEndGame === 'escolha' && (
            <div style={{ marginBottom: '0.5rem' }} onClick={e => e.stopPropagation()}>
              <div style={{ background: '#111', border: '1px solid #333', borderRadius: 4, overflow: 'hidden', display: 'inline-block', minWidth: 320 }}>
                <div style={{ background: corPlacar === C.yellow ? C.yellow : '#222', padding: '0.3rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '0.9rem', fontWeight: 900, color: corPlacar === C.yellow ? '#000' : '#fff', margin: 0, letterSpacing: 3 }}>WON BY:</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#333', padding: 1 }}>
                  {MOTIVOS_ENDGAME.map(m => (
                    <button key={m.id} onClick={() => { setVencedor(idx); setMotivo(m.id); setDuplo(null); setFaseEndGame('confirmacao'); }}
                      style={{ background: '#111', color: '#ccc', fontFamily: 'Arial Black, sans-serif', fontSize: '0.8rem', fontWeight: 900, padding: '0.6rem', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#ccc'; }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {faseEndGame === 'confirmacao' && venceuEste && (
            <div style={{ background: C.yellow, display: 'inline-block', padding: '0.2rem 0.9rem', marginBottom: '0.4rem', borderRadius: 3 }}>
              <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '0.9rem', fontWeight: 900, color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>WINNER BY {motivoLabel || duploLabel}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h2 style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', margin: 0, letterSpacing: -0.5, lineHeight: 1 }}>
              {nome.length > 22 ? nome.substring(0, 22) + '...' : nome}
            </h2>
            {!pesagemOk && <span style={{ background: '#ef444420', border: '1px solid #ef444440', color: C.red, fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: 3, letterSpacing: 1, flexShrink: 0 }}>⚖ PESAGEM PENDENTE</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.9rem, 1.8vw, 1.4rem)', color: C.gray, fontWeight: 900, flexShrink: 0 }}>BRA</span>
            <LogoAtleta atleta={{ academia }} size={36}/>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.9rem, 1.8vw, 1.4rem)', color: C.gray, fontWeight: 700, textTransform: 'uppercase' }}>{academia}</span>
          </div>

          {isAtivo && faseEndGame === 'normal' && (
            <div style={{ marginTop: '0.6rem' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.35rem', maxWidth: 460 }}>
                {[
                  { l: '+1', fn: () => addPlacar(idx, 'pontos', 1), cor: C.green },
                  { l: '+2', fn: () => addPlacar(idx, 'pontos', 2), cor: C.green },
                  { l: '+3', fn: () => addPlacar(idx, 'pontos', 3), cor: C.green },
                  { l: '+4', fn: () => addPlacar(idx, 'pontos', 4), cor: C.green },
                  { l: '+A', fn: () => addPlacar(idx, 'vantagens', 1), cor: '#60a5fa' },
                  { l: '+P', fn: () => addPlacar(idx, 'penalidades', 1), cor: C.red },
                  { l: '-1', fn: () => addPlacar(idx, 'pontos', -1), cor: '#f87171' },
                  { l: '-2', fn: () => addPlacar(idx, 'pontos', -2), cor: '#f87171' },
                  { l: '-3', fn: () => addPlacar(idx, 'pontos', -3), cor: '#f87171' },
                  { l: '-4', fn: () => addPlacar(idx, 'pontos', -4), cor: '#f87171' },
                  { l: '-A', fn: () => addPlacar(idx, 'vantagens', -1), cor: '#93c5fd' },
                  { l: '-P', fn: () => addPlacar(idx, 'penalidades', -1), cor: '#fca5a5' },
                ].map(({ l, fn, cor }) => (
                  <button key={l} onClick={fn} style={{ background: '#0d0d0d', border: `1px solid ${cor}40`, color: cor, fontFamily: 'Arial Black, sans-serif', fontSize: '1.1rem', fontWeight: 900, padding: '0.55rem', borderRadius: 3, cursor: 'pointer' }}>{l}</button>
                ))}
              </div>
              <button onClick={() => setAtletaAtivo(null)} style={{ marginTop: '0.35rem', background: 'none', border: '1px solid #2a2a2a', color: '#444', fontFamily: 'Arial Black, sans-serif', fontSize: '0.65rem', fontWeight: 900, padding: '0.25rem 1.2rem', borderRadius: 3, cursor: 'pointer', letterSpacing: 2 }}>FECHAR</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, paddingLeft: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#3a3a3a', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.15rem', letterSpacing: 1 }}>ADVANTAGE</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{p.vantagens}</p>
            <p style={{ color: '#3a3a3a', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', margin: '0.5rem 0 0.15rem', letterSpacing: 1 }}>PENALIDADE</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: p.penalidades > 0 ? C.red : '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{p.penalidades}</p>
          </div>
          <div style={{ background: corPlacar, width: 'clamp(100px, 14vw, 160px)', height: 'clamp(100px, 14vw, 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(5rem, 10vw, 10rem)', color: corPlacar === '#111' ? '#fff' : '#000', fontWeight: 900, margin: 0, lineHeight: 1 }}>{p.pontos}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes scrollInfo { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }`}</style>
      <div style={{ background: C.bg, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial Black, sans-serif', overflow: 'hidden' }}
        onClick={() => { if (atletaAtivo !== null) setAtletaAtivo(null); if (menuAberto) setMenuAberto(false); }}>

        {/* HEADER */}
        <div style={{ background: C.dark, padding: '0.35rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ background: '#1a1a1a', color: C.yellow, fontWeight: 900, fontSize: '1rem', padding: '0.2rem 0.6rem', borderRadius: 3 }}>{luta.numero}</span>
            <p style={{ color: '#666', fontWeight: 700, fontSize: '0.75rem', margin: 0 }}>
              {luta.chaves?.entradas?.nome} · <span style={{ color: C.yellow }}>{luta.fase}</span> · {luta.areas?.nome}
              {lutasPuladas.length > 0 && <span style={{ color: C.yellow, marginLeft: '0.5rem' }}>({lutasPuladas.length} pulada{lutasPuladas.length > 1 ? 's' : ''})</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={e => { e.stopPropagation(); window.open('/placar/tv', '_blank', 'width=1280,height=720'); setTvAberta(true); }}
              style={{ background: tvAberta ? '#1d4ed8' : C.blue, color: '#fff', border: 'none', borderRadius: 4, padding: '0.3rem 0.8rem', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
              {tvAberta ? '📺 TV' : '📺 ABRIR TV'}
            </button>
            <button onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
              style={{ background: '#1a1a1a', color: '#777', border: '1px solid #2a2a2a', borderRadius: 4, padding: '0.3rem 0.8rem', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
              {fullscreen ? '⛶ SAIR' : '⛶ FULLSCREEN'}
            </button>
          </div>
        </div>

        {/* ATLETAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderAtleta(esq, atletaEsq, C.yellow)}
          {renderAtleta(dir, atletaDir, '#0d0d0d')}
        </div>

        {/* DUPLOS */}
        {faseEndGame === 'escolha' && (
          <div style={{ background: C.dark, padding: '0.4rem 1.2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}>
            {DUPLOS.map(d => (
              <button key={d.id} onClick={() => { setDuplo(d.id); setVencedor(null); setMotivo(null); setFaseEndGame('confirmacao'); }}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', fontFamily: 'Arial Black, sans-serif', fontSize: '0.75rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: 3, cursor: 'pointer' }}>
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* RODAPÉ — TIMER */}
        <div style={{ background: C.dark, borderTop: `1px solid ${C.border}`, flexShrink: 0, position: 'relative' }}>

          {/* Menu */}
          {menuAberto && faseEndGame === 'normal' && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#0d0d0d', borderTop: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#1a1a1a', padding: 1 }}>
                {[
                  { l: 'DESFAZER ÚLTIMO MOVIMENTO', fn: desfazer, disabled: !acoes.length },
                  { l: 'TROCAR LADOS', fn: () => { setInvertido(i => !i); setMenuAberto(false); } },
                  { l: 'PULAR LUTA', fn: pularLuta },
                  { l: 'ORDEM DE LUTA DA ÁREA', fn: () => { setListando(true); setMenuAberto(false); } },
                  { l: 'END GAME', fn: () => { setRodando(false); setFaseEndGame('escolha'); setMenuAberto(false); setAtletaAtivo(null); }, destaque: true },
                ].map(({ l, fn, disabled, destaque }) => (
                  <button key={l} onClick={fn} disabled={disabled}
                    style={{ background: destaque ? '#7f1d1d' : '#0d0d0d', border: `1px solid ${destaque ? '#ef444430' : '#1a1a1a'}`, color: disabled ? '#333' : destaque ? '#fca5a5' : '#999', fontFamily: 'Arial Black, sans-serif', fontSize: '0.75rem', fontWeight: 900, padding: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', height: 80 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1.2rem', cursor: 'pointer', height: '100%' }}
              onClick={e => { e.stopPropagation(); if (faseEndGame === 'normal') setMenuAberto(m => !m); }}>
              {faseEndGame === 'normal' && (
                <p style={{ color: menuAberto ? '#555' : '#222', fontSize: '0.7rem', letterSpacing: 1, userSelect: 'none' }}>
                  {menuAberto ? '▾ FECHAR' : '▸ OPÇÕES / END GAME'}
                </p>
              )}
              {faseEndGame === 'escolha' && (
                <button onClick={e => { e.stopPropagation(); voltarEndGame(); }}
                  style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: 'Arial Black, sans-serif', fontSize: '0.7rem', fontWeight: 900, padding: '0.35rem 0.8rem', borderRadius: 3, cursor: 'pointer' }}>
                  VOLTAR
                </button>
              )}
              {faseEndGame === 'confirmacao' && (
                <div style={{ display: 'flex', gap: '0.6rem' }} onClick={e => e.stopPropagation()}>
                  <button onClick={voltarEndGame}
                    style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: 'Arial Black, sans-serif', fontSize: '0.7rem', fontWeight: 900, padding: '0.4rem 0.9rem', borderRadius: 3, cursor: 'pointer' }}>
                    VOLTAR
                  </button>
                  <button onClick={salvarResultado}
                    style={{ background: C.green, border: 'none', color: '#000', fontFamily: 'Arial Black, sans-serif', fontSize: '0.85rem', fontWeight: 900, padding: '0.5rem 1.3rem', borderRadius: 3, cursor: 'pointer' }}>
                    SALVAR
                  </button>
                </div>
              )}
            </div>

            {/* TIMER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {faseEndGame === 'normal' && (
                <>
                  {[{ l: '-30', fn: () => setTempo(t => Math.max(0, t - 30)) }, { l: '-1', fn: () => setTempo(t => Math.max(0, t - 1)) }].map(({ l, fn }) => (
                    <button key={l} onClick={e => { e.stopPropagation(); fn(); }}
                      style={{ background: '#111', border: '1px solid #222', color: '#555', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '0.7rem', padding: '0.4rem 0.5rem', borderRadius: 3, cursor: 'pointer' }}>{l}</button>
                  ))}
                </>
              )}
              <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 'clamp(3rem, 6.5vw, 5.5rem)', color: tempo <= 30 ? C.red : C.yellow, fontWeight: 900, margin: 0, letterSpacing: 4, lineHeight: 1, minWidth: 160, textAlign: 'center' }}>
                {fmt(tempo)}
              </p>
              {faseEndGame === 'normal' && (
                <>
                  <button onClick={e => { e.stopPropagation(); setRodando(r => !r); }}
                    style={{ background: rodando ? C.yellow : C.green, border: 'none', color: '#000', width: 44, height: 44, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    {rodando ? '⏸' : '▶'}
                  </button>
                  {[{ l: '+1', fn: () => setTempo(t => t + 1) }, { l: '+30', fn: () => setTempo(t => t + 30) }].map(({ l, fn }) => (
                    <button key={l} onClick={e => { e.stopPropagation(); fn(); }}
                      style={{ background: '#111', border: '1px solid #222', color: '#555', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, fontSize: '0.7rem', padding: '0.4rem 0.5rem', borderRadius: 3, cursor: 'pointer' }}>{l}</button>
                  ))}
                </>
              )}
            </div>

            <div style={{ flex: 1, padding: '0 1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '0.75rem', color: C.yellow, margin: '0 0 0.15rem', whiteSpace: 'nowrap', letterSpacing: 1 }}>{luta.fase} · {luta.areas?.nome}</p>
              <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '0.65rem', color: '#2a2a2a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {luta.chaves?.entradas?.nome}
              </p>
            </div>
          </div>
        </div>

        {/* MODAL SALVO */}
        {faseEndGame === 'salvo' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, padding: '2rem', width: 340, textAlign: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', border: `3px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>✓</div>
              <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '1.1rem', fontWeight: 900, color: '#fff', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: 2 }}>SALVO</p>
              <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.8rem', color: '#555', margin: '0 0 1.5rem' }}>
                {duplo ? duploLabel : `${nomeVencedor} — ${motivoLabel}`}
              </p>
              {lutasPuladas.length > 0 && (
                <div style={{ background: '#f5d80015', border: '1px solid #f5d80030', borderRadius: 6, padding: '0.5rem', marginBottom: '0.75rem' }}>
                  <p style={{ color: C.yellow, fontSize: '0.7rem', fontWeight: 900, letterSpacing: 1 }}>⚠ {lutasPuladas.length} LUTA(S) PULADA(S) PENDENTE(S)</p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button onClick={proximaLuta}
                  style={{ background: C.green, border: 'none', color: '#000', fontFamily: 'Arial Black, sans-serif', fontSize: '0.85rem', fontWeight: 900, padding: '0.75rem', borderRadius: 5, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {lutasPuladas.length > 0 ? '⚡ LUTA PULADA (PRIORITÁRIA)' : 'PRÓXIMA LUTA'}
                </button>
                <button onClick={() => { setListando(true); setFaseEndGame('normal'); }}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontFamily: 'Arial Black, sans-serif', fontSize: '0.85rem', fontWeight: 900, padding: '0.75rem', borderRadius: 5, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
                  ORDEM DE LUTA DA ÁREA
                </button>
                <button onClick={() => { setFaseEndGame('normal'); setVencedor(null); setMotivo(null); setDuplo(null); setAcoes([]); setTempo(luta?.chaves?.configuracao?.tempo_luta || 300); setRodando(false); setPlacar([{ pontos: 0, vantagens: 0, penalidades: 0 }, { pontos: 0, vantagens: 0, penalidades: 0 }]); }}
                  style={{ background: 'transparent', border: 'none', color: '#333', fontFamily: 'Arial Black, sans-serif', fontSize: '0.8rem', fontWeight: 900, padding: '0.5rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
                  FECHAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}