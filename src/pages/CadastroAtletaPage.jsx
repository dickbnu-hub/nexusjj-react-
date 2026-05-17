import { useState } from 'react';
import { Camera, Search, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import FaixaVisual from '../components/ui/FaixaVisual';
import { cadastrarAtleta } from '../api/authService';

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

export default function CadastroAtletaPage() {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [form, setForm] = useState({
    nome: '', sobrenome: '', cpf: '', dataNascimento: '',
    email: '', senha: '', confirmarSenha: '', telefone: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
    modalidade: '', graduacao: '', academia: '', sexo: '',
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState('');
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'modalidade') {
      setForm((prev) => ({ ...prev, modalidade: value, graduacao: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setErros((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (file) setFotoPreview(URL.createObjectURL(file));
  };

  const formatarCPF = (value) =>
    value.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);

  const formatarCEP = (value) =>
    value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);

  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setCepLoading(true);
    setCepErro('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) { setCepErro('CEP não encontrado.'); return; }
      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
    } catch {
      setCepErro('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  const calcularIdade = (data) => {
    const hoje = new Date();
    const nasc = new Date(data);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!form.sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório.';
    if (!form.cpf || form.cpf.length < 14) e.cpf = 'CPF inválido.';
    if (!form.dataNascimento) {
      e.dataNascimento = 'Data de nascimento é obrigatória.';
    } else if (calcularIdade(form.dataNascimento) < 18) {
      e.dataNascimento = 'menor18';
    }
    if (!form.cep || form.cep.length < 9) e.cep = 'CEP inválido.';
    if (!form.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório.';
    if (!form.numero.trim()) e.numero = 'Número é obrigatório.';
    if (!form.modalidade) e.modalidade = 'Selecione uma modalidade.';
    if (!form.sexo) e.sexo = 'Selecione o sexo.';
    if (!form.graduacao) e.graduacao = 'Selecione sua graduação.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar();
    if (!form.email) novosErros.email = 'Email é obrigatório.';
    if (!form.senha || form.senha.length < 6) novosErros.senha = 'Senha deve ter no mínimo 6 caracteres.';
    if (form.senha !== form.confirmarSenha) novosErros.confirmarSenha = 'As senhas não coincidem.';
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      if (novosErros.dataNascimento === 'menor18') {
        window.location.href = '/cadastro/menor-de-idade';
      }
      return;
    }
    setLoading(true);
    try {
      await cadastrarAtleta({
        nome: `${form.nome} ${form.sobrenome}`.trim(),
        email: form.email,
        password: form.senha,
        telefone: form.telefone,
        dataNascimento: form.dataNascimento,
        faixa: form.graduacao,
        sexo: form.sexo,
        peso: form.peso ? parseFloat(form.peso) : null,
      });
      setSucesso(true);
      setTimeout(() => {
        window.location.href = '/painel/atleta';
      }, 2000);
    } catch (err) {
      setErros({ geral: err.message || 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (campo) =>
    `w-full bg-slate-800 border ${erros[campo] ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`;

  const graduacoesDisponiveis = form.modalidade ? GRADUACOES[form.modalidade] : [];
  const ehFaixaPreta = FAIXAS_PRETA.includes(form.graduacao);
  const labelGraduacaoAtual = graduacoesDisponiveis.find(g => g.valor === form.graduacao)?.label || '';

  if (sucesso) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro realizado!</h2>
          <p className="text-slate-400 mb-6">Seu perfil de atleta foi criado com sucesso.</p>
          <a href="/" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
            Ir para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">
              Nexus<span className="text-blue-500">JJ</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-white">Cadastro de Atleta</h1>
          <p className="text-slate-400 text-sm mt-1">Preencha seus dados para criar seu perfil</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">
          {erros.geral && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{erros.geral}</p>
            </div>
          )}

          {/* FOTO */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                {fotoPreview
                  ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                  : <Camera size={32} className="text-slate-500" />
                }
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 rounded-full p-1.5 cursor-pointer transition-colors">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
              </label>
            </div>
            <p className="text-slate-500 text-xs">Foto do atleta (opcional)</p>
          </div>

          {/* DADOS PESSOAIS */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                <input name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome" className={inputClass('nome')} />
                {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Sobrenome *</label>
                <input name="sobrenome" value={form.sobrenome} onChange={handleChange} placeholder="Seu sobrenome" className={inputClass('sobrenome')} />
                {erros.sobrenome && <p className="text-red-400 text-xs mt-1">{erros.sobrenome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className={inputClass('email')} />
                {erros.email && <p className="text-red-400 text-xs mt-1">{erros.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" className={inputClass('telefone')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha *</label>
                <input name="senha" type="password" value={form.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" className={inputClass('senha')} />
                {erros.senha && <p className="text-red-400 text-xs mt-1">{erros.senha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Senha *</label>
                <input name="confirmarSenha" type="password" value={form.confirmarSenha} onChange={handleChange} placeholder="Repita a senha" className={inputClass('confirmarSenha')} />
                {erros.confirmarSenha && <p className="text-red-400 text-xs mt-1">{erros.confirmarSenha}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CPF *</label>
                <input
                  name="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: formatarCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  className={inputClass('cpf')}
                />
                {erros.cpf && <p className="text-red-400 text-xs mt-1">{erros.cpf}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Nascimento *</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={form.dataNascimento}
                  onChange={handleChange}
                  className={inputClass('dataNascimento')}
                />
                {erros.dataNascimento && erros.dataNascimento !== 'menor18' && (
                  <p className="text-red-400 text-xs mt-1">{erros.dataNascimento}</p>
                )}
              </div>
            </div>
          </div>

          {/* ENDEREÇO */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
              Endereço
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CEP *</label>
                <div className="relative">
                  <input
                    name="cep"
                    value={form.cep}
                    onChange={(e) => {
                      const val = formatarCEP(e.target.value);
                      setForm((p) => ({ ...p, cep: val }));
                      if (val.replace(/\D/g, '').length === 8) buscarCEP(val);
                    }}
                    placeholder="00000-000"
                    className={inputClass('cep')}
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {cepErro && <p className="text-red-400 text-xs mt-1">{cepErro}</p>}
                {erros.cep && <p className="text-red-400 text-xs mt-1">{erros.cep}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro *</label>
                <input name="logradouro" value={form.logradouro} onChange={handleChange} placeholder="Rua, Avenida..." className={inputClass('logradouro')} />
                {erros.logradouro && <p className="text-red-400 text-xs mt-1">{erros.logradouro}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Número *</label>
                <input name="numero" value={form.numero} onChange={handleChange} placeholder="123" className={inputClass('numero')} />
                {erros.numero && <p className="text-red-400 text-xs mt-1">{erros.numero}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Complemento</label>
                <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Apto, Bloco..." className={inputClass('complemento')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
                <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className={inputClass('bairro')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" className={inputClass('cidade')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                <input name="estado" value={form.estado} onChange={handleChange} placeholder="UF" maxLength={2} className={inputClass('estado')} />
              </div>
            </div>
          </div>

          {/* MODALIDADE E GRADUAÇÃO */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
              Modalidade e Graduação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SEXO */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Sexo *</label>
                <div className="flex gap-3">
                  {['Masculino','Feminino'].map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm(p => ({ ...p, sexo: s }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.sexo === s ? s === 'Masculino' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                      {s === 'Masculino' ? '♂ Masculino' : '♀ Feminino'}
                    </button>
                  ))}
                </div>
                {erros.sexo && <p className="text-red-400 text-xs mt-1">{erros.sexo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Modalidade *</label>
                <div className="relative">
                  <select
                    name="modalidade"
                    value={form.modalidade}
                    onChange={handleChange}
                    className={`${inputClass('modalidade')} appearance-none pr-10`}
                  >
                    <option value="">Selecione a modalidade</option>
                    {MODALIDADES.map((m) => (
                      <option key={m.valor} value={m.valor}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
                {erros.modalidade && <p className="text-red-400 text-xs mt-1">{erros.modalidade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Graduação *</label>
                <div className="relative">
                  <select
                    name="graduacao"
                    value={form.graduacao}
                    onChange={handleChange}
                    disabled={!form.modalidade}
                    className={`${inputClass('graduacao')} appearance-none pr-10 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {form.modalidade ? 'Selecione sua graduação' : 'Selecione a modalidade primeiro'}
                    </option>
                    {graduacoesDisponiveis.map((g) => (
                      <option key={g.valor} value={g.valor}>{g.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
                {erros.graduacao && <p className="text-red-400 text-xs mt-1">{erros.graduacao}</p>}
                {form.graduacao && (
                  <p className="text-slate-500 text-xs mt-1">
                    ⚠️ Sua graduação não poderá ser reduzida após salvar.
                  </p>
                )}
              </div>

              {/* PRÉVIA DA FAIXA — aparece ao selecionar modalidade + graduação */}
              {form.modalidade && form.graduacao && (
                <div className="sm:col-span-2 flex flex-col items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl py-5 px-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Sua faixa atual</p>
                  <FaixaVisual
                    modalidade={form.modalidade}
                    graduacao={form.graduacao}
                    label={labelGraduacaoAtual}
                    width={280}
                    height={70}
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Academia</label>
                <div className="relative">
                  <input
                    name="academia"
                    value={form.academia}
                    onChange={handleChange}
                    placeholder="Buscar academia pelo nome..."
                    className={inputClass('academia')}
                  />
                  <Search size={16} className="absolute right-3 top-3.5 text-slate-400" />
                </div>
                <p className="text-slate-500 text-xs mt-1">Deixe em branco se não tiver academia.</p>
              </div>
            </div>
          </div>

          {/* AVISO FAIXA PRETA */}
          {ehFaixaPreta && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 flex gap-3">
              <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm">
                Atletas de Faixa Preta precisam enviar comprovação (certificado, foto com faixa ou histórico).
                Você poderá fazer isso após o cadastro na área do seu perfil.
              </p>
            </div>
          )}

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando perfil...
              </span>
            ) : (
              'Criar meu perfil de atleta'
            )}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Já tem uma conta?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
}