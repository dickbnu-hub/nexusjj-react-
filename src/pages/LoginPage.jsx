import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Busca o perfil para redirecionar corretamente
        const { data: perfil } = await supabase
          .from('profiles')
          .select('tipo')
          .eq('id', data.user.id)
          .single();
        if (perfil?.tipo === 'organizador') window.location.href = '/painel/organizador';
        else if (perfil?.tipo === 'professor') window.location.href = '/painel/professor';
        else window.location.href = '/painel/atleta';
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">
              Nexus<span className="text-blue-500">JJ</span>
            </span>
          </a>
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isLogin
              ? 'Entre para acessar sua conta NexusJJ'
              : 'Preencha os dados para criar sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 mb-4 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">ou continue com email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Senha
                </label>
                {isLogin && (
                  <a href="/recuperar-senha" className="text-xs text-blue-400 hover:text-blue-300">
                    Esqueceu a senha?
                  </a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Sucesso */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Trocar modo */}
          <p className="text-center text-slate-400 text-sm mt-6">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            {isLogin ? (
              <a href="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium">
                Criar conta grátis
              </a>
            ) : (
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Entrar
              </button>
            )}
          </p>
        </div>

        {/* Rodapé */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Ao continuar, você concorda com os{' '}
          <a href="#" className="hover:text-slate-400">Termos de Uso</a>{' '}
          e{' '}
          <a href="#" className="hover:text-slate-400">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}