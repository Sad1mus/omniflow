import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/index.css'; // Importa el CSS global con fondo y variables

import { LoginPage } from '@/pages/Login';
import { InboxPage } from '@/pages/Inbox';
import { AiLabPage } from '@/pages/AiLab';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas (requieren autenticación) */}
          <Route element={<ProtectedRoute />}>
            {/* Ruta raíz redirige al inbox */}
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            {/* Página principal de Inbox */}
            <Route path="/inbox" element={<InboxPage />} />
            {/* Nueva ruta: AI Lab */}
            <Route path="/ai-lab" element={<AiLabPage />} />
            {/*
            <Route path="/dashboard/*" element={<DashboardLayout>}>
              <Route path="inbox" element={<InboxPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            */}
          </Route>

          {/* Redirigir cualquier otra ruta al login o inbox según auth */}
          <Route path="*" element={
            <ProtectedRoute>
              <Navigate to="/inbox" replace />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
