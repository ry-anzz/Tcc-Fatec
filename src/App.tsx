import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Prontuario from './pages/Prontuario';
import Pacientes from './pages/Pacientes';
import Faturamento from './pages/Faturamento';
import Agenda from './pages/Agenda';
import LandingPage from './pages/LandingPage';
import { supabase } from './lib/supabase'; // Certifique-se de que o caminho do supabase está correto

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se já existe um login ativo ao abrir a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Fica "escutando" para atualizar a rota na mesma hora que logar ou sair
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Evita que o sistema "pisque" telas erradas enquanto o Supabase verifica o login
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
        {/* ROTAS PÚBLICAS (Abertas para a internet) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<RecuperarSenha />} />
        
        {/* ROTAS DO SISTEMA (Protegidas pela Sessão) */}
        <Route path="/*" element={
          session ? (
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                 <Routes>
                   <Route path="/dashboard" element={<Dashboard />} />
                   <Route path="/pacientes" element={<Pacientes />} />
                   <Route path="/agenda" element={<Agenda />} />
                   <Route path="/prontuarios" element={<Prontuario />} />
                   <Route path="/Faturamento" element={<Faturamento />} />
                   <Route path="/config" element={<Configuracoes />} />
                 </Routes>
              </main>
            </div>
          ) : (
             /* Se tentar acessar as rotas internas sem login, volta para a Landing Page */
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;