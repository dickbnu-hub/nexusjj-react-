import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [sessaoOk, setSessaoOk] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase injeta a sessão automaticamente via URL hash quando vem do email
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessaoOk(true);
      else setErro('Link inválido ou expirado. Solicite um novo link de recuperação.');
    });
  }, []);

  const redefinir = async (e) => {
    e.preventDefault();
    if (!senha || senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setLoading(true); setErro('');
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) { setErro('Erro: ' + error.message); return; }
    setSucesso(true);
    setTimeout(() => navigate('/login'), 3000);
  };

  if (sucesso) return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Senha redefinida!</h2>
        <p className="text-slate-400 mb-2">Sua senha foi alterada com sucesso.</p>
        <p className="text-slate-500 text-sm">Redirecionando para o login...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">Nexus<span className="text-blue-500">JJ</span></span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Redefinir senha</h1>
          <p className="text-slate-400 text-sm">Digite sua nova senha abaixo.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {erro && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}
          {sessaoOk ? (
            <form onSubmit={redefinir} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">Nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={mostrar ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {mostrar ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">Confirmar nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={mostrar ? 'text' : 'password'} value={confirmar} onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50">
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          ) : !erro && <p className="text-slate-400 text-center">Verificando link...</p>}
          {erro && (
            <button onClick={() => navigate('/recuperar-senha')} className="w-full mt-4 border border-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-lg transition-all">
              Solicitar novo link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
