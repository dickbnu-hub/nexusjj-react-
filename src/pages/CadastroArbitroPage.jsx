import { useState } from 'react';
import { Camera, ChevronDown, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';

const MODALIDADES_DISPONIVEIS = [
  { valor: 'jiu-jitsu', label: 'Jiu-Jitsu (Gi & NoGi)' },
  { valor: 'judo', label: 'Judô' },
  { valor: 'kung-fu', label: 'Kung Fu' },
  { valor: 'mma', label: 'MMA' },
];

const NIVEIS_ARBITRAGEM = {
  'jiu-jitsu': ['Árbitro de Mesa', 'Árbitro de Tapete', 'Árbitro Central', 'Árbitro Supervisor'],
  'judo':      ['Árbitro Regional', 'Árbitro Nacional', 'Árbitro Internacional IJF'],
  'kung-fu':   ['Árbitro Nível 1', 'Árbitro Nível 2', 'Árbitro Nível 3'],
  'mma':       ['Árbitro Júnior', 'Árbitro Pleno', 'Árbitro Sênior'],
};

export default function CadastroArbitroPage() {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erros, setErros] = useState({});

  const [form, setForm] = useState({
    nome: '', sobrenome: '', cpf: '', dataNascimento: '',
    telefone: '', instagram: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  });

  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState([
    { modalidade: '', nivel: '' },
  ]);

  const [documentos, setDocumentos] = useState([]);
  const [cepLoading, setCepLoading] = useState(false);

  const inputClass = (campo) =>
    `w-full bg-slate-800 border ${erros[campo] ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors`;

  const formatarCPF = (v) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

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

  const adicionarModalidade = () => {
    if (modalidadesSelecionadas.length < MODALIDADES_DISPONIVEIS.length) {
      setModalidadesSelecionadas([...modalidadesSelecionadas, { modalidade: '', nivel: '' }]);
    }
  };

  const removerModalidade = (i) => setModalidadesSelecionadas(modalidadesSelecionadas.filter((_, idx) => idx !== i));

  const atualizarModalidade = (i, campo, valor) => {
    const updated = [...modalidadesSelecionadas];
    updated[i][campo] = valor;
    if (campo === 'modalidade') updated[i].nivel = '';
    setModalidadesSelecionadas(updated);
  };

  const modalidadesUsadas = modalidadesSelecionadas.map(m => m.modalidade).filter(Boolean);

  const handleDocumento = (e) => {
    const files = Array.from(e.target.files);
    setDocumentos(prev => [...prev, ...files].slice(0, 5));
  };

  const removerDocumento = (i) => setDocumentos(documentos.filter((_, idx) => idx !== i));

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!form.sobrenome.trim()) e.sobrenome = 'Sobrenome é obrigatório.';
    if (!form.cpf || form.cpf.length < 14) e.cpf = 'CPF inválido.';
    if (!form.dataNascimento) e.dataNascimento = 'Data de nascimento é obrigatória.';
    else if (calcularIdade(form.dataNascimento) < 18) e.dataNascimento = 'Você precisa ter 18 anos ou mais.';
    if (!form.telefone) e.telefone = 'Telefone é obrigatório.';
    if (!form.cep || form.cep.length < 9) e.cep = 'CEP inválido.';
    if (!form.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório.';
    if (!form.numero.trim()) e.numero = 'Número é obrigatório.';
    const temModalidade = modalidadesSelecionadas.some(m => m.modalidade && m.nivel);
    if (!temModalidade) e.modalidades = 'Selecione ao menos uma modalidade e nível.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSucesso(true); }, 1500);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro realizado!</h2>
          <p className="text-slate-400 mb-2">Seu perfil de árbitro foi criado com sucesso.</p>
          <p className="text-slate-500 text-sm mb-6">Seus documentos estão em análise. Você será notificado em breve.</p>
          <a href="/" className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
            Ir para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-dark px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-3xl" />
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
          <h1 className="text-2xl font-bold text-white">Cadastro de Árbitro</h1>
          <p className="text-slate-400 text-sm mt-1">Árbitros credenciados para eventos nacionais</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8">

          {/* FOTO */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                {fotoPreview
                  ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                  : <Camera size={32} className="text-slate-500" />
                }
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-500 rounded-full p-1.5 cursor-pointer transition-colors">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) setFotoPreview(URL.createObjectURL(f)); }} className="hidden" />
              </label>
            </div>
            <p className="text-slate-500 text-xs">Foto do árbitro (opcional)</p>
          </div>

          {/* DADOS PESSOAIS */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome *</label>
                <input value={form.nome} onChange={e => { setForm(p => ({ ...p, nome: e.target.value })); setErros(er => ({ ...er, nome: '' })); }} placeholder="Seu nome" className={inputClass('nome')} />
                {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Sobrenome *</label>
                <input value={form.sobrenome} onChange={e => { setForm(p => ({ ...p, sobrenome: e.target.value })); setErros(er => ({ ...er, sobrenome: '' })); }} placeholder="Seu sobrenome" className={inputClass('sobrenome')} />
                {erros.sobrenome && <p className="text-red-400 text-xs mt-1">{erros.sobrenome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">CPF *</label>
                <input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))} placeholder="000.000.000-00" className={inputClass('cpf')} />
                {erros.cpf && <p className="text-red-400 text-xs mt-1">{erros.cpf}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Nascimento *</label>
                <input type="date" value={form.dataNascimento} onChange={e => { setForm(p => ({ ...p, dataNascimento: e.target.value })); setErros(er => ({ ...er, dataNascimento: '' })); }} className={inputClass('dataNascimento')} />
                {erros.dataNascimento && <p className="text-red-400 text-xs mt-1">{erros.dataNascimento}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefone / WhatsApp *</label>
                <input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: formatarTelefone(e.target.value) }))} placeholder="(00) 00000-0000" className={inputClass('telefone')} />
                {erros.telefone && <p className="text-red-400 text-xs mt-1">{erros.telefone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Instagram</label>
                <input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@seuperfil" className={inputClass('instagram')} />
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
                  <input value={form.cep} onChange={e => { const v = formatarCEP(e.target.value); setForm(p => ({ ...p, cep: v })); if (v.replace(/\D/g, '').length === 8) buscarCEP(v); }} placeholder="00000-000" className={inputClass('cep')} />
                  {cepLoading && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>}
                </div>
                {erros.cep && <p className="text-red-400 text-xs mt-1">{erros.cep}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro *</label>
                <input value={form.logradouro} onChange={e => setForm(p => ({ ...p, logradouro: e.target.value }))} placeholder="Rua, Avenida..." className={inputClass('logradouro')} />
                {erros.logradouro && <p className="text-red-400 text-xs mt-1">{erros.logradouro}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Número *</label>
                <input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="123" className={inputClass('numero')} />
                {erros.numero && <p className="text-red-400 text-xs mt-1">{erros.numero}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Complemento</label>
                <input value={form.complemento} onChange={e => setForm(p => ({ ...p, complemento: e.target.value }))} placeholder="Apto, Bloco..." className={inputClass('complemento')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
                <input value={form.bairro} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} placeholder="Bairro" className={inputClass('bairro')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade</label>
                <input value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" className={inputClass('cidade')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                <input value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} placeholder="UF" maxLength={2} className={inputClass('estado')} />
              </div>
            </div>
          </div>

          {/* MODALIDADES CREDENCIADAS */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-1 pb-2 border-b border-slate-800">Modalidades Credenciadas</h3>
            <p className="text-slate-500 text-xs mb-4">Selecione as modalidades que você está credenciado para arbitrar e seu nível em cada uma.</p>

            <div className="space-y-3">
              {modalidadesSelecionadas.map((item, i) => {
                const niveisDisponiveis = item.modalidade ? NIVEIS_ARBITRAGEM[item.modalidade] : [];
                const modalDisponveis = MODALIDADES_DISPONIVEIS.filter(m => !modalidadesUsadas.includes(m.valor) || m.valor === item.modalidade);
                return (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Modalidade</label>
                      <div className="relative">
                        <select value={item.modalidade} onChange={e => atualizarModalidade(i, 'modalidade', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-orange-500">
                          <option value="">Selecione</option>
                          {modalDisponveis.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Nível</label>
                        <div className="relative">
                          <select value={item.nivel} onChange={e => atualizarModalidade(i, 'nivel', e.target.value)} disabled={!item.modalidade} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-orange-500 disabled:opacity-40">
                            <option value="">{item.modalidade ? 'Selecione' : 'Primeiro a modalidade'}</option>
                            {niveisDisponiveis.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      {modalidadesSelecionadas.length > 1 && (
                        <button type="button" onClick={() => removerModalidade(i)} className="text-red-400 hover:text-red-300 pb-2.5 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {modalidadesSelecionadas.length < MODALIDADES_DISPONIVEIS.length && (
                <button type="button" onClick={adicionarModalidade} className="flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm transition-colors">
                  <Plus size={16} /> Adicionar outra modalidade
                </button>
              )}
            </div>
            {erros.modalidades && <p className="text-red-400 text-xs mt-2">{erros.modalidades}</p>}
          </div>

          {/* DOCUMENTOS */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-1 pb-2 border-b border-slate-800">Documentos de Credenciamento</h3>
            <p className="text-slate-500 text-xs mb-4">Envie seu certificado de árbitro, carteirinha ou comprovante de credenciamento. Máximo 5 arquivos.</p>

            <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center mb-3">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Plus size={20} className="text-orange-400" />
                  </div>
                  <p className="text-slate-300 text-sm font-medium">Clique para enviar documentos</p>
                  <p className="text-slate-500 text-xs">PDF, JPG ou PNG — até 5 arquivos</p>
                </div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleDocumento} className="hidden" />
              </label>
            </div>

            {documentos.length > 0 && (
              <div className="space-y-2">
                {documentos.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5">
                    <span className="text-slate-300 text-sm truncate">{doc.name}</span>
                    <button type="button" onClick={() => removerDocumento(i)} className="text-red-400 hover:text-red-300 ml-3 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mt-4 flex gap-3">
              <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs leading-relaxed">
                Seus documentos serão analisados pela equipe NexusJJ. O credenciamento tem validade de <strong>1 ano</strong> e pode ser renovado a critério da organização.
              </p>
            </div>
          </div>

          {/* BOTÃO */}
          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-orange-600/20 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando perfil...
              </span>
            ) : 'Criar perfil de Árbitro'}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Já tem uma conta? <a href="/login" className="text-blue-400 hover:text-blue-300">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
}