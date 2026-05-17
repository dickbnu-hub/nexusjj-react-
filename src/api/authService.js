import { supabase } from '../lib/supabase';

// ============ LOGIN ============
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ============ LOGOUT ============
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============ USUÁRIO ATUAL ============
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ============ PERFIL DO USUÁRIO ============
export async function getPerfil(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ============ CADASTRO ATLETA ============
export async function cadastrarAtleta({ nome, email, password, telefone, dataNascimento, faixa, sexo, peso, academia, academiaId, professorId }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password, options: { data: { nome, tipo: 'atleta' } }
  });
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('Erro ao criar usuário.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ nome, telefone, sexo })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: atletaError } = await supabase
    .from('atletas')
    .insert({
      profile_id: userId,
      faixa, sexo, peso,
      data_nascimento: dataNascimento,
      academia: academia || null,
      academia_id: academiaId || null,
      professor_id: professorId || null,
    });
  if (atletaError) throw atletaError;

  return authData;
}

// ============ CADASTRO ORGANIZADOR ============
export async function cadastrarOrganizador({ nome, email, password, telefone }) {
  console.log('cadastrarOrganizador:', { nome, email, password: password?.length, telefone });
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, tipo: 'organizador' }
    }
  });
  if (authError) throw authError;
  return authData;
}

// ============ CADASTRO PROFESSOR ============
export async function cadastrarProfessor({ nome, email, password, telefone }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, tipo: 'professor' }
    }
  });
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('Erro ao criar usuário.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ nome, telefone, tipo: 'professor' })
    .eq('id', userId);
  if (profileError) throw profileError;

  return authData;
}

// ============ RECUPERAR SENHA ============
export async function recuperarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/nova-senha`,
  });
  if (error) throw error;
}

// ============ LISTENER DE AUTH ============
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}