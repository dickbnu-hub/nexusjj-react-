import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer } from 'lucide-react';

const COR_FAIXA = {
  Branca:'#ffffff', Cinza:'#b4b4b4', Amarela:'#EAD218', Laranja:'#e2871c',
  Verde:'#67C75A', Azul:'#2650FF', Roxa:'#B03BC2', Marrom:'#6F3519', Preta:'#1a1a1a'
};

function QRCode({ value, size = 80 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0a0a0a&color=ffffff&format=png`;
  return <img src={url} alt="QR Code" width={size} height={size}/>;
}

function Barcode({ value }) {
  const url = `https://barcodeapi.org/api/128/${encodeURIComponent(value)}`;
  return <img src={url} alt="Código de barras" style={{ width: '100%', height: 32, objectFit: 'contain', filter: 'invert(1)' }}/>;
}

export default function CredencialAtletaPage() {
  const { atletaId, eventoId } = useParams();
  const [dados, setDados] = useState(null);
  const [evento, setEvento] = useState(null);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { carregarDados(); }, [atletaId, eventoId]);

  const carregarDados = async () => {
    try {
      // Verifica autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErro('Faça login para acessar a credencial.'); setLoading(false); return; }

      // Verifica autorização: é o próprio atleta, organizador ou colaborador
      const [perfilRes, orgRes, colabRes] = await Promise.all([
        supabase.from('profiles').select('id').eq('id', atletaId).eq('id', user.id).single(),
        supabase.from('eventos').select('id').eq('id', eventoId).eq('organizador_id', user.id).single(),
        supabase.from('colaboradores').select('id').eq('evento_id', eventoId).eq('profile_id', user.id).eq('ativo', true).single(),
      ]);

      const ehOProprio = !!perfilRes.data;
      const ehOrganizador = !!orgRes.data;
      const ehColaborador = !!colabRes.data;

      if (!ehOProprio && !ehOrganizador && !ehColaborador) {
        setErro('Você não tem permissão para acessar esta credencial.');
        setLoading(false);
        return;
      }
      // Busca perfil
      const { data: perfil } = await supabase
        .from('profiles').select('id, nome, email, telefone, avatar_url')
        .eq('id', atletaId).single();
      if (!perfil) { setErro('Atleta não encontrado.'); return; }

      // Busca atleta
      const { data: atleta } = await supabase
        .from('atletas').select('id, faixa, academia, sexo, peso, data_nascimento, academia_id, academias:academia_id(nome, professor_id, profiles:professor_id(nome))')
        .eq('profile_id', atletaId).single();

      // Busca evento
      const { data: ev } = await supabase
        .from('eventos').select('id, nome, data_evento, data_fim_evento, local, cidade, estado, logo_url')
        .eq('id', eventoId).single();
      if (ev) setEvento(ev);

      // Busca inscrições do atleta neste evento
      const { data: inscData } = await supabase
        .from('inscricoes_entrada')
        .select('*, entradas:entrada_id(id, nome, modalidade)')
        .eq('atleta_id', atleta?.id)
        .eq('evento_id', eventoId)
        .eq('aprovado', true);

      setDados({ ...perfil, ...atleta, profile_id: atletaId });

      // Só exibe credencial se tiver pelo menos uma inscrição aprovada
      const inscAprovadas = inscData?.filter(i => i.aprovado) || [];
      if (inscAprovadas.length === 0) {
        setErro('Credencial não disponível. O atleta não está efetivado neste evento.');
        setLoading(false);
        return;
      }

      setInscricoes(inscAprovadas);
    } catch(e) {
      setErro('Erro ao carregar credencial.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <p className="text-white font-bold text-lg mb-2">Acesso não permitido</p>
        <p className="text-slate-400 text-sm mb-6">{erro}</p>
        {erro.includes('login') && (
          <a href="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all">
            Fazer Login
          </a>
        )}
      </div>
    </div>
  );

  const corFaixa = COR_FAIXA[dados?.faixa] || '#888';
  const qrUrl = `${window.location.origin}/credencial/${atletaId}/${eventoId}`;
  const codigoBarras = atletaId?.substring(0, 12).toUpperCase();
  const professor = dados?.academias?.profiles?.nome;
  const dataNasc = dados?.data_nascimento
    ? new Date(dados.data_nascimento).toLocaleDateString('pt-BR')
    : '—';
  const dataEvento = evento?.data_evento
    ? new Date(evento.data_evento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const dataFim = evento?.data_fim_evento
    ? new Date(evento.data_fim_evento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #000 !important; margin: 0; padding: 0; }
          @page { size: 85.6mm 130mm; margin: 0; }
        }
      `}</style>

      {/* Botão imprimir */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg">
          <Printer size={14}/> Imprimir Credencial
        </button>
      </div>

      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        {/* CREDENCIAL */}
        <div style={{
          width: 320,
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px #252525, 0 24px 64px rgba(0,0,0,0.9)',
          fontFamily: 'Arial, sans-serif',
        }}>

          {/* HEADER EVENTO */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1729 0%, #0d1420 100%)',
            padding: '14px 16px',
            borderBottom: '1px solid #1a2a3a',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            {evento?.logo_url ? (
              <img src={evento.logo_url} alt="Logo evento"
                style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #1a2a3a', flexShrink: 0 }}/>
            ) : (
              <div style={{ width: 48, height: 48, background: '#1a2a4a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #1a3a5a' }}>
                <span style={{ color: '#2563eb', fontWeight: 900, fontSize: 20 }}>N</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: 0, lineHeight: 1.2 }}>{evento?.nome || 'Evento'}</p>
              <p style={{ color: '#4a7ab5', fontSize: 10, margin: '3px 0 0', fontWeight: 700 }}>
                {dataEvento}{dataFim ? ` — ${dataFim}` : ''}
                {evento?.cidade ? ` · ${evento.cidade}/${evento.estado}` : ''}
              </p>
            </div>
          </div>

          {/* FAIXA COLORIDA */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${corFaixa} 0%, ${corFaixa}88 100%)` }}/>

          {/* ATLETA */}
          <div style={{ padding: '14px 16px', display: 'flex', gap: 14 }}>
            {/* Foto */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                background: '#1a1a1a', border: `2px solid ${corFaixa}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {dados?.avatar_url ? (
                  <img src={dados.avatar_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                ) : (
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#333' }}>{(dados?.nome || '?').charAt(0)}</span>
                )}
              </div>
              {/* Faixa visual */}
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 56, height: 7, borderRadius: 2, background: corFaixa, boxShadow: `0 0 8px ${corFaixa}55` }}/>
                <span style={{ color: '#555', fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>
                  {(dados?.faixa || 'BRANCA').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Dados */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 14, margin: '0 0 1px', lineHeight: 1.2, letterSpacing: -0.3 }}>
                {dados?.nome?.toUpperCase()}
              </p>
              <p style={{ color: '#4a7ab5', fontSize: 10, margin: '0 0 8px', fontWeight: 700 }}>
                {dados?.academia || 'Sem academia'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
                {[
                  { label: 'SEXO', valor: dados?.sexo || '—' },
                  { label: 'PESO', valor: dados?.peso ? `${dados.peso} kg` : '—' },
                  { label: 'NASCIMENTO', valor: dataNasc },
                  { label: 'FAIXA', valor: dados?.faixa || 'Branca' },
                ].map(i => (
                  <div key={i.label}>
                    <p style={{ color: '#333', fontSize: 8, fontWeight: 700, letterSpacing: 0.8, margin: 0 }}>{i.label}</p>
                    <p style={{ color: '#ccc', fontSize: 10, fontWeight: 700, margin: 0 }}>{i.valor}</p>
                  </div>
                ))}
              </div>
              {professor && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ color: '#333', fontSize: 8, fontWeight: 700, letterSpacing: 0.8, margin: 0 }}>PROFESSOR</p>
                  <p style={{ color: '#ccc', fontSize: 10, fontWeight: 700, margin: 0 }}>{professor}</p>
                </div>
              )}
            </div>
          </div>

          {/* CATEGORIAS INSCRITAS */}
          {inscricoes.length > 0 && (
            <div style={{ borderTop: '1px solid #1a1a1a', padding: '10px 16px' }}>
              <p style={{ color: '#333', fontSize: 8, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px' }}>
                CATEGORIA{inscricoes.length > 1 ? 'S' : ''} INSCRITA{inscricoes.length > 1 ? 'S' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inscricoes.map((insc, i) => (
                  <div key={i} style={{
                    background: '#0d0d0d', border: '1px solid #1a1a1a',
                    borderRadius: 8, padding: '5px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ color: '#ddd', fontSize: 10, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{insc.entradas?.nome}</p>
                      <p style={{ color: '#444', fontSize: 9, margin: 0 }}>{insc.entradas?.modalidade}</p>
                    </div>
                    <span style={{
                      background: insc.status_pagamento === 'pago' ? '#14532d' : '#1a1a0d',
                      color: insc.status_pagamento === 'pago' ? '#4ade80' : '#facc15',
                      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      border: `1px solid ${insc.status_pagamento === 'pago' ? '#166534' : '#422006'}`,
                    }}>
                      {insc.status_pagamento === 'pago' ? '✓ PAGO' : 'PENDENTE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR CODE + CÓDIGO DE BARRAS */}
          <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ background: '#0a0a0a', padding: 4, borderRadius: 8, border: '1px solid #1a1a1a', flexShrink: 0 }}>
                <QRCode value={qrUrl} size={72}/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#333', fontSize: 8, fontWeight: 700, letterSpacing: 0.8, margin: '0 0 2px' }}>ID DO ATLETA</p>
                <p style={{ color: '#555', fontSize: 9, fontFamily: 'monospace', margin: '0 0 6px', wordBreak: 'break-all' }}>
                  {atletaId?.substring(0, 18)}...
                </p>
                <p style={{ color: '#2a2a2a', fontSize: 8, margin: 0 }}>Escaneie para verificar</p>
              </div>
            </div>
            {/* Código de barras */}
            <div style={{ background: '#fff', borderRadius: 4, padding: '4px 8px' }}>
              <Barcode value={codigoBarras}/>
              <p style={{ color: '#666', fontSize: 8, textAlign: 'center', margin: '2px 0 0', letterSpacing: 2, fontFamily: 'monospace' }}>
                {codigoBarras}
              </p>
            </div>
          </div>

          {/* RODAPÉ */}
          <div style={{ background: '#060606', padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#1a1a1a', fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>NEXUSJJ.COM.BR</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}/>
              <span style={{ color: '#1a3a1a', fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>CREDENCIAL ATIVA</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}