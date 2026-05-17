import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, X, AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLUNA1 = [
  { value: 'idade_ano', label: 'Idade no ano' },
  { value: 'idade_evento', label: 'Idade no evento' },
  { value: 'genero', label: 'Gênero/Sexo' },
  { value: 'faixa', label: 'Faixa' },
];
const COLUNA2 = {
  idade_ano: ['maior_que','menor_que','igual','diferente'],
  idade_evento: ['maior_que','menor_que','igual','diferente'],
  genero: ['igual','diferente'],
  faixa: ['igual','diferente'],
};
const C2LABEL = { igual:'É', diferente:'Não é', maior_que:'Maior que', menor_que:'Menor que' };
const COLUNA3_STATIC = {
  genero: ['Masculino', 'Feminino'],
};

function getColuna3Opcoes(campo, faixas) {
  if (campo === 'genero') return ['Masculino', 'Feminino'];
  if (campo === 'faixa') return faixas?.map(f => f.nome) || ['Branca','Cinza','Amarela','Laranja','Verde','Azul','Roxa','Marrom','Preta'];
  return null;
}

function ModalValor({ bloco, valor, faixas, onSalvar, onFechar }) {
  const editando = !!valor;
  const [form, setForm] = useState({
    nome: valor?.nome||'',
    descricao: valor?.descricao||'',
    peso_min: valor?.peso_min||'',
    peso_max: valor?.peso_max||'',
    genero: valor?.genero||'ambos',
    faixas: valor?.faixas||[]
  });
  const [regras, setRegras] = useState(
    valor?.regras_valor?.length > 0
      ? valor.regras_valor
      : [{ coluna1:'idade_ano', coluna2:'maior_que', coluna3:'' }]
  );

  const addRegra = () => setRegras(p => [...p, { coluna1:'idade_ano', coluna2:'maior_que', coluna3:'' }]);
  const updRegra = (i, k, v) => setRegras(p => p.map((r,idx) => {
    if(idx!==i) return r;
    const n={...r,[k]:v};
    if(k==='coluna1'){n.coluna2=COLUNA2[v][0];n.coluna3='';}
    return n;
  }));

  const sc = 'bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500';
  const ic = 'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-white font-bold text-sm">{editando ? 'Editar' : 'Adicionar'} Valor — {bloco.nome}</h3>
          <button onClick={onFechar}><X size={16} className="text-slate-500 hover:text-white" /></button>
        </div>
        <div className="p-4 space-y-3">
          {bloco.tipo === 'sexo' ? (
            <div>
              <label className="text-slate-500 text-xs block mb-2">Selecione o gênero *</label>
              <div className="flex gap-2">
                {['Masculino', 'Feminino'].map(g => (
                  <button key={g} type="button"
                    onClick={() => setForm(p => ({ ...p, nome: g }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${form.nome === g ? g === 'Masculino' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                    {g === 'Masculino' ? '♂ Masculino' : '♀ Feminino'}
                  </button>
                ))}
              </div>
            </div>
          ) : bloco.tipo === 'faixa' ? (
            <div className="space-y-3">
              <div>
                <label className="text-slate-500 text-xs block mb-1">Nome do grupo de faixa *</label>
                <input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))}
                  placeholder="Ex: Branca, Colorida, Graduada..." className={ic} />
                <p className="text-slate-600 text-xs mt-1">Ex: "Branca" para faixa única, "Colorida" para múltiplas faixas agrupadas</p>
              </div>
              <div>
                <label className="text-slate-500 text-xs block mb-2">Faixas incluídas neste grupo *</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {nome:'Branca',cor:'#ffffff'},{nome:'Cinza',cor:'#b4b4b4'},{nome:'Amarela',cor:'#EAD218'},
                    {nome:'Laranja',cor:'#e2871c'},{nome:'Verde',cor:'#67C75A'},{nome:'Azul',cor:'#2650FF'},
                    {nome:'Roxa',cor:'#B03BC2'},{nome:'Marrom',cor:'#6F3519'},{nome:'Preta',cor:'#252525'}
                  ].map(f => {
                    const selecionada = (form.faixas || []).includes(f.nome);
                    return (
                      <button key={f.nome} type="button"
                        onClick={() => setForm(p => {
                          const atual = p.faixas || [];
                          const novo = atual.includes(f.nome) ? atual.filter(x => x !== f.nome) : [...atual, f.nome];
                          // Se só uma faixa selecionada e nome vazio, sugere o nome
                          const nomeAuto = novo.length === 1 && !p.nome ? novo[0] : p.nome;
                          return { ...p, faixas: novo, nome: nomeAuto };
                        })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selecionada ? 'ring-2 ring-blue-500/40 scale-105' : 'border-slate-700 hover:border-slate-500'}`}
                        style={{ backgroundColor: f.cor + '22', borderColor: selecionada ? '#3b82f6' : f.cor + '60' }}>
                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: f.cor }} />
                        <span style={{ color: f.cor === '#ffffff' ? '#cbd5e1' : f.cor }}>{f.nome}</span>
                        {selecionada && <span style={{ color: '#60a5fa' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {(form.faixas || []).length > 0 && (
                  <p className="text-blue-400 text-xs mt-2">
                    ✓ {(form.faixas || []).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ) : bloco.tipo === 'peso' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-slate-500 text-xs block mb-1">Peso início (kg)</label><input type="number" value={form.peso_min} onChange={e=>setForm(p=>({...p,peso_min:e.target.value}))} placeholder="0" className={ic} /></div>
                <div><label className="text-slate-500 text-xs block mb-1">Peso limite (kg)</label><input type="number" value={form.peso_max} onChange={e=>setForm(p=>({...p,peso_max:e.target.value}))} placeholder="76" className={ic} /></div>
              </div>
              <div><label className="text-slate-500 text-xs block mb-1">Nome *</label><input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: Até 76kg (Leve)" className={ic} /></div>
              <div>
                <label className="text-slate-500 text-xs block mb-1">Válido para</label>
                <select value={form.genero||'ambos'} onChange={e=>setForm(p=>({...p,genero:e.target.value}))}
                  className={ic}>
                  <option value="ambos">Masculino e Feminino</option>
                  <option value="Masculino">Somente Masculino</option>
                  <option value="Feminino">Somente Feminino</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div><label className="text-slate-500 text-xs block mb-1">Nome *</label><input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder={bloco.tipo==='idade'?'Ex: Pré Mirim 4-5 anos':bloco.tipo==='faixa'?'Ex: Faixa Branca':'Ex: Masculino'} className={ic} /></div>
              {bloco.tipo !== 'sexo' && bloco.tipo !== 'peso' && <div><label className="text-slate-500 text-xs block mb-1">Descrição</label><input value={form.descricao} onChange={e=>setForm(p=>({...p,descricao:e.target.value}))} placeholder="Opcional" className={ic} /></div>}
            </>
          )}

          {bloco.tipo !== 'sexo' && bloco.tipo !== 'peso' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-500 text-xs font-medium">Regras</span>
                <button onClick={addRegra} className="text-blue-400 text-xs flex items-center gap-1"><Plus size={10}/> regra</button>
              </div>
              <div className="space-y-1.5">
                {regras.map((r,i) => (
                  <div key={i} className="flex items-center gap-1.5 flex-wrap bg-slate-800/60 rounded-lg p-2">
                    <select value={r.coluna1} onChange={e=>updRegra(i,'coluna1',e.target.value)} className={sc}>
                      {COLUNA1.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={r.coluna2} onChange={e=>updRegra(i,'coluna2',e.target.value)} className={sc}>
                      {(COLUNA2[r.coluna1]||[]).map(o=><option key={o} value={o}>{C2LABEL[o]}</option>)}
                    </select>
                    {getColuna3Opcoes(r.coluna1, faixas) ? (
                      <select value={r.coluna3} onChange={e=>updRegra(i,'coluna3',e.target.value)} className={sc}>
                        <option value="">Selecione</option>
                        {getColuna3Opcoes(r.coluna1, faixas).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="number" value={r.coluna3} onChange={e=>updRegra(i,'coluna3',e.target.value)} placeholder="Ex: 18" className="w-16 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500" />
                    )}
                    <button onClick={()=>setRegras(p=>p.filter((_,idx)=>idx!==i))} className="text-slate-600 hover:text-red-400 ml-auto"><Trash2 size={11}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={onFechar} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-2 rounded-lg text-sm">Cancelar</button>
          <button onClick={()=>form.nome.trim()&&onSalvar({form,regras})} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-all">
            {editando ? '✓ Salvar Alterações' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BlocoClasse({ bloco: blocoInicial, faixas, onRemover }) {
  const [bloco, setBloco] = useState(blocoInicial);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState(blocoInicial.nome);
  const [valores, setValores] = useState([]);
  const [modal, setModal] = useState(false);
  const [editandoValor, setEditandoValor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    supabase.from('valores_bloco').select('*,regras_valor(*)').eq('bloco_id',bloco.id).order('ordem')
      .then(({data})=>{if(data)setValores(data);setLoading(false);});
  },[]);

  const salvarNomeBloco = async () => {
    await supabase.from('blocos_classe').update({ nome: nomeTemp }).eq('id', bloco.id);
    setBloco(p => ({ ...p, nome: nomeTemp }));
    setEditandoNome(false);
  };

  const salvarValor = async({form,regras})=>{
    if (editandoValor) {
      await supabase.from('valores_bloco').update({
        nome: form.nome, descricao: form.descricao||null, faixas: form.faixas||[],
        peso_min: form.peso_min?parseFloat(form.peso_min):null,
        peso_max: form.peso_max?parseFloat(form.peso_max):null,
        genero: form.genero||'ambos',
      }).eq('id', editandoValor.id);
      await supabase.from('regras_valor').delete().eq('valor_id', editandoValor.id);
      const rv = regras.filter(r=>r.coluna3);
      if(rv.length>0) await supabase.from('regras_valor').insert(rv.map((r,i)=>({valor_id:editandoValor.id,...r,ordem:i})));
      const {data:va} = await supabase.from('valores_bloco').select('*,regras_valor(*)').eq('id',editandoValor.id).single();
      if(va) setValores(p=>p.map(x=>x.id===editandoValor.id?va:x));
    } else {
      const {data:v} = await supabase.from('valores_bloco').insert({
        bloco_id:bloco.id,nome:form.nome,descricao:form.descricao||null,ativo:true,ordem:valores.length,faixas:form.faixas||[],
        peso_min:form.peso_min?parseFloat(form.peso_min):null,
        peso_max:form.peso_max?parseFloat(form.peso_max):null,
        genero: form.genero||'ambos',
      }).select().single();
      if(v){
        const rv=regras.filter(r=>r.coluna3);
        if(rv.length>0) await supabase.from('regras_valor').insert(rv.map((r,i)=>({valor_id:v.id,...r,ordem:i})));
        const {data:va}=await supabase.from('valores_bloco').select('*,regras_valor(*)').eq('id',v.id).single();
        if(va)setValores(p=>[...p,va]);
      }
    }
    setModal(false);
    setEditandoValor(null);
  };

  const toggleValor = async(v)=>{
    await supabase.from('valores_bloco').update({ativo:!v.ativo}).eq('id',v.id);
    setValores(p=>p.map(x=>x.id===v.id?{...x,ativo:!x.ativo}:x));
  };

  const removerValor = async(id)=>{
    await supabase.from('valores_bloco').delete().eq('id',id);
    setValores(p=>p.filter(x=>x.id!==id));
  };

  const corTipo = { sexo:'border-l-pink-400', idade:'border-l-blue-400', faixa:'border-l-yellow-400', peso:'border-l-green-400', custom:'border-l-purple-400' };

  return (
    <div className={`border border-slate-700 border-l-2 ${corTipo[bloco.tipo]||corTipo.custom} rounded-lg overflow-hidden`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40">
        {editandoNome ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={nomeTemp} onChange={e=>setNomeTemp(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500" />
            <button onClick={salvarNomeBloco} className="text-green-400 hover:text-green-300 text-xs font-bold">✓ Salvar</button>
            <button onClick={()=>setEditandoNome(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
          </div>
        ) : (
          <button onClick={()=>setEditandoNome(true)} className="text-white text-xs font-bold hover:text-blue-400 transition-colors text-left">
            {bloco.nome} <span className="text-slate-600 text-xs ml-1">✎</span>
          </button>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={()=>{setEditandoValor(null);setModal(true);}} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors">
            <Plus size={11}/> Valor
          </button>
          <button onClick={()=>onRemover(bloco.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
        </div>
      </div>
      {loading ? <div className="px-3 py-2"><div className="w-3 h-3 border border-slate-600 border-t-transparent rounded-full animate-spin"/></div> : (
        <div>
          {valores.length===0 && <p className="text-slate-600 text-xs px-3 py-2">Nenhum valor</p>}
          {valores.map(v=>(
            <div key={v.id} className={`flex items-center justify-between px-3 py-1.5 border-t border-slate-800 ${!v.ativo?'opacity-40':''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-xs font-medium">{v.nome}</span>
                  {bloco.tipo==='peso'&&v.peso_min!=null&&<span className="text-slate-500 text-xs">{v.peso_min}–{v.peso_max}kg</span>}
                  {bloco.tipo==='peso'&&(
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      !v.genero||v.genero==='ambos' ? 'bg-slate-700 text-slate-300 border border-slate-600' :
                      v.genero==='Masculino' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                    }`}>
                      {!v.genero||v.genero==='ambos' ? '♂♀ Ambos' : v.genero==='Masculino' ? '♂ Masculino' : '♀ Feminino'}
                    </span>
                  )}
                  {v.regras_valor?.map((r,i)=>(
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                      {COLUNA1.find(o=>o.value===r.coluna1)?.label?.split(':')[1]?.trim()||r.coluna1} {C2LABEL[r.coluna2]} {r.coluna3}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button onClick={()=>{setEditandoValor(v);setModal(true);}} className="text-slate-500 hover:text-blue-400 transition-colors" title="Editar">
                  <span className="text-xs">✎</span>
                </button>
                <button onClick={()=>toggleValor(v)}>
                  {v.ativo?<ToggleRight size={16} className="text-blue-400"/>:<ToggleLeft size={16} className="text-slate-600"/>}
                </button>
                <button onClick={()=>removerValor(v.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal&&<ModalValor bloco={bloco} valor={editandoValor} faixas={faixas} onSalvar={salvarValor} onFechar={()=>{setModal(false);setEditandoValor(null);}}/>}
    </div>
  );
}

function EntradaCard({ entrada, eventoId, faixas, onRemover, todasEntradas }) {
  const [aba, setAba] = useState('classes');
  const [blocos, setBlocos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [novoBloco, setNovoBloco] = useState({ tipo:'idade', nome:'' });
  const [novoLote, setNovoLote] = useState({ nome:'', valor:'', data_inicio:'', data_fim:'' });
  const [ativa, setAtiva] = useState(entrada.ativa);
  const [aberta, setAberta] = useState(true);
  const [requerEntradaId, setRequerEntradaId] = useState(entrada.requer_entrada_id || '');

  useEffect(()=>{
    supabase.from('blocos_classe').select('*').eq('entrada_id',entrada.id).order('ordem').then(({data})=>{if(data)setBlocos(data);});
    supabase.from('lotes_entrada').select('*').eq('entrada_id',entrada.id).order('data_inicio').then(({data})=>{if(data)setLotes(data);});
  },[]);

  const toggleEntrada = async()=>{ await supabase.from('entradas').update({ativa:!ativa}).eq('id',entrada.id); setAtiva(p=>!p); };

  const addBloco = async()=>{
    if(!novoBloco.nome.trim()) return;
    const {data}=await supabase.from('blocos_classe').insert({entrada_id:entrada.id,evento_id:eventoId,tipo:novoBloco.tipo,nome:novoBloco.nome,ordem:blocos.length}).select().single();
    if(data){setBlocos(p=>[...p,data]);setNovoBloco({tipo:'idade',nome:''});}
  };

  const addLote = async()=>{
    if(!novoLote.nome||!novoLote.valor||!novoLote.data_inicio||!novoLote.data_fim) return;
    const {data}=await supabase.from('lotes_entrada').insert({entrada_id:entrada.id,evento_id:eventoId,nome:novoLote.nome,valor:parseFloat(novoLote.valor),data_inicio:novoLote.data_inicio,data_fim:novoLote.data_fim,ativo:true}).select().single();
    if(data){setLotes(p=>[...p,data]);setNovoLote({nome:'',valor:'',data_inicio:'',data_fim:''});}
  };

  const ic='bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500';
  const sc='bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500';

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden ${ativa?'border-slate-700':'border-slate-800 opacity-70'}`}>
      {/* Header compacto */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
        <button onClick={()=>setAberta(p=>!p)} className="text-slate-500 hover:text-white">
          {aberta?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
        </button>
        <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${entrada.modalidade==='Gi'?'bg-blue-500/20 text-blue-400':entrada.modalidade==='NoGi'?'bg-purple-500/20 text-purple-400':'bg-slate-700 text-slate-400'}`}>
          {entrada.modalidade||'—'}
        </span>
        <span className="text-white font-bold text-sm flex-1">{entrada.nome}</span>
        <span className="text-slate-600 text-xs">{blocos.length}bl · {lotes.length}lt</span>
        <button onClick={toggleEntrada}>
          {ativa?<ToggleRight size={20} className="text-blue-400"/>:<ToggleLeft size={20} className="text-slate-600"/>}
        </button>
        <button onClick={()=>onRemover(entrada.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
      </div>

      {aberta && (
        <>
          {/* Abas compactas */}
          <div className="flex border-b border-slate-800">
            {[{id:'classes',label:'Classes'},{id:'precos',label:'Preços & Lotes'},{id:'acesso',label:'Acesso'}].map(a=>(
              <button key={a.id} onClick={()=>setAba(a.id)}
                className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${aba===a.id?'border-blue-500 text-blue-400':'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Aba Classes */}
          {aba==='classes' && (
            <div className="p-3 space-y-2">
              {blocos.map(b=><BlocoClasse key={b.id} bloco={b} faixas={faixas} onRemover={async(id)=>{await supabase.from('blocos_classe').delete().eq('id',id);setBlocos(p=>p.filter(x=>x.id!==id));}}/>)}
              <div className="flex items-center gap-2 pt-1">
                <select value={novoBloco.tipo} onChange={e=>setNovoBloco(p=>({...p,tipo:e.target.value,nome:e.target.value==='sexo'?'Sexo':e.target.value==='idade'?'Idade':e.target.value==='faixa'?'Faixa':e.target.value==='peso'?'Peso':''}))} className={sc+' shrink-0'}>
                  <option value="sexo">Sexo</option>
                  <option value="idade">Idade</option>
                  <option value="faixa">Faixa</option>
                  <option value="peso">Peso</option>
                  <option value="custom">Custom</option>
                </select>
                <input value={novoBloco.nome} onChange={e=>setNovoBloco(p=>({...p,nome:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addBloco()} placeholder="Nome do bloco" className={ic+' flex-1'}/>
                <button onClick={addBloco} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0"><Plus size={12}/> Bloco</button>
              </div>
            </div>
          )}

          {/* Aba Acesso */}
          {aba==='acesso' && (
            <div className="p-4 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 text-xs font-bold mb-1">🔒 Pré-requisito de inscrição</p>
                <p className="text-slate-400 text-xs">Para se inscrever nesta entrada, o atleta também precisará estar inscrito na entrada selecionada abaixo. Deixe em branco para permitir inscrição livre.</p>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Disponível apenas para quem também estiver inscrito em:</label>
                <select
                  value={requerEntradaId}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setRequerEntradaId(val);
                    await supabase.from('entradas').update({ requer_entrada_id: val || null }).eq('id', entrada.id);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Sem pré-requisito (inscrição livre) —</option>
                  {todasEntradas.filter(e => e.id !== entrada.id).map(e => (
                    <option key={e.id} value={e.id}>{e.nome} {e.modalidade ? `(${e.modalidade})` : ''}</option>
                  ))}
                </select>
                {requerEntradaId && (
                  <p className="text-green-400 text-xs mt-2">✓ Atleta precisará estar inscrito em <strong>{todasEntradas.find(e=>e.id===requerEntradaId)?.nome}</strong> para acessar esta entrada.</p>
                )}
              </div>
            </div>
          )}

          {/* Aba Preços */}
          {aba==='precos' && (
            <div className="p-3 space-y-2">
              {lotes.length===0&&<p className="text-slate-600 text-xs">Nenhum lote</p>}
              {lotes.map(l=>(
                <div key={l.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-xs font-medium">{l.nome}</span>
                    <span className="text-slate-500 text-xs ml-2">R${parseFloat(l.valor).toFixed(2)} · {new Date(l.data_inicio+'T00:00:00').toLocaleDateString('pt-BR')} – {new Date(l.data_fim+'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                  <button onClick={async()=>{await supabase.from('lotes_entrada').delete().eq('id',l.id);setLotes(p=>p.filter(x=>x.id!==l.id));}} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <input value={novoLote.nome} onChange={e=>setNovoLote(p=>({...p,nome:e.target.value}))} placeholder="Nome do lote" className={ic+' col-span-4'}/>
                <input type="number" value={novoLote.valor} onChange={e=>setNovoLote(p=>({...p,valor:e.target.value}))} placeholder="R$" className={ic}/>
                <input type="date" value={novoLote.data_inicio} onChange={e=>setNovoLote(p=>({...p,data_inicio:e.target.value}))} className={ic}/>
                <input type="date" value={novoLote.data_fim} onChange={e=>setNovoLote(p=>({...p,data_fim:e.target.value}))} className={ic}/>
                <button onClick={addLote} className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-2 py-1.5 rounded-lg transition-all"><Plus size={12}/> Lote</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ConfiguracaoCategoriasPage() {
  const { id: eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [novaEntrada, setNovaEntrada] = useState({ nome: '', modalidade: 'Gi' });

  useEffect(()=>{
    Promise.all([
      supabase.from('eventos').select('*').eq('id',eventoId).single(),
      supabase.from('entradas').select('*').eq('evento_id',eventoId).order('ordem'),
      supabase.from('faixas').select('*').order('ordem'),
    ]).then(([ev,en,fx])=>{
      if(ev.data)setEvento(ev.data);
      if(en.data)setEntradas(en.data);
      if(fx.data)setFaixas(fx.data);
      setLoading(false);
    });
  },[eventoId]);

  const addEntrada = async()=>{
    if(!novaEntrada.nome.trim()){setErro('Informe o nome.');return;}
    const {data}=await supabase.from('entradas').insert({
      evento_id:eventoId, nome:novaEntrada.nome,
      modalidade:novaEntrada.modalidade, ativa:true, ordem:entradas.length
    }).select().single();
    if(data){setEntradas(p=>[...p,data]);setNovaEntrada({nome:'',modalidade:'Gi'});setSucesso('Entrada criada!');setTimeout(()=>setSucesso(''),2000);}
  };

  const removerEntrada = async(id)=>{
    if(!window.confirm('Remover esta entrada e tudo dentro dela?'))return;
    await supabase.from('entradas').delete().eq('id',id);
    setEntradas(p=>p.filter(e=>e.id!==id));
  };

  if(loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <a href={"/eventos/"+eventoId+"/admin"} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center transition-all">
            <ArrowLeft size={14} className="text-slate-400"/>
          </a>
          <div>
            <h1 className="text-white text-lg font-bold">Categorias de Entrada</h1>
            <p className="text-slate-500 text-xs">{evento?.nome}</p>
          </div>
        </div>

        {sucesso&&<div className="bg-green-950/50 border border-green-500/30 rounded-lg px-3 py-2 flex items-center gap-2 mb-3"><CheckCircle size={14} className="text-green-400"/><p className="text-green-300 text-xs">{sucesso}</p></div>}
        {erro&&<div className="bg-red-950/50 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2 mb-3"><AlertCircle size={14} className="text-red-400"/><p className="text-red-300 text-xs">{erro}</p><button onClick={()=>setErro('')} className="ml-auto text-red-400 text-xs">x</button></div>}

        {/* Nova entrada com modalidade */}
        <div className="flex gap-2 mb-4">
          <select value={novaEntrada.modalidade} onChange={e=>setNovaEntrada(p=>({...p,modalidade:e.target.value}))}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shrink-0">
            {['Gi','NoGi','Judo','Luta Livre','MMA','Custom'].map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <input value={novaEntrada.nome} onChange={e=>setNovaEntrada(p=>({...p,nome:e.target.value}))}
            onKeyDown={e=>e.key==='Enter'&&addEntrada()}
            placeholder="Ex: Pré Mirim, Mirim, Adulto..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
          <button onClick={addEntrada} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shrink-0">
            <Plus size={14}/> Entrada
          </button>
        </div>

        {entradas.length===0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">Nenhuma entrada criada</p>
            <p className="text-slate-600 text-xs mt-1">Selecione a modalidade e adicione entradas como "Pré Mirim", "Adulto"...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entradas.map(e=><EntradaCard key={e.id} entrada={e} eventoId={eventoId} faixas={faixas} onRemover={removerEntrada} todasEntradas={entradas}/>)}
          </div>
        )}
      </div>
    </div>
  );
}