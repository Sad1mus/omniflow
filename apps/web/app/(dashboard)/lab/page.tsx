'use client';

import { useState } from 'react';
import {
  FlaskConical,
  Trophy,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';

interface PersonaTest {
  id: string;
  name: string;
  description: string;
  score: number;
  passed: number;
  failed: number;
  findings: string[];
}

interface LabResult {
  score: number;
  tenantId: string;
  verticalId: string;
  agentVersion: string;
  timestamp: string;
  personaResults: PersonaTest[];
  findings: string[];
  suggestions: string[];
}

const PERSONAS = [
  { id: 'p1', name: 'El comprador decidido', description: 'Quiere agendar YA, toma decisiones rápido' },
  { id: 'p2', name: 'El pregunton de precios', description: 'Pregunta mucho por costos antes de decidir' },
  { id: 'p3', name: 'El cliente enojado', description: 'Viene frustrado, pone a prueba la paciencia' },
  { id: 'p4', name: 'El que pregunta lo que no sabes', description: 'Hace preguntas fuera de alcance del bot' },
  { id: 'p5', name: 'El que exige un humano', description: 'Nunca acepta respuestas automáticas' },
  { id: 'p6', name: 'El que escribe con typos', description: 'Escribe informal, lleno de abreviaciones' },
];

export default function LabPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);

  const runLab = async () => {
    setRunning(true);
    try {
      // Llama a la API del backend para ejecutar el laboratorio
      const data = await fetchAPI<LabResult>('/api/lab/run', {
        method: 'POST',
      });
      setResult(data);
    } catch (error) {
      console.error('Error ejecutando laboratorio:', error);
      alert('Error al ejecutar el laboratorio de IA. Verifica que el backend esté corriendo.');
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laboratorio de IA</h1>
          <p className="text-gray-600">
            Antes de que tu agente hable con clientes reales, pruébalo aquí. Este sandbox <strong>nunca envía mensajes a WhatsApp</strong>.
          </p>
        </div>
        <button
          onClick={runLab}
          disabled={running}
          className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
            running
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span>{running ? 'Ejecutando pruebas...' : '🧪 Ejecutar Prueba de Agente'}</span>
        </button>
      </div>

      {!result && (
        <div className="grid grid-cols-3 gap-6">
          {PERSONAS.map((persona, idx) => (
            <div key={persona.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{persona.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">{persona.description}</p>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Score General */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Resultado General</h2>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}/100
                  </div>
                  <div className="text-xs text-gray-500">Score del agente</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {result.personaResults.reduce((acc, p) => acc + p.passed, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Pruebas aprobadas</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">
                    {result.personaResults.reduce((acc, p) => acc + p.failed, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Hallazgos</div>
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Resultados por persona */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Resultados por Cliente Simulado</h2>
            {result.personaResults.map((persona) => (
              <LabPersonaCard key={persona.id} persona={persona} />
            ))}
          </div>

          {/* Hallazgos globales */}
          {result.findings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Hallazgos Clave
              </h3>
              <ul className="space-y-2">
                {result.findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start text-sm text-amber-800">
                    <span className="mr-2">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugerencias */}
          {result.suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Sugerencias del Juez LLM
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start text-sm text-blue-800">
                    <span className="mr-2">💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LabPersonaCard({ persona }: { persona: PersonaTest }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg font-medium text-purple-700">
            ?
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{persona.name}</h3>
            <div className="flex items-center text-xs text-gray-500 space-x-3">
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                {persona.passed} OK
              </span>
              <span className="flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                {persona.failed} issues
              </span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="flex items-center justify-between py-3">
            <div className="text-sm text-gray-600">Score: <span className="font-semibold">{persona.score}/100</span></div>
            <div className="text-xs text-gray-500">Persona: {persona.id}</div>
          </div>
          {persona.findings.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Hallazgos:</h4>
              {persona.findings.map((finding, idx) => (
                <div key={idx} className="flex items-start text-sm text-gray-800 bg-gray-50 p-2 rounded">
                  <span className="mr-2">•</span>
                  {finding}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}