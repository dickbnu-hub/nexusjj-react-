import { supabase } from '../lib/supabase';

// ============ LISTAR EVENTOS ============
export async function listarEventos({ status, limite = 20, pagina = 0 } = {}) {
  let query = supabase
    .from('eventos')
    .select(`
      *,
      profiles:organizador_id (nome, email)
    `)
    .order('data_evento', { ascending: true })
    .range(pagina * limite, (pagina + 1) * limite - 1);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============ BUSCAR EVENTO POR ID ============
export async function buscarEvento(id) {
  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      profiles:organizador_id (nome, email, telefone)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ============ CRIAR EVENTO ============
export async function criarEvento({
  nome, descricao, dataEvento, dataFimEvento, local, cidade, estado,
  valorInscricao, organizadorId, logoUrl,
  dataInicioInscricao, dataFimInscricao,
  prazoEdicao, prazoCancelamento, prazoEstorno,
  permiteCancelamento, permiteEstorno
}) {
  const { data, error } = await supabase
    .from('eventos')
    .insert({
      organizador_id: organizadorId,
      nome, descricao,
      data_evento: dataEvento,
      data_fim_evento: dataFimEvento || null,
      logo_url: logoUrl || null,
      local, cidade, estado,
      valor_inscricao: valorInscricao,
      status: 'aberto',
      data_inicio_inscricao: dataInicioInscricao || null,
      data_fim_inscricao: dataFimInscricao || null,
      prazo_edicao: prazoEdicao || null,
      prazo_cancelamento: prazoCancelamento || null,
      prazo_estorno: prazoEstorno || null,
      permite_cancelamento: permiteCancelamento || false,
      permite_estorno: permiteEstorno || false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ ATUALIZAR EVENTO ============
export async function atualizarEvento(id, dados) {
  const { data, error } = await supabase
    .from('eventos')
    .update(dados)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ LISTAR EVENTOS DO ORGANIZADOR ============
export async function listarEventosOrganizador(organizadorId) {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('organizador_id', organizadorId)
    .order('data_evento', { ascending: false });
  if (error) throw error;
  return data;
}

// ============ INSCRIÇÕES DO EVENTO ============
export async function listarInscricoes(eventoId) {
  const { data, error } = await supabase
    .from('inscricoes')
    .select(`
      *,
      atletas:atleta_id (
        *,
        profiles:profile_id (nome, email, telefone)
      ),
      categorias_evento:categoria_id (*)
    `)
    .eq('evento_id', eventoId);
  if (error) throw error;
  return data;
}

// ============ INSCREVER ATLETA ============
export async function inscreverAtleta({ atletaId, eventoId, categoriaId }) {
  const { data, error } = await supabase
    .from('inscricoes')
    .insert({
      atleta_id: atletaId,
      evento_id: eventoId,
      categoria_id: categoriaId,
      status_pagamento: 'pendente',
      pesagem: 'pendente',
      aprovado: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ CATEGORIAS DO EVENTO ============
export async function listarCategorias(eventoId) {
  const { data, error } = await supabase
    .from('categorias_evento')
    .select('*')
    .eq('evento_id', eventoId)
    .order('nome');
  if (error) throw error;
  return data;
}

export async function criarCategoria({ eventoId, nome, tipo, sexo, faixa, idadeMin, idadeMax, pesoMin, pesoMax, pesoLabel, tempoLuta }) {
  const { data, error } = await supabase
    .from('categorias_evento')
    .insert({
      evento_id: eventoId,
      nome, tipo, sexo, faixa,
      idade_min: idadeMin,
      idade_max: idadeMax,
      peso_min: pesoMin,
      peso_max: pesoMax,
      peso_label: pesoLabel,
      tempo_luta: tempoLuta || 5,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}