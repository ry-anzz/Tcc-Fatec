import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, Loader2, Plus, Trash2, Bot, MessageCircle, QrCode, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3000';

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('negocio');

  // --- Estados da IA e Negócio ---
  const [nomeClinica, setNomeClinica] = useState('');
  const [telefone, setTelefone] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  // Mantemos esses estados ocultos para o banco não quebrar
  const [systemPrompt, setSystemPrompt] = useState('Você é um assistente virtual especializado...');
  const [askName, setAskName] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  
  const [services, setServices] = useState<any[]>([]);
  const [operatingHours, setOperatingHours] = useState<any>({
    Segunda: "09:00 - 18:00", Terça: "09:00 - 18:00", Quarta: "09:00 - 18:00", Quinta: "09:00 - 18:00", Sexta: "09:00 - 18:00"
  });

  // --- Estados do WhatsApp ---
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [wppStatus, setWppStatus] = useState('DESCONECTADO');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    buscarConfiguracoes();
    return () => pararPolling();
  }, []);

  useEffect(() => {
    if (whatsappAtivo && (wppStatus === 'INICIANDO' || wppStatus === 'QRCODE' || wppStatus === 'CONECTADO')) {
      iniciarPolling();
    } else {
      pararPolling();
    }
  }, [whatsappAtivo, wppStatus]);

  async function buscarConfiguracoes() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase.from('configuracoes').select('*').eq('tenant_id', user.id).single();

      if (data) {
        setConfigId(data.id_config);
        setNomeClinica(data.nome_clinica || '');
        setTelefone(data.telefone_contato || '');
        setBusinessDescription(data.business_description || '');
        setSystemPrompt(data.system_prompt || '');
        setAskName(data.ask_name ?? true);
        setTemperature(data.temperature ?? 0.7);
        setMaxTokens(data.max_tokens ?? 500);
        setServices(data.services || []);
        if (data.operating_hours) setOperatingHours(data.operating_hours);
        setWhatsappAtivo(data.webhook_ativo || false);
        
        if (data.webhook_ativo) checarStatusWpp();
      }
    }
    setLoading(false);
  }

  async function salvarConfiguracoes() {
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = {
      tenant_id: user?.id,
      nome_clinica: nomeClinica,
      telefone_contato: telefone,
      business_description: businessDescription,
      system_prompt: systemPrompt,
      ask_name: askName,
      temperature,
      max_tokens: maxTokens,
      services,
      operating_hours: operatingHours,
      webhook_ativo: whatsappAtivo,
      updated_at: new Date().toISOString()
    };

    if (configId) {
      await supabase.from('configuracoes').update(payload).eq('id_config', configId);
    } else {
      await supabase.from('configuracoes').insert([payload]);
    }

    alert("Configurações salvas com sucesso!");
    setSalvando(false);
    buscarConfiguracoes();
  }

  // --- Funções de Serviços ---
  const addService = () => setServices([...services, { id: crypto.randomUUID(), name: "", category: "", description: "", price: 0 }]);
  const removeService = (id: string) => setServices(services.filter(s => s.id !== id));
  const updateService = (id: string, field: string, value: any) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- Lógica do WPPConnect ---
  async function checarStatusWpp() {
    try {
      const res = await fetch(`${BACKEND_URL}/status`);
      const data = await res.json();
      setWppStatus(data.status || 'DESCONECTADO');
      setQrCode(data.qrcode && data.qrcode.startsWith('data:image') ? data.qrcode : null);
    } catch (e) {
      setWppStatus('ERRO_SERVIDOR');
    }
  }

  function iniciarPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => checarStatusWpp(), 3000);
  }

  function pararPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  async function conectarWhatsApp() {
    try {
      setWppStatus('INICIANDO');
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      await fetch(`${BACKEND_URL}/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ tenantId: user?.id })
      });
      checarStatusWpp();
    } catch (e) {
      setWppStatus('ERRO_SERVIDOR');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 animate-in fade-in duration-300">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 md:gap-3 text-gray-900">
            <Bot className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" /> Configuração do Sistema
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Configure o negócio e conecte o WhatsApp.</p>
        </div>
        <button onClick={salvarConfiguracoes} disabled={salvando} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 md:py-2.5 rounded-xl md:rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-70 shadow-sm cursor-pointer">
          {salvando ? <Loader2 className="animate-spin h-4 w-4 md:h-5 md:w-5" /> : <Save className="h-4 w-4 md:h-5 md:w-5" />} 
          Salvar Configurações
        </button>
      </div>

      {/* COMPONENTE DE TABS RESPONSIVO (Com scroll horizontal no mobile) */}
      <div className="bg-gray-100/70 p-1.5 rounded-xl flex overflow-x-auto space-x-1 mb-6 md:mb-8 hide-scrollbar">
        {[
          { id: 'negocio', label: 'Negócio' },
          { id: 'servicos', label: 'Serviços' },
          // Aba de Comportamento removida como solicitado!
          { id: 'whatsapp', label: 'WhatsApp' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] whitespace-nowrap py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS TABS */}
      <div className="bg-white border border-gray-200 rounded-2xl md:rounded-xl shadow-sm p-5 md:p-6">
        
        {/* TAB 1: NEGÓCIO */}
        {activeTab === 'negocio' && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Informações do Negócio</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Informações básicas sobre sua clínica que a IA usará no contexto.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-sm font-bold text-gray-700">Nome da Clínica</label>
                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl md:rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition text-sm md:text-base" value={nomeClinica} onChange={e => setNomeClinica(e.target.value)} placeholder="Ex: Clínica MedCare" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-sm font-bold text-gray-700">Telefone Principal</label>
                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl md:rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition text-sm md:text-base" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-sm font-bold text-gray-700">Descrição (Para a IA entender)</label>
              <textarea rows={4} className="w-full p-3 border border-gray-200 rounded-xl md:rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition text-sm md:text-base resize-none" value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} placeholder="Descreva as especialidades da sua clínica..."></textarea>
            </div>
            
            <hr className="border-gray-100" />
            
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 block">Horário de Funcionamento</label>
              {Object.entries(operatingHours).map(([day, hours]) => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                  <span className="w-24 text-sm font-medium text-gray-700">{day}</span>
                  <input type="text" className="w-full sm:w-48 p-2.5 md:p-2 border border-gray-200 rounded-xl md:rounded-lg text-sm transition focus:ring-2 focus:ring-gray-900 outline-none" value={hours as string} onChange={e => setOperatingHours({...operatingHours, [day]: e.target.value})} placeholder="09:00 - 18:00" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SERVIÇOS */}
        {activeTab === 'servicos' && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Serviços Oferecidos</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Configure os serviços (consultas/exames) que a IA poderá recomendar e informar os valores.</p>
            </div>
            
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="p-4 md:p-5 border border-gray-200 rounded-2xl md:rounded-xl bg-gray-50/50 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 block">Nome do Serviço</label>
                      <input type="text" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none transition" value={service.name} onChange={e => updateService(service.id, "name", e.target.value)} placeholder="Ex: Consulta Cardiológica" />
                    </div>
                    <div>
                      <label className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 block">Categoria</label>
                      <input type="text" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none transition" value={service.category} onChange={e => updateService(service.id, "category", e.target.value)} placeholder="Ex: Consulta" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 block">Descrição</label>
                    <textarea rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none transition resize-none" value={service.description} onChange={e => updateService(service.id, "description", e.target.value)} placeholder="Detalhes que a IA precisa saber..."></textarea>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="w-1/2 sm:w-auto">
                      <label className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 block">Valor (R$)</label>
                      <input type="number" className="w-full sm:w-32 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none transition" value={service.price} onChange={e => updateService(service.id, "price", parseFloat(e.target.value))} />
                    </div>
                    <button onClick={() => removeService(service.id)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-lg transition flex items-center justify-center shrink-0 h-[42px] w-[42px]" title="Remover">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              
              <button onClick={addService} className="w-full py-4 md:py-3 border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-2xl md:rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer">
                <Plus size={18} /> Adicionar Serviço
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="text-green-500" /> Conexão WhatsApp
                </h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Conecte o número da clínica para o sistema começar a atender.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" checked={whatsappAtivo} onChange={e => setWhatsappAtivo(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <div className={`p-4 md:p-6 border border-gray-200 rounded-2xl md:rounded-xl bg-gray-50 transition-opacity ${whatsappAtivo ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <h3 className="font-bold text-gray-900">Status do Dispositivo</h3>
                
                {/* Badges de Status Responsivos */}
                <div className="flex flex-wrap">
                  {wppStatus === 'CONECTADO' && <span className="flex items-center gap-1.5 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"><CheckCircle size={14}/> CONECTADO</span>}
                  {wppStatus === 'QRCODE' && <span className="flex items-center gap-1.5 text-orange-700 bg-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"><QrCode size={14}/> AGUARDANDO LEITURA</span>}
                  {wppStatus === 'INICIANDO' && <span className="flex items-center gap-1.5 text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"><Loader2 className="animate-spin" size={14}/> INICIANDO...</span>}
                  {wppStatus === 'ERRO_SERVIDOR' && <span className="flex items-center gap-1.5 text-red-700 bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"><XCircle size={14}/> OFFLINE</span>}
                  {wppStatus === 'DESCONECTADO' && <span className="text-gray-500 text-xs font-bold bg-gray-200 px-3 py-1.5 rounded-lg w-fit">DESCONECTADO</span>}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 md:py-10 bg-white rounded-xl border border-gray-200 min-h-[250px]">
                {wppStatus === 'CONECTADO' ? (
                  <div className="text-center px-4">
                    <CheckCircle className="mx-auto text-green-500 mb-3 md:mb-4 w-12 h-12 md:w-16 md:h-16" />
                    <p className="font-bold text-gray-900 text-base md:text-lg">WhatsApp Vinculado!</p>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">Seu sistema já está ouvindo e respondendo pacientes.</p>
                  </div>
                ) : wppStatus === 'QRCODE' && qrCode ? (
                  <div className="text-center animate-in zoom-in duration-300 px-4">
                    <p className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Escaneie o QR Code</p>
                    <img src={qrCode} alt="QR Code" className="mx-auto border-4 border-white shadow-md rounded-xl w-48 h-48 md:w-56 md:h-56" />
                  </div>
                ) : wppStatus === 'INICIANDO' ? (
                  <div className="text-center px-4">
                    <Loader2 className="animate-spin mx-auto text-gray-900 mb-3 md:mb-4 w-10 h-10 md:w-12 md:h-12" />
                    <p className="font-medium text-gray-600 text-sm md:text-base">Gerando QR Code...</p>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <QrCode className="mx-auto text-gray-300 mb-4 w-12 h-12 md:w-16 md:h-16" />
                    <button onClick={conectarWhatsApp} className="bg-green-600 text-white px-6 md:px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-sm text-sm md:text-base cursor-pointer">
                      Gerar QR Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}