import { User, School, ClipboardList, Shield } from 'lucide-react';

export default function CadastroPage() {
  const perfis = [
    {
      tipo: 'atleta',
      icone: User,
      titulo: 'Atleta',
      descricao: 'Quero competir em eventos, acompanhar meu histórico e gerenciar minha graduação.',
      href: '/cadastro/atleta',
      cor: 'blue',
    },
    {
      tipo: 'professor',
      icone: School,
      titulo: 'Professor / Academia',
      descricao: 'Quero cadastrar minha academia, gerenciar alunos e inscrições em eventos.',
      href: '/cadastro/professor',
      cor: 'cyan',
    },
    {
      tipo: 'organizador',
      icone: ClipboardList,
      titulo: 'Organizador de Evento',
      descricao: 'Quero criar e gerenciar campeonatos, chaveamentos e resultados.',
      href: '/cadastro/organizador',
      cor: 'purple',
    },
    {
      tipo: 'arbitro',
      icone: Shield,
      titulo: 'Árbitro',
      descricao: 'Sou árbitro credenciado e quero atuar em eventos oficiais.',
      href: '/cadastro/arbitro',
      cor: 'orange',
    },
  ];

  const cores = {
    blue:   { card: 'border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/10',   icon: 'bg-blue-500/20 text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-500' },
    cyan:   { card: 'border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/10',   icon: 'bg-cyan-500/20 text-cyan-400',   btn: 'bg-cyan-600 hover:bg-cyan-500' },
    purple: { card: 'border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/10', icon: 'bg-purple-500/20 text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500' },
    orange: { card: 'border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-500/10', icon: 'bg-orange-500/20 text-orange-400', btn: 'bg-orange-600 hover:bg-orange-500' },
  };

  return (
    <div className="min-h-screen bg-nexus-dark flex flex-col items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-2xl font-bold text-white">
              Nexus<span className="text-blue-500">JJ</span>
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mt-2">Como você vai usar a NexusJJ?</h1>
          <p className="text-slate-400 mt-2 text-sm">Escolha seu perfil para começar o cadastro</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {perfis.map((perfil) => {
            const c = cores[perfil.cor];
            const Icone = perfil.icone;
            return (
              <a
                key={perfil.tipo}
                href={perfil.href}
                className={`group flex flex-col gap-4 bg-slate-900 border rounded-2xl p-6 transition-all duration-300 cursor-pointer ${c.card}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${c.icon}`}>
                    <Icone size={28} strokeWidth={1.8} />
                  </div>
                  <h2 className="text-white font-bold text-lg">{perfil.titulo}</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{perfil.descricao}</p>
                <div className={`w-full text-center py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 ${c.btn}`}>
                  Cadastrar como {perfil.titulo}
                </div>
              </a>
            );
          })}
        </div>

        {/* Login */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Já tem uma conta?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}