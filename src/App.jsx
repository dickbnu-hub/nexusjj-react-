import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import ServicesSection from './components/Services/ServicesSection';
import Showcase from './components/Showcase/Showcase';
import LoginPage from './pages/LoginPage';
import RecuperarSenhaPage from './pages/RecuperarSenhaPage';
import RedefinirSenhaPage from './pages/RedefinirSenhaPage';
import CadastroPage from './pages/CadastroPage';
import CadastroAtletaPage from './pages/CadastroAtletaPage';
import MenorDeIdadePage from './pages/MenorDeIdadePage';
import CadastroProfessorPage from './pages/CadastroProfessorPage';
import CadastroArbitroPage from './pages/CadastroArbitroPage';
import CadastroOrganizadorPage from './pages/CadastroOrganizadorPage';
import PagamentoAdesaoPage from './pages/PagamentoAdesaoPage';
import PainelAtletaPage from './pages/PainelAtletaPage';
import PainelProfessorPage from './pages/PainelProfessorPage';
import PainelOrganizadorPage from './pages/PainelOrganizadorPage';
import PainelAdminPage from './pages/PainelAdminPage';
import PainelOrganizadorEventoPage from './pages/PainelOrganizadorEventoPage';
import EventosPage from './pages/EventosPage';
import EventoDetalhePage from './pages/EventoDetalhePage';
import PainelAreasPage from './pages/PainelAreasPage';
import PlacarMesa from './pages/PlacarMesa';
import PlacarTV from './pages/PlacarTV';
import PainelTransmissaoPage from './pages/PainelTransmissaoPage';
import PainelLutasAoVivo from './pages/PainelLutasAoVivo';
import PlacarAoVivoPage from './pages/PlacarAoVivoPage';
import PainelPesagemPage from './pages/PainelPesagemPage';
import CredencialAtletaPage from './pages/CredencialAtletaPage';
import ChaveamentoPage from './pages/ChaveamentoPage';
import ChaveamentoAdminPage from './pages/ChaveamentoAdminPage';
import ConfiguracaoChavesPage from './pages/ConfiguracaoChavesPage';
import DistribuicaoChavesPage from './pages/DistribuicaoChavesPage';
import CriarEventoPage from './pages/CriarEventoPage';
import ConfiguracaoValoresPage from './pages/ConfiguracaoValoresPage';
import ConfiguracaoCategoriasPage from './pages/ConfiguracaoCategoriasPage';
import InscricaoEventoPage from './pages/InscricaoEventoPage';
import PagamentoInscricaoPage from './pages/PagamentoInscricaoPage';

function AppContent() {
  const location = useLocation();
  const semHeader = ['/placar/mesa', '/placar/tv', '/painel/'].some(p => location.pathname.startsWith(p));

  return (
    <>
      {!semHeader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<><Hero /><ServicesSection /><Showcase /></>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/cadastro/atleta" element={<CadastroAtletaPage />} />
          <Route path="/cadastro/menor-de-idade" element={<MenorDeIdadePage />} />
          <Route path="/cadastro/professor" element={<CadastroProfessorPage />} />
          <Route path="/cadastro/arbitro" element={<CadastroArbitroPage />} />
          <Route path="/cadastro/organizador" element={<CadastroOrganizadorPage />} />
          <Route path="/cadastro/organizador/pagamento" element={<PagamentoAdesaoPage />} />
          <Route path="/painel/atleta" element={<PainelAtletaPage />} />
          <Route path="/painel/professor" element={<PainelProfessorPage />} />
          <Route path="/painel/organizador" element={<PainelOrganizadorPage />} />
          <Route path="/eventos/novo" element={<CriarEventoPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/eventos/:id" element={<EventoDetalhePage />} />
          <Route path="/eventos/:id/inscricao" element={<InscricaoEventoPage />} />
          <Route path="/admin" element={<PainelAdminPage />} />
          <Route path="/eventos/:id/admin" element={<PainelOrganizadorEventoPage />} />
          <Route path="/eventos/:id/areas" element={<PainelAreasPage />} />
          <Route path="/eventos/:id/valores" element={<ConfiguracaoValoresPage />} />
          <Route path="/eventos/:id/categorias" element={<ConfiguracaoCategoriasPage />} />
          <Route path="/eventos/:id/chaves" element={<ChaveamentoPage />} />
          <Route path="/eventos/:id/chaves/admin" element={<ChaveamentoAdminPage />} />
          <Route path="/eventos/:id/chaves/configuracao" element={<ConfiguracaoChavesPage />} />
          <Route path="/eventos/:id/chaves/distribuicao" element={<DistribuicaoChavesPage />} />
          <Route path="/placar/mesa" element={<PlacarMesa />} />
          <Route path="/placar/tv" element={<PlacarTV />} />
          <Route path="/eventos/:id/transmissao" element={<PainelTransmissaoPage />} />
          <Route path="/eventos/:id/lutas" element={<PainelLutasAoVivo />} />
          <Route path="/ao-vivo/:eventoId/:areaId" element={<PlacarAoVivoPage />} />
          <Route path="/pesagem/:eventoId" element={<PainelPesagemPage />} />
          <Route path="/credencial/:atletaId/:eventoId" element={<CredencialAtletaPage />} />
          <Route path="/eventos/:id/pagamento" element={<PagamentoInscricaoPage />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;