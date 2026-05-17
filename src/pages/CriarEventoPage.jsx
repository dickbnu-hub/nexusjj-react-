import { useState, useRef } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { criarEvento } from '../api/eventosService';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function CriarEventoPage() {
  const [form, setForm] = useState({
    nome: '', descricao: '',
    dataEvento: '', dataFimEvento: '',
    ginasio: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
    permiteCancelamento: false, dataLimiteCancelamento: '',
    permiteEstorno: false, dataLimiteEstorno: '',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const logoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErro('');
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    try {
      const ext = logoFile.name.split('.').pop();
      const path = `eventos/${Date.now()}.${ext}`;
      await supabase.storage.from('avatars').upload(path, logoFile, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      return publicUrl;
    } catch(e) { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.dataEvento || !form.cidade) {
      setErro('Preencha nome, data e cidade.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const logoUrl = await uploadLogo();

      // Cria o evento
      const evento = await criarEvento({
        nome: form.nome,
        descricao: form.descricao,
        dataEvento: form.dataEvento,
        dataFimEvento: form.dataFimEvento || null,
        ginasio: form.ginasio,
        local: [form.logradouro, form.numero, form.bairro].filter(Boolean).join(', '),
        cidade: form.cidade,
        estado: form.estado,
        organizadorId: user.id,
        logoUrl: logoUrl || null,
        permiteCancelamento: form.permiteCancelamento,
        prazoСancelamento: form.dataLimiteCancelamento || null,
        permiteEstorno: form.permiteEstorno,
        prazoEstorno: form.dataLimiteEstorno || null,
      });

      setSucesso(true);
      setTimeout(() => { window.location.href = `/eventos/${evento.id}/admin`; }, 1500);
    } catch (err) {
      setErro(err.message || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors';

  if (sucesso) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4"/>
        <h2 className="text-white text-2xl font-bold mb-2">Evento criado!</h2>
        <p className="text-slate-400">Redirecionando para o painel do evento...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <a href="/painel/organizador"
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={16} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white text-xl font-bold">Criar Novo Evento</h1>
            <p className="text-slate-500 text-sm">Preencha as informações do evento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {erro && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0"/>
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}

          {/* LOGO + NOME */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Identificação</h2>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                onClick={() => logoRef.current?.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover"/>
                ) : (
                  <div className="text-center">
                    <Camera size={22} className="text-slate-500 mx-auto"/>
                    <p className="text-slate-600 text-xs mt-1">Logo</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-sm font-medium mb-1">Logo do evento</p>
                <p className="text-slate-500 text-xs mb-2">Aparece na credencial dos atletas</p>
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-700 transition-all">
                  <Camera size={12}/> {logoPreview ? 'Trocar' : 'Upload logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome do Evento *</label>
              <input name="nome" value={form.nome} onChange={handleChange}
                placeholder="Ex: Copa NexusJJ 2026" className={ic}/>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange}
                placeholder="Descreva o evento, regras, informações importantes..." rows={3}
                className={ic + ' resize-none'}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Início *</label>
                <input type="date" name="dataEvento" value={form.dataEvento} onChange={handleChange} className={ic}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Término</label>
                <input type="date" name="dataFimEvento" value={form.dataFimEvento} onChange={handleChange}
                  min={form.dataEvento} className={ic}/>
                <p className="text-slate-600 text-xs mt-1">Deixe em branco para 1 dia</p>
              </div>
            </div>
          </div>

          {/* LOCAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Local</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Ginásio / Estabelecimento</label>
              <input name="ginasio" value={form.ginasio} onChange={handleChange}
                placeholder="Ex: Ginásio Municipal, Arena JJ..." className={ic}/>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Logradouro</label>
                <input name="logradouro" value={form.logradouro} onChange={handleChange}
                  placeholder="Rua, Avenida..." className={ic}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Número</label>
                <input name="numero" value={form.numero} onChange={handleChange}
                  placeholder="123" className={ic}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Bairro</label>
              <input name="bairro" value={form.bairro} onChange={handleChange}
                placeholder="Bairro" className={ic}/>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cidade *</label>
                <input name="cidade" value={form.cidade} onChange={handleChange}
                  placeholder="Ex: Blumenau" className={ic}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}
                  className={ic + ' appearance-none'}>
                  <option value="">UF</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CANCELAMENTO E ESTORNO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Políticas</h2>

            <div className={`border rounded-xl p-4 transition-all ${form.permiteCancelamento ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white text-sm font-medium">Permitir cancelamento pelo atleta</p>
                  <p className="text-slate-500 text-xs mt-0.5">Atleta pode cancelar inscrição até a data limite</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, permiteCancelamento: !p.permiteCancelamento }))}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${form.permiteCancelamento ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.permiteCancelamento ? 'left-6' : 'left-1'}`}/>
                </button>
              </div>
              {form.permiteCancelamento && (
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Data limite para cancelamento *</label>
                  <input type="date" name="dataLimiteCancelamento" value={form.dataLimiteCancelamento}
                    onChange={handleChange} className={ic}/>
                </div>
              )}
            </div>

            <div className={`border rounded-xl p-4 transition-all ${form.permiteEstorno ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white text-sm font-medium">Permitir estorno ao atleta</p>
                  <p className="text-slate-500 text-xs mt-0.5">Atleta pode solicitar estorno até a data limite</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, permiteEstorno: !p.permiteEstorno }))}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${form.permiteEstorno ? 'bg-green-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.permiteEstorno ? 'left-6' : 'left-1'}`}/>
                </button>
              </div>
              {form.permiteEstorno && (
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Data limite para estorno *</label>
                  <input type="date" name="dataLimiteEstorno" value={form.dataLimiteEstorno}
                    onChange={handleChange} className={ic}/>
                </div>
              )}
            </div>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3">
            <a href="/painel/organizador"
              className="flex-1 text-center bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm hover:bg-slate-700 transition-all">
              Cancelar
            </a>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar Evento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}