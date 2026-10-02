import { Outlet, useNavigate } from 'react-router-dom';
import { CopilotDrawer } from '../components/copilot/CopilotDrawer';
import { MobileNav } from '../components/layout/MobileNav';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useAuth } from '../context/AuthContext';

/**
 * Casca do app autenticado. A navegação vive em `lib/navigation.ts` (fonte
 * única); aqui só se compõe sidebar (desktop), topbar, barra inferior (mobile),
 * copiloto e o formulário global de movimentação.
 */
export function MainLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar onSignOut={() => void handleSignOut()} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileNav onSignOut={() => void handleSignOut()} />

      <CopilotDrawer />

      <TransactionForm />
    </div>
  );
}
