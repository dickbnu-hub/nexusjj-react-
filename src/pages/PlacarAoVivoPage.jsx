import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function useAlternador(principal, alternativo, tempoPrincipal = 20000, tempoAlternativo = 3000) {
  const [atual, setAtual] = useState(principal);
  useEffect(() => {
    if (!alternativo) return;
    let timeout;
    const ciclo = (mostrando) => {
      const duracao = mostrando === 'principal' ? tempoPrincipal : tempoAlternativo;
      timeout = setTimeout(() => {
        setAtual(mostrando === 'principal' ? alternativo : principal);
        ciclo(mostrando === 'principal' ? 'alternativo' : 'principal');
      }, duracao);
    };
    setAtual(principal);
    ciclo('principal');
    return () => clearTimeout(timeout);
  }, [principal, alternativo]);
  return atual;
}

export default function PlacarAoVivoPage() {
  const { eventoId, areaId } = useParams();
  const [evento, setEvento] = useState(null);
  const [area, setArea] = useState(null);
  const [placar, setPlacar] = useState(null);
  const [pronto, setPronto] = useState(false);

  const nomeAtleta1 = placar?.atleta1?.nome || '—';
  const acadAtleta1 = placar?.atleta1?.academia || '';
  const textoAtleta1 = useAlternador(nomeAtleta1, acadAtleta1);

  const nomeAtleta2 = placar?.atleta2?.nome || '—';
  const acadAtleta2 = placar?.atleta2?.academia || '';
  const textoAtleta2 = useAlternador(nomeAtleta2, acadAtleta2);

  useEffect(() => {
    carregarDados();
    const channel = supabase.channel(`placar-ao-vivo-${areaId}`)
      .on('broadcast', { event: 'placar' }, ({ payload }) => { setPlacar(payload); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventoId, areaId]);

  const carregarDados = async () => {
    try {
      const [evRes, areaRes] = await Promise.all([
        supabase.from('eventos').select('id, nome, logo_url').eq('id', eventoId).single(),
        supabase.from('areas').select('id, nome').eq('id', areaId).single(),
      ]);
      if (evRes.data) setEvento(evRes.data);
      if (areaRes.data) setArea(areaRes.data);

      const { data: lutaData } = await supabase
        .from('lutas')
        .select('id, fase, area_id, atleta1_id, atleta2_id')
        .eq('area_id', areaId)
        .eq('status', 'lutando')
        .maybeSingle();

      if (lutaData) {
        const { data: ie1 } = await supabase
          .from('inscricoes_entrada')
          .select('atleta_id, atletas:atleta_id(academia, faixa, profiles:profile_id(nome))')
          .eq('id', lutaData.atleta1_id)
          .maybeSingle();
        const { data: ie2 } = await supabase
          .from('inscricoes_entrada')
          .select('atleta_id, atletas:atleta_id(academia, faixa, profiles:profile_id(nome))')
          .eq('id', lutaData.atleta2_id)
          .maybeSingle();

        setPlacar({
          atleta1: {
            nome: ie1?.atletas?.profiles?.nome || 'Atleta 1',
            academia: ie1?.atletas?.academia || '',
            faixa: ie1?.atletas?.faixa || 'Azul',
          },
          atleta2: {
            nome: ie2?.atletas?.profiles?.nome || 'Atleta 2',
            academia: ie2?.atletas?.academia || '',
            faixa: ie2?.atletas?.faixa || 'Branca',
          },
          pts1: 0, van1: 0, pen1: 0,
          pts2: 0, van2: 0, pen2: 0,
          tempo: '00:00',
          categoria: lutaData.fase || '',
          fase: lutaData.fase || '',
        });
      }
    } catch(e) { console.error('PLACAR ERROR:', e); }
    setPronto(true);
  };

  const FASES = {
    classificatoria: 'CLASSIFICATÓRIA', oitavas: 'OITAVAS DE FINAL',
    quartas: 'QUARTAS DE FINAL', semi: 'SEMIFINAL', final: 'FINAL',
  };

  const COR_FAIXA = {
    Branca:'#fff', Cinza:'#b4b4b4', Amarela:'#EAD218', Laranja:'#e2871c',
    Verde:'#67C75A', Azul:'#2650FF', Roxa:'#B03BC2', Marrom:'#6F3519', Preta:'#111'
  };

  const pts1 = placar?.pts1 ?? 0;
  const pts2 = placar?.pts2 ?? 0;
  const van1 = placar?.van1 ?? 0;
  const van2 = placar?.van2 ?? 0;
  const pen1 = placar?.pen1 ?? 0;
  const pen2 = placar?.pen2 ?? 0;
  const tempo = placar?.tempo || '00:00';
  const categoria = placar?.categoria || '';
  const fase = FASES[placar?.fase] || placar?.fase || '';
  const faixa1 = placar?.atleta1?.faixa || 'Azul';
  const faixa2 = placar?.atleta2?.faixa || 'Branca';
  const cor1 = COR_FAIXA[faixa1] || '#2650FF';
  const cor2 = COR_FAIXA[faixa2] || '#fff';
  const vencedor = placar?.vencedor;

  // Aguardando dados
  if (!pronto) return null;

  // Sem luta em andamento — thumbnail
  if (!placar) return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      fontFamily: '"Arial Black", Arial, sans-serif',
    }}>
      <div style={{
        background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
        padding: '20px 40px 30px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 6, height: 40, background: '#2563eb', borderRadius: 3, flexShrink: 0 }}/>
        <div>
          <p style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>{evento?.nome || 'NexusJJ'}</p>
          <p style={{ color: '#4a7ab5', fontSize: 13, margin: '2px 0 0', fontWeight: 700 }}>{area?.nome || 'Área'} · Aguardando luta...</p>
        </div>
      </div>
    </div>
  );

  // Placar ao vivo
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      fontFamily: '"Arial Black", Arial, sans-serif',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(4px)',
        borderTop: '2px solid rgba(255,255,255,0.06)',
      }}>
        {/* Linha principal */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: 52 }}>

          {/* ATLETA 1 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px 0 12px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            {placar?.atleta1?.logoUrl ? (
              <img src={placar.atleta1.logoUrl} alt="logo" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', marginRight: 8, flexShrink: 0 }}/>
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
                <span style={{ color: '#555', fontSize: 14, fontWeight: 900 }}>{(nomeAtleta1 || '?').charAt(0)}</span>
              </div>
            )}
            <div style={{ width: 3, height: 36, background: cor1, marginRight: 8, flexShrink: 0, borderRadius: 2 }}/>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {textoAtleta1.toUpperCase()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ color: '#a78bfa', fontSize: 10, fontWeight: 900, lineHeight: 1, background: 'rgba(167,139,250,0.1)', padding: '1px 4px', borderRadius: 3 }}>V {van1}</span>
                <span style={{ color: '#f87171', fontSize: 10, fontWeight: 900, lineHeight: 1, background: 'rgba(248,113,113,0.1)', padding: '1px 4px', borderRadius: 3 }}>P {pen1}</span>
              </div>
              <div style={{ background: pts1 > pts2 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${pts1 > pts2 ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: pts1 > pts2 ? '#4ade80' : '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{pts1}</span>
              </div>
            </div>
          </div>

          {/* CENTRO */}
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, background: '#2563eb', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>N</span>
              </div>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>Nexus<span style={{ color: '#2563eb' }}>JJ</span></span>
            </div>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2, lineHeight: 1, marginTop: 2 }}>{tempo}</span>
          </div>

          {/* ATLETA 2 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px 0 8px', borderLeft: '1px solid rgba(255,255,255,0.06)', flexDirection: 'row-reverse' }}>
            {placar?.atleta2?.logoUrl ? (
              <img src={placar.atleta2.logoUrl} alt="logo" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', marginLeft: 8, flexShrink: 0 }}/>
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 }}>
                <span style={{ color: '#555', fontSize: 14, fontWeight: 900 }}>{(nomeAtleta2 || '?').charAt(0)}</span>
              </div>
            )}
            <div style={{ width: 3, height: 36, background: cor2, marginLeft: 8, flexShrink: 0, borderRadius: 2, border: cor2 === '#fff' ? '1px solid #444' : 'none' }}/>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'right' }}>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {textoAtleta2.toUpperCase()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8, flexShrink: 0, flexDirection: 'row-reverse' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ color: '#a78bfa', fontSize: 10, fontWeight: 900, lineHeight: 1, background: 'rgba(167,139,250,0.1)', padding: '1px 4px', borderRadius: 3 }}>V {van2}</span>
                <span style={{ color: '#f87171', fontSize: 10, fontWeight: 900, lineHeight: 1, background: 'rgba(248,113,113,0.1)', padding: '1px 4px', borderRadius: 3 }}>P {pen2}</span>
              </div>
              <div style={{ background: pts2 > pts1 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${pts2 > pts1 ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: pts2 > pts1 ? '#4ade80' : '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{pts2}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha inferior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 16px', background: 'rgba(0,0,0,0.4)', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {categoria && <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{categoria.toUpperCase()}</span>}
          {categoria && fase && <span style={{ color: '#334155', fontSize: 10 }}>·</span>}
          {fase && <span style={{ color: fase === 'FINAL' ? '#fbbf24' : fase === 'SEMIFINAL' ? '#c084fc' : '#60a5fa', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{fase}</span>}
          {area && <><span style={{ color: '#334155', fontSize: 10 }}>·</span><span style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{area.nome.toUpperCase()}</span></>}
        </div>

        {/* Vencedor */}
        {vencedor && (
          <div style={{ background: 'rgba(34,197,94,0.15)', borderTop: '1px solid rgba(34,197,94,0.3)', padding: '4px 16px', textAlign: 'center' }}>
            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>
              🏆 VENCEDOR: {(vencedor === 'atleta1' ? nomeAtleta1 : nomeAtleta2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}