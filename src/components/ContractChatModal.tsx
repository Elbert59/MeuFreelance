import React, { useState, useEffect } from 'react';
import { Contract, ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MessageSquare, X, Send, ShieldCheck } from 'lucide-react';

interface ContractChatModalProps {
  contract: Contract;
  onClose: () => void;
}

export const ContractChatModal: React.FC<ContractChatModalProps> = ({ contract, onClose }) => {
  const { session, role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadChat() {
      const msgs = await api.getChatMessages(contract.id);
      setMessages(msgs);
    }
    loadChat();
  }, [contract.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    setLoading(true);
    try {
      const newMsg = await api.sendChatMessage({
        contractId: contract.id,
        senderRole: role,
        senderName: session.name,
        content: inputContent.trim(),
      });
      setMessages((prev) => [...prev, newMsg]);
      setInputContent('');
    } catch (err) {
      console.error('Error sending message', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[520px] text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <MessageSquare className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <span>Alinhamento de Turno</span>
                <span className="font-mono text-amber-700">{contract.id}</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                {contract.companyName} ↔ {contract.freelancerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security bar */}
        <div className="bg-emerald-50 px-4 py-1.5 border-b border-emerald-100 text-[10px] text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Canal protegido ChefMatch B2B
          </span>
          <span className="font-mono font-semibold">R$ {contract.dailyRate} em Escrow</span>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/70">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-neutral-400 py-12">
              Nenhuma mensagem trocada ainda. Inicie o alinhamento de facas, uniforme e horário.
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderRole === role;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-neutral-400 mb-0.5 px-1 font-medium">
                    {msg.senderName} ({msg.senderRole === 'EMPRESA' ? 'Restaurante' : 'Freelancer'})
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMine
                        ? 'bg-amber-500 text-neutral-950 font-medium rounded-tr-xs shadow-xs'
                        : 'bg-white text-neutral-800 rounded-tl-xs border border-neutral-200 shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-0.5 px-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Escreva uma mensagem sobre uniforme, facas ou horário..."
            className="flex-1 text-xs rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !inputContent.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-neutral-950 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
