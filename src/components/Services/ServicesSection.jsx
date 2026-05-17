export default function ServicesSection() {
  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que seu evento precisa, em um só lugar
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Da inscrição ao pódio — tecnologia profissional para eventos de Jiu-Jitsu.
          </p>
        </div>

        {/* BLOCO 1: Placar */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1">
            <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Placar Digital</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Transmissão ao vivo em tempo real</h3>
            <p className="text-slate-400 leading-relaxed">Placar profissional com cronômetro, pontos, vantagens e penalidades. Exibição em telão, tablet ou qualquer tela — sem instalar nada.</p>
            <ul className="mt-4 space-y-2">
              {['Cronômetro automático por categoria','Atualização instantânea no telão','Histórico de todas as lutas'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
                <span className="text-white text-xs font-bold">🔴 AO VIVO — Área 1</span>
                <span className="text-blue-200 text-xs">Adulto Azul Pluma</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-white font-bold text-sm">SILVA, R.</p>
                    <p className="text-slate-400 text-xs">Gracie Barra</p>
                    <p className="text-white text-4xl font-black mt-2">4</p>
                    <div className="flex justify-center gap-3 mt-1 text-xs text-slate-400">
                      <span>Vant: <b className="text-white">1</b></span>
                      <span>Pen: <b className="text-white">0</b></span>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-green-400 text-2xl font-black font-mono">03:42</p>
                    <p className="text-slate-500 text-xs mt-1">05:00</p>
                    <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1 animate-pulse" />
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-white font-bold text-sm">COSTA, M.</p>
                    <p className="text-slate-400 text-xs">Alliance</p>
                    <p className="text-white text-4xl font-black mt-2">2</p>
                    <div className="flex justify-center gap-3 mt-1 text-xs text-slate-400">
                      <span>Vant: <b className="text-white">0</b></span>
                      <span>Pen: <b className="text-white">1</b></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Mobile */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1 w-full order-2 lg:order-1">
            <div className="flex justify-center items-end gap-3">

              {/* iPhone 1 — App aberto mostrando próximo evento (levemente inclinado) */}
              <div className="relative shrink-0" style={{transform:'rotate(-6deg) translateY(16px)'}}>
                {/* Botão lateral direito — power */}
                <div className="absolute right-0 top-20 w-1 h-10 bg-slate-500 rounded-r-sm" style={{right:'-4px'}} />
                {/* Botões volume esquerdo */}
                <div className="absolute left-0 top-16 w-1 h-7 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                <div className="absolute left-0 top-28 w-1 h-7 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                {/* Silencioso */}
                <div className="absolute left-0 top-12 w-1 h-4 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                {/* Corpo */}
                <div className="w-44 bg-gradient-to-b from-slate-700 to-slate-800 rounded-[2.5rem] p-[3px] shadow-2xl" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'}}>
                  <div className="bg-black rounded-[2.3rem] overflow-hidden">
                    {/* Dynamic Island */}
                    <div className="bg-black pt-3 pb-1 flex justify-center">
                      <div className="w-20 h-5 bg-black rounded-full border border-slate-800 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      </div>
                    </div>
                    {/* Tela — app aberto */}
                    <div className="bg-slate-950 px-2.5 pb-4">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-white text-xs font-semibold">14:22</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-2 fill-white" viewBox="0 0 24 16"><rect x="0" y="4" width="4" height="12" rx="1"/><rect x="6" y="2" width="4" height="14" rx="1"/><rect x="12" y="0" width="4" height="16" rx="1"/><rect x="18" y="0" width="4" height="16" rx="1" opacity="0.3"/></svg>
                          <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                          <div className="w-5 h-2.5 rounded-sm border border-white flex items-center px-0.5"><div className="w-3 h-1.5 bg-green-400 rounded-sm" /></div>
                        </div>
                      </div>
                      {/* Header do app */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black">N</div>
                        <span className="text-white text-xs font-bold">NexusJJ</span>
                      </div>
                      {/* Conteúdo */}
                      <div className="bg-blue-600/20 rounded-xl p-2 border border-blue-500/30 mb-1.5">
                        <p className="text-blue-400 text-xs font-bold">Próximo evento</p>
                        <p className="text-white text-xs font-semibold">Nexus Open 2025</p>
                        <p className="text-slate-400 text-xs">15/08 · São Paulo</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-2 mb-1.5">
                        <p className="text-slate-400 text-xs font-bold mb-1">Minha categoria</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                          <div>
                            <p className="text-white text-xs">Adulto Azul Pluma</p>
                            <p className="text-slate-500 text-xs">Confirmado</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2">
                        <p className="text-orange-400 text-xs font-bold">⏱ Minha luta</p>
                        <p className="text-white text-xs">Área 2 · ~14:30</p>
                        <p className="text-slate-400 text-xs">Luta 8 de 12</p>
                      </div>
                    </div>
                    {/* Home bar */}
                    <div className="bg-slate-950 pb-2 flex justify-center">
                      <div className="w-16 h-1 rounded-full bg-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* iPhone 2 — Tela de bloqueio com notificação push */}
              <div className="relative shrink-0" style={{transform:'rotate(4deg)'}}>
                {/* Botão power direito */}
                <div className="absolute right-0 top-20 w-1 h-10 bg-slate-500 rounded-r-sm" style={{right:'-4px'}} />
                {/* Botões volume */}
                <div className="absolute left-0 top-16 w-1 h-7 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                <div className="absolute left-0 top-28 w-1 h-7 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                <div className="absolute left-0 top-12 w-1 h-4 bg-slate-500 rounded-l-sm" style={{left:'-4px'}} />
                {/* Corpo */}
                <div className="w-44 bg-gradient-to-b from-slate-600 to-slate-700 rounded-[2.5rem] p-[3px] shadow-2xl" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)'}}>
                  <div className="bg-black rounded-[2.3rem] overflow-hidden">
                    {/* Dynamic Island */}
                    <div className="bg-black pt-3 pb-1 flex justify-center">
                      <div className="w-20 h-5 bg-black rounded-full border border-slate-800 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      </div>
                    </div>
                    {/* Lock screen */}
                    <div className="bg-gradient-to-b from-blue-950 to-slate-950 px-2.5 pb-4">
                      <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-white text-xs font-semibold">14:28</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-2 fill-white" viewBox="0 0 24 16"><rect x="0" y="4" width="4" height="12" rx="1"/><rect x="6" y="2" width="4" height="14" rx="1"/><rect x="12" y="0" width="4" height="16" rx="1"/></svg>
                          <div className="w-5 h-2.5 rounded-sm border border-white flex items-center px-0.5"><div className="w-4 h-1.5 bg-green-400 rounded-sm" /></div>
                        </div>
                      </div>
                      {/* Hora na lock screen */}
                      <div className="text-center mb-3">
                        <p className="text-white text-3xl font-thin">14:28</p>
                        <p className="text-slate-300 text-xs">Sábado, 15 de agosto</p>
                      </div>
                      {/* Notificação push */}
                      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-3 border border-slate-600/40 shadow-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-black shrink-0">N</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs font-bold">NexusJJ</span>
                              <span className="text-slate-400 text-xs">agora</span>
                            </div>
                            <span className="text-slate-400 text-xs">nexusjj.com.br</span>
                          </div>
                        </div>
                        <p className="text-white text-xs font-bold">⏰ Sua luta em 10 minutos!</p>
                        <p className="text-slate-300 text-xs mt-0.5">Área 2 · vs ROCHA, Diego · Luta 8</p>
                        <p className="text-slate-400 text-xs mt-0.5">Dirija-se à área de aquecimento.</p>
                      </div>
                    </div>
                    {/* Home bar */}
                    <div className="bg-slate-950 pb-2 flex justify-center">
                      <div className="w-16 h-1 rounded-full bg-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Para o Atleta</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Tudo na palma da mão</h3>
            <p className="text-slate-400 leading-relaxed">O atleta acompanha inscrições, resultados e chaves direto pelo celular. Sem baixar aplicativo — tudo pelo navegador.</p>
            <ul className="mt-4 space-y-2">
              {['Inscrição em minutos com validação automática','Acompanhe o chaveamento ao vivo','Veja seus resultados e histórico'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* BLOCO 3: Busca de luta */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1">
            <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">Quando é minha luta?</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Atleta sabe a hora exata de lutar</h3>
            <p className="text-slate-400 leading-relaxed">Qualquer pessoa — atleta, professor ou responsável — busca pelo nome e vê em qual área, em que horário e qual posição na fila está a luta.</p>
            <ul className="mt-4 space-y-2">
              {['Busca por nome ou academia','Horário estimado atualizado em tempo real','Notificação minutos antes da luta começar'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl">
              <p className="text-white font-bold text-sm mb-3">🔍 Buscar minha luta</p>
              <div className="bg-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3 border border-slate-700">
                <span className="text-slate-400 text-sm">🔍</span>
                <span className="text-white text-sm">Rafael Silva</span>
                <span className="w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5" />
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-bold">SILVA, Rafael</p>
                  <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">Próxima</span>
                </div>
                <p className="text-slate-400 text-xs">Adulto Masculino · Azul · Pluma</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-slate-300">📍 Área 2</span>
                  <span className="text-slate-300">⏱ ~14:30</span>
                  <span className="text-slate-300">🥋 Luta 8 de 12</span>
                </div>
                <div className="mt-2 bg-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between">
                  <span className="text-slate-400 text-xs">vs ROCHA, Diego · GF Team</span>
                  <span className="text-orange-400 text-xs font-bold">~15 min</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs text-center">Horário atualiza automaticamente conforme o evento avança</p>
            </div>
          </div>
        </div>

        {/* BLOCO 4: Financeiro */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1 w-full order-2 lg:order-1">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl">
              <p className="text-white font-bold text-sm mb-3">💰 Painel Financeiro</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-xs font-bold">Confirmado</p>
                  <p className="text-white text-lg font-black">R$ 8.400</p>
                  <p className="text-slate-500 text-xs">70 atletas</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                  <p className="text-yellow-400 text-xs font-bold">Pendente</p>
                  <p className="text-white text-lg font-black">R$ 1.200</p>
                  <p className="text-slate-500 text-xs">10 atletas</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <p className="text-blue-400 text-xs font-bold">Total</p>
                  <p className="text-white text-lg font-black">R$ 9.600</p>
                  <p className="text-slate-500 text-xs">80 atletas</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { nome: 'SILVA, Rafael', valor: 'R$ 120', status: 'Pago', cor: 'text-green-400' },
                  { nome: 'COSTA, Maria', valor: 'R$ 120', status: 'Pago', cor: 'text-green-400' },
                  { nome: 'SOUZA, João', valor: 'R$ 120', status: 'Pendente', cor: 'text-yellow-400' },
                ].map(p => (
                  <div key={p.nome} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                    <p className="text-white text-xs font-medium">{p.nome}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-slate-400 text-xs">{p.valor}</p>
                      <p className={`text-xs font-bold ${p.cor}`}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-wider">Financeiro</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Controle total da receita</h3>
            <p className="text-slate-400 leading-relaxed">Visualize em tempo real quanto já arrecadou, pagamentos pendentes e relatórios completos por evento.</p>
            <ul className="mt-4 space-y-2">
              {['Lotes de preços automáticos por data','Relatório de pagamentos confirmados','Controle de inadimplência'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* BLOCO 5: Chaveamento completo */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1">
            <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">Chaveamento</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Brackets automáticos e precisos</h3>
            <p className="text-slate-400 leading-relaxed">O sistema gera chaveamentos automaticamente. Eliminação simples, repescagem, round robin — você escolhe por categoria.</p>
            <ul className="mt-4 space-y-2">
              {['BYEs automáticos para número ímpar','Sorteio com separação de mesma academia','Publicação pública para atletas acompanharem'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">🏅 Adulto Azul Pluma</p>
                <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">8 atletas</span>
              </div>
              {/* Bracket 8 atletas — 3 colunas: quartas, semi, final */}
              <div className="flex gap-2 items-center overflow-x-auto pb-1">
                {/* Quartas */}
                <div className="flex flex-col gap-3 shrink-0">
                  <p className="text-slate-500 text-xs text-center mb-1">Quartas</p>
                  {[
                    { a: 'SILVA, R.', b: 'ROCHA, D.', v: 0 },
                    { a: 'COSTA, M.', b: 'ALVES, P.', v: 1 },
                    { a: 'SOUZA, L.', b: 'FERR., C.', v: 0 },
                    { a: 'MENDES, T.', b: 'HUGO, V.', v: 0 },
                  ].map((l, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-1.5 w-28">
                      <div className={`px-1.5 py-0.5 rounded text-xs mb-0.5 ${l.v === 0 ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{l.a}</div>
                      <div className={`px-1.5 py-0.5 rounded text-xs ${l.v === 1 ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{l.b}</div>
                    </div>
                  ))}
                </div>
                {/* Seta */}
                <div className="flex flex-col gap-8 shrink-0 pt-6">
                  {[0,1].map(i => <span key={i} className="text-slate-600 text-xs">›</span>)}
                </div>
                {/* Semis */}
                <div className="flex flex-col gap-6 shrink-0">
                  <p className="text-slate-500 text-xs text-center mb-1">Semi</p>
                  {[
                    { a: 'SILVA, R.', b: 'ALVES, P.', v: 0 },
                    { a: 'SOUZA, L.', b: 'MENDES, T.', v: 1 },
                  ].map((l, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-1.5 w-28">
                      <div className={`px-1.5 py-0.5 rounded text-xs mb-0.5 ${l.v === 0 ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{l.a}</div>
                      <div className={`px-1.5 py-0.5 rounded text-xs ${l.v === 1 ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{l.b}</div>
                    </div>
                  ))}
                </div>
                {/* Seta */}
                <div className="flex flex-col gap-4 shrink-0 pt-6">
                  <span className="text-slate-600 text-xs">›</span>
                </div>
                {/* Final */}
                <div className="flex flex-col shrink-0">
                  <p className="text-slate-500 text-xs text-center mb-1">Final</p>
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-1.5 w-28">
                    <div className="px-1.5 py-0.5 rounded text-xs text-yellow-400 font-bold mb-0.5">SILVA, R. 🏆</div>
                    <div className="px-1.5 py-0.5 rounded text-xs text-slate-500">MENDES, T.</div>
                  </div>
                  <div className="mt-2 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1.5 w-28">
                    <p className="text-slate-500 text-xs px-1">3º lugar</p>
                    <div className="px-1.5 py-0.5 text-xs text-orange-400 font-bold">ALVES, P. 🥉</div>
                    <div className="px-1.5 py-0.5 text-xs text-orange-400 font-bold">SOUZA, L. 🥉</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 6: Notificação Web Push */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
          <div className="flex-1 w-full order-2 lg:order-1">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl">
              {/* Mock notificação Android */}
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black">N</div>
                  <span className="text-slate-400 text-xs">NexusJJ · agora</span>
                </div>
                <p className="text-white text-sm font-bold">⏰ Sua luta começa em 10 minutos!</p>
                <p className="text-slate-400 text-xs mt-0.5">Área 2 · Adulto Azul Pluma · vs ROCHA, Diego</p>
                <p className="text-slate-500 text-xs mt-1">Dirija-se à área de aquecimento.</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black">N</div>
                  <span className="text-slate-400 text-xs">NexusJJ · 14:28</span>
                </div>
                <p className="text-white text-sm font-bold">🥊 É a sua vez! Área 2</p>
                <p className="text-slate-400 text-xs mt-0.5">SILVA, Rafael vs ROCHA, Diego · Luta 8</p>
              </div>
              <p className="text-slate-600 text-xs text-center mt-3 italic">
                iPhone: adicione o site à tela inicial (Safari → compartilhar → "Adicionar à Tela de Início") para ativar notificações.
              </p>
            </div>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Notificações</span>
            <h3 className="text-white text-2xl font-bold mt-2 mb-4">Aviso automático antes da luta</h3>
            <p className="text-slate-400 leading-relaxed">
              O atleta recebe uma notificação no celular 10 minutos antes da luta começar — mesmo com o navegador fechado.
              Sem depender de aplicativo, sem custo adicional.
            </p>
            <ul className="mt-4 space-y-2">
              {['Aviso 10 minutos antes da luta','Notificação quando é a vez exata','Funciona no Android e iPhone (como PWA)'].map(i => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{i}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <a href="/cadastro/organizador" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 transition-all duration-300">
            Criar meu evento grátis
          </a>
          <p className="text-slate-500 text-sm mt-3">Sem mensalidade. Você só paga quando seu evento acontece.</p>
        </div>

      </div>
    </section>
  );
}
