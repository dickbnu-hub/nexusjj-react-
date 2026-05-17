import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Eventos", href: "/eventos" },
    { label: "Funcionalidades", href: "/#funcionalidades" },
    { label: "Contato", href: "mailto:contato@nexusjj.com.br" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <span className="text-xl font-bold text-white">
            Nexus<span className="text-blue-500">JJ</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Entrar</a>
          <a href="/cadastro" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500">
            Criar conta
          </a>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 transition-colors hover:text-white md:hidden" aria-label="Abrir menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-800 pt-4">
              <a href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Entrar</a>
              <a href="/cadastro" className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                Criar conta
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
