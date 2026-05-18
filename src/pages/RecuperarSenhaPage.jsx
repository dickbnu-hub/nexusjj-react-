import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    if (!email) { setErro('Informe seu email.'); return; }
    setLoading(true); setErro('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://nexusjj-react.vercel.app/redefinir-senha',
    });
    setLoading(false);
    if (error) { setErro('Erro: ' + error.message); return; }
    setEnviado(true);
  };

  if (enviado) return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Email enviado!</h2>
        <p className="text-slate-400 mb-6">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
        <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-all">
          Voltar ao login
        </button>
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
          <h1 className="text-2xl font-bold text-white mb-2">Recuperar senha</h1>
          <p className="text-slate-400 text-sm">Informe seu email e enviaremos um link para redefinir sua senha.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {erro && (
            <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="text-red-400" />
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}
          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-4">
            Lembrou a senha?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300">Fazer login</button>
          </p>
        </div>
      </div>
    </div>
  );
}
