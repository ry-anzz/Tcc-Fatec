import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Inbox, ArrowLeftRight, Send, User, Bot, CheckCircle, ArrowLeft, Trash2, Hand } from 'lucide-react';

export default function Atendimento() {
  const [abaAtiva, setAbaAtiva] = useState<'inbox' | 'transferidas'>('transferidas');
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<any>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buscarConversas();
  }, [abaAtiva]);

  useEffect(() => {
    if (conversaSelecionada) {
      buscarMensagens(conversaSelecionada.id);
    }
  }, [conversaSelecionada]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // MÁSCARA PARA DEIXAR O NÚMERO BONITO NA TELA
  function formatarTelefone(telefone: string) {
    if (!telefone) return 'Sem número';
    const num = telefone.replace(/\D/g, ''); 
    if (num.length === 12 || num.length === 13) {
      const ddd = num.substring(2, 4);
      const prefix = num.length === 13 ? num.substring(4, 9) : num.substring(4, 8);
      const suffix = num.substring(num.length - 4);
      return `+55 (${ddd}) ${prefix}-${suffix}`;
    }
    return telefone; 
  }

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

  async function selecionarConversa(conv: any) {
    setConversaSelecionada(conv);
    if (conv.unread_count > 0) {
      await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id);
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
    setNovaMensagem(''); 
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: msgSalva, error: erroInsert } = await supabase.from('messages').insert([{
      conversation_id: conversaSelecionada.id,
      tenant_id: user?.id,
      sender_type: 'agent',
      content: textoMensagem,
      message_type: 'text',
      provider: 'meta',
      is_read: true
    }]).select().single();

    if (erroInsert) {
      console.error("Erro ao salvar no banco:", erroInsert);
      alert("Erro ao salvar mensagem: " + erroInsert.message);
    } else if (msgSalva) {
      setMensagens((prev) => [...prev, msgSalva]);
    }

    await supabase.from('conversations').update({
      last_message: textoMensagem,
      last_message_at: new Date().toISOString()
    }).eq('id', conversaSelecionada.id);

    setConversas(conversas.map(c => c.id === conversaSelecionada.id ? { ...c, last_message: textoMensagem } : c));

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

  // 💡 NOVA FUNÇÃO: INTERCEPTA A IA E PASSA O CONTROLE PRO ATENDENTE
  async function assumirAtendimento() {
    if (!conversaSelecionada) return;
    
    await supabase.from('conversations')
      .update({ is_ai_active: false, status: 'pending' })
      .eq('id', conversaSelecionada.id);

    setConversaSelecionada(null);
    setAbaAtiva('transferidas'); // Joga a tela direto para a aba de Humanos
    buscarConversas();
  }

  async function encerrarAtendimento() {
    if (!conversaSelecionada) return;
    
    await supabase.from('conversations')
      .update({ is_ai_active: true, status: 'active' })
      .eq('id', conversaSelecionada.id);

    setConversaSelecionada(null);
    buscarConversas();
  }

  async function excluirConversa() {
    if (!conversaSelecionada) return;
    
    const confirmar = window.confirm("Tem certeza que deseja excluir esta conversa do painel? Isso NÃO apagará as mensagens no WhatsApp do cliente.");
    
    if (!confirmar) return;

    await supabase.from('conversations').delete().eq('id', conversaSelecionada.id);
    
    setConversaSelecionada(null);
    buscarConversas();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[85vh] bg-white md:rounded-3xl shadow-sm md:border border-gray-100 overflow-hidden -mx-4 md:mx-0 mt-2 md:mt-0">
      
      {/* MENU LATERAL (Lista de Conversas) */}
      <div className={`${conversaSelecionada ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-100 flex-col bg-gray-50`}>
        
        {/* Abas */}
        <div className="flex p-3 md:p-4 gap-2 border-b border-gray-200 bg-white">
          <button 
            onClick={() => { setAbaAtiva('inbox'); setConversaSelecionada(null); }}
            className={`flex-1 py-2.5 md:py-3 px-2 md:px-4 rounded-xl font-bold flex items-center justify-center gap-1 md:gap-2 transition text-sm md:text-base ${abaAtiva === 'inbox' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Inbox size={18} /> <span className="hidden sm:inline">IA Atendendo</span><span className="sm:hidden">IA</span>
          </button>
          <button 
            onClick={() => { setAbaAtiva('transferidas'); setConversaSelecionada(null); }}
            className={`flex-1 py-2.5 md:py-3 px-2 md:px-4 rounded-xl font-bold flex items-center justify-center gap-1 md:gap-2 transition text-sm md:text-base ${abaAtiva === 'transferidas' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <ArrowLeftRight size={18} /> Humanos
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
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
                onClick={() => selecionarConversa(conv)}
                className={`p-3 md:p-4 rounded-2xl cursor-pointer transition border ${conversaSelecionada?.id === conv.id ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-transparent hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-900 truncate flex items-center gap-2 text-sm md:text-base">
                    <User size={16} className="text-gray-400 shrink-0"/> 
                    <span className="truncate">{conv.contacts?.name || formatarTelefone(conv.contacts?.phone_number)}</span>
                  </h4>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:py-1 rounded-full shrink-0 ml-2">{conv.unread_count}</span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-500 truncate">{conv.last_message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JANELA DE CHAT */}
      <div className={`${!conversaSelecionada ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-[#F9FAFB] relative`}>
        {conversaSelecionada ? (
          <>
            {/* CABEÇALHO DO CHAT */}
            <div className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-3 md:px-8 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2 md:gap-4 truncate">
                
                <button 
                  onClick={() => setConversaSelecionada(null)} 
                  className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg md:text-xl shrink-0">
                  {conversaSelecionada.contacts?.name?.charAt(0) || <User />}
                </div>
                <div className="truncate">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">{conversaSelecionada.contacts?.name || "Sem Nome"}</h2>
                  <p className="text-xs md:text-sm text-gray-500 truncate">{formatarTelefone(conversaSelecionada.contacts?.phone_number)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 💡 SE A IA ESTIVER ATENDENDO: Exibe o botão para o humano assumir */}
                {abaAtiva === 'inbox' && (
                  <button onClick={assumirAtendimento} className="flex items-center gap-1 md:gap-2 bg-orange-50 text-orange-600 px-3 md:px-4 py-2 rounded-xl font-bold hover:bg-orange-100 transition shrink-0">
                    <Hand size={18} /> <span className="hidden sm:inline">Assumir Chat</span><span className="sm:hidden text-sm">Assumir</span>
                  </button>
                )}

                {abaAtiva === 'transferidas' && (
                  <button onClick={encerrarAtendimento} className="flex items-center gap-1 md:gap-2 bg-green-50 text-green-700 px-3 md:px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition shrink-0">
                    <CheckCircle size={18} /> <span className="hidden sm:inline">Resolver e Devolver</span><span className="sm:hidden text-sm">Resolver</span>
                  </button>
                )}
                
                <button onClick={excluirConversa} className="flex items-center gap-1 md:gap-2 bg-red-50 text-red-600 px-3 md:px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition shrink-0" title="Apagar do Painel">
                  <Trash2 size={18} /> <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
            </div>

            {/* ÁREA DE MENSAGENS */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
              {mensagens.map((msg) => {
                const isCliente = msg.sender_type === 'customer';
                const isIA = msg.sender_type === 'ai';
                
                return (
                  <div key={msg.id} className={`flex ${isCliente ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl text-sm md:text-base ${
                      isCliente ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm' : 
                      isIA ? 'bg-gray-800 text-white rounded-tr-none' : 
                      'bg-blue-600 text-white rounded-tr-none' 
                    }`}>
                      {!isCliente && (
                        <div className="flex items-center gap-1 mb-1 opacity-70 text-[10px] md:text-xs font-bold">
                          {isIA ? <><Bot size={12}/> Robô IA</> : <><User size={12}/> Você</>}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            {/* BARRA DE DIGITAÇÃO */}
            <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
              {abaAtiva === 'inbox' ? (
                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 font-medium text-xs md:text-sm">
                  🤖 A Inteligência Artificial está no controle desta conversa.
                </div>
              ) : (
                <form onSubmit={enviarMensagemHumana} className="flex gap-2">
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Sua mensagem..."
                    className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm md:text-base"
                    disabled={enviando}
                  />
                  <button 
                    type="submit" 
                    disabled={enviando || !novaMensagem.trim()}
                    className="bg-blue-600 text-white w-12 md:w-14 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Send size={20} className={enviando ? 'animate-pulse' : ''} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 flex-col">
            <MessageSquare size={60} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-gray-800 mb-1">Selecione uma conversa</h3>
            <p>Escolha um paciente no menu lateral para visualizar o chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}