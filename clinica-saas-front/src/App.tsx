import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Prontuario from './pages/Prontuario';
import Agenda from './pages/Agenda';
import LandingPage from './pages/LandingPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTAS PÚBLICAS (Sem Sidebar) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<RecuperarSenha />} />
        
        {/* ROTAS DO SISTEMA (Com Sidebar) */}
        <Route path="/*" element={
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
               <Routes>
                 <Route path="/dashboard" element={<Dashboard />} />
                 <Route path="/agenda" element={<Agenda />} />
                 <Route path="/prontuarios" element={<Prontuario />} />
                 <Route path="/config" element={<Configuracoes />} />
               </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;