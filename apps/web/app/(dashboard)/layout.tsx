import '@/app/globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  Bot,
  Building2,
  Settings,
  LucideIcon,
} from 'lucide-react';

export const metadata = {
  title: 'OmniFlow CRM',
  description: 'Dashboard Multi-Tenant de Agentes WhatsApp con IA',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">OmniFlow</h1>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-2">
          <Link
            href="/app/dashboard/inbox"
            className="group flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Bot className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
            Bandeja de Entrada
          </Link>

          <Link
            href="/app/dashboard/lab"
            className="group flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Building2 className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
            Laboratorio de IA
          </Link>

          <Link
            href="/app/dashboard/settings"
            className="group flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-5 h-5 mr-3 text-blue-500 group-hover:text-blue-600" />
            Configuración
          </Link>
        </nav>

        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p className="mb-2">Tenant: Demo Corp</p>
          <p>Plan: Growth • <span className="underline cursor-pointer">Cerrar sesión</span></p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}