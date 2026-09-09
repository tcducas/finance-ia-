import { Navigate, Route, Routes } from 'react-router-dom';
import { CopilotProvider } from './context/CopilotContext';
import { FinanceProvider } from './context/FinanceContext';
import { MainLayout } from './layouts/MainLayout';
import { AdminPage } from './pages/AdminPage';
import { AtivoDetalhePage } from './pages/AtivoDetalhePage';
import { CarteiraPage } from './pages/CarteiraPage';
import { MercadoPage } from './pages/MercadoPage';
import { OrcamentoPage } from './pages/OrcamentoPage';
import { PerfilPage } from './pages/PerfilPage';
import { PlanejamentoPage } from './pages/PlanejamentoPage';

export default function App() {
  return (
    <FinanceProvider>
      <CopilotProvider>
        <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<CarteiraPage />} />
          <Route path="gastos" element={<OrcamentoPage />} />
          <Route path="planejamento" element={<PlanejamentoPage />} />
          <Route path="investimentos" element={<MercadoPage />} />
          <Route path="investimentos/:ticker" element={<AtivoDetalhePage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </CopilotProvider>
    </FinanceProvider>
  );
}
