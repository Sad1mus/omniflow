'use client';

import { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  Search,
  MoreVertical,
  Phone,
  MessageSquare,
  User,
  Bot,
} from 'lucide-react';
import { useSSE } from '@/lib/useSSE';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
}

interface ConversationMessage {
  id: string;
  from: string;
  text: string;
  senderType: 'ia' | 'humano';
  timestamp: string;
}

export default function InboxPage() {
  // Datos de contacto de ejemplo (se cargarían de la API real)
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'María González',
      phone: '573001234567',
      lastMessage: 'Hola, quisiera agendar una cita para mi perro...',
      lastMessageTime: 'Hace 2 min',
      unreadCount: 2,
      avatar: 'MG',
    },
    {
      id: '2',
      name: 'Juan Pérez',
      phone: '573109876543',
      lastMessage: '¿Tienen disponibilidad este fin de semana?',
      lastMessageTime: 'Hace 15 min',
      unreadCount: 0,
      avatar: 'JP',
    },
    {
      id: '3',
      name: 'Clínica Dental Sonríe',
      phone: '573005551212',
      lastMessage: 'Confirmo la cita para el viernes a las 10am',
      lastMessageTime: 'Hace 1 hora',
      unreadCount: 1,
      avatar: 'CS',
    },
  ]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contacts[0]
  );

  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'm1',
      from: 'contact',
      text: 'Hola! 👋 Quisiera agendar una cita para vacunar a mi perro. Tiene 6 meses.',
      senderType: 'humano',
      timestamp: '10:30 AM',
    },
    {
      id: 'm2',
      from: 'me',
      text: '¡Hola! Claro que sí 🐕. Tengo disponibilidad este jueves a las 4:00 PM o el viernes a las 10:00 AM. ¿Cuál prefieres?',
      senderType: 'ia',
      timestamp: '10:31 AM',
    },
    {
      id: 'm3',
      from: 'contact',
      text: 'El viernes a las 10am me queda perfecto. Es para la vacunación completa.',
      senderType: 'humano',
      timestamp: '10:35 AM',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  // Escuchar nuevos mensajes en tiempo real vía SSE
  useSSE('/api/webhook/inbox-stream');

  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      const data = event.detail;
      setMessages((prev) => [...prev, data]);
      // Marcar contacto como leído
    };

    window.addEventListener('omniflow:inbox-update', handleMessage as EventListener);
    return () => {
      window.removeEventListener('omniflow:inbox-update', handleMessage as EventListener);
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const msg: ConversationMessage = {
      id: Date.now().toString(),
      from: 'me',
      text: newMessage,
      senderType: 'ia',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bandeja de Entrada</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Inbox className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex">
        {/* Columna 1: Lista de contactos */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{contact.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                  {contact.unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {contact.unreadCount} {contact.unreadCount === 1 ? 'nuevo' : 'nuevos'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Columna 2: Hilo de conversación */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {selectedContact.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-3 h-3 mr-1" />
                      {selectedContact.phone}
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.from === 'me'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {msg.senderType === 'ia' ? (
                          <span title="Respuesta IA">🤖</span>
                        ) : (
                          <span title="Mensaje humano">👤</span>
                        )}
                        <span className="text-xs opacity-75">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecciona una conversación
            </div>
          )}
        </div>

        {/* Columna 3: Panel de detalles del contacto */}
        <div className="w-1/3 p-4 border-l border-gray-200 overflow-y-auto">
          {selectedContact && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-2xl mx-auto mb-3">
                  {selectedContact.avatar}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h2>
                <p className="text-gray-500 text-sm mb-2">Cliente</p>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  {selectedContact.phone}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Información</h3>
                <dl className="space-y-2">
                  <div className="flex items-start">
                    <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500">Último contacto</dt>
                      <dd className="text-sm text-gray-900">Hace 2 minutos</dd>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500">Conversaciones totales</dt>
                      <dd className="text-sm text-gray-900">24 mensajes</dd>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Bot className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500">Respuesta IA</dt>
                      <dd className="text-sm text-gray-900">Tiempo promedio: 12s</dd>
                    </div>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Acciones rápidas</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors">
                    ⚠️ Escalar a Humano
                  </button>
                  <button className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md text-sm text-blue-700 transition-colors">
                    📝 Capturar Lead
                  </button>
                  <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors">
                    🚫 Reportar Spam
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}