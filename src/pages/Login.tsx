import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: any) {
    e.preventDefault(); // Impede a página de recarregar
    setErro('');
    setLoading(true);

    // Chama a autenticação do Supabase
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password: senha 
    });

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.');
      setLoading(false);
    } else {
      // Sucesso! Redireciona para o painel. O App.tsx vai detectar e liberar a tela.
      navigate('/dashboard');
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 w-full">
      
      {/* Mensagem de Erro */}
      {erro && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in zoom-in duration-300">
          <AlertCircle size={20} />
          {erro}
        </div>
      )}

      {/* Input de E-mail */}
      <div className="relative">
        <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
        <input 
          type="email" 
          placeholder="E-mail profissional" 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg outline-none transition" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
          required
          disabled={loading}
        />
      </div>

      {/* Input de Senha */}
      <div className="relative">
        <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
        <input 
          type="password" 
          placeholder="Sua senha" 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg outline-none transition" 
          value={senha}
          onChange={e => setSenha(e.target.value)} 
          required
          disabled={loading}
        />
      </div>
      
      {/* Botão de Entrar com estado de Loading */}
      <button 
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Autenticando...
          </>
        ) : (
          'Entrar no Sistema'
        )}
      </button>
    </form>
  );
}