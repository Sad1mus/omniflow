import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import '@/app/globals.css'; // Alias @ configurado en vite.config.ts

import { InboxPage } from '@/app/(dashboard)/inbox/page';
import { DashboardLayout } from '@/app/(dashboard)/layout';
import { LoginPage } from '@/app/login/page';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
    >
      {children}
    </Link>
  );
}

function DashboardPage() {
  return (
    <Router>
      <Routes>
        <Route
          path="/app/dashboard/inbox"
          element={
            <DashboardLayout>
              <InboxPage />
            </DashboardLayout>
          }
        />
        <Route path="/" element={<DashboardLayout><InboxPage /></DashboardLayout>} />
      </Routes>
    </Router>
  );
}

function LoginPageRoute() {
  return <Router><LoginPage /></Router>;
}

function AppRoot() {
  return (
    <Router useRoutes={true}>
      <Routes>
        <Route path="/login" element={<LoginPageRoute />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);