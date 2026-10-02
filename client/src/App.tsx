import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { RequireAuth } from './components/auth/RequireAuth';
import { Skeleton } from './components/ui/Skeleton';
import { AuthProvider } from './context/AuthContext';
import { CopilotProvider } from './context/CopilotContext';
import { FinanceProvider } from './context/FinanceContext';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

/**
 * As telas públicas são estáticas — são o primeiro paint e não podem esperar um
 * chunk. As telas de `/app/*` entram por lazy: sem isso a landing baixava o app
 * inteiro, Recharts incluído, num único bundle de ~1 MB.
 */
const CarteiraPage = lazy(() =>
  import('./pages/CarteiraPage').then((m) => ({ default: m.CarteiraPage })),
);
const OrcamentoPage = lazy(() =>
  import('./pages/OrcamentoPage').then((m) => ({ default: m.OrcamentoPage })),
);
const PlanejamentoPage = lazy(() =>
  import('./pages/PlanejamentoPage').then((m) => ({ default: m.PlanejamentoPage })),
);
const MercadoPage = lazy(() =>
  import('./pages/MercadoPage').then((m) => ({ default: m.MercadoPage })),
);
const AtivoDetalhePage = lazy(() =>
  import('./pages/AtivoDetalhePage').then((m) => ({ default: m.AtivoDetalhePage })),
);
const AcoesB3Page = lazy(() =>
  import('./pages/AcoesB3Page').then((m) => ({ default: m.AcoesB3Page })),
);
const CriptoPage = lazy(() =>
  import('./pages/CriptoPage').then((m) => ({ default: m.CriptoPage })),
);
const InternacionalPage = lazy(() =>
  import('./pages/InternacionalPage').then((m) => ({ default: m.InternacionalPage })),
);
const PerfilPage = lazy(() =>
  import('./pages/PerfilPage').then((m) => ({ default: m.PerfilPage })),
);
const PlanoPage = lazy(() => import('./pages/PlanoPage').then((m) => ({ default: m.PlanoPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

/** Esqueleto enquanto o chunk da rota chega. */
function RouteFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Carregando a tela…</span>
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-28" rows={2} />
      <Skeleton className="h-64" />
    </div>
  );
}

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
      <Suspense fallback={<RouteFallback />}>
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
            <Route path="cripto" element={<CriptoPage />} />
            <Route path="acoes" element={<AcoesB3Page />} />
            <Route path="internacional" element={<InternacionalPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="plano" element={<PlanoPage />} />
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
      </Suspense>
    </AuthProvider>
  );
}
