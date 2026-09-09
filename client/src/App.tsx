import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { RequireAuth } from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { CopilotProvider } from './context/CopilotContext';
import { FinanceProvider } from './context/FinanceContext';
import { MainLayout } from './layouts/MainLayout';
import { AdminPage } from './pages/AdminPage';
import { AtivoDetalhePage } from './pages/AtivoDetalhePage';
import { CarteiraPage } from './pages/CarteiraPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MercadoPage } from './pages/MercadoPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OrcamentoPage } from './pages/OrcamentoPage';
import { PerfilPage } from './pages/PerfilPage';
import { PlanejamentoPage } from './pages/PlanejamentoPage';

/** Casca do app autenticado: portão + providers de dados + layout. */
function AppShell() {
  return (
    <RequireAuth>
      <FinanceProvider>
        <CopilotProvider>
          <MainLayout />
        </CopilotProvider>
      </FinanceProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route path="/app" element={<AppShell />}>
          <Route index element={<CarteiraPage />} />
          <Route path="gastos" element={<OrcamentoPage />} />
          <Route path="planejamento" element={<PlanejamentoPage />} />
          <Route path="investimentos" element={<MercadoPage />} />
          <Route path="investimentos/:ticker" element={<AtivoDetalhePage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
