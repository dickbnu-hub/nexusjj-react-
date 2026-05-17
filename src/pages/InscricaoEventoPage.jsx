import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, ChevronRight, User, Scale, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ORDEM_FAIXAS = ['Branca','Cinza','Amarela','Laranja','Verde','Azul','Roxa','Marrom','Preta'];
const COR_FAIXA = {
  Branca:'#ffffff', Cinza:'#b4b4b4', Amarela:'#EAD218', Laranja:'#e2871c',
  Verde:'#67C75A', Azul:'#2650FF', Roxa:'#B03BC2', Marrom:'#6F3519', Preta:'#252525'
};

export default function InscricaoEventoPage() {
  const { id: eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [atleta, setAtleta] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState('configurar'); // configurar | resumo | sucesso

  // Seleções do atleta
  const [faixaSelecionada, setFaixaSelecionada] = useState('');
  const [inscricoes, setInscricoes] = useState([]); // [{ entrada_id, entrada_nome, modalidade, peso_categoria, peso_min, peso_max }]
  const [inscricoesExistentes, setInscricoesExistentes] = useState([]);

  useEffect(() => { carregarDados(); }, [eventoId]);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const [eventoRes, perfilRes] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', eventoId).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      if (!eventoRes.data) { setErro('Evento não encontrado.'); setLoading(false); return; }
      setEvento(eventoRes.data);
      setPerfil(perfilRes.data);

      // Busca atleta
      const { data: atletaData } = await supabase
        .from('atletas').select('*').eq('profile_id', user.id).single();

      if (!atletaData) { setErro('Complete seu perfil de atleta antes de se inscrever.'); setLoading(false); return; }
      setAtleta(atletaData);
      setFaixaSelecionada(atletaData.faixa || '');

      // Busca entradas do evento com blocos e valores
      const { data: entradasData } = await supabase
        .from('entradas')
        .select('*, requer_entrada_id, blocos_classe(*, valores_bloco(*, regras_valor(*)))')
        .eq('evento_id', eventoId)
        .eq('ativa', true)
        .order('ordem');

      if (entradasData) setEntradas(entradasData);

      // Busca inscrições existentes
      const { data: inscExist } = await supabase
        .from('inscricoes_entrada')
        .select('*')
        .eq('atleta_id', atletaData.id)
        .eq('evento_id', eventoId);

      if (inscExist) setInscricoesExistentes(inscExist);

    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // Calcula idade do atleta
  const calcularIdade = (tipo) => {
    if (!atleta?.data_nascimento) return null;
    const nasc = new Date(atleta.data_nascimento);
    if (tipo === 'idade_ano') {
      return new Date(evento?.data_evento || Date.now()).getFullYear() - nasc.getFullYear();
    } else {
      const ref = new Date(evento?.data_evento || Date.now());
      let idade = ref.getFullYear() - nasc.getFullYear();
      if (ref.getMonth() < nasc.getMonth() || (ref.getMonth() === nasc.getMonth() && ref.getDate() < nasc.getDate())) idade--;
      return idade;
    }
  };

  // Verifica se uma regra é satisfeita
  const verificarRegra = (regra, faixa) => {
    const { coluna1, coluna2, coluna3 } = regra;
    if (coluna1 === 'genero') {
      const generoAtleta = perfil?.sexo || atleta?.sexo || '';
      if (coluna2 === 'igual') return generoAtleta === coluna3;
      if (coluna2 === 'diferente') return generoAtleta !== coluna3;
    }
    if (coluna1 === 'faixa') {
      if (coluna2 === 'igual') return faixa === coluna3;
      if (coluna2 === 'diferente') return faixa !== coluna3;
    }
    if (coluna1 === 'idade_ano' || coluna1 === 'idade_evento') {
      const idade = calcularIdade(coluna1);
      if (idade === null) return true;
      const val = parseInt(coluna3);
      if (coluna2 === 'maior_que') return idade >= val;
      if (coluna2 === 'menor_que') return idade <= val;
      if (coluna2 === 'igual') return idade === val;
      if (coluna2 === 'diferente') return idade !== val;
    }
    return true;
  };

  // Verifica se a faixa do atleta está dentro de um valor de bloco de faixa (suporta faixas[])
  const faixaMatchValor = (valor, faixaAtleta) => {
    // Se tem faixas[] preenchido, usa ele (novo sistema de grupos)
    if (valor.faixas && valor.faixas.length > 0) {
      return valor.faixas.includes(faixaAtleta);
    }
    // Fallback: usa o nome do valor (sistema antigo, faixa única)
    return valor.nome === faixaAtleta;
  };

  // Filtra pesos disponíveis para o atleta em uma entrada
  const getPesosDisponiveis = (entrada) => {
    const blocosPeso = entrada.blocos_classe?.filter(b => b.tipo === 'peso') || [];
    const generoAtleta = atleta?.sexo || perfil?.sexo || 'Masculino';
    const todos = blocosPeso.flatMap(b => b.valores_bloco || []);
    return todos.filter(v => {
      if (!v.ativo) return false;
      if (v.genero && v.genero !== 'ambos' && v.genero !== generoAtleta) return false;
      return true;
    });
  };

  // Verifica se atleta é elegível para a entrada (idade + faixa)
  const isElegivel = (entrada, faixa) => {
    const blocos = entrada.blocos_classe || [];
    const blocosFaixa = blocos.filter(b => b.tipo === 'faixa');
    const blocosOutros = blocos.filter(b => b.tipo !== 'faixa' && b.tipo !== 'peso');

    // Verifica blocos de faixa: atleta precisa estar em pelo menos um grupo
    if (blocosFaixa.length > 0) {
      const faixaOk = blocosFaixa.some(bloco =>
        (bloco.valores_bloco || []).some(v => v.ativo && faixaMatchValor(v, faixa))
      );
      if (!faixaOk) return false;
    }

    // Verifica outros blocos (idade, sexo) com regras
    for (const bloco of blocosOutros) {
      for (const valor of (bloco.valores_bloco || [])) {
        if (!valor.ativo) continue;
        const regras = valor.regras_valor || [];
        if (regras.length === 0) continue;
        const todasOk = regras.every(r => verificarRegra(r, faixa));
        if (todasOk) return true;
      }
    }

    // Se só tem bloco de faixa (sem outros blocos com regras), e faixa passou, é elegível
    if (blocosOutros.length === 0) return true;

    return false;
  };

  // Toggle seleção de entrada + peso
  const toggleInscricao = (entrada, peso) => {
    const key = entrada.id + '_' + peso.id;
    const existe = inscricoes.find(i => i.key === key);
    if (existe) {
      setInscricoes(prev => prev.filter(i => i.key !== key));
    } else {
      setInscricoes(prev => [...prev, {
        key, entrada_id: entrada.id, entrada_nome: entrada.nome,
        modalidade: entrada.modalidade, peso_categoria: peso.nome,
        peso_min: peso.peso_min, peso_max: peso.peso_max,
      }]);
    }
  };

  // Atualiza faixa — só permite upgrade
  const atualizarFaixa = async (novaFaixa) => {
    const idxAtual = ORDEM_FAIXAS.indexOf(faixaSelecionada);
    const idxNova = ORDEM_FAIXAS.indexOf(novaFaixa);
    if (idxNova < idxAtual) { setErro('Não é possível fazer downgrade de faixa.'); return; }
    setFaixaSelecionada(novaFaixa);
    setErro('');
  };

  const confirmarInscricao = async () => {
    if (inscricoes.length === 0) { setErro('Selecione pelo menos uma categoria.'); return; }
    setEtapa('resumo');
  };

  const finalizarInscricao = async () => {
    setLoading(true);
    try {
      // Atualiza faixa no perfil do atleta se mudou
      if (faixaSelecionada !== atleta.faixa) {
        await supabase.from('atletas').update({ faixa: faixaSelecionada }).eq('id', atleta.id);
      }

      // Cria inscrições
      for (const insc of inscricoes) {
        await supabase.from('inscricoes_entrada').upsert({
          atleta_id: atleta.id, evento_id: eventoId,
          entrada_id: insc.entrada_id, faixa: faixaSelecionada,
          peso_categoria: insc.peso_categoria,
          peso_valor_min: insc.peso_min, peso_valor_max: insc.peso_max,
          status_pagamento: 'pendente', aprovado: false,
        }, { onConflict: 'atleta_id,evento_id,entrada_id' });
      }

      setEtapa('sucesso');
      setTimeout(() => window.location.href = `/eventos/${eventoId}/pagamento`, 2000);
    } catch (e) {
      setErro('Erro ao finalizar inscrição: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (etapa === 'sucesso') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Inscrição realizada!</h2>
        <p className="text-slate-400">Redirecionando para o pagamento...</p>
      </div>
    </div>
  );

  const entradasElegiveis = entradas.filter(e => isElegivel(e, faixaSelecionada));

  // Verifica se o pré-requisito de uma entrada está satisfeito
  const prereqSatisfeito = (entrada) => {
    if (!entrada.requer_entrada_id) return true;
    // Já tem inscrição salva no banco
    const jaInscrito = inscricoesExistentes.some(i => i.entrada_id === entrada.requer_entrada_id);
    // Ou está selecionando agora na mesma sessão
    const selecionandoAgora = inscricoes.some(i => i.entrada_id === entrada.requer_entrada_id);
    return jaInscrito || selecionandoAgora;
  };

  // Nome da entrada pré-requisito
  const nomePrereq = (entrada) => {
    if (!entrada.requer_entrada_id) return '';
    return entradas.find(e => e.id === entrada.requer_entrada_id)?.nome || 'outra entrada';
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href={`/eventos/${eventoId}`} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center">
            <ArrowLeft size={14} className="text-slate-400" />
          </a>
          <div>
            <h1 className="text-white text-lg font-bold">Inscrição no Evento</h1>
            <p className="text-slate-500 text-xs">{evento?.nome}</p>
          </div>
        </div>

        {erro && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{erro}</p>
            <button onClick={() => setErro('')} className="ml-auto text-red-400 text-xs">✕</button>
          </div>
        )}

        {/* ETAPA: RESUMO */}
        {etapa === 'resumo' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">Confirmar Inscrição</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{perfil?.nome}</p>
                    <p className="text-slate-500 text-xs">Atleta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                  <Award size={16} className="text-slate-400 shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[faixaSelecionada] || '#888' }} />
                    <p className="text-white text-sm font-medium">Faixa {faixaSelecionada}</p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Categorias selecionadas</p>
              <div className="space-y-2 mb-5">
                {inscricoes.map(i => (
                  <div key={i.key} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{i.entrada_nome}</p>
                      <p className="text-slate-500 text-xs">{i.modalidade} · {i.peso_categoria}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${i.modalidade === 'Gi' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {i.modalidade}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEtapa('configurar')} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">
                  Voltar
                </button>
                <button onClick={finalizarInscricao} disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50">
                  {loading ? 'Confirmando...' : 'Confirmar e Pagar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA: CONFIGURAR */}
        {etapa === 'configurar' && (
          <div className="space-y-4">

            {/* Card do atleta */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Seus dados</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                  <User size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{perfil?.nome}</p>
                  <p className="text-slate-500 text-xs">
                    {atleta?.data_nascimento ? `${calcularIdade('idade_ano')} anos` : ''} · {perfil?.sexo || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Seleção de faixa */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sua Faixa</p>
                {faixaSelecionada !== atleta?.faixa && (
                  <span className="text-yellow-400 text-xs">⚠️ Atualização pendente</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ORDEM_FAIXAS.map(f => {
                  const idxAtual = ORDEM_FAIXAS.indexOf(atleta?.faixa || 'Branca');
                  const idxFaixa = ORDEM_FAIXAS.indexOf(f);
                  const bloqueada = idxFaixa < idxAtual;
                  return (
                    <button key={f} onClick={() => !bloqueada && atualizarFaixa(f)}
                      disabled={bloqueada}
                      title={bloqueada ? 'Não é possível fazer downgrade de faixa' : ''}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        faixaSelecionada === f ? 'ring-2 ring-blue-500/50 scale-105' : ''
                      } ${bloqueada ? 'opacity-25 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                      style={{
                        backgroundColor: COR_FAIXA[f] + '22',
                        borderColor: faixaSelecionada === f ? '#3b82f6' : COR_FAIXA[f] + '60'
                      }}>
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[f] }} />
                      <span style={{ color: f === 'Branca' ? '#cbd5e1' : COR_FAIXA[f] }}>{f}</span>
                    </button>
                  );
                })}
              </div>
              {faixaSelecionada !== atleta?.faixa && (
                <p className="text-yellow-400 text-xs mt-2">Ao confirmar, sua faixa será atualizada para <strong>{faixaSelecionada}</strong> no seu perfil.</p>
              )}
            </div>

            {/* Entradas disponíveis */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Categorias disponíveis para você
              </p>

              {entradasElegiveis.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nenhuma categoria disponível para o seu perfil</p>
                  <p className="text-slate-600 text-xs mt-1">Verifique sua faixa e idade</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entradasElegiveis.map(entrada => {
                    const pesos = getPesosDisponiveis(entrada);
                    const jaInscrito = inscricoesExistentes.find(i => i.entrada_id === entrada.id);
                    const prereqOk = prereqSatisfeito(entrada);

                    return (
                      <div key={entrada.id} className={`border rounded-xl overflow-hidden ${jaInscrito ? 'border-green-500/30 bg-green-500/5' : prereqOk ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}>
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/40">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${entrada.modalidade === 'Gi' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {entrada.modalidade}
                          </span>
                          <span className="text-white text-sm font-bold flex-1">{entrada.nome}</span>
                          {jaInscrito && <span className="text-green-400 text-xs font-bold">✓ Inscrito</span>}
                          {!prereqOk && <span className="text-slate-500 text-xs">🔒 Requer inscrição</span>}
                        </div>
                        {!prereqOk && (
                          <div className="px-3 py-2.5 bg-slate-800/20 border-t border-slate-700/50">
                            <p className="text-slate-500 text-xs">Para se inscrever aqui, você precisa primeiro se inscrever em <span className="text-slate-300 font-medium">{nomePrereq(entrada)}</span>.</p>
                          </div>
                        )}

                        {pesos.length === 0 ? (
                          <p className="text-slate-600 text-xs px-3 py-2">Nenhum peso disponível</p>
                        ) : (
                          <div className="px-3 py-2 flex flex-wrap gap-2">
                            {pesos.map(peso => {
                              const sel = inscricoes.find(i => i.key === entrada.id + '_' + peso.id);
                              return (
                                <button key={peso.id} onClick={() => !jaInscrito && toggleInscricao(entrada, peso)}
                                  disabled={!!jaInscrito}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    sel ? 'bg-blue-600 border-blue-500 text-white' :
                                    jaInscrito ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' :
                                    'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-white'
                                  }`}>
                                  <Scale size={11} />
                                  {peso.nome}
                                  {peso.peso_max && <span className="text-xs opacity-70">até {peso.peso_max}kg</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botão confirmar */}
            {inscricoes.length > 0 && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                <p className="text-slate-400 text-xs mb-2">{inscricoes.length} categoria{inscricoes.length > 1 ? 's' : ''} selecionada{inscricoes.length > 1 ? 's' : ''}</p>
                <button onClick={confirmarInscricao}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                  Revisar Inscrição <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}