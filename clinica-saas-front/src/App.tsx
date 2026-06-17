import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react'; // 👈 Ícone para o menu do celular
import Sidebar from './components/Sidebar';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Atendimento from './pages/Atendimento';
import RecuperarSenha from './pages/RecuperarSenha';
import Prontuario from './pages/Prontuario';
import Pacientes from './pages/Pacientes';
import Faturamento from './pages/Faturamento';
import Agenda from './pages/Agenda';
import LandingPage from './pages/LandingPage';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // 👈 Controle do menu no celular

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<RecuperarSenha />} />
        
        {/* ROTAS DO SISTEMA PROTEGIDAS */}
        <Route path="/*" element={
          session ? (
            <div className="flex min-h-screen bg-gray-50 relative">
              
              {/* 📱 OVERLAY ESCURO: Fundo transparente quando o menu abre no celular */}
              {sidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* 🗂️ SIDEBAR RESPONSIVA: Fica fixa na esquerda. Esconde no celular, mostra no PC */}
              <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Dica de Ouro: Se quiser fechar o menu ao clicar num link, você precisaria passar onClick={() => setSidebarOpen(false)} lá pra dentro do seu componente Sidebar depois! */}
                <Sidebar />
              </div>

              {/* 🖥️ CONTEÚDO PRINCIPAL DA TELA */}
              <div className="flex-1 flex flex-col w-full md:ml-64 h-screen overflow-hidden">
                
                {/* 🍔 CABEÇALHO MOBILE: Só aparece em telas pequenas (md:hidden) */}
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm z-30">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 text-xl">Facility Health</span>
                  </div>
                  <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="p-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition"
                  >
                    <Menu size={24} />
                  </button>
                </div>

                {/* 📄 ÁREA DAS PÁGINAS (Agora flexível!) */}
                {/* p-4 no celular e p-8 no computador */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                   <Routes>
                     <Route path="/dashboard" element={<Dashboard />} />
                     <Route path="/pacientes" element={<Pacientes />} />
                     <Route path="/atendimento" element={<Atendimento />} />
                     <Route path="/agenda" element={<Agenda />} />
                     <Route path="/prontuarios" element={<Prontuario />} />
                     <Route path="/Faturamento" element={<Faturamento />} />
                     <Route path="/config" element={<Configuracoes />} />
                   </Routes>
                </main>

              </div>
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;