import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      {/* Background animado */}
      <div className="hero__background">
        <div className="hero__grid"></div>
        <div className="hero__glow"></div>
        <div className="hero__particles"></div>
      </div>

      {/* Conteúdo central */}
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot"></span>
          Plataforma oficial de Jiu-Jitsu
        </div>

        <h1 className="hero__title">
          Nexus<span className="hero__title-accent">JJ</span>
        </h1>

        <p className="hero__subtitle">
          Feito para o universo da luta
        </p>

        <p className="hero__description">
          Conecte-se, evolua e domine sua jornada marcial.
          A plataforma definitiva para atletas, professores e academias.
        </p>

        <div className="hero__cta">
          <a href="/cadastro" className="hero__btn hero__btn--primary">
            Começar agora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <button className="hero__btn hero__btn--secondary" onClick={() => document.querySelector('section.bg-slate-950')?.scrollIntoView({behavior:'smooth'})}>
            Ver funcionalidades
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
