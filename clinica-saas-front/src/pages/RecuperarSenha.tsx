import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, KeyRound, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function RecuperarSenha() {
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // ETAPA 1: Envia o código para o e-mail
  async function solicitarCodigo(e: any) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setErro('Erro ao enviar e-mail. Verifique se o endereço está correto.');
    } else {
      setEtapa('codigo'); // Muda a tela para pedir o código
    }
    setLoading(false);
  }

  // ETAPA 2: Valida o código e altera a senha
  async function redefinirSenha(e: any) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    // 1. Valida o código OTP (Isso cria uma sessão temporária)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: 'recovery'
    });

    if (verifyError) {
      setErro('Código inválido ou expirado.');
      setLoading(false);
      return;
    }

    // 2. Com o código validado, atualizamos a senha do usuário
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha
    });

    if (updateError) {
      setErro('Erro ao atualizar a senha. Tente uma senha mais forte.');
    } else {
      setSucesso(true);
    }
    setLoading(false);
  }

  if (sucesso) {
    return (
      <div className="text-center space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-green-500" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Senha Alterada!</h2>
        <p className="text-gray-600 font-medium">Sua senha foi redefinida com sucesso.</p>
        {/* O botão "Voltar ao login" do componente pai (LandingPage) fará o resto */}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl font-extrabold text-center mb-2">Recuperar Acesso</h2>
      
      {erro && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-6 animate-in fade-in">
          <AlertCircle size={20} />
          {erro}
        </div>
      )}

      {etapa === 'email' ? (
        <form onSubmit={solicitarCodigo} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          <p className="text-center text-gray-500 font-medium mb-6">
            Enviaremos um código de 6 dígitos para o seu e-mail.
          </p>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Digite seu e-mail" 
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg transition" 
              value={email}
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Enviar Código'}
          </button>
        </form>
      ) : (
        <form onSubmit={redefinirSenha} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <p className="text-center text-gray-500 font-medium mb-6">
            Digite o código enviado para <br/><span className="text-gray-900 font-bold">{email}</span>
          </p>
          <div className="relative">
            <KeyRound className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Código de 6 dígitos" 
              maxLength={6}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg transition text-center tracking-[0.5em] font-bold" 
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} // Aceita só números
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
            <input 
              type="password" 
              placeholder="Nova senha" 
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-600 text-lg transition" 
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)} 
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Salvar Nova Senha'}
          </button>
        </form>
      )}
    </div>
  );
}