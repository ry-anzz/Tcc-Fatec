import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Inbox, ArrowLeftRight, Send, User, Bot, CheckCircle } from 'lucide-react';

export default function Atendimento() {
  const [abaAtiva, setAbaAtiva] = useState<'inbox' | 'transferidas'>('transferidas');
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<any>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  // Busca as conversas sempre que a aba mudar
  useEffect(() => {
    buscarConversas();
  }, [abaAtiva]);

  // Busca as mensagens sempre que o usuário selecionar uma conversa
  useEffect(() => {
    if (conversaSelecionada) {
      buscarMensagens(conversaSelecionada.id);
    }
  }, [conversaSelecionada]);

  // Rola o chat para o final automaticamente
  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function buscarConversas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('conversations')
      .select(`*, contacts(name, phone_number)`)
      .eq('tenant_id', user?.id)
      .order('last_message_at', { ascending: false });

    if (abaAtiva === 'inbox') {
      query = query.eq('is_ai_active', true);
    } else {
      query = query.eq('is_ai_active', false).eq('status', 'pending');
    }

    const { data } = await query;
    if (data) setConversas(data);
    setLoading(false);
  }

  // 🚀 NOVA FUNÇÃO: Zera a notificação ao clicar na conversa
  async function selecionarConversa(conv: any) {
    setConversaSelecionada(conv);
    
    // Se tiver mensagem não lida, avisa o banco para zerar
    if (conv.unread_count > 0) {
      await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id);
      
      // Atualiza visualmente na mesma hora
      setConversas(conversas.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    }
  }

  async function buscarMensagens(conversationId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMensagens(data);
  }

  async function enviarMensagemHumana(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMensagem.trim() || !conversaSelecionada) return;

    const textoMensagem = novaMensagem;
    setNovaMensagem(''); // Limpa o input na hora para dar sensação de agilidade
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Grava no Supabase (Agora com 'provider' para não sumir no refresh)
    const { data: msgSalva, error: erroInsert } = await supabase.from('messages').insert([{
      conversation_id: conversaSelecionada.id,
      tenant_id: user?.id,
      sender_type: 'agent',
      content: textoMensagem,
      message_type: 'text',
      provider: 'meta', // <- ISSO ESTAVA FALTANDO!
      is_read: true
    }]).select().single();

    if (erroInsert) {
      console.error("Erro ao salvar no banco:", erroInsert);
      alert("Erro ao salvar mensagem: " + erroInsert.message);
    } else if (msgSalva) {
      setMensagens((prev) => [...prev, msgSalva]);
    }

    // 2. Atualiza o card lateral com a sua última mensagem
    await supabase.from('conversations').update({
      last_message: textoMensagem,
      last_message_at: new Date().toISOString()
    }).eq('id', conversaSelecionada.id);

    setConversas(conversas.map(c => c.id === conversaSelecionada.id ? { ...c, last_message: textoMensagem } : c));

    // 3. Manda para o Node.js disparar no WhatsApp real!
    try {
      const response = await fetch('http://localhost:3000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversaSelecionada.id,
          content: textoMensagem,
          tenantId: user?.id
        })
      });

      if (!response.ok) {
        console.error("Erro do Node.js:", await response.text());
      }
    } catch (err) {
      console.error('Erro ao conectar com o backend do WhatsApp:', err);
    }

    setEnviando(false);
  }

  async function encerrarAtendimento() {
    if (!conversaSelecionada) return;
    
    await supabase.from('conversations')
      .update({ is_ai_active: true, status: 'active' })
      .eq('id', conversaSelecionada.id);

    setConversaSelecionada(null);
    buscarConversas();
  }

  return (
    <div className="flex h-[85vh] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* MENU LATERAL */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
        
        {/* Abas */}
        <div className="flex p-4 gap-2 border-b border-gray-200 bg-white">
          <button 
            onClick={() => { setAbaAtiva('inbox'); setConversaSelecionada(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${abaAtiva === 'inbox' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Inbox size={18} /> IA Atendendo
          </button>
          <button 
            onClick={() => { setAbaAtiva('transferidas'); setConversaSelecionada(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition relative ${abaAtiva === 'transferidas' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <ArrowLeftRight size={18} /> Humanos
          </button>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 mt-10">Carregando...</p>
          ) : conversas.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 flex flex-col items-center">
              <MessageSquare size={40} className="mb-3 opacity-20" />
              <p>Nenhuma conversa aqui.</p>
            </div>
          ) : (
            conversas.map((conv) => (
              <div 
                key={conv.id} 
                onClick={() => selecionarConversa(conv)} // <-- Modificado aqui!
                className={`p-4 rounded-2xl cursor-pointer transition border ${conversaSelecionada?.id === conv.id ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-transparent hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-900 truncate flex items-center gap-2">
                    <User size={16} className="text-gray-400"/> {conv.contacts?.name || conv.contacts?.phone_number}
                  </h4>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{conv.unread_count}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JANELA DE CHAT */}
      <div className="w-2/3 flex flex-col bg-[#F9FAFB] relative">
        {conversaSelecionada ? (
          <>
            <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {conversaSelecionada.contacts?.name?.charAt(0) || <User />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{conversaSelecionada.contacts?.name}</h2>
                  <p className="text-sm text-gray-500">{conversaSelecionada.contacts?.phone_number}</p>
                </div>
              </div>
              
              {abaAtiva === 'transferidas' && (
                <button onClick={encerrarAtendimento} className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition">
                  <CheckCircle size={18} /> Resolver e Devolver para IA
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {mensagens.map((msg) => {
                const isCliente = msg.sender_type === 'customer';
                const isIA = msg.sender_type === 'ai';
                
                return (
                  <div key={msg.id} className={`flex ${isCliente ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl ${
                      isCliente ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm' : 
                      isIA ? 'bg-gray-800 text-white rounded-tr-none' : 
                      'bg-blue-600 text-white rounded-tr-none' 
                    }`}>
                      {!isCliente && (
                        <div className="flex items-center gap-1 mb-1 opacity-70 text-xs font-bold">
                          {isIA ? <><Bot size={12}/> Robô IA</> : <><User size={12}/> Você (Humano)</>}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              {abaAtiva === 'inbox' ? (
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 font-medium">
                  🤖 A Inteligência Artificial está no controle desta conversa.
                </div>
              ) : (
                <form onSubmit={enviarMensagemHumana} className="flex gap-2">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Digite sua mensagem para o paciente..."
                    className="flex-1 px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    disabled={enviando}
                  />
                  <button 
                    type="submit" 
                    disabled={enviando || !novaMensagem.trim()}
                    className="bg-blue-600 text-white w-14 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={20} className={enviando ? 'animate-pulse' : ''} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
            <MessageSquare size={60} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-gray-800 mb-1">Selecione uma conversa</h3>
            <p>Escolha um paciente no menu lateral para visualizar o chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}