import { useState } from 'react';
import Login from './Login';
import RecuperarSenha from './RecuperarSenha';
import { Stethoscope, BarChart, Clock, MessageSquare, ArrowRight, X,ShieldCheck, FileText } from 'lucide-react';

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'login' | 'recuperar'>('login');

  // Link para o WhatsApp da Empresa
  const whatsappLink = "https://wa.me/5511914648331?text=Olá! Gostaria de saber mais sobre o Facility Health.";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* HEADER */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-40 px-12 py-5 flex justify-between items-center">
       <div className="flex items-center gap-2">
    <img 
      src="/logo.png" 
      alt="Logo Facility Health" 
      className="h-25 w-50" // Ajuste o 'h-10' para aumentar ou diminuir a logo
    />
  </div>
        <div className="flex gap-6 items-center">
          <button 
            onClick={() => { setView('login'); setShowModal(true); }}
            className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition shadow-lg cursor-pointer"
          >
            Acessar Sistema
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="pt-40 pb-24 px-12 text-center flex flex-col items-center">
         <h1 className="text-7xl font-extrabold max-w-5xl leading-tight mb-8 tracking-tighter">
          Transforme sua clínica em um <span className="text-blue-600">centro de excelência</span>.
        </h1>
        <p className="text-2xl text-gray-600 max-w-3xl mb-12 font-medium">
          Automatize o agendamento, elimine faltas e foque no que realmente importa: seus pacientes.
        </p>
        <div className="flex gap-4">
          <a href={whatsappLink} target="_blank" className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 shadow-xl transition flex items-center gap-3 cursor-pointer">
            Começar agora <ArrowRight size={20}/>
          </a>
        </div>
      </main>

      {/* BENEFÍCIOS E FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-extrabold text-center mb-16">Por que escolher o Facility?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MessageSquare, title: 'Bot WhatsApp', desc: 'Agendamento e confirmação automática via IA.' },
              { icon: FileText, title: 'Prontuário Digital', desc: 'PEP completo, seguro e acessível de qualquer lugar.' },
              { icon: BarChart, title: 'Analytics Clínico', desc: 'Dashboards financeiros e de performance da equipe.' },
              { icon: ShieldCheck, title: 'Segurança LGPD', desc: 'Dados criptografados e conformidade total.' }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition">
                <feat.icon className="text-blue-600 mb-6" size={40} />
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-gray-600">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER COMERCIAL */}
      <footer className="py-20 px-12 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Pronto para modernizar sua clínica?</h2>
        <a href={whatsappLink} className="inline-block bg-green-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition cursor-pointer">
          Falar com um consultor no WhatsApp
        </a>
        <p className="mt-12 text-gray-500">© 2026 Facility Health. Todos os direitos reservados.</p>
      </footer>

      {/* MODAL (LOGIN/RECUPERAR) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setShowModal(false)}><X size={24} /></button>
            {view === 'login' ? (
              <>
                <h2 className="text-3xl font-extrabold text-center mb-8">Acessar Facility</h2>
                <Login />
                <button onClick={() => setView('recuperar')} className="w-full text-center mt-6 text-gray-500 hover:text-blue-600 font-medium cursor-pointer">Esqueci minha senha</button>
              </>
            ) : (
              <>
                <RecuperarSenha />
                <button onClick={() => setView('login')} className="w-full text-center mt-6 text-blue-600 font-bold cursor-pointer">Voltar ao login</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}