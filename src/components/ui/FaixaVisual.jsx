const FAIXAS = {
  'jiu-jitsu': {
    'branca':   { cor: '#FFFFFF', borda: '#cccccc', textoCor: '#444444' },
    'cinza':    { cor: '#9E9E9E', borda: '#757575', textoCor: '#ffffff' },
    'amarela':  { cor: '#F9C923', borda: '#c9a200', textoCor: '#5a3d00' },
    'laranja':  { cor: '#F97316', borda: '#c2560a', textoCor: '#ffffff' },
    'verde':    { cor: '#22c55e', borda: '#15803d', textoCor: '#ffffff' },
    'azul':     { cor: '#3B82F6', borda: '#1d4ed8', textoCor: '#ffffff' },
    'roxa':     { cor: '#9333ea', borda: '#6b21a8', textoCor: '#ffffff' },
    'marrom':   { cor: '#92400e', borda: '#5c2400', textoCor: '#ffffff' },
    'preta':    { cor: '#111111', borda: '#000000', textoCor: '#ffffff', tipCor: '#b91c1c' },
    'coral':    { cor: '#ef4444', borda: '#b91c1c', textoCor: '#ffffff', listra: '#FFFFFF' },
    'vermelha': { cor: '#DC2626', borda: '#991b1b', textoCor: '#ffffff' },
  },
  'judo': {
    'branca':          { cor: '#FFFFFF', borda: '#cccccc', textoCor: '#444444' },
    'amarela':         { cor: '#F9C923', borda: '#c9a200', textoCor: '#5a3d00' },
    'laranja':         { cor: '#F97316', borda: '#c2560a', textoCor: '#ffffff' },
    'verde':           { cor: '#22c55e', borda: '#15803d', textoCor: '#ffffff' },
    'azul':            { cor: '#3B82F6', borda: '#1d4ed8', textoCor: '#ffffff' },
    'marrom':          { cor: '#92400e', borda: '#5c2400', textoCor: '#ffffff' },
    'preta-1':         { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
    'preta-2':         { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
    'preta-3':         { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
    'preta-4':         { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
    'preta-5':         { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
    'vermelha-branca': { cor: '#DC2626', borda: '#991b1b', textoCor: '#ffffff', listra: '#FFFFFF' },
    'vermelha':        { cor: '#DC2626', borda: '#991b1b', textoCor: '#ffffff' },
  },
  'kung-fu': {
    'sem-faixa': { cor: '#E5E7EB', borda: '#cccccc', textoCor: '#444444' },
    'amarela':   { cor: '#F9C923', borda: '#c9a200', textoCor: '#5a3d00' },
    'laranja':   { cor: '#F97316', borda: '#c2560a', textoCor: '#ffffff' },
    'verde':     { cor: '#22c55e', borda: '#15803d', textoCor: '#ffffff' },
    'azul':      { cor: '#3B82F6', borda: '#1d4ed8', textoCor: '#ffffff' },
    'roxa':      { cor: '#9333ea', borda: '#6b21a8', textoCor: '#ffffff' },
    'marrom':    { cor: '#92400e', borda: '#5c2400', textoCor: '#ffffff' },
    'preta':     { cor: '#111111', borda: '#000000', textoCor: '#ffffff' },
  },
  'mma': {
    'iniciante':    { cor: '#3B82F6', borda: '#1d4ed8', textoCor: '#ffffff' },
    'amador':       { cor: '#9333ea', borda: '#6b21a8', textoCor: '#ffffff' },
    'profissional': { cor: '#111111', borda: '#000000', textoCor: '#ffffff', tipCor: '#b91c1c' },
  },
};

export default function FaixaVisual({ modalidade, graduacao, label, width = 280, height = 70 }) {
  if (!modalidade || !graduacao) return null;
  const faixa = FAIXAS[modalidade]?.[graduacao];
  if (!faixa) return null;

  const W = width, H = height;
  const tipW = Math.round(W * 0.19);
  const r = 8;
  const mainW = W - tipW;
  const midY = H / 2;
  const stripesY = Math.round(H * 0.18);
  const stripesH = H - stripesY * 2;
  const grauW = 8, grauGap = 4, numGraus = 4;
  const totalGraus = numGraus * grauW + (numGraus - 1) * grauGap;
  const grauStartX = mainW + tipW / 2 - totalGraus / 2;
  const tipCor = faixa.tipCor || faixa.cor;
  const tipBorda = faixa.tipCor ? '#7f1d1d' : faixa.borda;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
      >
        {faixa.listra ? (
          <>
            <rect x={0} y={0} width={mainW / 2} height={H} rx={r} fill={faixa.cor} stroke={faixa.borda} strokeWidth={1.5} />
            <rect x={mainW / 2} y={0} width={mainW / 2} height={H} rx={0} fill={faixa.listra} stroke={faixa.borda} strokeWidth={1.5} />
          </>
        ) : (
          <rect x={0} y={0} width={mainW} height={H} rx={r} fill={faixa.cor} stroke={faixa.borda} strokeWidth={1.5} />
        )}
        <rect x={mainW - r} y={0} width={tipW + r} height={H} rx={r} fill={tipCor} stroke={tipBorda} strokeWidth={1.5} />
        <line x1={mainW} y1={0} x2={mainW} y2={H} stroke={faixa.borda} strokeWidth={2} />
        {Array.from({ length: numGraus }).map((_, i) => (
          <rect
            key={i}
            x={grauStartX + i * (grauW + grauGap)}
            y={stripesY}
            width={grauW}
            height={stripesH}
            rx={2}
            fill={faixa.textoCor}
            opacity={0.3}
          />
        ))}
        <text
          x={mainW / 2}
          y={midY + 5}
          textAnchor="middle"
          fontSize={Math.round(H * 0.22)}
          fontWeight="600"
          fontFamily="Inter, sans-serif"
          fill={faixa.textoCor}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}