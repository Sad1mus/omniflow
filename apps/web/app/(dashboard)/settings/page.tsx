'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Shield,
  MessageSquare,
  Tag,
  Clock,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';

interface TenantSettings {
  systemPrompt: string;
  tone: 'formal' | 'informal' | 'professional';
  timezone: string;
  businessHours: {
    start: string;
    end: string;
    days: number[]; // 0 = domingo, 1 = lunes, etc.
  };
  maxTokens: number;
  temperature: number;
}

interface TenantStatus {
  connected: boolean;
  qualityRating: 'green' | 'yellow' | 'red';
  lastReceived: string | null;
  webhookActive: boolean;
  messagesSent: number;
  messagesFailed: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings>({
    systemPrompt: 'Eres un asistente especializado en WhatsApp para clínicas veterinarias...',
    tone: 'professional',
    timezone: 'America/Bogota',
    businessHours: {
      start: '08:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    },
    maxTokens: 2048,
    temperature: 0.3,
  });

  const [status, setStatus] = useState<TenantStatus>({
    connected: true,
    qualityRating: 'green',
    lastReceived: '2026-10-13 10:45:00',
    webhookActive: true,
    messagesSent: 0,
    messagesFailed: 0,
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar configuración desde API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchAPI<{ settings: TenantSettings; status: TenantStatus }>(
          '/api/tenant/settings'
        );
        setSettings(data.settings);
        setStatus(data.status);
      } catch (error) {
        console.warn('No se pudo cargar configuración (usando valores por defecto)', error);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetchAPI('/api/tenant/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAPI<TenantStatus>('/api/tenant/status');
      setStatus(data);
    } catch (error) {
      console.error('Error refrescando status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Configuración del Tenant</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshStatus}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar Estado</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-500" />
          Estado de Conexión
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {status.connected ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-500">WhatsApp Conectado</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${
              status.qualityRating === 'green' ? 'text-green-600' :
              status.qualityRating === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {status.qualityRating === 'green' ? '✓' : status.qualityRating === 'yellow' ? '⚠' : '✗'}
            </div>
            <div className="text-xs text-gray-500">Quality Rating</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {status.messagesSent}
            </div>
            <div className="text-xs text-gray-500">Mensajes Enviados</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {status.messagesFailed}
            </div>
            <div className="text-xs text-gray-500">Mensajes Fallidos</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <strong>Último mensaje recibido:</strong>{' '}
          {status.lastReceived || 'Nunca'}
        </div>
      </div>

      {/* Configuración del System Prompt */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
          System Prompt
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instrucciones del agente
          </label>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Eres un asistente de WhatsApp especializado en... (el prompt guía todo el comportamiento del agente)"
          />
          <p className="mt-2 text-xs text-gray-500">
            Este prompt define el comportamiento del agente. El agente NO inventa precios, disponibilidad o diagnósticos médicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tono</label>
            <select
              value={settings.tone}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="professional">Profesional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="America/Bogota">America/Bogotá (UTC-5)</option>
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
              <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={512}
              max={8192}
              step={256}
            />
          </div>
        </div>
      </div>

      {/* Configuración de IA */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Tag className="w-5 h-5 mr-2 text-blue-500" />
          Configuración de IA
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <input
              type="range"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.1"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservador (0.0)</span>
              <span>Creativo (1.0)</span>
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <Clock className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <div className="text-sm font-medium text-gray-900">Ventana 24h</div>
              <div className="text-xs text-gray-600 mt-1">
                Mensaje libre hasta: <strong className="text-green-600">10:30 AM (hoy)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center pt-4">
        Los cambios se aplican inmediatamente. Recuerda que el agente sigue las reglas de prevención de alucinaciones.
      </div>
    </div>
  );
}