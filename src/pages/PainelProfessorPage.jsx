import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit3, Save, X, Camera, CheckCircle, AlertCircle, Users, Award, Calendar, ChevronDown, Shield, Bell, BellOff, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ORDEM_FAIXAS = ['Branca','Cinza','Amarela','Laranja','Verde','Azul','Roxa','Marrom','Preta'];
const COR_FAIXA = {
  Branca:'#ffffff', Cinza:'#b4b4b4', Amarela:'#EAD218', Laranja:'#e2871c',
  Verde:'#67C75A', Azul:'#2650FF', Roxa:'#B03BC2', Marrom:'#6F3519', Preta:'#252525'
};

// Times carregados do banco pela NexusJJ

export default function PainelProfessorPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [academia, setAcademia] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [professoresResp, setProfessoresResp] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [subAbaResultados, setSubAbaResultados] = useState('resumo');
  const [filtroResultadoAno, setFiltroResultadoAno] = useState('');
  const [filtroResultadoAtleta, setFiltroResultadoAtleta] = useState('');
  const [filtroResultadoMedalha, setFiltroResultadoMedalha] = useState('');
  const [filtroResultadoEvento, setFiltroResultadoEvento] = useState('');
  const [verMaisResultados, setVerMaisResultados] = useState(10);
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [modalPagamentoLote, setModalPagamentoLote] = useState(null);
  const [inscricoesEvento, setInscricoesEvento] = useState([]);
  const [carregandoInscricoes, setCarregandoInscricoes] = useState(false);
  const [cupomLote, setCupomLote] = useState('');
  const [cupomValido, setCupomValido] = useState(null);
  const [modoPagamentoLote, setModoPagamentoLote] = useState('professor');
  const [etapaPagamento, setEtapaPagamento] = useState('lista');
  const [organizadorEvento, setOrganizadorEvento] = useState(null);
  const [atletaProfessor, setAtletaProfessor] = useState(null);
  const [inscricoesProfessor, setInscricoesProfessor] = useState([]);
  const [criandoAtleta, setCriandoAtleta] = useState(false);
  const [formAtletaProf, setFormAtletaProf] = useState({ faixa: 'Branca', peso: '', sexo: '' });
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('academia');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // Form academia
  const [editandoAcademia, setEditandoAcademia] = useState(false);
  const [formAcademia, setFormAcademia] = useState({ nome: '', descricao: '', cidade: '', estado: '', afiliacao: '', telefone: '', aprovacao_alunos: false });
  const [times, setTimes] = useState([]);

  // Alunos — sub-aba
  const [subAbaAlunos, setSubAbaAlunos] = useState('novo'); // novo | existente
  const [formAluno, setFormAluno] = useState({ nome: '', email: '', telefone: '', dataNascimento: '', sexo: '', faixa: 'Branca', peso: '' });
  const [buscaAluno, setBuscaAluno] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [salvandoAluno, setSalvandoAluno] = useState(false);

  // Modal graduar
  const [modalGraduar, setModalGraduar] = useState(null);

  // Modal adicionar professor
  const [modalProfessor, setModalProfessor] = useState(false);
  const [buscaProfessor, setBuscaProfessor] = useState('');
  const [resultadosProfessor, setResultadosProfessor] = useState([]);

  // Eventos — dropdown
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [dropdownEventos, setDropdownEventos] = useState(false);
  const [filtroEvento, setFiltroEvento] = useState('');

  // Modal solicitar time
  const [modalSolicitarTime, setModalSolicitarTime] = useState(false);
  const [formSolicitarTime, setFormSolicitarTime] = useState({ nomeTime: '', nomeResponsavel: '', email: '' });

  useEffect(() => { carregarDados(); }, []);
  useEffect(() => {
    supabase.from('times').select('id,nome').eq('ativo', true).order('nome').then(({ data }) => { if (data) setTimes(data); });
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: perfilData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (perfilData) {
        setPerfil(perfilData);
        setFormSolicitarTime(p => ({ ...p, nomeResponsavel: perfilData.nome || '', email: perfilData.email || '' }));
      }

      const { data: acadData } = await supabase.from('academias').select('*').eq('professor_id', user.id).single();
      if (acadData) {
        setAcademia(acadData);
        setFormAcademia({
          nome: acadData.nome || '', descricao: acadData.descricao || '',
          cidade: acadData.cidade || '', estado: acadData.estado || '',
          afiliacao: acadData.afiliacao || '', telefone: acadData.telefone || '',
          aprovacao_alunos: acadData.aprovacao_alunos || false,
        });

        const { data: alunosData } = await supabase
          .from('atletas').select('*, profiles:profile_id(nome, email, telefone, sexo)')
          .eq('academia_id', acadData.id).order('created_at', { ascending: false });
        if (alunosData) setAlunos(alunosData);

        const { data: profData } = await supabase
          .from('academia_professores').select('*, profiles:professor_id(nome, email)')
          .eq('academia_id', acadData.id);
        if (profData) setProfessoresResp(profData);
      }

      const { data: eventosData } = await supabase
        .from('eventos').select('id, nome, data_evento, cidade, estado, status')
        .eq('status', 'aberto').order('data_evento', { ascending: true });
      if (eventosData) setEventos(eventosData);

      // Carrega perfil atleta do professor
      const { data: atletaProf } = await supabase
        .from('atletas').select('*').eq('profile_id', user.id).single();
      if (atletaProf) {
        setAtletaProfessor(atletaProf);
        setFormAtletaProf({ faixa: atletaProf.faixa || 'Branca', peso: atletaProf.peso || '', sexo: atletaProf.sexo || '' });
        const { data: inscProf } = await supabase
          .from('inscricoes_entrada')
          .select('*, eventos:evento_id(id, nome, data_evento, cidade, estado), entradas:entrada_id(nome, modalidade)')
          .eq('atleta_id', atletaProf.id)
          .order('created_at', { ascending: false });
        if (inscProf) setInscricoesProfessor(inscProf);
      }

      // Carrega resultados da academia
      if (acadData) {
        const { data: resData } = await supabase
          .from('inscricoes_entrada')
          .select('*, eventos:evento_id(nome, data_evento), entradas:entrada_id(nome), atletas:atleta_id(id, profiles:profile_id(nome))')
          .in('atleta_id', (await supabase.from('atletas').select('id').eq('academia_id', acadData.id)).data?.map(a => a.id) || [])
          .not('podio', 'is', null);
        if (resData) setResultados(resData);
      }

    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const salvarAcademia = async () => {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (academia) {
        await supabase.from('academias').update({
          nome: formAcademia.nome, descricao: formAcademia.descricao,
          cidade: formAcademia.cidade, estado: formAcademia.estado,
          afiliacao: formAcademia.afiliacao, telefone: formAcademia.telefone,
          aprovacao_alunos: formAcademia.aprovacao_alunos,
        }).eq('id', academia.id);
        setAcademia(p => ({ ...p, ...formAcademia }));
      } else {
        const { data } = await supabase.from('academias').insert({
          nome: formAcademia.nome, descricao: formAcademia.descricao,
          cidade: formAcademia.cidade, estado: formAcademia.estado,
          afiliacao: formAcademia.afiliacao, telefone: formAcademia.telefone,
          aprovacao_alunos: false, professor_id: user.id,
        }).select().single();
        if (data) setAcademia(data);
      }
      setEditandoAcademia(false);
      setSucesso('Academia salva!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file || !academia) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `academias/${academia.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('academias').update({ logo_url: publicUrl }).eq('id', academia.id);
      setAcademia(p => ({ ...p, logo_url: publicUrl }));
      setSucesso('Logo atualizada!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) {
      setErro('Erro ao fazer upload: ' + e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const toggleAprovacaoAlunos = async () => {
    if (!academia) return;
    const novo = !academia.aprovacao_alunos;
    await supabase.from('academias').update({ aprovacao_alunos: novo }).eq('id', academia.id);
    setAcademia(p => ({ ...p, aprovacao_alunos: novo }));
    setSucesso(novo ? 'Aprovação ativada!' : 'Aprovação desativada!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const buscarAlunos = async (texto) => {
    setBuscaAluno(texto);
    if (texto.length < 2) { setResultadosBusca([]); return; }
    const { data } = await supabase.from('profiles').select('id, nome, email, atletas(id, faixa, academia_id)')
      .ilike('nome', `%${texto}%`).eq('tipo', 'atleta').limit(5);
    setResultadosBusca(data || []);
  };

  const vincularAluno = async (profileSelecionado) => {
    if (!academia) return;
    try {
      await supabase.from('atletas').update({ academia_id: academia.id, academia: academia.nome }).eq('profile_id', profileSelecionado.id);
      await carregarDados();
      setBuscaAluno(''); setResultadosBusca([]);
      setSucesso('Aluno vinculado!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) { setErro('Erro ao vincular: ' + e.message); }
  };

  const criarAluno = async () => {
    if (!formAluno.nome) { setErro('Nome é obrigatório.'); return; }
    setSalvandoAluno(true);
    try {
      // Gera email automático se não informado
      const nomeSlug = formAluno.nome.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
      const codigo = Math.random().toString(36).slice(-4);
      const emailFinal = formAluno.email || `${nomeSlug}.${codigo}@nexusjj.com.br`;
      const semEmailReal = !formAluno.email;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFinal,
        password: Math.random().toString(36).slice(-8) + 'Aa1!',
        options: { data: { nome: formAluno.nome, tipo: 'atleta' } }
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Erro ao criar usuário');

      await new Promise(r => setTimeout(r, 1000));
      await supabase.from('profiles').upsert({
        id: userId, nome: formAluno.nome, email: emailFinal,
        telefone: formAluno.telefone, sexo: formAluno.sexo, tipo: 'atleta',
        sem_email_real: semEmailReal,
      });
      await supabase.from('atletas').upsert({
        profile_id: userId, faixa: formAluno.faixa,
        peso: formAluno.peso ? parseFloat(formAluno.peso) : null,
        data_nascimento: formAluno.dataNascimento || null,
        sexo: formAluno.sexo, academia_id: academia?.id, academia: academia?.nome,
      });

      await carregarDados();
      setFormAluno({ nome: '', email: '', telefone: '', dataNascimento: '', sexo: '', faixa: 'Branca', peso: '' });
      setSucesso(semEmailReal
        ? `Aluno criado! Email gerado: ${emailFinal} (acesso gerenciado pelo professor)`
        : 'Aluno criado! Email de acesso enviado.');
      setTimeout(() => setSucesso(''), 5000);
    } catch (e) { setErro('Erro ao criar aluno: ' + e.message); }
    finally { setSalvandoAluno(false); }
  };

  const graduarAluno = async (atletaId, novaFaixa) => {
    const atleta = alunos.find(a => a.id === atletaId);
    if (!atleta) return;
    const idxAtual = ORDEM_FAIXAS.indexOf(atleta.faixa || 'Branca');
    const idxNova = ORDEM_FAIXAS.indexOf(novaFaixa);
    if (idxNova <= idxAtual) { setErro('Só é possível promover para faixa superior.'); return; }
    try {
      await supabase.from('atletas').update({ faixa: novaFaixa }).eq('id', atletaId);
      await supabase.from('historico_faixas').insert({ atleta_id: atletaId, faixa: novaFaixa, data_graduacao: new Date().toISOString().split('T')[0], observacao: `Graduado pelo professor ${perfil?.nome}` });
      setAlunos(prev => prev.map(a => a.id === atletaId ? { ...a, faixa: novaFaixa } : a));
      setModalGraduar(null);
      setSucesso(`${atleta.profiles?.nome} graduado para Faixa ${novaFaixa}!`);
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) { setErro('Erro ao graduar: ' + e.message); }
  };

  const criarAtletaProfessor = async () => {
    if (!formAtletaProf.sexo) { setErro('Selecione o sexo.'); return; }
    setCriandoAtleta(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('atletas').insert({
        profile_id: user.id,
        faixa: formAtletaProf.faixa,
        peso: formAtletaProf.peso ? parseFloat(formAtletaProf.peso) : null,
        sexo: formAtletaProf.sexo,
        academia_id: academia?.id,
        academia: academia?.nome,
      }).select().single();
      if (data) setAtletaProfessor(data);
      setSucesso('Perfil de atleta criado! Agora você pode se inscrever em eventos.');
      setTimeout(() => setSucesso(''), 3000);
    } catch(e) { setErro('Erro: ' + e.message); }
    finally { setCriandoAtleta(false); }
  };

  const carregarInscricoesEvento = async (evId) => {
    if (!academia || !evId) return;
    setCarregandoInscricoes(true);
    setAlunosSelecionados([]);
    setCupomLote('');
    setCupomValido(null);
    setEtapaPagamento('lista');
    try {
      const idsAlunos = alunos.map(a => a.id);
      if (idsAlunos.length === 0) { setInscricoesEvento([]); return; }
      const { data } = await supabase
        .from('inscricoes_entrada')
        .select('*, entradas:entrada_id(nome, modalidade), atletas:atleta_id(id, profiles:profile_id(nome))')
        .eq('evento_id', evId)
        .in('atleta_id', idsAlunos);
      setInscricoesEvento(data || []);

      // Busca organizador do evento para WhatsApp
      const { data: evData } = await supabase
        .from('eventos').select('valor_inscricao, profiles:organizador_id(nome, telefone)').eq('id', evId).single();
      if (evData) setOrganizadorEvento(evData);
    } catch(e) { console.error(e); }
    finally { setCarregandoInscricoes(false); }
  };

  const buscarCupom = async () => {
    if (!cupomLote.trim() || !eventoSelecionado) return;
    const { data } = await supabase
      .from('cupons').select('*, cupons_eventos!inner(evento_id)')
      .eq('codigo', cupomLote.toUpperCase())
      .eq('cupons_eventos.evento_id', eventoSelecionado)
      .eq('ativo', true)
      .single();
    if (data) {
      setCupomValido(data);
      setSucesso(`Cupom aplicado! ${data.tipo === 'percentual' ? data.valor + '%' : 'R$ ' + data.valor} de desconto.`);
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setCupomValido(null);
      setErro('Cupom inválido ou não disponível para este evento.');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const buscarProfessores = async (texto) => {
    setBuscaProfessor(texto);
    if (texto.length < 2) { setResultadosProfessor([]); return; }
    const { data } = await supabase.from('profiles').select('id, nome, email').ilike('nome', `%${texto}%`).eq('tipo', 'professor').limit(5);
    setResultadosProfessor(data || []);
  };

  const adicionarProfessorResp = async (prof) => {
    if (!academia) return;
    if (professoresResp.length >= 3) { setErro('Máximo de 3 professores responsáveis.'); return; }
    try {
      await supabase.from('academia_professores').insert({ academia_id: academia.id, professor_id: prof.id });
      setProfessoresResp(prev => [...prev, { professor_id: prof.id, profiles: { nome: prof.nome, email: prof.email } }]);
      setModalProfessor(false); setBuscaProfessor('');
      setSucesso('Professor adicionado!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) { setErro('Erro: ' + e.message); }
  };

  const enviarSolicitacaoTime = () => {
    const { nomeTime, nomeResponsavel, email } = formSolicitarTime;
    if (!nomeTime || !email) { setErro('Preencha o nome do time e seu email.'); return; }
    const subject = encodeURIComponent(`Solicitação de cadastro de Time/Afiliação: ${nomeTime}`);
    const body = encodeURIComponent(
      `Olá equipe NexusJJ!\n\nGostaria de solicitar o cadastro do seguinte time/afiliação:\n\n` +
      `Nome do Time: ${nomeTime}\nSolicitante: ${nomeResponsavel}\nEmail: ${email}\n\n` +
      `Por favor, entrem em contato para envio da logo do time.\n\nObrigado!`
    );
    window.open(`mailto:suporte@nexusjj.com.br?subject=${subject}&body=${body}`);
    setModalSolicitarTime(false);
    setSucesso('Email de solicitação aberto! Aguarde o cadastro pela equipe NexusJJ.');
    setTimeout(() => setSucesso(''), 5000);
  };

  const eventosFiltrados = eventos.filter(e => e.nome.toLowerCase().includes(filtroEvento.toLowerCase()) || e.cidade?.toLowerCase().includes(filtroEvento.toLowerCase()));
  const eventoSel = eventos.find(e => e.id === eventoSelecionado);

  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl border-2 border-blue-500/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                {academia?.logo_url ? <img src={academia.logo_url} className="w-full h-full object-cover" alt="logo"/> : <Shield size={28} className="text-blue-400"/>}
              </div>
              {academia && (
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all border-2 border-slate-900">
                  {uploadingLogo ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : <Camera size={11} className="text-white"/>}
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden"/>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl">{academia?.nome || 'Minha Academia'}</h1>
              <p className="text-slate-400 text-sm">{perfil?.nome} · Professor</p>
              {academia?.afiliacao && <p className="text-blue-400 text-xs mt-0.5">{academia.afiliacao}</p>}
              {academia?.cidade && <p className="text-slate-500 text-xs">{academia.cidade}/{academia.estado}</p>}
            </div>
            <div className="text-center bg-slate-800 rounded-xl px-4 py-2 shrink-0">
              <p className="text-white font-black text-xl">{alunos.length}</p>
              <p className="text-slate-500 text-xs">alunos</p>
            </div>
          </div>
        </div>

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Abas */}
        <div className="flex gap-2 mb-5">
          {[{ id:'academia', label:'Academia' }, { id:'alunos', label:`Alunos (${alunos.length})` }, { id:'eventos', label:'Inscrever em Evento' }, { id:'resultados', label:'Resultados' }, { id:'minha', label:'Minha Inscrição' }].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${aba === a.id ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ABA ACADEMIA */}
        {aba === 'academia' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Dados da Academia</h3>
                {!editandoAcademia ? (
                  <button onClick={() => setEditandoAcademia(true)} className="flex items-center gap-1.5 text-blue-400 text-sm"><Edit3 size={14}/> Editar</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditandoAcademia(false)} className="text-slate-500 text-sm flex items-center gap-1"><X size={14}/> Cancelar</button>
                    <button onClick={salvarAcademia} disabled={salvando} className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
                      <Save size={14}/> {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>

              {editandoAcademia ? (
                <div className="space-y-3">
                  <div><label className="text-slate-400 text-xs mb-1.5 block">Nome da Academia *</label><input value={formAcademia.nome} onChange={e => setFormAcademia(p => ({ ...p, nome: e.target.value }))} className={ic}/></div>
                  <div><label className="text-slate-400 text-xs mb-1.5 block">Telefone</label><input value={formAcademia.telefone} onChange={e => setFormAcademia(p => ({ ...p, telefone: e.target.value }))} placeholder="(47) 99999-9999" className={ic}/></div>
                  <div><label className="text-slate-400 text-xs mb-1.5 block">Descrição</label><textarea value={formAcademia.descricao} onChange={e => setFormAcademia(p => ({ ...p, descricao: e.target.value }))} rows={3} className={ic + ' resize-none'}/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-slate-400 text-xs mb-1.5 block">Cidade</label><input value={formAcademia.cidade} onChange={e => setFormAcademia(p => ({ ...p, cidade: e.target.value }))} className={ic}/></div>
                    <div><label className="text-slate-400 text-xs mb-1.5 block">Estado</label><input value={formAcademia.estado} onChange={e => setFormAcademia(p => ({ ...p, estado: e.target.value }))} maxLength={2} className={ic}/></div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Afiliação / Time</label>
                    <select value={formAcademia.afiliacao} onChange={e => setFormAcademia(p => ({ ...p, afiliacao: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                      <option value="">Selecione o time...</option>
                      {times.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>
                    <button type="button" onClick={() => setModalSolicitarTime(true)}
                      className="mt-2 flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                      <Mail size={12}/> Não encontrou seu time? Solicitar cadastro à NexusJJ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'Nome', valor: academia?.nome, icon: null },
                    { label: 'Telefone', valor: academia?.telefone },
                    { label: 'Descrição', valor: academia?.descricao },
                    { label: 'Cidade', valor: academia?.cidade && `${academia.cidade}/${academia.estado}` },
                    { label: 'Afiliação', valor: academia?.afiliacao },
                  ].filter(i => i.valor).map(item => (
                    <div key={item.label} className="flex items-start justify-between bg-slate-800 rounded-xl px-4 py-3">
                      <p className="text-slate-500 text-sm shrink-0 mr-4">{item.label}</p>
                      <p className="text-white text-sm font-medium text-right">{item.valor}</p>
                    </div>
                  ))}
                  {!academia && <p className="text-slate-500 text-sm text-center py-4">Nenhuma academia cadastrada. Clique em Editar para criar.</p>}
                </div>
              )}
            </div>

            {/* Toggle aprovação */}
            {academia && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      {academia.aprovacao_alunos ? <Bell size={16} className="text-blue-400"/> : <BellOff size={16} className="text-slate-500"/>}
                      Aprovação de alunos
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {academia.aprovacao_alunos ? 'Você receberá alertas quando um atleta se registrar com sua academia' : 'Alunos vinculados automaticamente sem aprovação'}
                    </p>
                  </div>
                  <button onClick={toggleAprovacaoAlunos}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${academia.aprovacao_alunos ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    {academia.aprovacao_alunos ? 'Ativado' : 'Desativado'}
                  </button>
                </div>
              </div>
            )}

            {/* Professores responsáveis */}
            {academia && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-sm">Professores Responsáveis ({professoresResp.length}/3)</h3>
                  {professoresResp.length < 3 && (
                    <button onClick={() => setModalProfessor(true)}
                      className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      <Plus size={12}/> Adicionar
                    </button>
                  )}
                </div>
                {professoresResp.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-3">Nenhum professor responsável</p>
                ) : (
                  <div className="space-y-2">
                    {professoresResp.map(p => (
                      <div key={p.professor_id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">{p.profiles?.nome?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{p.profiles?.nome}</p>
                          <p className="text-slate-500 text-xs">{p.profiles?.email}</p>
                        </div>
                        <button onClick={() => { if(window.confirm('Remover este professor?')) { supabase.from('academia_professores').delete().eq('academia_id', academia.id).eq('professor_id', p.professor_id).then(() => setProfessoresResp(prev => prev.filter(x => x.professor_id !== p.professor_id))); } }}
                          className="text-slate-600 hover:text-red-400 transition-colors"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA ALUNOS */}
        {aba === 'alunos' && (
          <div className="space-y-4">
            {/* Sub-abas */}
            <div className="flex gap-2">
              {[{ id:'novo', label:'Aluno Novo' }, { id:'existente', label:'Aluno Existente' }].map(s => (
                <button key={s.id} onClick={() => setSubAbaAlunos(s.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${subAbaAlunos === s.id ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Novo aluno */}
            {subAbaAlunos === 'novo' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-white font-bold mb-2">Cadastrar Novo Aluno</h3>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Nome *</label><input value={formAluno.nome} onChange={e => setFormAluno(p => ({ ...p, nome: e.target.value }))} className={ic}/></div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Email <span className="text-slate-600">(opcional — se não informado, um email será gerado automaticamente)</span></label>
                  <input type="email" value={formAluno.email} onChange={e => setFormAluno(p => ({ ...p, email: e.target.value }))} placeholder="Deixe em branco para gerar automaticamente" className={ic}/>
                </div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Telefone</label><input value={formAluno.telefone} onChange={e => setFormAluno(p => ({ ...p, telefone: e.target.value }))} className={ic}/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-slate-400 text-xs mb-1.5 block">Nascimento</label><input type="date" value={formAluno.dataNascimento} onChange={e => setFormAluno(p => ({ ...p, dataNascimento: e.target.value }))} className={ic}/></div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Sexo</label>
                    <div className="flex gap-2">
                      {['Masculino','Feminino'].map(s => (
                        <button key={s} type="button" onClick={() => setFormAluno(p => ({ ...p, sexo: s }))}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${formAluno.sexo === s ? s === 'Masculino' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {s === 'Masculino' ? '♂' : '♀'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Peso (kg)</label><input type="number" value={formAluno.peso} onChange={e => setFormAluno(p => ({ ...p, peso: e.target.value }))} className={ic}/></div>
                <div>
                  <label className="text-slate-400 text-xs mb-2 block">Faixa</label>
                  <div className="flex flex-wrap gap-2">
                    {ORDEM_FAIXAS.map(f => (
                      <button key={f} type="button" onClick={() => setFormAluno(p => ({ ...p, faixa: f }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formAluno.faixa === f ? 'ring-2 ring-blue-500/50 scale-105' : ''}`}
                        style={{ backgroundColor: COR_FAIXA[f] + '22', borderColor: formAluno.faixa === f ? '#3b82f6' : COR_FAIXA[f] + '60' }}>
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[f] }}/>
                        <span style={{ color: f === 'Branca' ? '#cbd5e1' : COR_FAIXA[f] }}>{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={criarAluno} disabled={salvandoAluno}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all mt-2">
                  {salvandoAluno ? 'Criando...' : '+ Criar Aluno'}
                </button>
              </div>
            )}

            {/* Aluno existente */}
            {subAbaAlunos === 'existente' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-white font-bold mb-3">Vincular Atleta Existente</h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3.5 text-slate-500"/>
                    <input value={buscaAluno} onChange={e => buscarAlunos(e.target.value)}
                      placeholder="Buscar atleta pelo nome..." className={ic + ' pl-9'}/>
                    {resultadosBusca.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-10 shadow-xl">
                        {resultadosBusca.map(r => (
                          <button key={r.id} onClick={() => vincularAluno(r)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0">
                            <p className="text-white text-sm font-medium">{r.nome}</p>
                            <p className="text-slate-500 text-xs">{r.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de alunos */}
                <div className="space-y-2">
                  {alunos.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
                      <Users size={36} className="text-slate-700 mx-auto mb-3"/>
                      <p className="text-slate-500 text-sm">Nenhum aluno ainda</p>
                    </div>
                  ) : alunos.map(aluno => (
                    <div key={aluno.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold shrink-0">
                          {(aluno.profiles?.nome || 'A').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{aluno.profiles?.nome || '—'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[aluno.faixa] || '#888' }}/>
                              <span className="text-slate-400 text-xs">Faixa {aluno.faixa || 'Branca'}</span>
                            </div>
                            {aluno.peso && <span className="text-slate-500 text-xs">{aluno.peso}kg</span>}
                          </div>
                        </div>
                        <button onClick={() => setModalGraduar(aluno)}
                          className="flex items-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0">
                          <Award size={12}/> Graduar
                        </button>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: COR_FAIXA[aluno.faixa] || '#888', boxShadow: `0 0 6px ${COR_FAIXA[aluno.faixa]}44` }}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA EVENTOS */}
        {aba === 'eventos' && (
          <div className="space-y-4">
            {/* Dropdown de eventos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3">Selecionar Evento</h3>
              <div className="relative">
                <button onClick={() => setDropdownEventos(d => !d)}
                  className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm">
                  <span>{eventoSel ? eventoSel.nome : 'Selecione um evento...'}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownEventos ? 'rotate-180' : ''}`}/>
                </button>
                {dropdownEventos && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
                    <div className="p-2 border-b border-slate-700">
                      <input value={filtroEvento} onChange={e => setFiltroEvento(e.target.value)}
                        placeholder="Filtrar eventos..." autoFocus
                        className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {eventosFiltrados.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhum evento encontrado</p>
                      ) : eventosFiltrados.map(ev => (
                        <button key={ev.id} onClick={() => { setEventoSelecionado(ev.id); setDropdownEventos(false); setFiltroEvento(''); carregarInscricoesEvento(ev.id); }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 transition-colors ${eventoSelecionado === ev.id ? 'bg-blue-600/20' : ''}`}>
                          <p className="text-white text-sm font-medium">{ev.nome}</p>
                          <p className="text-slate-500 text-xs">{new Date(ev.data_evento).toLocaleDateString('pt-BR')} · {ev.cidade}/{ev.estado}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {eventoSel && (
                <div className="mt-4 space-y-3">
                  <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-white font-bold text-sm">{eventoSel.nome}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{new Date(eventoSel.data_evento).toLocaleDateString('pt-BR')} · {eventoSel.cidade}/{eventoSel.estado}</p>
                    <button onClick={() => navigate(`/eventos/${eventoSel.id}/inscricao`)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                      <Plus size={14}/> Inscrever Aluno neste Evento
                    </button>
                  </div>

                  {/* Inscrições dos alunos neste evento */}
                  {carregandoInscricoes ? (
                    <div className="text-center py-4"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>
                  ) : inscricoesEvento.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                        <p className="text-white font-bold text-sm">Inscrições dos seus alunos ({inscricoesEvento.length})</p>
                        <button onClick={() => setAlunosSelecionados(
                          alunosSelecionados.length === inscricoesEvento.filter(i => i.status_pagamento === 'pendente').length
                            ? [] : inscricoesEvento.filter(i => i.status_pagamento === 'pendente').map(i => i.id)
                        )} className="text-blue-400 text-xs hover:text-blue-300">
                          {alunosSelecionados.length === inscricoesEvento.filter(i => i.status_pagamento === 'pendente').length ? 'Desmarcar todos' : 'Selecionar pendentes'}
                        </button>
                      </div>

                      {etapaPagamento === 'lista' && (
                        <>
                          <div className="divide-y divide-slate-800/50">
                            {inscricoesEvento.map(insc => {
                              const pendente = insc.status_pagamento === 'pendente';
                              const selecionado = alunosSelecionados.includes(insc.id);
                              return (
                                <div key={insc.id} className={`flex items-center gap-3 px-4 py-3 ${selecionado ? 'bg-blue-500/5' : ''}`}>
                                  {pendente ? (
                                    <input type="checkbox" checked={selecionado}
                                      onChange={() => setAlunosSelecionados(prev => selecionado ? prev.filter(i => i !== insc.id) : [...prev, insc.id])}
                                      className="w-4 h-4 accent-blue-500 shrink-0"/>
                                  ) : <div className="w-4 h-4 shrink-0"/>}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{insc.atletas?.profiles?.nome}</p>
                                    <p className="text-slate-500 text-xs truncate">{insc.entradas?.nome} · Faixa {insc.faixa}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${insc.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-400 border-green-500/20' : insc.status_pagamento === 'cancelado' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {insc.status_pagamento === 'pago' ? 'Pago' : insc.status_pagamento === 'cancelado' ? 'Cancelado' : 'Pendente'}
                                  </span>
                                  {insc.aprovado && (
                                    <button onClick={() => window.open(`/credencial/${insc.atletas?.profile_id}/${eventoSelecionado}`, '_blank')}
                                      className="text-xs bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white font-bold px-2 py-1 rounded-lg transition-all shrink-0">
                                      🪪
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {alunosSelecionados.length > 0 && (
                            <div className="p-4 border-t border-slate-800 space-y-3">
                              {/* Cupom */}
                              <div className="flex gap-2">
                                <input value={cupomLote} onChange={e => setCupomLote(e.target.value.toUpperCase())}
                                  placeholder="Cupom de desconto (opcional)"
                                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                <button onClick={buscarCupom} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 rounded-xl text-sm transition-all">
                                  Aplicar
                                </button>
                              </div>
                              {cupomValido && (
                                <div className="bg-green-950/30 border border-green-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
                                  <p className="text-green-400 text-xs">✅ Cupom {cupomValido.codigo} aplicado — {cupomValido.tipo === 'percentual' ? cupomValido.valor + '%' : 'R$ ' + cupomValido.valor} de desconto</p>
                                  <button onClick={() => { setCupomValido(null); setCupomLote(''); }} className="text-slate-500 hover:text-red-400"><X size={12}/></button>
                                </div>
                              )}

                              {/* Total */}
                              {(() => {
                                const valorUnit = organizadorEvento?.valor_inscricao || 0;
                                const subtotal = alunosSelecionados.length * valorUnit;
                                const desconto = cupomValido ? (cupomValido.tipo === 'percentual' ? subtotal * cupomValido.valor / 100 : cupomValido.valor) : 0;
                                const total = Math.max(0, subtotal - desconto);
                                return (
                                  <div className="bg-slate-800 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-slate-400"><span>{alunosSelecionados.length} atleta(s) × R$ {valorUnit.toFixed(2)}</span><span>R$ {subtotal.toFixed(2)}</span></div>
                                    {desconto > 0 && <div className="flex justify-between text-green-400"><span>Desconto</span><span>- R$ {desconto.toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-white font-bold border-t border-slate-700 pt-1.5"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                                  </div>
                                );
                              })()}

                              {/* Modo de pagamento */}
                              <div className="grid grid-cols-2 gap-2">
                                {[{ id:'professor', label:'Eu pago tudo', desc:'PIX único com total' }, { id:'atleta', label:'Cada atleta paga', desc:'Cada um paga separado' }].map(m => (
                                  <button key={m.id} onClick={() => setModoPagamentoLote(m.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${modoPagamentoLote === m.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                    <p className={`text-sm font-bold ${modoPagamentoLote === m.id ? 'text-blue-400' : 'text-white'}`}>{m.label}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{m.desc}</p>
                                  </button>
                                ))}
                              </div>

                              <button onClick={() => {
                                if (modoPagamentoLote === 'atleta') {
                                  setSucesso(`${alunosSelecionados.length} atleta(s) notificados para pagar individualmente!`);
                                  setTimeout(() => setSucesso(''), 3000);
                                  setAlunosSelecionados([]);
                                } else {
                                  setEtapaPagamento('pagamento');
                                }
                              }} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                                {modoPagamentoLote === 'professor' ? '💳 Pagar agora' : '📲 Notificar atletas'}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {etapaPagamento === 'pagamento' && (() => {
                        const valorUnit = organizadorEvento?.valor_inscricao || 0;
                        const subtotal = alunosSelecionados.length * valorUnit;
                        const desconto = cupomValido ? (cupomValido.tipo === 'percentual' ? subtotal * cupomValido.valor / 100 : cupomValido.valor) : 0;
                        const total = Math.max(0, subtotal - desconto);
                        const tel = (organizadorEvento?.profiles?.telefone || '').replace(/\D/g, '');
                        const nomes = inscricoesEvento.filter(i => alunosSelecionados.includes(i.id)).map(i => `• ${i.atletas?.profiles?.nome} — ${i.entradas?.nome}`).join('\n');
                        const msg = encodeURIComponent(`Olá! Sou professor e estou pagando as inscrições de meus atletas no evento *${eventoSel?.nome}*.\n\n📋 *Atletas:*\n${nomes}\n\n💰 *Total:* R$ ${total.toFixed(2)}${cupomValido ? `\n🎟️ Cupom: ${cupomValido.codigo}` : ''}\n\nSegue o comprovante em anexo.`);
                        return (
                          <div className="p-4 border-t border-slate-800 space-y-3">
                            <div className="bg-slate-800 rounded-xl px-4 py-3 space-y-1 text-sm">
                              <div className="flex justify-between text-slate-400"><span>Atletas selecionados</span><span>{alunosSelecionados.length}</span></div>
                              <div className="flex justify-between text-white font-bold"><span>Total a pagar</span><span>R$ {total.toFixed(2)}</span></div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                              <p className="text-slate-400 text-xs mb-1.5">Chave PIX</p>
                              <p className="text-white text-sm font-mono">pagamentos@nexusjj.com.br</p>
                            </div>
                            <div className="bg-yellow-950/40 border border-yellow-500/20 rounded-xl px-4 py-3">
                              <p className="text-yellow-300 text-xs">⚠️ Após pagar, envie o comprovante ao organizador via WhatsApp para efetivar seus atletas.</p>
                            </div>
                            {tel && (
                              <button onClick={() => { window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank'); setEtapaPagamento('aguardando'); }}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                                ✅ Já paguei — enviar comprovante via WhatsApp
                              </button>
                            )}
                            <button onClick={() => setEtapaPagamento('lista')} className="w-full bg-slate-800 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm">
                              Voltar
                            </button>
                          </div>
                        );
                      })()}

                      {etapaPagamento === 'aguardando' && (
                        <div className="p-4 border-t border-slate-800 text-center">
                          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⏳</span>
                          </div>
                          <p className="text-white font-bold mb-1">Aguardando confirmação</p>
                          <p className="text-slate-400 text-sm mb-4">O organizador validará o comprovante e efetivará seus atletas.</p>
                          <button onClick={() => { setEtapaPagamento('lista'); setAlunosSelecionados([]); }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                            Voltar para lista
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA RESULTADOS */}
        {aba === 'resultados' && (() => {
          // Anos disponíveis
          const anos = [...new Set(resultados.map(r => r.eventos?.data_evento ? new Date(r.eventos.data_evento).getFullYear() : null).filter(Boolean))].sort((a,b) => b-a);
          // Eventos disponíveis
          const eventosRes = [...new Map(resultados.map(r => [r.evento_id, r.eventos?.nome])).entries()].filter(([,v]) => v);
          // Atletas disponíveis
          const atletasRes = [...new Map(resultados.map(r => [r.atleta_id, r.atletas?.profiles?.nome])).entries()].filter(([,v]) => v);

          // Filtra resultados
          const resFiltrados = resultados.filter(r => {
            const ano = r.eventos?.data_evento ? new Date(r.eventos.data_evento).getFullYear().toString() : '';
            if (filtroResultadoAno && ano !== filtroResultadoAno) return false;
            if (filtroResultadoAtleta && r.atleta_id !== filtroResultadoAtleta) return false;
            if (filtroResultadoMedalha && r.podio !== parseInt(filtroResultadoMedalha)) return false;
            if (filtroResultadoEvento && r.evento_id !== filtroResultadoEvento) return false;
            return true;
          });

          const temFiltro = filtroResultadoAno || filtroResultadoAtleta || filtroResultadoMedalha || filtroResultadoEvento;

          return (
          <div className="space-y-4">
            {/* Sub-abas */}
            <div className="flex gap-2">
              {[{ id:'resumo', label:'Resumo' }, { id:'eventos', label:'Por Evento' }, { id:'atletas', label:'Por Atleta' }].map(s => (
                <button key={s.id} onClick={() => setSubAbaResultados(s.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${subAbaResultados === s.id ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex gap-2 flex-wrap">
                <select value={filtroResultadoAno} onChange={e => setFiltroResultadoAno(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                  <option value="">Todos os anos</option>
                  {anos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filtroResultadoEvento} onChange={e => setFiltroResultadoEvento(e.target.value)}
                  className="flex-1 min-w-32 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                  <option value="">Todos os eventos</option>
                  {eventosRes.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select>
                <select value={filtroResultadoAtleta} onChange={e => setFiltroResultadoAtleta(e.target.value)}
                  className="flex-1 min-w-32 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                  <option value="">Todos os atletas</option>
                  {atletasRes.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select>
                <select value={filtroResultadoMedalha} onChange={e => setFiltroResultadoMedalha(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
                  <option value="">Todas</option>
                  <option value="1">🥇 Ouro</option>
                  <option value="2">🥈 Prata</option>
                  <option value="3">🥉 Bronze</option>
                </select>
                {temFiltro && (
                  <button onClick={() => { setFiltroResultadoAno(''); setFiltroResultadoAtleta(''); setFiltroResultadoMedalha(''); setFiltroResultadoEvento(''); }}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-400 text-xs transition-colors px-2">
                    <X size={12}/> Limpar
                  </button>
                )}
              </div>
            </div>

            {resultados.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                <Award size={36} className="text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">Nenhum resultado ainda</p>
                <p className="text-slate-600 text-xs mt-1">Aparecem após os organizadores lançarem os resultados</p>
              </div>
            ) : (
              <>
                {/* SUB-ABA RESUMO */}
                {subAbaResultados === 'resumo' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { emoji: '🥇', label: 'Ouro', count: resFiltrados.filter(r => r.podio === 1).length, cor: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                        { emoji: '🥈', label: 'Prata', count: resFiltrados.filter(r => r.podio === 2).length, cor: 'bg-slate-700/30 border-slate-600 text-slate-300' },
                        { emoji: '🥉', label: 'Bronze', count: resFiltrados.filter(r => r.podio === 3).length, cor: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                      ].map(m => (
                        <div key={m.label} className={`border rounded-xl p-3 text-center ${m.cor}`}>
                          <p className="text-2xl">{m.emoji}</p>
                          <p className="font-black text-xl">{m.count}</p>
                          <p className="text-xs opacity-70">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="space-y-0">
                        {resFiltrados.slice(0, verMaisResultados).map(r => (
                          <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
                            <span className="text-xl shrink-0">{r.podio === 1 ? '🥇' : r.podio === 2 ? '🥈' : '🥉'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{r.atletas?.profiles?.nome}</p>
                              <p className="text-slate-500 text-xs truncate">{r.eventos?.nome} · {r.entradas?.nome}</p>
                            </div>
                            <p className="text-slate-500 text-xs shrink-0">{r.eventos?.data_evento ? new Date(r.eventos.data_evento).getFullYear() : ''}</p>
                          </div>
                        ))}
                      </div>
                      {resFiltrados.length > verMaisResultados && (
                        <button onClick={() => setVerMaisResultados(v => v + 10)}
                          className="w-full py-3 text-blue-400 hover:text-blue-300 text-sm font-medium border-t border-slate-800 transition-colors">
                          Ver mais ({resFiltrados.length - verMaisResultados} restantes)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-ABA POR EVENTO */}
                {subAbaResultados === 'eventos' && (
                  <div className="space-y-3">
                    {eventosRes.filter(([id]) => !filtroResultadoEvento || id === filtroResultadoEvento).map(([eventoId, eventoNome]) => {
                      const resEvento = resFiltrados.filter(r => r.evento_id === eventoId);
                      if (resEvento.length === 0) return null;
                      const dataEvento = resEvento[0]?.eventos?.data_evento;
                      return (
                        <div key={eventoId} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                            <div>
                              <p className="text-white font-medium text-sm">{eventoNome}</p>
                              {dataEvento && <p className="text-slate-500 text-xs">{new Date(dataEvento).toLocaleDateString('pt-BR')}</p>}
                            </div>
                            <div className="flex gap-1.5">
                              {resEvento.filter(r=>r.podio===1).length > 0 && <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">🥇 {resEvento.filter(r=>r.podio===1).length}</span>}
                              {resEvento.filter(r=>r.podio===2).length > 0 && <span className="text-xs bg-slate-700/50 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-full">🥈 {resEvento.filter(r=>r.podio===2).length}</span>}
                              {resEvento.filter(r=>r.podio===3).length > 0 && <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">🥉 {resEvento.filter(r=>r.podio===3).length}</span>}
                            </div>
                          </div>
                          {resEvento.map(r => (
                            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0">
                              <span className="text-base shrink-0">{r.podio === 1 ? '🥇' : r.podio === 2 ? '🥈' : '🥉'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium">{r.atletas?.profiles?.nome}</p>
                                <p className="text-slate-500 text-xs truncate">{r.entradas?.nome}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SUB-ABA POR ATLETA */}
                {subAbaResultados === 'atletas' && (
                  <div className="space-y-2">
                    {alunos.filter(a => !filtroResultadoAtleta || a.id === filtroResultadoAtleta).map(aluno => {
                      const medalhasAtleta = resFiltrados.filter(r => r.atleta_id === aluno.id);
                      const ouros = medalhasAtleta.filter(r => r.podio === 1).length;
                      const pratas = medalhasAtleta.filter(r => r.podio === 2).length;
                      const bronzes = medalhasAtleta.filter(r => r.podio === 3).length;
                      return (
                        <div key={aluno.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(aluno.profiles?.nome || 'A').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{aluno.profiles?.nome}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COR_FAIXA[aluno.faixa] || '#888' }}/>
                                <span className="text-slate-500 text-xs">Faixa {aluno.faixa || 'Branca'}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              {ouros > 0 && <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">🥇 {ouros}</span>}
                              {pratas > 0 && <span className="text-xs bg-slate-700/50 border border-slate-600 text-slate-300 px-2 py-0.5 rounded-full">🥈 {pratas}</span>}
                              {bronzes > 0 && <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">🥉 {bronzes}</span>}
                              {medalhasAtleta.length === 0 && <span className="text-slate-600 text-xs">Sem medalhas</span>}
                            </div>
                          </div>
                          {medalhasAtleta.length > 0 && (
                            <div className="space-y-1 pl-11">
                              {medalhasAtleta.slice(0, 3).map(r => (
                                <p key={r.id} className="text-slate-500 text-xs">
                                  {r.podio === 1 ? '🥇' : r.podio === 2 ? '🥈' : '🥉'} {r.eventos?.nome} · {r.entradas?.nome}
                                </p>
                              ))}
                              {medalhasAtleta.length > 3 && <p className="text-slate-600 text-xs">+{medalhasAtleta.length - 3} mais...</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          );
        })()}

        {/* ABA MINHA INSCRIÇÃO */}
        {aba === 'minha' && (
          <div className="space-y-4">
            {!atletaProfessor ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-2">Criar Perfil de Atleta</h3>
                <p className="text-slate-400 text-sm mb-4">Para se inscrever em eventos como competidor, crie seu perfil de atleta.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Sexo *</label>
                    <div className="flex gap-2">
                      {['Masculino','Feminino'].map(s => (
                        <button key={s} type="button" onClick={() => setFormAtletaProf(p => ({ ...p, sexo: s }))}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${formAtletaProf.sexo === s ? s === 'Masculino' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {s === 'Masculino' ? '♂ Masculino' : '♀ Feminino'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Peso (kg)</label>
                    <input type="number" value={formAtletaProf.peso} onChange={e => setFormAtletaProf(p => ({ ...p, peso: e.target.value }))}
                      placeholder="Ex: 76" className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-2 block">Faixa</label>
                    <div className="flex flex-wrap gap-2">
                      {ORDEM_FAIXAS.map(f => (
                        <button key={f} type="button" onClick={() => setFormAtletaProf(p => ({ ...p, faixa: f }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formAtletaProf.faixa === f ? 'ring-2 ring-blue-500/50 scale-105' : ''}`}
                          style={{ backgroundColor: COR_FAIXA[f] + '22', borderColor: formAtletaProf.faixa === f ? '#3b82f6' : COR_FAIXA[f] + '60' }}>
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[f] }}/>
                          <span style={{ color: f === 'Branca' ? '#cbd5e1' : COR_FAIXA[f] }}>{f}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={criarAtletaProfessor} disabled={criandoAtleta}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-all">
                    {criandoAtleta ? 'Criando...' : 'Criar meu perfil de atleta'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Perfil do atleta */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-xl font-black text-blue-400 shrink-0">
                      {(perfil?.nome || 'P').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{perfil?.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[atletaProfessor.faixa] || '#888' }}/>
                        <span className="text-slate-400 text-xs">Faixa {atletaProfessor.faixa || 'Branca'}</span>
                        {atletaProfessor.peso && <span className="text-slate-500 text-xs">· {atletaProfessor.peso}kg</span>}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/eventos`)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shrink-0">
                      <Plus size={13}/> Inscrever
                    </button>
                  </div>
                </div>

                {/* Inscrições do professor como atleta */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-white font-bold text-sm">Minhas Inscrições como Atleta ({inscricoesProfessor.length})</p>
                  </div>
                  {inscricoesProfessor.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar size={32} className="text-slate-700 mx-auto mb-2"/>
                      <p className="text-slate-500 text-sm">Nenhuma inscrição ainda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/50">
                      {inscricoesProfessor.map(insc => (
                        <div key={insc.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{insc.eventos?.nome}</p>
                            <p className="text-slate-500 text-xs">{insc.entradas?.nome} · Faixa {insc.faixa}</p>
                            <p className="text-slate-600 text-xs">{insc.eventos?.data_evento ? new Date(insc.eventos.data_evento).toLocaleDateString('pt-BR') : ''}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${insc.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-400 border-green-500/20' : insc.status_pagamento === 'cancelado' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                              {insc.status_pagamento === 'pago' ? 'Pago' : insc.status_pagamento === 'cancelado' ? 'Cancelado' : 'Pendente'}
                            </span>
                            {insc.status_pagamento === 'pendente' && (
                              <button onClick={() => navigate(`/eventos/${insc.evento_id}/pagamento`)}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg transition-all">
                                Pagar
                              </button>
                            )}
                            {insc.aprovado && (
                              <button onClick={() => {
                                const atletaProfileId = alunos.find(a => a.id === inscricoesProfessor.find(i => i.id === insc.id)?.atleta_id || insc.atleta_id)?.profile_id;
                                window.open(`/credencial/${atletaProfileId || insc.atleta_id}/${insc.evento_id}`, '_blank');
                              }}
                                className="text-xs bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white font-bold px-3 py-1 rounded-lg transition-all">
                                🪪
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {modalGraduar && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold flex items-center gap-2"><Award size={16} className="text-yellow-400"/> Graduar Aluno</h3>
              <button onClick={() => setModalGraduar(null)}><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="p-5">
              <p className="text-white font-medium mb-1">{modalGraduar.profiles?.nome}</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[modalGraduar.faixa] || '#888' }}/>
                <p className="text-slate-400 text-sm">Faixa atual: {modalGraduar.faixa || 'Branca'}</p>
              </div>
              <p className="text-slate-400 text-xs mb-3">Selecione a nova faixa:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {ORDEM_FAIXAS.slice(ORDEM_FAIXAS.indexOf(modalGraduar.faixa || 'Branca') + 1).map(f => (
                  <button key={f} onClick={() => graduarAluno(modalGraduar.id, f)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border hover:scale-105 transition-all"
                    style={{ backgroundColor: COR_FAIXA[f] + '22', borderColor: COR_FAIXA[f] + '60' }}>
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[f] }}/>
                    <span style={{ color: f === 'Branca' ? '#cbd5e1' : COR_FAIXA[f] }}>{f}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setModalGraduar(null)} className="w-full bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR PROFESSOR */}
      {modalProfessor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Adicionar Professor Responsável</h3>
              <button onClick={() => setModalProfessor(false)}><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="p-5">
              <p className="text-slate-400 text-sm mb-3">O professor precisa ter cadastro na plataforma NexusJJ.</p>
              <div className="relative mb-3">
                <input value={buscaProfessor} onChange={e => buscarProfessores(e.target.value)}
                  placeholder="Buscar professor pelo nome..." className={ic}/>
                {resultadosProfessor.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-10">
                    {resultadosProfessor.map(r => (
                      <button key={r.id} onClick={() => adicionarProfessorResp(r)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0">
                        <p className="text-white text-sm font-medium">{r.nome}</p>
                        <p className="text-slate-500 text-xs">{r.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setModalProfessor(false)} className="w-full bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOLICITAR TIME */}
      {modalSolicitarTime && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold flex items-center gap-2"><Mail size={16} className="text-blue-400"/> Solicitar Cadastro de Time</h3>
              <button onClick={() => setModalSolicitarTime(false)}><X size={18} className="text-slate-500"/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3">
                <p className="text-blue-300 text-xs">Somente a equipe NexusJJ pode cadastrar times/afiliações para evitar duplicidades. Preencha o formulário abaixo e enviaremos um email ao suporte.</p>
              </div>
              <div><label className="text-slate-400 text-xs mb-1.5 block">Nome do Time *</label><input value={formSolicitarTime.nomeTime} onChange={e => setFormSolicitarTime(p => ({ ...p, nomeTime: e.target.value }))} placeholder="Ex: Gracie Barra" className={ic}/></div>
              <div><label className="text-slate-400 text-xs mb-1.5 block">Seu nome</label><input value={formSolicitarTime.nomeResponsavel} onChange={e => setFormSolicitarTime(p => ({ ...p, nomeResponsavel: e.target.value }))} className={ic}/></div>
              <div><label className="text-slate-400 text-xs mb-1.5 block">Seu email *</label><input type="email" value={formSolicitarTime.email} onChange={e => setFormSolicitarTime(p => ({ ...p, email: e.target.value }))} className={ic}/></div>
              <p className="text-slate-500 text-xs">Após o envio, a equipe NexusJJ entrará em contato para solicitar a logo do time.</p>
              <div className="flex gap-2">
                <button onClick={() => setModalSolicitarTime(false)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm">Cancelar</button>
                <button onClick={enviarSolicitacaoTime} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all">Enviar Solicitação</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}