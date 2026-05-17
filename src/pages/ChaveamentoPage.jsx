import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Shield, Clock, ChevronRight, ArrowLeft, Tv, Users, Plus, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEMPO_FAIXA = { Branca: 5, Cinza: 5, Amarela: 5, Laranja: 5, Verde: 5, Azul: 6, Roxa: 7, Marrom: 8, Preta: 10 };

const STATUS_COR = {
  finalizada: 'border-slate-700 bg-slate-900/60',
  lutando: 'border-green-500/60 bg-green-950/20 shadow-green-500/10 shadow-md',
  proxima: 'border-yellow-500/40 bg-yellow-950/10',
  aguardando: 'border-slate-800 bg-slate-900/40',
};

const STATUS_LABEL = {
  finalizada: { txt: 'Finalizada', cor: 'text-slate-500' },
  lutando: { txt: '● AO VIVO', cor: 'text-green-400 animate-pulse' },
  proxima: { txt: 'Próxima', cor: 'text-yellow-400' },
  aguardando: { txt: 'Aguardando', cor: 'text-slate-600' },
};

const RESULTADOS = ['Por Pontos', 'Por Finalização', 'Por Vantagem', 'W.O.', 'Desclassificação'];

function CardLuta({ luta, onRegistrarResultado, isMesario }) {
  const cfg = STATUS_COR[luta.status] || STATUS_COR.aguardando;
  const label = STATUS_LABEL[luta.status] || STATUS_LABEL.aguardando;
  const [modalAberto, setModalAberto] = useState(false);
  const [vencedor, setVencedor] = useState(null);
  const [resultado, setResultado] = useState('Por Pontos');

  const a1Nome = luta.atleta1?.profiles?.nome || 'A definir';
  const a2Nome = luta.atleta2?.profiles?.nome || 'A definir';
  const a1Acad = luta.atleta1?.academia || '';
  const a2Acad = luta.atleta2?.academia || '';

  return (
    <>
      <div className={`border rounded-xl overflow-hidden transition-all ${cfg}`}>
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/50">
          <span className="text-slate-500 text-xs font-mono">#{luta.numero} · {luta.fase}</span>
          <span className={`text-xs font-bold ${label.cor}`}>{label.txt}</span>
        </div>
        <div className="p-3 space-y-2">
          {[
            { nome: a1Nome, acad: a1Acad, lado: 'Azul', venceu: luta.vencedor_id === luta.atleta1_id },
            { nome: a2Nome, acad: a2Acad, lado: 'Branco', venceu: luta.vencedor_id === luta.atleta2_id },
          ].map(({ nome, acad, lado, venceu }) => (
            <div key={lado} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${venceu ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-800/50'}`}>
              <div className={`w-3 h-3 rounded-sm shrink-0 ${lado === 'Azul' ? 'bg-blue-600' : 'bg-slate-300'}`}/>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${nome === 'A definir' ? 'text-slate-600 italic' : venceu ? 'text-yellow-300' : 'text-white'}`}>{nome}</p>
                {acad && <p className="text-slate-500 text-xs truncate">{acad}</p>}
              </div>
              {venceu && <span className="text-yellow-400 text-xs font-black shrink-0">✓</span>}
            </div>
          ))}
        </div>
        {luta.resultado && (
          <div className="px-3 pb-2">
            <p className="text-slate-500 text-xs">{luta.resultado}</p>
          </div>
        )}
        {isMesario && luta.status !== 'finalizada' && luta.atleta1_id && luta.atleta2_id && (
          <div className="px-3 pb-3 space-y-1.5">
            {luta.status !== 'aguardando' && (
              <button onClick={() => setModalAberto(true)}
                className="w-full flex items-center justify-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-all">
                <Check size={11}/> Registrar Resultado
              </button>
            )}
            {luta.status === 'aguardando' && (
              <button onClick={() => onRegistrarResultado && onRegistrarResultado(luta.id, 'proxima', null, null)}
                className="w-full flex items-center justify-center gap-1.5 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-400 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-all">
                Chamar para luta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal resultado */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Registrar Resultado</h3>
              <button onClick={() => setModalAberto(false)}><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-slate-400 text-xs mb-2">Vencedor</p>
                <div className="space-y-2">
                  {[{ id: luta.atleta1_id, nome: a1Nome, acad: a1Acad, lado: 'Azul' }, { id: luta.atleta2_id, nome: a2Nome, acad: a2Acad, lado: 'Branco' }].map(a => (
                    <button key={a.id} onClick={() => setVencedor(a.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${vencedor === a.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                      <div className={`w-3 h-3 rounded-sm shrink-0 ${a.lado === 'Azul' ? 'bg-blue-600' : 'bg-slate-300'}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{a.nome}</p>
                        <p className="text-slate-500 text-xs">{a.acad}</p>
                      </div>
                      {vencedor === a.id && <Check size={14} className="text-yellow-400 shrink-0"/>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-2">Tipo de resultado</p>
                <select value={resultado} onChange={e => setResultado(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                  {RESULTADOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalAberto(false)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">Cancelar</button>
                <button onClick={() => {
                  if (!vencedor) return;
                  onRegistrarResultado(luta.id, 'finalizada', vencedor, resultado);
                  setModalAberto(false);
                }} disabled={!vencedor}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BracketEliminacao({ lutas, fases, onRegistrarResultado, isMesario }) {
  const lutasPorFase = fases.map(fase => ({
    nome: fase,
    lutas: lutas.filter(l => l.fase === fase),
  }));

  const finalLuta = lutas.find(l => l.fase === 'Final');
  const vencedorFinal = finalLuta?.vencedor_id === finalLuta?.atleta1_id
    ? finalLuta?.atleta1?.profiles?.nome
    : finalLuta?.vencedor_id === finalLuta?.atleta2_id
    ? finalLuta?.atleta2?.profiles?.nome
    : 'A definir';

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {lutasPorFase.map((fase, fi) => (
          <div key={fi} className="flex flex-col gap-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mb-1">{fase.nome}</p>
            <div className="flex flex-col gap-3">
              {fase.lutas.map(luta => (
                <div key={luta.id} style={{ width: 240 }}>
                  <CardLuta luta={luta} onRegistrarResultado={onRegistrarResultado} isMesario={isMesario}/>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pódio */}
        <div className="flex flex-col justify-center gap-3" style={{ width: 200 }}>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mb-1">Resultado</p>
          {[
            { pos: '🥇 1º Lugar', nome: vencedorFinal, cor: 'border-yellow-500/30 bg-yellow-950/20' },
            { pos: '🥈 2º Lugar', nome: 'A definir', cor: 'border-slate-600 bg-slate-900' },
            { pos: '🥉 3º Lugar', nome: 'A definir', cor: 'border-orange-500/20 bg-orange-950/10' },
          ].map((p, i) => (
            <div key={i} className={`border rounded-xl px-3 py-3 text-center ${p.cor}`}>
              <p className="text-white text-xs font-bold">{p.pos}</p>
              <p className="text-slate-400 text-xs mt-1 truncate">{p.nome}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoundRobin({ lutas, atletas, onRegistrarResultado, isMesario }) {
  const atletasComStats = atletas.map(a => ({
    ...a,
    vitorias: lutas.filter(l => l.vencedor_id === a.id).length,
    derrotas: lutas.filter(l => (l.atleta1_id === a.id || l.atleta2_id === a.id) && l.vencedor_id && l.vencedor_id !== a.id).length,
  })).sort((a, b) => b.vitorias - a.vitorias);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-white font-semibold text-sm">Classificação</p>
        </div>
        <div className="divide-y divide-slate-800">
          {atletasComStats.map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-lg font-black w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{a.profiles?.nome}</p>
                <p className="text-slate-500 text-xs">{a.academia}</p>
              </div>
              <div className="flex gap-4 text-center text-xs">
                <div><p className="text-green-400 font-bold">{a.vitorias}</p><p className="text-slate-600">V</p></div>
                <div><p className="text-red-400 font-bold">{a.derrotas}</p><p className="text-slate-600">D</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Lutas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lutas.map(luta => (
            <CardLuta key={luta.id} luta={luta} onRegistrarResultado={onRegistrarResultado} isMesario={isMesario}/>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChaveamentoPage({ isMesario = false }) {
  const { id: eventoId } = useParams();
  const [entradas, setEntradas] = useState([]);
  const [entradaAtiva, setEntradaAtiva] = useState(null);
  const [chave, setChave] = useState(null);
  const [lutas, setLutas] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [configChaves, setConfigChaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [gerandoChave, setGerandoChave] = useState(false);

  useEffect(() => { if (eventoId) carregarEntradas(); }, [eventoId]);
  useEffect(() => { if (entradaAtiva) carregarChave(); }, [entradaAtiva]);

  const carregarEntradas = async () => {
    setLoading(true);
    try {
      const [entradasRes, configRes] = await Promise.all([
        supabase.from('entradas').select('id, nome, modalidade').eq('evento_id', eventoId).eq('ativa', true).order('ordem'),
        supabase.from('configuracoes_chaves').select('*').eq('evento_id', eventoId).single(),
      ]);
      if (configRes.data) setConfigChaves(configRes.data);
      if (entradasRes.data && entradasRes.data.length > 0) {
        setEntradas(entradasRes.data);
        setEntradaAtiva(entradasRes.data[0].id);
      }
    } catch(e) { setErro('Erro ao carregar categorias.'); }
    finally { setLoading(false); }
  };

  const carregarChave = async () => {
    setLoading(true);
    try {
      const { data: chaveData } = await supabase
        .from('chaves')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('entrada_id', entradaAtiva)
        .single();

      if (chaveData) {
        setChave(chaveData);
        const { data: lutasData } = await supabase
          .from('lutas')
          .select('*, atleta1:atleta1_id(id, academia, profiles:profile_id(nome)), atleta2:atleta2_id(id, academia, profiles:profile_id(nome))')
          .eq('chave_id', chaveData.id)
          .order('numero');
        setLutas(lutasData || []);

        // Carrega atletas para round robin
        const { data: inscData } = await supabase
          .from('inscricoes_entrada')
          .select('atletas:atleta_id(id, academia, profiles:profile_id(nome))')
          .eq('entrada_id', entradaAtiva)
          .eq('aprovado', true);
        setAtletas(inscData?.map(i => i.atletas).filter(Boolean) || []);
      } else {
        setChave(null);
        setLutas([]);
        // Carrega atletas disponíveis para gerar chave
        const { data: inscData } = await supabase
          .from('inscricoes_entrada')
          .select('atletas:atleta_id(id, academia, profiles:profile_id(nome))')
          .eq('entrada_id', entradaAtiva)
          .eq('aprovado', true);
        setAtletas(inscData?.map(i => i.atletas).filter(Boolean) || []);
      }
    } catch(e) { setErro('Erro ao carregar chave.'); }
    finally { setLoading(false); }
  };

  const gerarChave = async () => {
    if (atletas.length < 1) { setErro('Precisa de pelo menos 1 atleta efetivado.'); return; }
    setGerandoChave(true);
    try {
      const atletasSorteados = [...atletas].sort(() => Math.random() - 0.5);
      const n = atletasSorteados.length;

      // Caso especial: 1 atleta — W.O. automático
      if (n === 1) {
        await supabase.from('chaves').insert({
          evento_id: eventoId, entrada_id: entradaAtiva,
          formato: 'wo', configuracao: { total_atletas: 1 },
        });
        await supabase.from('inscricoes_entrada').update({ podio: 1 })
          .eq('atleta_id', atletasSorteados[0].id).eq('evento_id', eventoId);
        setSucesso(`${atletasSorteados[0].profiles?.nome} é campeão por W.O.! 🥇`);
        setTimeout(() => setSucesso(''), 4000);
        await carregarChave();
        setGerandoChave(false);
        return;
      }

      const formato = n === 2
        ? (configChaves?.formato_2atletas || 'simples')
        : n === 3
        ? (configChaves?.formato_3atletas || 'round_robin_repescagem')
        : (configChaves?.formato_padrao || 'eliminacao');

      // Cria chave
      const { data: novaChave } = await supabase.from('chaves').insert({
        evento_id: eventoId,
        entrada_id: entradaAtiva,
        formato,
        configuracao: { total_atletas: n },
      }).select().single();

      // Gera lutas
      const lutasParaInserir = [];
      if (formato === 'round_robin') {
        let num = 1;
        for (let i = 0; i < atletasSorteados.length; i++) {
          for (let j = i + 1; j < atletasSorteados.length; j++) {
            lutasParaInserir.push({
              chave_id: novaChave.id, evento_id: eventoId,
              fase: 'Round Robin', numero: num++,
              atleta1_id: atletasSorteados[i].id,
              atleta2_id: atletasSorteados[j].id,
              status: num === 2 ? 'proxima' : 'aguardando',
            });
          }
        }
      } else {
        // Eliminação simples — calcula fases
        let faseAtletas = atletasSorteados;
        let faseNum = 1;
        const faseNomes = ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];
        let num = 1;
        while (faseAtletas.length > 1) {
          const faseNome = faseAtletas.length <= 2 ? 'Final' : faseAtletas.length <= 4 ? 'Semifinal' : faseAtletas.length <= 8 ? 'Quartas de Final' : 'Oitavas de Final';
          for (let i = 0; i < faseAtletas.length; i += 2) {
            lutasParaInserir.push({
              chave_id: novaChave.id, evento_id: eventoId,
              fase: faseNome, numero: num++,
              atleta1_id: faseAtletas[i]?.id || null,
              atleta2_id: faseAtletas[i+1]?.id || null,
              status: num === 2 ? 'proxima' : 'aguardando',
            });
          }
          faseAtletas = faseAtletas.slice(0, Math.ceil(faseAtletas.length / 2));
        }
      }

      await supabase.from('lutas').insert(lutasParaInserir);
      setSucesso('Chave gerada com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
      await carregarChave();
    } catch(e) { setErro('Erro ao gerar chave: ' + e.message); }
    finally { setGerandoChave(false); }
  };

  const registrarResultado = async (lutaId, status, vencedorId, resultado) => {
    try {
      await supabase.from('lutas').update({ status, vencedor_id: vencedorId, resultado }).eq('id', lutaId);

      // Se finalizou, ativa a próxima luta
      if (status === 'finalizada') {
        const lutasAtualizadas = [...lutas];
        const idx = lutasAtualizadas.findIndex(l => l.id === lutaId);
        if (idx !== -1) lutasAtualizadas[idx] = { ...lutasAtualizadas[idx], status, vencedor_id: vencedorId, resultado };
        setLutas(lutasAtualizadas);

        // Ativa próxima luta aguardando
        const proxima = lutas.find(l => l.status === 'aguardando' && l.id !== lutaId);
        if (proxima) {
          await supabase.from('lutas').update({ status: 'proxima' }).eq('id', proxima.id);
          setLutas(prev => prev.map(l => l.id === proxima.id ? { ...l, status: 'proxima' } : l));
        }

        // Registra pódio se for final
        const lutaAtual = lutas.find(l => l.id === lutaId);
        if (lutaAtual?.fase === 'Final' && vencedorId) {
          await supabase.from('inscricoes_entrada').update({ podio: 1 })
            .eq('atleta_id', vencedorId).eq('evento_id', eventoId);
          const perdedorId = lutaAtual.atleta1_id === vencedorId ? lutaAtual.atleta2_id : lutaAtual.atleta1_id;
          await supabase.from('inscricoes_entrada').update({ podio: 2 })
            .eq('atleta_id', perdedorId).eq('evento_id', eventoId);
        }
        setSucesso('Resultado registrado!');
        setTimeout(() => setSucesso(''), 3000);
      } else {
        setLutas(prev => prev.map(l => l.id === lutaId ? { ...l, status } : l));
      }
    } catch(e) { setErro('Erro: ' + e.message); }
  };

  const fases = [...new Set(lutas.map(l => l.fase))];
  const entrada = entradas.find(e => e.id === entradaAtiva);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <a href={`/eventos/${eventoId}/admin`} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft size={14}/> Voltar
            </a>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400"/>
              <h1 className="text-white font-bold">Chaveamento</h1>
            </div>
          </div>
          {isMesario && (
            <a href="/placar/mesa" target="_blank"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
              <Tv size={13}/> Abrir Placar
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><Check size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Seletor de categoria */}
        {entradas.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {entradas.map(e => (
              <button key={e.id} onClick={() => setEntradaAtiva(e.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${entradaAtiva === e.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded ${e.modalidade === 'Gi' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{e.modalidade}</span>
                {e.nome}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center mb-6">
            <Trophy size={40} className="text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-semibold">Nenhuma categoria cadastrada</p>
            <p className="text-slate-500 text-sm mt-1">Configure as categorias primeiro em Configuração de Categorias.</p>
          </div>
        )}

        {/* Chave não gerada */}
        {entradas.length > 0 && !chave && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Trophy size={40} className="text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-semibold mb-1">Chave não gerada para esta categoria</p>
            <p className="text-slate-500 text-sm mb-2">{atletas.length} atleta(s) efetivado(s)</p>
            {atletas.length >= 1 ? (
              <button onClick={gerarChave} disabled={gerandoChave}
                className="mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50 transition-all mx-auto">
                <Plus size={14}/> {gerandoChave ? 'Gerando...' : atletas.length === 1 ? 'Registrar W.O. (1 atleta)' : 'Gerar Chave Automaticamente'}
              </button>
            ) : (
              <p className="text-yellow-400 text-xs mt-3">Mínimo de 2 atletas efetivados para gerar a chave.</p>
            )}
          </div>
        )}

        {/* Bracket */}
        {chave && lutas.length > 0 && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 mb-6 flex items-center gap-6 flex-wrap">
              <div><p className="text-slate-500 text-xs">Categoria</p><p className="text-white font-bold">{entrada?.nome}</p></div>
              <div><p className="text-slate-500 text-xs">Formato</p><p className="text-white font-bold">{chave.formato === 'round_robin' ? 'Round Robin' : 'Eliminação Simples'}</p></div>
              <div><p className="text-slate-500 text-xs">Atletas</p><p className="text-white font-bold flex items-center gap-1"><Users size={13} className="text-blue-400"/> {atletas.length}</p></div>
              <div><p className="text-slate-500 text-xs">Lutas</p><p className="text-white font-bold">{lutas.length}</p></div>
              <div><p className="text-slate-500 text-xs">Finalizadas</p><p className="text-green-400 font-bold">{lutas.filter(l => l.status === 'finalizada').length}</p></div>
            </div>

            {chave.formato === 'wo' && (
              <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">🥇</p>
                <p className="text-white font-black text-xl">{atletas[0]?.profiles?.nome}</p>
                <p className="text-slate-400 text-sm mt-1">{atletas[0]?.academia}</p>
                <div className="mt-4 inline-block bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold px-4 py-2 rounded-xl">
                  Campeão por W.O. — categoria com 1 atleta
                </div>
              </div>
            )}
            {chave.formato === 'eliminacao' && (
              <BracketEliminacao lutas={lutas} fases={fases} onRegistrarResultado={registrarResultado} isMesario={isMesario}/>
            )}
            {chave.formato === 'round_robin' && (
              <RoundRobin lutas={lutas} atletas={atletas} onRegistrarResultado={registrarResultado} isMesario={isMesario}/>
            )}
          </>
        )}
      </div>
    </div>
  );
}