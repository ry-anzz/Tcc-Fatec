import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e: any) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('Email ou senha incorretos.');
    else navigate('/'); // Redireciona para o dashboard
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 w-full">
      <div className="relative">
        <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg transition" 
          onChange={e => setEmail(e.target.value)} 
          required
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
        <input 
          type="password" 
          placeholder="Senha" 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg transition" 
          onChange={e => setSenha(e.target.value)} 
          required
        />
      </div>
      
      {erro && <p className="text-red-500 text-sm font-medium">{erro}</p>}
      
      <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-md cursor-pointer">
        Entrar
      </button>
      
    </form>
  );
}