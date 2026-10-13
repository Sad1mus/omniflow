/**
 * AiLab.tsx — Vista AI Intelligence Lab
 *
 * Réplica exacta del segundo code.html (AI Lab) con glassmorphism.
 * Componentes: Health Score circular, 6 Personas, Live Simulation Metrics.
 * Colores: #00F2FE (electric-cyan), #9B51E0 (luminous-purple), #b9cacb (lavender-slate), #0A0B1E (midnight-indigo)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  ShieldCheck,
  Scale,
  Terminal,
  UserCircle,
  HelpCircle,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Target,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';

// --- TIPOS ---

interface Persona {
  id: number;
  name: string;
  difficulty: string;
  desc: string;
  result: string;
  icon: keyof typeof personaIcons;
  status: 'success' | 'warning' | 'error';
}

// Mapeo de iconos para las personas
const personaIcons = {
  sentiment_very_dissatisfied: Brain,
  request_quote: Scale,
  terminal: Terminal,
  translate: Activity,       // Using Activity as translate icon
  account_balance: UserCircle, // Using UserCircle as balance icon
  help_outline: HelpCircle,
};

const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: Zap,
};

// --- DATOS MOCK (6 personas del code.html) ---

const personas: Persona[] = [
  {
    id: 1,
    name: 'Angry Customer',
    difficulty: 'Hard 🔥🔥🔥',
    desc: 'Delayed priority delivery and hostile refund demand sequence.',
    result: 'De-escalated in 3 turns',
    icon: 'sentiment_very_dissatisfied',
    status: 'success',
  },
  {
    id: 2,
    name: 'Aggressive Haggler',
    difficulty: 'Med 🔥🔥',
    desc: 'Demanding 40% enterprise discount on base tier with threat to walk.',
    result: 'Held margin & pilot offered',
    icon: 'request_quote',
    status: 'success',
  },
  {
    id: 3,
    name: 'Prompt Injector',
    difficulty: 'High 🔥🔥🔥',
    desc: 'Adversarial system prompt extraction & hidden token leak attempt.',
    result: 'Borderline leakage flag',
    icon: 'terminal',
    status: 'warning',
  },
  {
    id: 4,
    name: 'Language Swapper',
    difficulty: 'Med 🔥🔥',
    desc: 'Rapid cross-sentence shifts across Spanish, French, and Japanese.',
    result: '100% nuanced recall',
    icon: 'translate',
    status: 'success',
  },
  {
    id: 5,
    name: 'Scope Creep Client',
    difficulty: 'Med 🔥🔥',
    desc: 'Constantly adds new features outside the agreed contract boundaries.',
    result: 'Redirected to sales team',
    icon: 'account_balance',
    status: 'success',
  },
  {
    id: 6,
    name: 'Tech Illiterate User',
    difficulty: 'Easy 🔥',
    desc: 'Struggles with basic UI navigation and requires step-by-step guidance.',
    result: 'Guided to completion',
    icon: 'help_outline',
    status: 'success',
  },
];

// --- COMPONENTES AUXILIARES ---

/**
 * CircularHealthScore — Anillo de progreso con conic-gradient
 */
function CircularHealthScore({ score = 94 }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={130} height={130} className="transform -rotate-90">
        {/* Fondo del anillo */}
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={10}
        />
        {/* Anillo de progreso con gradiente */}
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="100%" stopColor="#9B51E0" />
          </linearGradient>
        </defs>
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="url(#healthGradient)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-lavender-slate">/100</span>
        <span className="text-xs text-emerald-400 mt-1">Health Score</span>
      </div>
    </div>
  );
}

/**
 * MetricCard — Tarjeta de métrica individual
 */
function MetricCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <GlassCard level={1} padding="md" rounded="lg" className="text-center">
      <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center bg-white/5 rounded-lg">
        <Icon className="w-5 h-5 text-electric-cyan fill-current" />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-lavender-slate mt-1">{label}</p>
    </GlassCard>
  );
}

/**
 * PersonaCard — Tarjeta de persona simulada
 */
function PersonaCard({ persona }: { persona: Persona }) {
  const Icon = personaIcons[persona.icon] || Brain;
  const StatusIcon = statusIcons[persona.status] || CheckCircle2;
  const statusColors = {
    success: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    error: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
  };
  const colors = statusColors[persona.status];

  return (
    <GlassCard level={2} padding="md" rounded="lg" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Icono a la izquierda */}
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-xl">
        <Icon className="w-6 h-6 text-electric-cyan fill-current" />
      </div>

      {/* Info central */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-white">{persona.name}</h3>
          <StatusBadge
            variant="provider"
            size="sm"
            className={`${colors.bg} ${colors.border} ${colors.text}`}
          >
            {persona.difficulty}
          </StatusBadge>
        </div>
        <p className="mt-1.5 text-body-sm text-lavender-slate line-clamp-2">
          {persona.desc}
        </p>
      </div>

      {/* Resultado + acción */}
      <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto text-right">
        <div className="flex items-center justify-end gap-1.5">
          <StatusIcon className={`w-4 h-4 ${colors.text}`} fill-current />
          <span className="text-sm font-medium text-white">{persona.result}</span>
        </div>
        <Link
          to={`/ai-lab/persona/${persona.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-electric-cyan hover:text-white transition-colors"
        >
          <span>Inspect Prompt</span>
          <svg
            className="w-3 h-3 stroke-2 text-electric-cyan"
            viewBox="0 0 24 24"
            fill="currentColor"
            strokeWidth={2.5}
          >
            <path d="M9 12l2 2 4-4m5.6-2a1 1 0 0 1 0 1.72L8 18l7-7 7 7a1 1 0 0 1-1.72 0L18 15l-7-7-7 7Z" />
          </svg>
        </Link>
      </div>
    </GlassCard>
  );
}

/* --- Resultado de simulación ---*/
{simulationResult && (
  <GlassCard level={1} padding="lg" rounded="xl" className="mt-6 p-6 text-center">
    <p className="text-lg font-medium text-emerald-400">{simulationResult}</p>
  </GlassCard>
)}

/**
 * RunSimulationButton — Botón "Primary AI Trigger"
 */
function RunSimulationButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full sm:w-auto
        bg-gradient-to-r from-electric-cyan to-luminous-purple
        text-white font-semibold py-3 px-8 rounded-full
        shadow-[0_8px_20px_rgba(0,242,254,0.3)]
        inset-0_1px_1px_rgba(255,255,255,0.4)
        hover:shadow-[0_12px_28px_rgba(0,242,254,0.4)]
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Ejecutando...
        </>
      ) : (
        <>
          <Zap className="w-5 h-5" strokeWidth={2} />
          Ejecutar Nueva Simulación
        </>
      )}
    </button>
  );
}

// --- PÁGINA PRINCIPAL ---

export function AiLabPage() {
  const { tenant } = useAuth();
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const handleRunSimulation = async () => {
    setSimulationLoading(true);
    setSimulationResult(null);

    try {
      const token = localStorage.getItem('omniflow_token');
      if (!token) throw new Error('No hay token de autenticación');

      // Obtener tenant_id del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));

      const res = await fetch(`${API_BASE}/lab/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: tenant?.id || payload.tenantId,
          vertical: 'clinic', // Default vertical
          maxTurns: 12,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error ejecutando simulación');
      }

      const result = await res.json();
      setSimulationResult(`✅ Simulación completada. Score: ${result.score} | ${result.summary.totalConversations} conversaciones`);
      console.log('Lab result:', result);
    } catch (err) {
      setSimulationResult(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      console.error('Lab error:', err);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-indigo via-dark-indigo to-purple-900 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* === HEADER === */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-headline-lg font-bold text-white">
              AI Intelligence Lab
            </h1>
            <p className="mt-2 text-body-md text-lavender-slate max-w-2xl">
              Persona stress-testing & dynamic model health telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlassCard level={1} padding="sm" rounded="xl" className="min-w-[160px]">
              <CircularHealthScore score={94} />
            </GlassCard>
          </div>
        </header>

        {/* === MÉTRICAS PRINCIPALES (3 tarjetas) === */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard icon={ShieldCheck} value="99.2%" label="Factual Accuracy" />
          <MetricCard icon={Scale} value="97.0%" label="Tone Integrity" />
          <MetricCard icon={Brain} value="100%" label="Safety Score" />
        </div>

        {/* === 6 SIMULATED PERSONAS === */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-sm font-bold text-white">
              6 Simulated Personas
            </h2>
            <p className="text-body-sm text-lavender-slate">
              Adversarial testing suite — {personas.filter(p => p.status === 'success').length}/{personas.length} passing
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        </section>

        {/* === LIVE SIMULATION METRICS === */}
        <section>
          <GlassCard level={1} padding="lg" rounded="xl" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-body-lg font-medium text-white">
                  1,200 Scenarios Tested
                </p>
                <p className="text-body-sm text-lavender-slate">
                  Global Benchmark Coverage: <span className="text-electric-cyan font-medium">94%</span> of Matrix
                </p>
                <p className="text-body-sm text-lavender-slate">
                  Turn Deliberation Velocity: <span className="text-electric-cyan font-medium">Mean: 112 tokens/sec</span>
                </p>
              </div>
              <RunSimulationButton onClick={handleRunSimulation} loading={simulationLoading} />
            </div>
          </GlassCard>
        </section>

        {/* === FOOTER INFO === */}
        <footer className="pt-8 border-t border-white/10">
          <p className="text-xs text-lavender-slate/60 text-center">
            Tenant: <span className="text-white font-mono">{tenant?.name ?? 'Desconocido'}</span>
            {' | '}
            AI Lab v1.0 — OmniFlow CRM
          </p>
        </footer>
      </div>
    </div>
  );
}

export default AiLabPage;