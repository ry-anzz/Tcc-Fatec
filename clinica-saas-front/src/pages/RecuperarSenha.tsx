import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle } from 'lucide-react';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function enviarEmail() {
    await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: window.location.origin + '/nova-senha' 
    });
    setEnviado(true);
  }

  return (
    <div className="space-y-6 w-full text-center">
      <h2 className="text-2xl font-bold">Recuperar Acesso</h2>
      <p className="text-gray-500">Enviaremos um link de redefinição para o seu e-mail.</p>
      
      {enviado ? (
        <div className="bg-green-50 p-6 rounded-xl text-green-700 flex flex-col items-center gap-2">
            <CheckCircle size={40} />
            <p className="font-bold">Instruções enviadas!</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-4 border rounded-xl" 
              placeholder="seu@email.com" 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <button 
            onClick={enviarEmail} 
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            Enviar Instruções
          </button>
        </>
      )}
    </div>
  );
}