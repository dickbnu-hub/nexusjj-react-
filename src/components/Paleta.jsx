import React from 'react';

const Paleta = () => {
  const grupos = [
    {
      titulo: '🌟 Cores Principais (Marca)',
      cores: [
        { nome: 'nexus-primary', hex: '#22D3EE', classe: 'bg-nexus-primary' },
        { nome: 'nexus-secondary', hex: '#0EA5E9', classe: 'bg-nexus-secondary' },
        { nome: 'nexus-accent', hex: '#06B6D4', classe: 'bg-nexus-accent' },
      ],
    },
    {
      titulo: '🌑 Fundos e Superfícies',
      cores: [
        { nome: 'nexus-dark', hex: '#0A0E1A', classe: 'bg-nexus-dark' },
        { nome: 'nexus-surface', hex: '#111827', classe: 'bg-nexus-surface' },
        { nome: 'nexus-surface-2', hex: '#1A2235', classe: 'bg-nexus-surface-2' },
        { nome: 'nexus-border', hex: '#1F2937', classe: 'bg-nexus-border' },
      ],
    },
    {
      titulo: '✍️ Textos',
      cores: [
        { nome: 'nexus-light', hex: '#F9FAFB', classe: 'bg-nexus-light' },
        { nome: 'nexus-muted', hex: '#6B7280', classe: 'bg-nexus-muted' },
      ],
    },
    {
      titulo: '🚦 Estados (Feedback)',
      cores: [
        { nome: 'nexus-success', hex: '#10B981', classe: 'bg-nexus-success' },
        { nome: 'nexus-danger', hex: '#EF4444', classe: 'bg-nexus-danger' },
        { nome: 'nexus-warning', hex: '#F59E0B', classe: 'bg-nexus-warning' },
        { nome: 'nexus-info', hex: '#3B82F6', classe: 'bg-nexus-info' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-nexus-dark p-8">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-nexus-light mb-3 font-display">
            🎨 Paleta NexusJ
          </h1>
          <p className="text-nexus-muted text-lg">
            Identidade visual completa do projeto
          </p>
        </header>

        {/* Grupos de cores */}
        {grupos.map((grupo) => (
          <section key={grupo.titulo} className="mb-10">
            <h2 className="text-2xl font-semibold text-nexus-light mb-4">
              {grupo.titulo}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {grupo.cores.map((cor) => (
                <div
                  key={cor.nome}
                  className="bg-nexus-surface rounded-xl overflow-hidden border border-nexus-border hover:scale-105 transition-transform duration-300"
                >
                  {/* Quadrado da cor */}
                  <div
                    className={`${cor.classe} h-28 w-full border-b border-nexus-border`}
                  ></div>
                  {/* Info */}
                  <div className="p-4">
                    <p className="text-nexus-light font-mono text-sm font-semibold">
                      {cor.nome}
                    </p>
                    <p className="text-nexus-muted font-mono text-xs mt-1">
                      {cor.hex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Demonstração prática */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-nexus-light mb-6">
            ✨ Exemplos em ação
          </h2>

          <div className="bg-nexus-surface rounded-2xl p-8 border border-nexus-border space-y-4">
            {/* Botões */}
            <div className="flex flex-wrap gap-3">
              <button className="bg-nexus-primary text-nexus-dark font-bold px-6 py-3 rounded-lg hover:bg-nexus-secondary transition-colors">
                Botão Primário
              </button>
              <button className="bg-nexus-success text-white font-bold px-6 py-3 rounded-lg">
                Sucesso
              </button>
              <button className="bg-nexus-danger text-white font-bold px-6 py-3 rounded-lg">
                Perigo
              </button>
              <button className="bg-nexus-warning text-nexus-dark font-bold px-6 py-3 rounded-lg">
                Aviso
              </button>
              <button className="bg-nexus-info text-white font-bold px-6 py-3 rounded-lg">
                Info
              </button>
            </div>

            {/* Card de exemplo */}
            <div className="bg-nexus-surface-2 p-6 rounded-xl border border-nexus-border mt-6">
              <h3 className="text-nexus-primary text-xl font-bold mb-2 font-display">
                Card Exemplo
              </h3>
              <p className="text-nexus-light mb-2">
                Esse é um texto principal usando <span className="text-nexus-primary font-semibold">nexus-light</span>.
              </p>
              <p className="text-nexus-muted text-sm">
                E esse é um texto secundário com nexus-muted.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Paleta;
