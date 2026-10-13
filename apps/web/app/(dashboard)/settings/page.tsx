'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Shield,
  MessageSquare,
  Tag,
  Clock,
  Wifi,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/GlassCard';
import { WhatsAppConnectButton } from '@/components/ui/WhatsAppConnectButton';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

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
    connected: false,
    qualityRating: 'red',
    lastReceived: null,
    webhookActive: false,
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

  const handleWhatsAppConnected = (error?: unknown) => {
    // Callback cuando el OAuth de Meta completa exitosamente
    refreshStatus();
    alert('¡WhatsApp conectado correctamente! Estado actualizado.');
  };

  return (
    <div className="h-full space-y-6 bg-gradient-to-br from-midnight-indigo/20 to-lavender-slate/10 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
          <p className="text-lavender-slate mt-1">Gestiona la conexión WhatsApp y el comportamiento del agente</p>
        </div>
        <div className="flex items-center space-x-3">
          <ConnectionStatus connected={status.connected} syncRate={99.8} />
        </div>
      </div>

      {/* Sección 1: Conexión WhatsApp (MCP / Embedded Signup) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard level={2} padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-electric-cyan to-luminous-purple rounded-xl flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Conexión WhatsApp Business</h2>
                  <p className="text-lavender-slate text-sm">Configuración oficial vía Meta Embedded Signup (MCP)</p>
                </div>
              </div>
              <button
                onClick={refreshStatus}
                disabled={refreshing}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar Estado</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Botón principal de conexión MCP */}
              <WhatsAppConnectButton
                tenantId="current-tenant-id" // En producción: usar el tenantId real del contexto
                onSuccess={handleWhatsAppConnected}
                onError={(error) => alert(`Error: ${error}`)}
              />

              {/* Estado de conexión actual */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {status.connected ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-lavender-slate">WhatsApp Conectado</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className={`text-2xl font-bold ${
                    status.qualityRating === 'green' ? 'text-electric-cyan' :
                    status.qualityRating === 'yellow' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {status.qualityRating === 'green' ? '✓' : status.qualityRating === 'yellow' ? '⚠' : '✗'}
                  </div>
                  <div className="text-xs text-lavender-slate">Quality Rating</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {status.messagesSent}
                  </div>
                  <div className="text-xs text-lavender-slate">Mensajes Enviados</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-red-400">
                    {status.messagesFailed}
                  </div>
                  <div className="text-xs text-lavender-slate">Mensajes Fallidos</div>
                </div>
              </div>

              <div className="text-sm text-lavender-slate">
                <strong>Último mensaje recibido:</strong>{' '}
                {status.lastReceived || 'Nunca'}
              </div>
            </div>
          </GlassCard>

          {/* Configuración del System Prompt */}
          <GlassCard level={2} padding="lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-electric-cyan" />
              System Prompt del Agente
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-lavender-slate mb-2">
                Instrucciones del agente
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-electric-cyan/50 focus:border-transparent font-mono text-sm text-white placeholder-lavender-slate"
                placeholder="Eres un asistente de WhatsApp especializado en... (el prompt guía todo el comportamiento del agente)"
              />
              <p className="mt-2 text-xs text-lavender-slate/70">
                Este prompt define el comportamiento del agente. El agente NO inventa precios, disponibilidad o diagnósticos médicos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-lavender-slate mb-2">Tono</label>
                <select
                  value={settings.tone}
                  onChange={(e) => setSettings({ ...settings, tone: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-electric-cyan/50 focus:border-transparent text-white"
                >
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                  <option value="professional">Profesional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-lavender-slate mb-2">Zona Horaria</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-electric-cyan/50 focus:border-transparent text-white"
                >
                  <option value="America/Bogota">America/Bogotá (UTC-5)</option>
                  <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-lavender-slate mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-electric-cyan/50 focus:border-transparent text-white"
                  min={512}
                  max={8192}
                  step={256}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar: Configuración IA + Acciones */}
        <div className="space-y-6">
          <GlassCard level={2} padding="lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-electric-cyan" />
              Configuración de IA
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-lavender-slate mb-2">Temperature</label>
              <input
                type="range"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                min="0"
                max="1"
                step="0.1"
                className="w-full accent-electric-cyan"
              />
              <div className="flex justify-between text-xs text-lavender-slate/70 mt-1">
                <span>Conservador (0.0)</span>
                <span>Creativo (1.0)</span>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-center p-4 bg-electric-cyan/10 rounded-lg border border-electric-cyan/20">
                <Clock className="w-6 h-6 mx-auto text-electric-cyan mb-2" />
                <div className="text-sm font-medium text-white">Ventana 24h</div>
                <div className="text-xs text-lavender-slate mt-1">
                  Mensaje libre hasta: <strong className="text-electric-cyan">10:30 AM (hoy)</strong>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard level={2} padding="lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-electric-cyan" />
              Acciones Rápidas
            </h2>

            <div className="space-y-2">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full px-4 py-3 bg-gradient-to-r from-electric-cyan to-luminous-purple text-white font-semibold rounded-lg hover:shadow-[0_8px_20px_rgba(0,242,254,0.3)] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>

              <button
                onClick={refreshStatus}
                disabled={refreshing}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar Estado WhatsApp</span>
              </button>

              <button
                className="w-full px-4 py-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium rounded-lg hover:bg-amber-500/30 transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Probar Guardrails</span>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="text-xs text-lavender-slate/60 text-center pt-4">
        Los cambios se aplican inmediatamente. El agente sigue las reglas de prevención de alucinaciones y escalación humana.
      </div>
    </div>
  );
}