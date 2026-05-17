import { useState } from 'react';
import { Camera, Search, ChevronDown, AlertCircle, CheckCircle, Upload, Plus, Trash2 } from 'lucide-react';
import FaixaVisual from '../components/ui/FaixaVisual';

const MODALIDADES = [
  { valor: 'jiu-jitsu', label: 'Jiu-Jitsu (Gi & NoGi)' },
  { valor: 'judo', label: 'Judô' },
  { valor: 'kung-fu', label: 'Kung Fu' },
  { valor: 'mma', label: 'MMA' },
];

const GRADUACOES = {
  'jiu-jitsu': [
    { valor: 'branca', label: 'Faixa Branca' },
    { valor: 'cinza', label: 'Faixa Cinza' },
    { valor: 'amarela', label: 'Faixa Amarela' },
    { valor: 'laranja', label: 'Faixa Laranja' },
    { valor: 'verde', label: 'Faixa Verde' },
    { valor: 'azul', label: 'Faixa Azul' },
    { valor: 'roxa', label: 'Faixa Roxa' },
    { valor: 'marrom', label: 'Faixa Marrom' },
    { valor: 'preta', label: 'Faixa Preta' },
    { valor: 'coral', label: 'Faixa Coral' },
    { valor: 'vermelha', label: 'Faixa Vermelha' },
  ],
  'judo': [
    { valor: 'branca', label: 'Faixa Branca' },
    { valor: 'amarela', label: 'Faixa Amarela' },
    { valor: 'laranja', label: 'Faixa Laranja' },
    { valor: 'verde', label: 'Faixa Verde' },
    { valor: 'azul', label: 'Faixa Azul' },
    { valor: 'marrom', label: 'Faixa Marrom' },
    { valor: 'preta-1', label: 'Faixa Preta — 1º Dan' },
    { valor: 'preta-2', label: 'Faixa Preta — 2º Dan' },
    { valor: 'preta-3', label: 'Faixa Preta — 3º Dan' },
    { valor: 'preta-4', label: 'Faixa Preta — 4º Dan' },
    { valor: 'preta-5', label: 'Faixa Preta — 5º Dan' },
    { valor: 'vermelha-branca', label: 'Faixa Vermelha e Branca' },
    { valor: 'vermelha', label: 'Faixa Vermelha' },
  ],
  'kung-fu': [
    { valor: 'sem-faixa', label: 'Sem Faixa' },
    { valor: 'amarela', label: 'Faixa Amarela' },
    { valor: 'laranja', label: 'Faixa Laranja' },
    { valor: 'verde', label: 'Faixa Verde' },
    { valor: 'azul', label: 'Faixa Azul' },
    { valor: 'roxa', label: 'Faixa Roxa' },
    { valor: 'marrom', label: 'Faixa Marrom' },
    { valor: 'preta', label: 'Faixa Preta' },
  ],
  'mma': [
    { valor: 'iniciante', label: 'Iniciante' },
    { valor: 'amador', label: 'Amador' },
    { valor: 'profissional', label: 'Profissional' },
  ],
};

const FAIXAS_PRETA = ['preta', 'preta-1', 'preta-2', 'preta-3', 'preta-4', 'preta-5'];

const ETAPAS = ['Dados Pessoais', 'Academia'];

export default function CadastroProfessorPage() {
  const [etapa, setEtapa] = useState(0);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [pessoal, setPessoal] = useState({
    nome: '', sobrenome: '', cpf: '', dataNascimento: '',
    telefone: '', instagram: '', facebook: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
    modalidade: '', graduacao: '',
  });

  const [academia, setAcademia] = useState({
    nomeAcademia: '',
    cepAcademia: '', logradouroAcademia: '', numeroAcademia: '',
    complementoAcademia: '', bairroAcademia: '', cidadeAcademia: '', estadoAcademia: '',
    telefoneAcademia: '', site: '',
    aprovacaoManual: false,
  });

  const [professoresAux, setProfessoresAux] = useState([{ email: '' }]);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepAcadLoading, setCepAcadLoading] = useState(false);
  const [erros, setErros] = useState({});

  const inputClass = (campo) =>
    `w-full bg-slate-800 border ${erros[campo] ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`;

  const formatarCPF = (v) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

  const formatarTelefone = (v) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);

  const formatarCEP = (v) =>
    v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  const buscarCEP = async (cep, tipo) => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    tipo === 'pessoal' ? setCepLoading(true) : setCepAcadLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (data.erro) return;
      if (tipo === 'pessoal') {
        setPessoal(p => ({ ...p, logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' }));
      } else {
        setAcademia(a => ({ ...a, logradouroAcademia: data.logradouro || '', bairroAcademia: data.bairro || '', cidadeAcademia: data.localidade || '', estadoAcademia: data.uf || '' }));
      }
    } catch { } finally {
      tipo === 'pessoal' ? setCepLoading(false) : setCepAcadLoading(false);
    }
  };

  const calcularIdade = (data) => {
    const hoje = new Date(), nasc = new Date(data);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const validarEtapa0 = () => {
    const e = {};
    if (!pessoal.nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!pessoal.sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório.';
    if (!pessoal.cpf || pessoal.cpf.length < 14) e.cpf = 'CPF inválido.';
    if (!pessoal.dataNascimento) e.dataNascimento = 'Data de nascimento é obrigatória.';
    else if (calcularIdade(pessoal.dataNascimento) < 18) e.dataNascimento = 'Você precisa ter 18 anos ou mais.';
    if (!pessoal.telefone) e.telefone = 'Telefone é obrigatório.';
    if (!pessoal.cep || pessoal.cep.length < 9) e.cep = 'CEP inválido.';
    if (!pessoal.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório.';
    if (!pessoal.numero.trim()) e.numero = 'Número é obrigatório.';
    if (!pessoal.modalidade) e.modalidade = 'Selecione uma modalidade.';
    if (!pessoal.graduacao) e.graduacao = 'Selecione sua graduação.';
    return e;
  };

  const validarEtapa1 = () => {
    const e = {};
    if (!academia.nomeAcademia.trim()) e.nomeAcademia = 'Nome da academia é obrigatório.';
    if (!academia.cepAcademia || academia.cepAcademia.length < 9) e.cepAcademia = 'CEP inválido.';
    if (!academia.logradouroAcademia.trim()) e.logradouroAcademia = 'Logradouro é obrigatório.';
    if (!academia.numeroAcademia.trim()) e.numeroAcademia = 'Número é obrigatório.';
    if (!academia.telefoneAcademia) e.telefoneAcademia = 'Telefone da academia é obrigatório.';
    return e;
  };

  const avancar = () => {
    const e = validarEtapa0();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    setErros({});
    setEtapa(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validarEtapa1();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSucesso(true); }, 1500);
  };

  const adicionarProfAux = () => {
    if (professoresAux.length < 3) setProfessoresAux([...professoresAux, { email: '' }]);
  };

  const removerProfAux = (i) => setProfessoresAux(professoresAux.filter((_, idx) => idx !== i));

  const graduacoesDisponiveis = pessoal.modalidade ? GRADUACOES[pessoal.modalidade] : [];
  const labelGraduacao = graduacoesDisponiveis.find(g => g.valor === pessoal.graduacao)?.label || '';
  const ehFaixaPreta = FAIXAS_PRETA.includes(pessoal.graduacao);

  if (sucesso) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro realizado!</h2>
          <p className="text-slate-400 mb-6">Seu perfil de professor e academia foram criados com sucesso.</p>
          <a href="/" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
            Ir para o painel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">Nexus<span className="text-blue-500">JJ</span></span>
          </a>
          <h1 className="text-2xl font-bold text-white">Cadastro de Professor</h1>
          <p className="text-slate-400 text-sm mt-1">Preencha seus dados e os da sua academia</p>
        </div>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {ETAPAS.map((nome, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= etapa ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${i === etapa ? 'text-white' : 'text-slate-500'}`}>{nome}</span>
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={`w-12 h-px ${i < etapa ? 'bg-cyan-600' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">

          {/* ===== ETAPA 0: DADOS PESSOAIS ===== */}
          {etapa === 0 && (
            <>
              {/* FOTO */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                    {fotoPreview
                      ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                      : <Camera size={32} className="text-slate-500" />
                    }
                  </div>
                  <label className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 rounded-full p-1.5 cursor-pointer transition-colors">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) setFotoPreview(URL.createObjectURL(f)); }} className="hidden" />
                  </label>
                </div>
                <p className="text-slate-500 text-xs">Foto do professor (opcional)</p>
              </div>

              {/* DADOS PESSOAIS */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Dados Pessoais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                    <input value={pessoal.nome} onChange={e => { setPessoal(p => ({ ...p, nome: e.target.value })); setErros(er => ({ ...er, nome: '' })); }} placeholder="Seu nome" className={inputClass('nome')} />
                    {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Sobrenome *</label>
                    <input value={pessoal.sobrenome} onChange={e => { setPessoal(p => ({ ...p, sobrenome: e.target.value })); setErros(er => ({ ...er, sobrenome: '' })); }} placeholder="Seu sobrenome" className={inputClass('sobrenome')} />
                    {erros.sobrenome && <p className="text-red-400 text-xs mt-1">{erros.sobrenome}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">CPF *</label>
                    <input value={pessoal.cpf} onChange={e => setPessoal(p => ({ ...p, cpf: formatarCPF(e.target.value) }))} placeholder="000.000.000-00" className={inputClass('cpf')} />
                    {erros.cpf && <p className="text-red-400 text-xs mt-1">{erros.cpf}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Nascimento *</label>
                    <input type="date" value={pessoal.dataNascimento} onChange={e => { setPessoal(p => ({ ...p, dataNascimento: e.target.value })); setErros(er => ({ ...er, dataNascimento: '' })); }} className={inputClass('dataNascimento')} />
                    {erros.dataNascimento && <p className="text-red-400 text-xs mt-1">{erros.dataNascimento}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone / WhatsApp *</label>
                    <input value={pessoal.telefone} onChange={e => setPessoal(p => ({ ...p, telefone: formatarTelefone(e.target.value) }))} placeholder="(00) 00000-0000" className={inputClass('telefone')} />
                    {erros.telefone && <p className="text-red-400 text-xs mt-1">{erros.telefone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram</label>
                    <input value={pessoal.instagram} onChange={e => setPessoal(p => ({ ...p, instagram: e.target.value }))} placeholder="@seuperfil" className={inputClass('instagram')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Facebook</label>
                    <input value={pessoal.facebook} onChange={e => setPessoal(p => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/seuperfil" className={inputClass('facebook')} />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO PESSOAL */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Endereço</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">CEP *</label>
                    <div className="relative">
                      <input value={pessoal.cep} onChange={e => { const v = formatarCEP(e.target.value); setPessoal(p => ({ ...p, cep: v })); if (v.replace(/\D/g, '').length === 8) buscarCEP(v, 'pessoal'); }} placeholder="00000-000" className={inputClass('cep')} />
                      {cepLoading && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                    {erros.cep && <p className="text-red-400 text-xs mt-1">{erros.cep}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro *</label>
                    <input value={pessoal.logradouro} onChange={e => setPessoal(p => ({ ...p, logradouro: e.target.value }))} placeholder="Rua, Avenida..." className={inputClass('logradouro')} />
                    {erros.logradouro && <p className="text-red-400 text-xs mt-1">{erros.logradouro}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Número *</label>
                    <input value={pessoal.numero} onChange={e => setPessoal(p => ({ ...p, numero: e.target.value }))} placeholder="123" className={inputClass('numero')} />
                    {erros.numero && <p className="text-red-400 text-xs mt-1">{erros.numero}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Complemento</label>
                    <input value={pessoal.complemento} onChange={e => setPessoal(p => ({ ...p, complemento: e.target.value }))} placeholder="Apto, Bloco..." className={inputClass('complemento')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
                    <input value={pessoal.bairro} onChange={e => setPessoal(p => ({ ...p, bairro: e.target.value }))} placeholder="Bairro" className={inputClass('bairro')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                    <input value={pessoal.cidade} onChange={e => setPessoal(p => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" className={inputClass('cidade')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                    <input value={pessoal.estado} onChange={e => setPessoal(p => ({ ...p, estado: e.target.value }))} placeholder="UF" maxLength={2} className={inputClass('estado')} />
                  </div>
                </div>
              </div>

              {/* MODALIDADE E GRADUAÇÃO */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Modalidade e Graduação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Modalidade *</label>
                    <div className="relative">
                      <select value={pessoal.modalidade} onChange={e => { setPessoal(p => ({ ...p, modalidade: e.target.value, graduacao: '' })); setErros(er => ({ ...er, modalidade: '' })); }} className={`${inputClass('modalidade')} appearance-none pr-10`}>
                        <option value="">Selecione a modalidade</option>
                        {MODALIDADES.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    {erros.modalidade && <p className="text-red-400 text-xs mt-1">{erros.modalidade}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Graduação *</label>
                    <div className="relative">
                      <select value={pessoal.graduacao} onChange={e => { setPessoal(p => ({ ...p, graduacao: e.target.value })); setErros(er => ({ ...er, graduacao: '' })); }} disabled={!pessoal.modalidade} className={`${inputClass('graduacao')} appearance-none pr-10 disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <option value="">{pessoal.modalidade ? 'Selecione sua graduação' : 'Selecione a modalidade primeiro'}</option>
                        {graduacoesDisponiveis.map(g => <option key={g.valor} value={g.valor}>{g.label}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    {erros.graduacao && <p className="text-red-400 text-xs mt-1">{erros.graduacao}</p>}
                  </div>

                  {/* Prévia da faixa */}
                  {pessoal.modalidade && pessoal.graduacao && (
                    <div className="sm:col-span-2 flex flex-col items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl py-5 px-4">
                      <p className="text-slate-400 text-xs uppercase tracking-wider">Sua faixa atual</p>
                      <FaixaVisual modalidade={pessoal.modalidade} graduacao={pessoal.graduacao} label={labelGraduacao} width={280} height={70} />
                    </div>
                  )}
                </div>

                {ehFaixaPreta && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 flex gap-3 mt-4">
                    <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-yellow-300 text-sm">Professores Faixa Preta precisam enviar comprovação. Você poderá fazer isso após o cadastro.</p>
                  </div>
                )}
              </div>

              <button type="button" onClick={avancar} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-600/20">
                Próximo — Dados da Academia
              </button>

              <p className="text-center text-slate-500 text-xs">
                Já tem uma conta? <a href="/login" className="text-blue-400 hover:text-blue-300">Entrar</a>
              </p>
            </>
          )}

          {/* ===== ETAPA 1: ACADEMIA ===== */}
          {etapa === 1 && (
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* LOGO DA ACADEMIA */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      : <Upload size={32} className="text-slate-500" />
                    }
                  </div>
                  <label className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 rounded-full p-1.5 cursor-pointer transition-colors">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) setLogoPreview(URL.createObjectURL(f)); }} className="hidden" />
                  </label>
                </div>
                <p className="text-slate-500 text-xs">Logo da academia — aparece na ficha de inscrição e no placar digital</p>
              </div>

              {/* DADOS DA ACADEMIA */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Dados da Academia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da Academia *</label>
                    <input value={academia.nomeAcademia} onChange={e => { setAcademia(a => ({ ...a, nomeAcademia: e.target.value })); setErros(er => ({ ...er, nomeAcademia: '' })); }} placeholder="Nome oficial da academia" className={inputClass('nomeAcademia')} />
                    {erros.nomeAcademia && <p className="text-red-400 text-xs mt-1">{erros.nomeAcademia}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone *</label>
                    <input value={academia.telefoneAcademia} onChange={e => setAcademia(a => ({ ...a, telefoneAcademia: formatarTelefone(e.target.value) }))} placeholder="(00) 00000-0000" className={inputClass('telefoneAcademia')} />
                    {erros.telefoneAcademia && <p className="text-red-400 text-xs mt-1">{erros.telefoneAcademia}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Site</label>
                    <input value={academia.site} onChange={e => setAcademia(a => ({ ...a, site: e.target.value }))} placeholder="www.suaacademia.com.br" className={inputClass('site')} />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO DA ACADEMIA */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Endereço da Academia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">CEP *</label>
                    <div className="relative">
                      <input value={academia.cepAcademia} onChange={e => { const v = formatarCEP(e.target.value); setAcademia(a => ({ ...a, cepAcademia: v })); if (v.replace(/\D/g, '').length === 8) buscarCEP(v, 'academia'); }} placeholder="00000-000" className={inputClass('cepAcademia')} />
                      {cepAcadLoading && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                    {erros.cepAcademia && <p className="text-red-400 text-xs mt-1">{erros.cepAcademia}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro *</label>
                    <input value={academia.logradouroAcademia} onChange={e => setAcademia(a => ({ ...a, logradouroAcademia: e.target.value }))} placeholder="Rua, Avenida..." className={inputClass('logradouroAcademia')} />
                    {erros.logradouroAcademia && <p className="text-red-400 text-xs mt-1">{erros.logradouroAcademia}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Número *</label>
                    <input value={academia.numeroAcademia} onChange={e => setAcademia(a => ({ ...a, numeroAcademia: e.target.value }))} placeholder="123" className={inputClass('numeroAcademia')} />
                    {erros.numeroAcademia && <p className="text-red-400 text-xs mt-1">{erros.numeroAcademia}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Complemento</label>
                    <input value={academia.complementoAcademia} onChange={e => setAcademia(a => ({ ...a, complementoAcademia: e.target.value }))} placeholder="Sala, Bloco..." className={inputClass('complementoAcademia')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
                    <input value={academia.bairroAcademia} onChange={e => setAcademia(a => ({ ...a, bairroAcademia: e.target.value }))} placeholder="Bairro" className={inputClass('bairroAcademia')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                    <input value={academia.cidadeAcademia} onChange={e => setAcademia(a => ({ ...a, cidadeAcademia: e.target.value }))} placeholder="Cidade" className={inputClass('cidadeAcademia')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                    <input value={academia.estadoAcademia} onChange={e => setAcademia(a => ({ ...a, estadoAcademia: e.target.value }))} placeholder="UF" maxLength={2} className={inputClass('estadoAcademia')} />
                  </div>
                </div>
              </div>

              {/* PROFESSORES AUXILIARES */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-1 pb-2 border-b border-slate-800">Professores Auxiliares</h3>
                <p className="text-slate-500 text-xs mb-4">Adicione até 3 professores com as mesmas permissões. Eles precisam ter cadastro na NexusJJ.</p>
                <div className="space-y-3">
                  {professoresAux.map((prof, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={prof.email}
                        onChange={e => {
                          const updated = [...professoresAux];
                          updated[i].email = e.target.value;
                          setProfessoresAux(updated);
                        }}
                        placeholder={`Email do professor auxiliar ${i + 1}`}
                        className={inputClass('profAux')}
                      />
                      {professoresAux.length > 1 && (
                        <button type="button" onClick={() => removerProfAux(i)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {professoresAux.length < 3 && (
                    <button type="button" onClick={adicionarProfAux} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                      <Plus size={16} /> Adicionar professor auxiliar
                    </button>
                  )}
                </div>
              </div>

              {/* APROVAÇÃO MANUAL */}
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Aprovação de Alunos</h3>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white text-sm font-medium">Aprovação manual de alunos</p>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Se ativado, você receberá um alerta para aprovar ou recusar cada atleta que se registrar como aluno da sua academia.
                        Se recusado, o atleta ficará como <strong className="text-slate-300">"Equipe Independente"</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAcademia(a => ({ ...a, aprovacaoManual: !a.aprovacaoManual }))}
                      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 ${academia.aprovacaoManual ? 'bg-cyan-600' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${academia.aprovacaoManual ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex flex-col gap-3">
                <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-600/20 disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Criando perfil...
                    </span>
                  ) : 'Criar perfil de Professor'}
                </button>
                <button type="button" onClick={() => { setEtapa(0); window.scrollTo(0, 0); }} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-lg transition-all border border-slate-700">
                  Voltar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}