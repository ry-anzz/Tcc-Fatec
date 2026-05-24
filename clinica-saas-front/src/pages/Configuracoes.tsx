import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Key, Globe, Save, Loader2, Building, Phone, Webhook } from 'lucide-react';

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  // Estados do Formulário
  const [nomeClinica, setNomeClinica] = useState('');
  const [telefone, setTelefone] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [webhookAtivo, setWebhookAtivo] = useState(false);

  useEffect(() => {
    buscarConfiguracoes();
  }, []);

  async function buscarConfiguracoes() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('tenant_id', user.id)
        .single();

      if (data) {
        setConfigId(data.id_config);
        setNomeClinica(data.nome_clinica || '');
        setTelefone(data.telefone_contato || '');
        setApiUrl(data.api_url || '');
        setApiToken(data.api_token || '');
        setWebhookAtivo(data.webhook_ativo || false);
      }
    }
    setLoading(false);
  }

  async function salvarConfiguracoes(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = {
      tenant_id: user?.id,
      nome_clinica: nomeClinica,
      telefone_contato: telefone,
      api_url: apiUrl,
      api_token: apiToken,
      webhook_ativo: webhookAtivo,
      updated_at: new Date().toISOString()
    };

    let error;

    // Se já existe, atualiza. Se não, insere.
    if (configId) {
      const res = await supabase.from('configuracoes').update(payload).eq('id_config', configId);
      error = res.error;
    } else {
      const res = await supabase.from('configuracoes').insert([payload]);
      error = res.error;
    }

    if (!error) {
      alert("Configurações salvas com sucesso!");
      buscarConfiguracoes(); // Recarrega para pegar o ID caso tenha sido insert
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    
    setSalvando(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Settings className="text-blue-600" size={32} /> Configurações do Sistema
        </h1>
        <p className="text-gray-500 mt-1">Gerencie os dados da sua clínica e integrações com serviços externos.</p>
      </div>

      <form onSubmit={salvarConfiguracoes} className="space-y-8">
        
        {/* Bloco 1: Dados da Clínica */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Building className="text-blue-500" size={24} /> Perfil da Clínica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Clínica / Razão Social</label>
              <input 
                type="text" 
                required
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ex: Clínica MedCare"
                value={nomeClinica}
                onChange={e => setNomeClinica(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Telefone Principal</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Integração API */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="text-blue-500" size={24} /> Integração de API
            </h2>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={webhookAtivo} onChange={e => setWebhookAtivo(e.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition ${webhookAtivo ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${webhookAtivo ? 'translate-x-6' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-bold text-gray-700">Ativar Integração</span>
            </label>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Configure as credenciais para comunicação com sistemas externos (ex: Disparos de WhatsApp, Pagamentos).
          </p>
          
          <div className="space-y-6 opacity-100 transition-opacity" style={{ opacity: webhookAtivo ? 1 : 0.5, pointerEvents: webhookAtivo ? 'auto' : 'none' }}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Endpoint (URL da API)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                  type="url" 
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm"
                  placeholder="https://api.seuservico.com/v1/webhook"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bearer Token / Chave de API</label>
              <div className="relative">
                <Key className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm tracking-wider"
                  placeholder="••••••••••••••••••••••••••••"
                  value={apiToken}
                  onChange={e => setApiToken(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar Global */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={salvando}
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg cursor-pointer disabled:opacity-70"
          >
            {salvando ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
            Salvar Todas as Configurações
          </button>
        </div>

      </form>
    </div>
  );
}