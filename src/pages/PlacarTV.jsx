import { useState, useEffect } from 'react';

const CHANNEL_KEY = 'nexusjj_placar';

function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function LogoAtleta({ atleta, size = 52 }) {
  const nome = atleta?.time || atleta?.academia || '';
  const iniciais = nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial Black, sans-serif', fontSize: size * 0.33, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
      {iniciais}
    </div>
  );
}

export default function PlacarTV() {
  const [estado, setEstado] = useState(null);
  const [animVencedor, setAnimVencedor] = useState(false);

  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL_KEY);
      channel.onmessage = (e) => {
        const novo = e.data;
        setEstado(prev => {
          if (novo.salvo && (!prev || !prev.salvo)) setAnimVencedor(true);
          return novo;
        });
      };
    } catch {
      const poll = setInterval(() => {
        const raw = localStorage.getItem(CHANNEL_KEY);
        if (raw) {
          try {
            const novo = JSON.parse(raw);
            setEstado(prev => {
              if (novo.salvo && (!prev || !prev.salvo)) setAnimVencedor(true);
              return novo;
            });
          } catch {}
        }
      }, 200);
      return () => clearInterval(poll);
    }
    return () => channel?.close();
  }, []);

  // Tela de espera
  if (!estado) {
    return (
      <div style={{ background: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <h1 style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(5rem, 15vw, 14rem)', fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: -2 }}>
          <span style={{ color: '#2563eb' }}>N</span>
          <span style={{ color: '#fff' }}>EXUS</span>
          <span style={{ color: '#2563eb' }}>JJ</span>
        </h1>
        <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)', color: '#333', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 6, margin: 0 }}>
          Plataforma de Eventos de Artes Marciais
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
          <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, margin: 0 }}>
            Aguardando placar...
          </p>
        </div>
      </div>
    );
  }

  const { luta, placar, tempo, invertido, vencedor, motivoLabel, duplo, salvo } = estado;
  const esq = invertido ? 1 : 0;
  const dir = invertido ? 0 : 1;
  const nomes = [luta.atleta1.nome, luta.atleta2.nome];
  const academias = [luta.atleta1.academia, luta.atleta2.academia];
  const times = [luta.atleta1.time, luta.atleta2.time];
  const atletas = [luta.atleta1, luta.atleta2];
  const pEsq = placar[esq];
  const pDir = placar[dir];
  const temVencedor = salvo && (vencedor !== null || duplo !== null);

  // Tela de vencedor com animação
  if (temVencedor && vencedor !== null) {
    const nomeVencedor = nomes[vencedor];
    const academiaVencedor = times[vencedor] || academias[vencedor];
    const atletaVencedor = atletas[vencedor];
    return (
      <div style={{ background: '#1a1a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <style>{`
          @keyframes flashWhite { 0%{opacity:1} 100%{opacity:0} }
          @keyframes zoomIn { 0%{transform:scale(0.05);opacity:0} 60%{transform:scale(1.06);opacity:1} 80%{transform:scale(0.97)} 100%{transform:scale(1);opacity:1} }
          @keyframes zoomBadge { 0%{transform:scale(0) rotate(-6deg);opacity:0} 60%{transform:scale(1.1) rotate(1deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
          @keyframes fadeUp { 0%{transform:translateY(24px);opacity:0} 100%{transform:translateY(0);opacity:1} }
          @keyframes glowPulse { 0%,100%{text-shadow:0 0 40px rgba(255,255,255,0.1)} 50%{text-shadow:0 0 80px rgba(255,255,255,0.3)} }
          .flash { position:fixed;inset:0;background:#fff;z-index:100;animation:flashWhite 0.5s ease-out forwards;pointer-events:none; }
          .badge { animation:zoomBadge 0.6s cubic-bezier(0.175,0.885,0.32,1.275) 0.2s both; }
          .nome { animation:zoomIn 0.8s cubic-bezier(0.175,0.885,0.32,1.275) 0.4s both; }
          .academia { animation:fadeUp 0.5s ease-out 1s both; }
          .glow { animation:glowPulse 2s ease-in-out 1.5s infinite; }
        `}</style>
        <div className="flash" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', position: 'relative', zIndex: 1 }}>
          <div className="badge" style={{ background: '#f5d800', padding: '0.5rem 2.5rem', marginBottom: '2rem', borderRadius: 4 }}>
            <p style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(1.2rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#000', letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>
              VENCEDOR POR {motivoLabel}
            </p>
          </div>
          <div className="nome glow">
            <h1 style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(3rem, 9vw, 9rem)', fontWeight: 900, color: '#fff', letterSpacing: -2, textTransform: 'uppercase', textAlign: 'center', margin: '0 0 0.5rem', lineHeight: 0.9 }}>
              {nomeVencedor.length > 20 ? nomeVencedor.substring(0, 20) + '...' : nomeVencedor}
            </h1>
          </div>
          <div className="academia" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <LogoAtleta atleta={atletaVencedor} size={48} />
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.9rem, 2vw, 2rem)', color: '#555', textTransform: 'uppercase', fontWeight: 900, letterSpacing: 3, margin: 0 }}>
              {academiaVencedor}
            </p>
          </div>
        </div>
        <div style={{ background: '#111', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 'clamp(3rem, 7vw, 6rem)', color: '#f5d800', fontWeight: 900, margin: 0, letterSpacing: 4 }}>{fmt(tempo)}</p>
        </div>
      </div>
    );
  }

  // Tela duplo resultado
  if (temVencedor && duplo) {
    return (
      <div style={{ background: '#1a1a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#f97316', padding: '0.8rem 3rem', borderRadius: 4 }}>
          <p style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, color: '#000', letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>
            {motivoLabel}
          </p>
        </div>
      </div>
    );
  }

  // PLACAR NORMAL
  return (
    <div style={{ background: '#232323', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes scrollInfo { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Atleta 1 (Esquerdo/Azul) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', borderBottom: '3px solid #1a1a1a' }}>
        <div style={{ flex: 1, padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2.5rem)' }}>
          {/* País + Nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1vw, 1rem)', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(1rem, 2vw, 1.8rem)', color: '#666', fontWeight: 900 }}>{atletas[esq].pais}</span>
            <h1 style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 6rem)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', margin: 0, letterSpacing: -1, lineHeight: 1 }}>
              {nomes[esq].length > 22 ? nomes[esq].substring(0, 22) + '...' : nomes[esq]}
            </h1>
          </div>
          {/* Logo + Academia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.4rem, 1vw, 0.8rem)' }}>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.8rem, 1.5vw, 1.4rem)', color: '#555', fontWeight: 900 }}>{atletas[esq].pais}</span>
            <LogoAtleta atleta={atletas[esq]} size={Math.max(32, Math.min(52, window.innerWidth * 0.04))} />
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.8rem, 1.8vw, 1.6rem)', color: '#666', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(times[esq] || academias[esq]).length > 30 ? (times[esq] || academias[esq]).substring(0, 30) + '...' : (times[esq] || academias[esq])}
            </span>
          </div>
        </div>
        {/* Advantage + Penalty + Pontos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 1.5rem)', paddingRight: 'clamp(0.5rem, 2vw, 1.5rem)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: 'clamp(0.55rem, 1vw, 0.9rem)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.2rem', letterSpacing: 2 }}>ADVANTAGE</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pEsq.vantagens}</p>
            <p style={{ color: '#555', fontSize: 'clamp(0.55rem, 1vw, 0.9rem)', fontWeight: 700, textTransform: 'uppercase', margin: '0.5rem 0 0.2rem', letterSpacing: 2 }}>PENALTY</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: pEsq.penalidades > 0 ? '#ef4444' : '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pEsq.penalidades}</p>
          </div>
          <div style={{ background: '#f5d800', width: 'clamp(100px, 15vw, 220px)', height: 'clamp(100px, 15vw, 220px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(5rem, 12vw, 14rem)', color: '#000', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pEsq.pontos}</p>
          </div>
        </div>
      </div>

      {/* Atleta 2 (Direito/Preto) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, padding: 'clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1vw, 1rem)', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(1rem, 2vw, 1.8rem)', color: '#666', fontWeight: 900 }}>{atletas[dir].pais}</span>
            <h1 style={{ fontFamily: 'Impact, Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 6rem)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', margin: 0, letterSpacing: -1, lineHeight: 1 }}>
              {nomes[dir].length > 22 ? nomes[dir].substring(0, 22) + '...' : nomes[dir]}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.4rem, 1vw, 0.8rem)' }}>
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.8rem, 1.5vw, 1.4rem)', color: '#555', fontWeight: 900 }}>{atletas[dir].pais}</span>
            <LogoAtleta atleta={atletas[dir]} size={Math.max(32, Math.min(52, window.innerWidth * 0.04))} />
            <span style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.8rem, 1.8vw, 1.6rem)', color: '#666', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(times[dir] || academias[dir]).length > 30 ? (times[dir] || academias[dir]).substring(0, 30) + '...' : (times[dir] || academias[dir])}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 1.5rem)', paddingRight: 'clamp(0.5rem, 2vw, 1.5rem)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: 'clamp(0.55rem, 1vw, 0.9rem)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.2rem', letterSpacing: 2 }}>ADVANTAGE</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pDir.vantagens}</p>
            <p style={{ color: '#555', fontSize: 'clamp(0.55rem, 1vw, 0.9rem)', fontWeight: 700, textTransform: 'uppercase', margin: '0.5rem 0 0.2rem', letterSpacing: 2 }}>PENALTY</p>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: pDir.penalidades > 0 ? '#ef4444' : '#666', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pDir.penalidades}</p>
          </div>
          <div style={{ background: '#111', width: 'clamp(100px, 15vw, 220px)', height: 'clamp(100px, 15vw, 220px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(5rem, 12vw, 14rem)', color: '#fff', fontWeight: 900, margin: 0, lineHeight: 1 }}>{pDir.pontos}</p>
          </div>
        </div>
      </div>

      {/* Rodapé — info categoria + timer */}
      <div style={{ background: '#141414', borderTop: '3px solid #0d0d0d', display: 'flex', alignItems: 'center', padding: '0.75rem clamp(1rem, 3vw, 2.5rem)', gap: '1.5rem', minHeight: 'clamp(90px, 12vw, 130px)' }}>

        {/* Info categoria — lado esquerdo */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.9rem, 1.8vw, 1.5rem)', color: '#f5d800', margin: '0 0 0.3rem', fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap' }}>
            {luta.fase} · {luta.area} · {luta.id}
          </p>
          <p style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(0.75rem, 1.4vw, 1.2rem)', color: '#555', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {luta.categoria}
          </p>
        </div>

        {/* Timer — lado direito, grande */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          {estado.rodando
            ? <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
            : <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#2a2a2a' }} />
          }
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 'clamp(3.5rem, 9vw, 8rem)', color: tempo <= 30 ? '#ef4444' : '#f5d800', fontWeight: 900, margin: 0, letterSpacing: 5, lineHeight: 1 }}>
            {fmt(tempo)}
          </p>
        </div>
      </div>
    </div>
  );
}