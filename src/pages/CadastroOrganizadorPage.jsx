import { useState } from 'react';
import { Camera, ChevronDown, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { cadastrarOrganizador } from '../api/authService';

export default function CadastroOrganizadorPage() {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erros, setErros] = useState({});
  const [tipoPessoa, setTipoPessoa] = useState('pf');
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState({
    // PF
    nome: '', sobrenome: '', cpf: '', dataNascimento: '',
    // PJ
    razaoSocial: '', cnpj: '', nomeFantasia: '', responsavel: '',
    // Compartilhados
    telefone: '', email: '', site: '', senha: '', confirmarSenha: '',
    instagram: '', facebook: '', youtube: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  });

  const inputClass = (campo) =>
    `w-full bg-slate-800 border ${erros[campo] ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors`;

  const formatarCPF = (v) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

  const formatarCNPJ = (v) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2').slice(0, 18);

  const formatarTelefone = (v) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);

  const formatarCEP = (v) =>
    v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  const buscarCEP = async (cep) => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(p => ({ ...p, logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' }));
      }
    } catch { } finally { setCepLoading(false); }
  };

  const calcularIdade = (data) => {
    const hoje = new Date(), nasc = new Date(data);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const handleChange = (campo, valor) => {
    setForm(p => ({ ...p, [campo]: valor }));
    setErros(e => ({ ...e, [campo]: '' }));
  };

  const validar = () => {
    const e = {};
    if (tipoPessoa === 'pf') {
      if (!form.nome.trim()) e.nome = 'Nome é obrigatório.';
      if (!form.sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório.';
      if (!form.cpf || form.cpf.length < 14) e.cpf = 'CPF inválido.';
      if (!form.dataNascimento) e.dataNascimento = 'Data de nascimento é obrigatória.';
      else if (calcularIdade(form.dataNascimento) < 18) e.dataNascimento = 'Você precisa ter 18 anos ou mais.';
    } else {
      if (!form.razaoSocial.trim()) e.razaoSocial = 'Razão social é obrigatória.';
      if (!form.cnpj || form.cnpj.length < 18) e.cnpj = 'CNPJ inválido.';
      if (!form.responsavel.trim()) e.responsavel = 'Nome do responsável é obrigatório.';
    }
    if (!form.telefone) e.telefone = 'Telefone é obrigatório.';
    if (!form.email || !form.email.includes('@')) e.email = 'Email válido é obrigatório.';
    if (!form.cep || form.cep.length < 9) e.cep = 'CEP inválido.';
    if (!form.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório.';
    if (!form.numero.trim()) e.numero = 'Número é obrigatório.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar();
    if (!form.senha || form.senha.length < 6) novosErros.senha = 'Senha deve ter no mínimo 6 caracteres.';
    if (form.senha !== form.confirmarSenha) novosErros.confirmarSenha = 'As senhas não coincidem.';
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }
    setLoading(true);
    try {
      await cadastrarOrganizador({
        nome: tipoPessoa === 'pf' ? `${form.nome} ${form.sobrenome}`.trim() : form.razaoSocial,
        email: form.email,
        password: form.senha,
        telefone: form.telefone,
      });
      window.location.replace('/painel/organizador');
    } catch (err) {
      setErros({ geral: err.message || 'Erro ao criar conta. Tente novamente.' });
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro realizado!</h2>
          <p className="text-slate-400 mb-6">Seu perfil de organizador foi criado com sucesso.</p>
          <a href="/" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
            Ir para o painel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-3xl" />
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
          <h1 className="text-2xl font-bold text-white">Crie aqui seu evento</h1>
          <p className="text-slate-400 text-sm mt-1">Cadastre-se como organizador e gerencie seus eventos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">
          {erros.geral && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <p className="text-red-300 text-sm">{erros.geral}</p>
            </div>
          )}

          {/* TIPO DE PESSOA */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button type="button" onClick={() => setTipoPessoa('pf')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${tipoPessoa === 'pf' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Pessoa Física
            </button>
            <button type="button" onClick={() => setTipoPessoa('pj')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${tipoPessoa === 'pj' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Pessoa Jurídica
            </button>
          </div>

          {/* FOTO / LOGO */}
          <div className="flex gap-6 justify-center flex-wrap">
            {/* Foto do responsável */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                  {fotoPreview ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" /> : <Camera size={28} className="text-slate-500" />}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-500 rounded-full p-1.5 cursor-pointer transition-colors">
                  <Camera size={12} className="text-white" />
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setFotoPreview(URL.createObjectURL(f)); }} className="hidden" />
                </label>
              </div>
              <p className="text-slate-500 text-xs">Foto do responsável</p>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <Upload size={28} className="text-slate-500" />}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-500 rounded-full p-1.5 cursor-pointer transition-colors">
                  <Camera size={12} className="text-white" />
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setLogoPreview(URL.createObjectURL(f)); }} className="hidden" />
                </label>
              </div>
              <p className="text-slate-500 text-xs">Logo do evento/organização</p>
            </div>
          </div>

          {/* DADOS PF */}
          {tipoPessoa === 'pf' && (
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Dados Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                  <input value={form.nome} onChange={e => handleChange('nome', e.target.value)} placeholder="Seu nome" className={inputClass('nome')} />
                  {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sobrenome *</label>
                  <input value={form.sobrenome} onChange={e => handleChange('sobrenome', e.target.value)} placeholder="Seu sobrenome" className={inputClass('sobrenome')} />
                  {erros.sobrenome && <p className="text-red-400 text-xs mt-1">{erros.sobrenome}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CPF *</label>
                  <input value={form.cpf} onChange={e => handleChange('cpf', formatarCPF(e.target.value))} placeholder="000.000.000-00" className={inputClass('cpf')} />
                  {erros.cpf && <p className="text-red-400 text-xs mt-1">{erros.cpf}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Nascimento *</label>
                  <input type="date" value={form.dataNascimento} onChange={e => handleChange('dataNascimento', e.target.value)} className={inputClass('dataNascimento')} />
                  {erros.dataNascimento && <p className="text-red-400 text-xs mt-1">{erros.dataNascimento}</p>}
                </div>
              </div>
            </div>
          )}

          {/* DADOS PJ */}
          {tipoPessoa === 'pj' && (
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Dados da Empresa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Razão Social *</label>
                  <input value={form.razaoSocial} onChange={e => handleChange('razaoSocial', e.target.value)} placeholder="Nome oficial da empresa" className={inputClass('razaoSocial')} />
                  {erros.razaoSocial && <p className="text-red-400 text-xs mt-1">{erros.razaoSocial}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CNPJ *</label>
                  <input value={form.cnpj} onChange={e => handleChange('cnpj', formatarCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className={inputClass('cnpj')} />
                  {erros.cnpj && <p className="text-red-400 text-xs mt-1">{erros.cnpj}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome Fantasia</label>
                  <input value={form.nomeFantasia} onChange={e => handleChange('nomeFantasia', e.target.value)} placeholder="Nome comercial" className={inputClass('nomeFantasia')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome do Responsável *</label>
                  <input value={form.responsavel} onChange={e => handleChange('responsavel', e.target.value)} placeholder="Nome completo do responsável legal" className={inputClass('responsavel')} />
                  {erros.responsavel && <p className="text-red-400 text-xs mt-1">{erros.responsavel}</p>}
                </div>
              </div>
            </div>
          )}

          {/* CONTATO */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone / WhatsApp *</label>
                <input value={form.telefone} onChange={e => handleChange('telefone', formatarTelefone(e.target.value))} placeholder="(00) 00000-0000" className={inputClass('telefone')} />
                {erros.telefone && <p className="text-red-400 text-xs mt-1">{erros.telefone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="seu@email.com" className={inputClass('email')} />
                {erros.email && <p className="text-red-400 text-xs mt-1">{erros.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha *</label>
                <input type="password" value={form.senha} onChange={e => handleChange('senha', e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass('senha')} />
                {erros.senha && <p className="text-red-400 text-xs mt-1">{erros.senha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Senha *</label>
                <input type="password" value={form.confirmarSenha} onChange={e => handleChange('confirmarSenha', e.target.value)} placeholder="Repita a senha" className={inputClass('confirmarSenha')} />
                {erros.confirmarSenha && <p className="text-red-400 text-xs mt-1">{erros.confirmarSenha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Site</label>
                <input value={form.site} onChange={e => handleChange('site', e.target.value)} placeholder="www.seusite.com.br" className={inputClass('site')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram</label>
                <input value={form.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@seuperfil" className={inputClass('instagram')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Facebook</label>
                <input value={form.facebook} onChange={e => handleChange('facebook', e.target.value)} placeholder="facebook.com/seuperfil" className={inputClass('facebook')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">YouTube</label>
                <input value={form.youtube} onChange={e => handleChange('youtube', e.target.value)} placeholder="youtube.com/@seucanal" className={inputClass('youtube')} />
              </div>
            </div>
          </div>

          {/* ENDEREÇO */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CEP *</label>
                <div className="relative">
                  <input value={form.cep} onChange={e => { const v = formatarCEP(e.target.value); handleChange('cep', v); if (v.replace(/\D/g, '').length === 8) buscarCEP(v); }} placeholder="00000-000" className={inputClass('cep')} />
                  {cepLoading && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>}
                </div>
                {erros.cep && <p className="text-red-400 text-xs mt-1">{erros.cep}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro *</label>
                <input value={form.logradouro} onChange={e => handleChange('logradouro', e.target.value)} placeholder="Rua, Avenida..." className={inputClass('logradouro')} />
                {erros.logradouro && <p className="text-red-400 text-xs mt-1">{erros.logradouro}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Número *</label>
                <input value={form.numero} onChange={e => handleChange('numero', e.target.value)} placeholder="123" className={inputClass('numero')} />
                {erros.numero && <p className="text-red-400 text-xs mt-1">{erros.numero}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Complemento</label>
                <input value={form.complemento} onChange={e => handleChange('complemento', e.target.value)} placeholder="Apto, Sala..." className={inputClass('complemento')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
                <input value={form.bairro} onChange={e => handleChange('bairro', e.target.value)} placeholder="Bairro" className={inputClass('bairro')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                <input value={form.cidade} onChange={e => handleChange('cidade', e.target.value)} placeholder="Cidade" className={inputClass('cidade')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                <input value={form.estado} onChange={e => handleChange('estado', e.target.value)} placeholder="UF" maxLength={2} className={inputClass('estado')} />
              </div>
            </div>
          </div>

          {/* AVISO */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3 flex gap-3">
            <AlertCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-purple-300 text-xs leading-relaxed">
              Após o cadastro você poderá criar eventos, configurar inscrições, chaveamentos e pagamentos pelo seu painel de organizador.
            </p>
          </div>

          {/* BOTÃO */}
          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando perfil...
              </span>
            ) : 'Criar perfil de Organizador'}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Já tem uma conta? <a href="/login" className="text-blue-400 hover:text-blue-300">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
}