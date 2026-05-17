import React from 'react';
import { Trophy, Users, Shield, BarChart2, Globe, Zap } from 'lucide-react';
import './Showcase.css';

const Showcase = () => {
  const cards = [
    {
      icon: Trophy,
      title: 'Gestão de Campeonatos',
      description: 'Organize torneios de Jiu-Jitsu, MMA e outras modalidades com chaveamento automático e resultados em tempo real.',
    },
    {
      icon: Users,
      title: 'Para Federações',
      description: 'Ferramentas completas para federações gerenciarem filiados, rankings e eventos oficiais.',
    },
    {
      icon: Shield,
      title: 'Credenciamento Oficial',
      description: 'Sistema de credenciamento de árbitros, atletas e equipes com validação de documentos e faixas.',
    },
    {
      icon: BarChart2,
      title: 'Rankings e Estatísticas',
      description: 'Acompanhe o desempenho de atletas e academias com rankings atualizados automaticamente após cada evento.',
    },
    {
      icon: Globe,
      title: 'Alcance Nacional',
      description: 'Plataforma utilizada em todo o Brasil, conectando atletas, academias e federações em um só lugar.',
    },
    {
      icon: Zap,
      title: 'Tecnologia de Ponta',
      description: 'Sistema rápido, seguro e confiável para eventos de qualquer tamanho — de locais a internacionais.',
    },
  ];

  return (
    <section className="showcase">
      <div className="showcase__container">
        <div className="showcase__header">
          <h2 className="showcase__title">Por que escolher a NexusJJ?</h2>
          <p className="showcase__subtitle">
            A plataforma mais completa para o universo das artes marciais —
            do atleta iniciante ao campeão mundial.
          </p>
        </div>

        <div className="showcase__grid">
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div className="showcase__card" key={index}>
                <div className="showcase__card-icon">
                  <IconComponent size={28} strokeWidth={2} />
                </div>
                <h3 className="showcase__card-title">{card.title}</h3>
                <p className="showcase__card-description">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Showcase;