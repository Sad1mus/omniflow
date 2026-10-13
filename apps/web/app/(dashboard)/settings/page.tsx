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
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
    days: number[];
  };
  maxTokens: number;
  temperature: number;
}

interface TenantStatus {
  connected: boolean;
  wabaId: string | null;
  phoneNumberId: string | null;
}

export default function SettingsPage() {
  const { tenant, user } = useAuth();
  const [settings, setSettings] = useState<TenantSettings>({
    systemPrompt: 'Eres un asistente especializado en WhatsApp para clínicas veterinarias...',
    tone: 'professional',
    timezone: 'America/Bogota',
    businessHours: {
      start: '08:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5, 6],
    },
    maxTokens: 2048,
    temperature: 0.3,
  });

  const [status, setStatus] = useState<TenantStatus>({
    connected: false,
    wabaId: null,
    phoneNumberId: null,
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Cargar estado del tenant al montar
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = localStorage.getItem('omniflow_token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/tenant/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setStatus({
            connected: data.isConnected,
            wabaId: data.wabaId,
            phoneNumberId: data.phoneNumberId,
          });
        }
      } catch (error) {
        console.warn('No se pudo cargar estado del tenant', error);
      }
    };
    loadStatus();
  }, []);

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('omniflow_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/tenant/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({
          connected: data.isConnected,
          wabaId: data.wabaId,
          phoneNumberId: data.phoneNumberId,
        });
      }
    } catch (error) {
      console.error('Error refrescando status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleWhatsAppConnected = (error?: unknown) => {
    refreshStatus();
    if (!error) {
      alert('WhatsApp conectado correctamente! Estado actualizado.');
    }
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
              <WhatsAppConnectButton
                tenantId={tenant?.id || user?.tenant_id || 'demo-tenant-1'}
                onSuccess={handleWhatsAppConnected}
                onError={(error) => alert(`Error: ${error}`)}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {status.connected ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-lavender-slate">WhatsApp Conectado</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-electric-cyan">
                    {status.connected ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-lavender-slate">WABA Configurado</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {status.wabaId ? status.wabaId.slice(-8) : '—'}
                  </div>
                  <div className="text-xs text-lavender-slate">WABA ID</div>
                </div>

                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {status.phoneNumberId ? status.phoneNumberId.slice(-8) : '—'}
                  </div>
                  <div className="text-xs text-lavender-slate">Phone Number ID</div>
                </div>
              </div>
            </div>
          </GlassCard>

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
                  <option value="America/Bogota">America/Bogota (UTC-5)</option>
                  <option value="America/Mexico_City">Ciudad de Mexico (UTC-6)</option>
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

        <div className="space-y-6">
          <GlassCard level={2} padding="lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-electric-cyan" />
              Configuracion de IA
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
              Acciones Rapidas
            </h2>

            <div className="space-y-2">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full px-4 py-3 bg-gradient-to-r from-electric-cyan to-luminous-purple text-white font-semibold rounded-lg hover:shadow-[0_8px_20px_rgba(0,242,254,0.3)] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuracion'}</span>
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
        Los cambios se aplican inmediatamente. El agente sigue las reglas de prevencion de alucinaciones y escalacion humana.
      </div>
    </div>
  );
}