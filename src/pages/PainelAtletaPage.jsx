import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Award, Calendar, MapPin, CheckCircle, Clock, AlertCircle, Edit3, Save, X, Camera, Trophy, Medal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BotaoNotificacao from '../components/ui/BotaoNotificacao';

const ORDEM_FAIXAS = ['Branca','Cinza','Amarela','Laranja','Verde','Azul','Roxa','Marrom','Preta'];
const COR_FAIXA = {
  Branca:'#ffffff', Cinza:'#b4b4b4', Amarela:'#EAD218', Laranja:'#e2871c',
  Verde:'#67C75A', Azul:'#2650FF', Roxa:'#B03BC2', Marrom:'#6F3519', Preta:'#252525'
};

function FaixaBadge({ faixa, size = 'md' }) {
  const cor = COR_FAIXA[faixa] || '#888';
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${sizes[size]} rounded-full border border-white/20 shrink-0`} style={{ backgroundColor: cor }} />
      <span style={{ color: faixa === 'Branca' ? '#cbd5e1' : cor }} className="font-medium">
        Faixa {faixa}
      </span>
    </div>
  );
}

function CredencialModal({ inscricao, atleta, perfil, avatarUrl, onFechar }) {
  const codigo = `NJJ-${inscricao.id.substring(0,8).toUpperCase()}`;
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4 text-white text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">NexusJJ</p>
          <p className="text-lg font-black mt-0.5">{inscricao.eventos?.nome || 'Evento'}</p>
        </div>
        <div className="p-5 text-center">
          <div className="w-20 h-20 rounded-full border-4 border-blue-600 flex items-center justify-center text-3xl font-black text-slate-500 mx-auto mb-3 overflow-hidden bg-slate-200">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" /> : (perfil?.nome || 'A').charAt(0)}
          </div>
          <h2 className="text-slate-900 font-black text-xl">{perfil?.nome}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{atleta?.academia || '—'}</p>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: COR_FAIXA[inscricao.faixa] === '#ffffff' ? '#94a3b8' : COR_FAIXA[inscricao.faixa] }}>
              Faixa {inscricao.faixa}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              {inscricao.entradas?.modalidade || inscricao.entradas?.nome}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 mt-4 text-left space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Categoria</span><span className="text-slate-800 font-medium">{inscricao.entradas?.nome}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Peso</span><span className="text-slate-800 font-medium">{inscricao.peso_categoria}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Status</span><span className="text-green-600 font-bold">✅ Efetivado</span></div>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center">
              <div className="grid grid-cols-7 gap-0.5 w-full h-full">
                {Array.from({length: 49}).map((_, i) => (
                  <div key={i} className={`rounded-sm ${(i * 7 + i) % 3 === 0 ? 'bg-white' : 'bg-slate-900'}`} />
                ))}
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-2 font-mono">{codigo}</p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={onFechar} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-sm">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function PainelAtletaPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [atleta, setAtleta] = useState(null);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('inscricoes');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sugestoesAcademia, setSugestoesAcademia] = useState([]);
  const [buscandoAcademia, setBuscandoAcademia] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [credencialAberta, setCredencialAberta] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [historicoFaixas, setHistoricoFaixas] = useState([]);
  const [form, setForm] = useState({ nome: '', academia: '', peso: '', faixa: '', telefone: '' });

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const [perfilRes, atletaRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('atletas').select('*').eq('profile_id', user.id).single(),
      ]);

      if (perfilRes.data) {
        setPerfil(perfilRes.data);
        setForm(p => ({ ...p, nome: perfilRes.data.nome || '', academia: perfilRes.data.academia || '', telefone: perfilRes.data.telefone || '', sexo: perfilRes.data.sexo || '', data_nascimento: perfilRes.data.data_nascimento || '' }));
        // Carrega avatar
        if (perfilRes.data.avatar_url) setAvatarUrl(perfilRes.data.avatar_url);
      }
      if (atletaRes.data) {
        setAtleta(atletaRes.data);
        setForm(p => ({ ...p, peso: atletaRes.data.peso || '', faixa: atletaRes.data.faixa || '' }));

        // Carrega histórico de faixas
        const { data: hfData } = await supabase
          .from('historico_faixas')
          .select('*')
          .eq('atleta_id', atletaRes.data.id)
          .order('data_graduacao', { ascending: false });
        if (hfData) setHistoricoFaixas(hfData);
      }

      if (atletaRes.data) {
        const { data: inscData } = await supabase
          .from('inscricoes_entrada')
          .select('*, eventos:evento_id(id, nome, data_evento, local, cidade, estado, permite_cancelamento, prazo_cancelamento), entradas:entrada_id(nome, modalidade)')
          .eq('atleta_id', atletaRes.data.id)
          .order('created_at', { ascending: false });
        if (inscData) setInscricoes(inscData);
      }
    } catch (e) {
      setErro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('fotos-atletas').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('fotos-atletas').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
      setSucesso('Foto atualizada!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) {
      setErro('Erro ao fazer upload: ' + e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const buscarAcademias = async (termo) => {
    if (!termo || termo.length < 2) { setSugestoesAcademia([]); return; }
    setBuscandoAcademia(true);
    try {
      const { data } = await supabase.from('academias').select('id,nome,cidade,estado').ilike('nome', `%${termo}%`).limit(5);
      setSugestoesAcademia(data || []);
    } catch { setSugestoesAcademia([]); }
    finally { setBuscandoAcademia(false); }
  };

  const salvarPerfil = async () => {
    setSalvando(true);
    setErro('');
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Verifica se atleta já participou de algum evento pela plataforma
      const { data: inscricoesAtleta } = await supabase
        .from('inscricoes_entrada')
        .select('id')
        .eq('atleta_id', atleta?.id)
        .in('status_pagamento', ['aprovado', 'confirmado'])
        .limit(1);
      const participouEvento = inscricoesAtleta && inscricoesAtleta.length > 0;

      // RESTRIÇÃO: nome bloqueado se participou de evento
      if (participouEvento && form.nome !== perfil?.nome) {
        setErro('Seu nome não pode ser alterado após participar de um evento pela plataforma. Entre em contato com a NexusJJ.');
        setSalvando(false);
        return;
      }

      // RESTRIÇÃO: downgrade de faixa sempre bloqueado
      const idxAtual = ORDEM_FAIXAS.indexOf(atleta?.faixa || 'Branca');
      const idxNova = ORDEM_FAIXAS.indexOf(form.faixa);
      if (idxNova < idxAtual) {
        setErro('Não é possível reduzir sua faixa. Somente a NexusJJ pode fazer isso.');
        setSalvando(false);
        return;
      }

      // Upgrade de faixa é sempre permitido — faixa antiga fica salva no histórico

      // Se mudou de faixa → registra no histórico (só chega aqui se não participou de evento)
      if (form.faixa !== atleta?.faixa) {
        await supabase.from('historico_faixas').insert({
          atleta_id: atleta.id,
          faixa: form.faixa,
          data_graduacao: new Date().toISOString().split('T')[0],
        });
        setHistoricoFaixas(prev => [{
          faixa: form.faixa,
          data_graduacao: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        }, ...prev]);
      }

      const [r1, r2] = await Promise.all([
        supabase.from('profiles').update({ nome: form.nome, telefone: form.telefone, sexo: form.sexo || null, data_nascimento: form.data_nascimento || null }).eq('id', user.id),
        supabase.from('atletas').update({ peso: form.peso ? parseFloat(form.peso) : null, faixa: form.faixa, academia: form.academia }).eq('id', atleta.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;

      setPerfil(p => ({ ...p, nome: form.nome, sexo: form.sexo, data_nascimento: form.data_nascimento }));
      setAtleta(p => ({ ...p, peso: form.peso, faixa: form.faixa, academia: form.academia }));
      setEditando(false);
      setSucesso('Perfil atualizado!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) {
      setErro('Erro ao salvar: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Histórico de medalhas
  const medalhas = inscricoes.filter(i => i.podio);
  const ouros = medalhas.filter(i => i.podio === 1).length;
  const pratas = medalhas.filter(i => i.podio === 2).length;
  const bronzes = medalhas.filter(i => i.podio === 3).length;

  const statusConfig = {
    pendente: { label: 'Pendente', cor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
    pago: { label: 'Pago', cor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle },
    cancelado: { label: 'Cancelado', cor: 'bg-red-500/10 text-red-400 border-red-500/20', icon: X },
  };

  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header — card do atleta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4">
            {/* Avatar com upload */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                  : <span className="text-2xl font-black text-blue-400">{(perfil?.nome || 'A').charAt(0)}</span>
                }
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all border-2 border-slate-900">
                {uploadingAvatar
                  ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={11} className="text-white" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl truncate">{perfil?.nome || 'Atleta'}</h1>
              {/* Faixa visual */}
              {atleta?.faixa && (
                <div className="flex items-center gap-2 mt-1.5 mb-1">
                  <div className="flex-1 h-2 rounded-full relative overflow-hidden" style={{ backgroundColor: COR_FAIXA[atleta.faixa] || '#888', boxShadow: `0 0 8px ${COR_FAIXA[atleta.faixa]}66` }}>
                    {/* Faixa preta tem detalhes brancos */}
                    {atleta.faixa === 'Preta' && (
                      <div className="absolute right-2 top-0 bottom-0 flex items-center gap-0.5">
                        <div className="w-1 h-full bg-white/30 rounded" />
                      </div>
                    )}
                    {/* Faixa branca tem borda */}
                    {atleta.faixa === 'Branca' && (
                      <div className="absolute inset-0 border border-slate-600 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: atleta.faixa === 'Branca' ? '#cbd5e1' : COR_FAIXA[atleta.faixa] }}>
                    {atleta.faixa}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {perfil?.sexo && <span className="text-slate-500 text-xs">{perfil.sexo}</span>}
                {atleta?.peso && <span className="text-slate-500 text-xs">{atleta.peso}kg</span>}
              </div>
              {atleta?.academia && <p className="text-slate-500 text-xs mt-0.5">{atleta.academia}</p>}
            </div>

            {/* Stats rápidos */}
            <div className="flex gap-3 shrink-0">
              <div className="text-center">
                <p className="text-white font-black text-xl">{inscricoes.length}</p>
                <p className="text-slate-500 text-xs">eventos</p>
              </div>
              {medalhas.length > 0 && (
                <div className="text-center">
                  <p className="text-yellow-400 font-black text-xl">{medalhas.length}</p>
                  <p className="text-slate-500 text-xs">medalhas</p>
                </div>
              )}
            </div>
          </div>

          {/* Contador de medalhas */}
          {medalhas.length > 0 && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
              {ouros > 0 && <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5"><span>🥇</span><span className="text-yellow-400 font-bold text-sm">{ouros}</span></div>}
              {pratas > 0 && <div className="flex items-center gap-1.5 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5"><span>🥈</span><span className="text-slate-300 font-bold text-sm">{pratas}</span></div>}
              {bronzes > 0 && <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5"><span>🥉</span><span className="text-orange-400 font-bold text-sm">{bronzes}</span></div>}
            </div>
          )}
        </div>

        {sucesso && <div className="bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-sm">{sucesso}</p></div>}
        {erro && <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-sm">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400">✕</button></div>}

        {/* Abas */}
        <div className="flex gap-2 mb-5">
          {[
            { id:'inscricoes', label:'Inscrições' },
            { id:'historico', label:'Histórico' },
            { id:'perfil', label:'Meu Perfil' },
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${aba === a.id ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ABA INSCRIÇÕES */}
        {aba === 'inscricoes' && (
          <div className="space-y-3">
            {inscricoes.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
                <Calendar size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Nenhuma inscrição ainda</p>
                <a href="/eventos" className="inline-flex items-center gap-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">Ver Eventos</a>
              </div>
            ) : (
              inscricoes.map(insc => {
                const st = statusConfig[insc.status_pagamento] || statusConfig.pendente;
                const StatusIcon = st.icon;
                const dataEvento = insc.eventos?.data_evento ? new Date(insc.eventos.data_evento).toLocaleDateString('pt-BR') : '—';
                const efetivado = insc.aprovado;
                return (
                  <div key={insc.id} className={`bg-slate-900 border rounded-2xl overflow-hidden ${efetivado ? 'border-green-500/30' : 'border-slate-800'}`}>
                    {efetivado && (
                      <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-1.5 flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-400" />
                        <span className="text-green-400 text-xs font-bold">Efetivado</span>
                        {insc.podio === 1 && <span className="ml-auto">🥇</span>}
                        {insc.podio === 2 && <span className="ml-auto">🥈</span>}
                        {insc.podio === 3 && <span className="ml-auto">🥉</span>}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-white font-bold">{insc.eventos?.nome || 'Evento'}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className="text-slate-500 text-xs flex items-center gap-1"><Calendar size={11}/> {dataEvento}</p>
                            {insc.eventos?.cidade && <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={11}/> {insc.eventos.cidade}/{insc.eventos.estado}</p>}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${st.cor}`}>
                          <StatusIcon size={10}/> {st.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-800 rounded-xl px-3 py-2">
                          <p className="text-slate-500 text-xs">Categoria</p>
                          <p className="text-white text-xs font-medium mt-0.5 truncate">{insc.entradas?.nome || '—'}</p>
                        </div>
                        <div className="bg-slate-800 rounded-xl px-3 py-2">
                          <p className="text-slate-500 text-xs">Faixa</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: COR_FAIXA[insc.faixa] || '#888' }} />
                            <p className="text-white text-xs font-medium">{insc.faixa}</p>
                          </div>
                        </div>
                        <div className="bg-slate-800 rounded-xl px-3 py-2">
                          <p className="text-slate-500 text-xs">Peso</p>
                          <p className="text-white text-xs font-medium mt-0.5 truncate">{insc.peso_categoria || '—'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {insc.status_pagamento === 'pendente' && (
                          <button onClick={() => navigate(`/eventos/${insc.evento_id}/pagamento`)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                            💳 Pagar agora
                          </button>
                        )}
                        {efetivado && (
                          <button onClick={() => window.open(`/credencial/${perfil?.id}/${insc.evento_id}`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 hover:border-green-500 text-green-400 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                            🪪 Credencial
                          </button>
                        )}
                        {insc.eventos?.permite_cancelamento && insc.status_pagamento !== 'cancelado' && (() => {
                          const prazo = insc.eventos?.prazo_cancelamento;
                          const ok = !prazo || new Date() <= new Date(prazo + 'T23:59:59');
                          return ok ? (
                            <button onClick={async () => {
                              if (!window.confirm('Cancelar esta inscrição?')) return;
                              await supabase.from('inscricoes_entrada').update({ status_pagamento: 'cancelado' }).eq('id', insc.id);
                              setInscricoes(prev => prev.map(i => i.id === insc.id ? { ...i, status_pagamento: 'cancelado' } : i));
                            }} className="flex items-center justify-center gap-1 bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white font-bold px-3 py-2.5 rounded-xl text-sm transition-all">
                              ✕
                            </button>
                          ) : null;
                        })()}
                        <a href={`/eventos/${insc.evento_id}`} className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                          Ver
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {aba === 'historico' && (
          <div className="space-y-4">
            {/* Resumo de medalhas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Trophy size={16} className="text-yellow-400"/> Resumo de Conquistas</h3>
              {medalhas.length === 0 ? (
                <div className="text-center py-6">
                  <Medal size={32} className="text-slate-700 mx-auto mb-2"/>
                  <p className="text-slate-500 text-sm">Nenhuma medalha ainda</p>
                  <p className="text-slate-600 text-xs mt-1">Participe de eventos para conquistar medalhas!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl">🥇</p>
                      <p className="text-yellow-400 font-black text-xl">{ouros}</p>
                      <p className="text-slate-500 text-xs">Ouro</p>
                    </div>
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-3 text-center">
                      <p className="text-2xl">🥈</p>
                      <p className="text-slate-300 font-black text-xl">{pratas}</p>
                      <p className="text-slate-500 text-xs">Prata</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl">🥉</p>
                      <p className="text-orange-400 font-black text-xl">{bronzes}</p>
                      <p className="text-slate-500 text-xs">Bronze</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {medalhas.map(insc => (
                      <div key={insc.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                        <span className="text-xl shrink-0">{insc.podio === 1 ? '🥇' : insc.podio === 2 ? '🥈' : '🥉'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{insc.eventos?.nome}</p>
                          <p className="text-slate-500 text-xs">{insc.entradas?.nome} · {insc.faixa} · {insc.peso_categoria}</p>
                        </div>
                        <p className="text-slate-500 text-xs shrink-0">
                          {insc.eventos?.data_evento ? new Date(insc.eventos.data_evento).getFullYear() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Histórico de faixas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Award size={16} className="text-blue-400"/> Histórico de Graduações
              </h3>
              {historicoFaixas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Nenhuma graduação registrada ainda</p>
                  <p className="text-slate-600 text-xs mt-1">Ao atualizar sua faixa no perfil, ela será registrada aqui</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historicoFaixas.map((h, i) => (
                    <div key={h.id || i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${i === 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0" style={{ backgroundColor: COR_FAIXA[h.faixa] || '#888' }} />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Faixa {h.faixa}</p>
                        {h.observacao && <p className="text-slate-500 text-xs">{h.observacao}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">{new Date(h.data_graduacao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        {i === 0 && <p className="text-blue-400 text-xs font-bold">Atual</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Todos os eventos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-400"/> Todos os Eventos ({inscricoes.length})</h3>
              {inscricoes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Nenhum evento ainda</p>
              ) : (
                <div className="space-y-2">
                  {inscricoes.map(insc => (
                    <div key={insc.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                        {insc.podio === 1 ? <span>🥇</span> : insc.podio === 2 ? <span>🥈</span> : insc.podio === 3 ? <span>🥉</span> : <Calendar size={14} className="text-blue-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{insc.eventos?.nome}</p>
                        <p className="text-slate-500 text-xs">{insc.entradas?.nome} · Faixa {insc.faixa}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-slate-500 text-xs">{insc.eventos?.data_evento ? new Date(insc.eventos.data_evento).toLocaleDateString('pt-BR') : ''}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${insc.status_pagamento === 'pago' ? 'text-green-400' : insc.status_pagamento === 'cancelado' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {insc.status_pagamento === 'pago' ? 'Pago' : insc.status_pagamento === 'cancelado' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA PERFIL */}
        {aba === 'perfil' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Meus Dados</h3>
              {!editando ? (
                <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  <Edit3 size={14}/> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditando(false); setErro(''); }} className="flex items-center gap-1 text-slate-500 hover:text-white text-sm transition-colors">
                    <X size={14}/> Cancelar
                  </button>
                  <button onClick={salvarPerfil} disabled={salvando} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-all">
                    <Save size={14}/> {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>

            {editando ? (
              <div className="space-y-3">
                <div><label className="text-slate-400 text-xs mb-1.5 block">Nome completo</label><input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className={ic}/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Telefone</label><input value={form.telefone||''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(47) 99999-9999" className={ic}/></div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Data de Nascimento</label><input type="date" value={form.data_nascimento||''} onChange={e => setForm(p => ({ ...p, data_nascimento: e.target.value }))} className={ic}/></div>
                <div>
                  <label className="text-slate-400 text-xs mb-2 block">Sexo</label>
                  <div className="flex gap-2">
                    {['Masculino','Feminino'].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, sexo: s }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${form.sexo === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <label className="text-slate-400 text-xs mb-1.5 block">Academia</label>
                  <input value={form.academia||''} onChange={e => { setForm(p => ({ ...p, academia: e.target.value })); buscarAcademias(e.target.value); }} placeholder="Nome da academia" className={ic} autoComplete="off"/>
                  {sugestoesAcademia.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                      {sugestoesAcademia.map(a => (
                        <button key={a.id} type="button" onClick={() => { setForm(p => ({ ...p, academia: a.nome })); setSugestoesAcademia([]); }}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0">
                          <span className="font-medium">{a.nome}</span>
                          {a.cidade && <span className="text-slate-400 text-xs ml-2">{a.cidade}{a.estado ? `, ${a.estado}` : ''}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.academia && form.academia.length >= 3 && sugestoesAcademia.length === 0 && !buscandoAcademia && (
                    <p className="text-slate-500 text-xs mt-1.5">Academia não encontrada. <a href="https://wa.me/5547999999999?text=Olá!%20Quero%20cadastrar%20minha%20academia%20na%20NexusJJ" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">Peça ao professor via WhatsApp →</a></p>
                  )}
                </div>
                <div><label className="text-slate-400 text-xs mb-1.5 block">Peso (kg)</label><input type="number" value={form.peso} onChange={e => setForm(p => ({ ...p, peso: e.target.value }))} placeholder="Ex: 76" min="0" className={ic}/></div>
                <div>
                  <label className="text-slate-400 text-xs mb-2 block">Faixa</label>
                  <div className="flex flex-wrap gap-2">
                    {ORDEM_FAIXAS.map(f => {
                      const bloqueada = ORDEM_FAIXAS.indexOf(f) < ORDEM_FAIXAS.indexOf(atleta?.faixa || 'Branca');
                      return (
                        <button key={f} type="button" onClick={() => !bloqueada && setForm(p => ({ ...p, faixa: f }))}
                          disabled={bloqueada} title={bloqueada ? 'Não é possível fazer downgrade' : ''}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.faixa === f ? 'ring-2 ring-blue-500/50 scale-105' : ''} ${bloqueada ? 'opacity-25 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                          style={{ backgroundColor: COR_FAIXA[f] + '22', borderColor: form.faixa === f ? '#3b82f6' : COR_FAIXA[f] + '60' }}>
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: COR_FAIXA[f] }}/>
                          <span style={{ color: f === 'Branca' ? '#cbd5e1' : COR_FAIXA[f] }}>{f}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5">Faixas anteriores bloqueadas — só é permitido upgrade</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Nome', valor: perfil?.nome },
                  { label: 'Email', valor: perfil?.email },
                  { label: 'Telefone', valor: perfil?.telefone || '—' },
                  { label: 'Nascimento', valor: perfil?.data_nascimento ? new Date(perfil.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                  { label: 'Sexo', valor: perfil?.sexo || '—' },
                  { label: 'Academia', valor: atleta?.academia || '—' },
                  { label: 'Professor', valor: atleta?.academias?.profiles?.nome ? `Prof. ${atleta.academias.profiles.nome}` : '—' },
                  { label: 'Peso', valor: atleta?.peso ? `${atleta.peso} kg` : '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                    <p className="text-slate-500 text-sm">{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.valor || '—'}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                  <p className="text-slate-500 text-sm">Faixa</p>
                  {atleta?.faixa ? <FaixaBadge faixa={atleta.faixa} /> : <p className="text-white text-sm">—</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {credencialAberta && (
        <CredencialModal
          inscricao={credencialAberta}
          atleta={atleta}
          perfil={perfil}
          avatarUrl={avatarUrl}
          onFechar={() => setCredencialAberta(null)}
        />
      )}

      {/* Notificações Push */}
      <div className="mt-4 px-4 pb-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">🔔 Notificações de Luta</p>
        <BotaoNotificacao atletaId={atleta?.id} />
      </div>
    </div>
  );
}