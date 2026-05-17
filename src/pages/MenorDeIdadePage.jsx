import { UserPlus, ArrowLeft, Users } from 'lucide-react';

export default function MenorDeIdadePage() {
  return (
    <div className="min-h-screen bg-nexus-dark flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
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
        </div>

        {/* Card principal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">

          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users size={40} className="text-blue-400" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Cadastro restrito para maiores de 18 anos
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Na NexusJJ, atletas menores de idade não podem criar uma conta própria.
            Um responsável maior de 18 anos deve criar o cadastro e adicionar o menor
            como <strong className="text-white">dependente</strong> no seu perfil.
          </p>

          {/* Passos */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-8 text-left space-y-4">
            <p className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3">Como funciona:</p>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">1</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                O <strong className="text-white">responsável</strong> (pai, mãe ou tutor) cria sua própria conta na NexusJJ.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">2</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dentro do perfil, o responsável acessa <strong className="text-white">"Meus Dependentes"</strong> e adiciona o atleta menor de idade.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">3</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                O menor receberá um <strong className="text-white">ID único</strong> na plataforma com todo seu histórico de lutas e eventos.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">4</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Quando completar 18 anos, o atleta pode criar sua própria conta e solicitar à NexusJJ a <strong className="text-white">unificação do histórico</strong>.
              </p>
            </div>
          </div>

          {/* Aviso CPF */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-8 text-left">
            <p className="text-yellow-300 text-sm">
              <strong>Sobre o CPF:</strong> Para atletas menores de idade, o CPF é opcional no cadastro de dependente.
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-3">
            <a
              href="/cadastro/atleta"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              <UserPlus size={18} />
              Criar conta como Responsável
            </a>

            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-slate-700"
            >
              Já tenho conta — Fazer login
            </a>

            <a
              href="/cadastro"
              className="flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors mt-1"
            >
              <ArrowLeft size={14} />
              Voltar para escolha de perfil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}