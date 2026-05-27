import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Clock, FileText, Clipboard } from 'lucide-react';

export default function ProntuarioModal({ paciente, onClose }: { paciente: any, onClose: () => void }) {
  const [historico, setHistorico] = useState<any[]>([]);
  const [queixa, setQueixa] = useState('');
  const [conduta, setConduta] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (paciente) buscarHistorico();
  }, [paciente]);

  async function buscarHistorico() {
    const { data } = await supabase
      .from('prontuarios')
      .select('*')
      .eq('id_paciente', paciente.id_paciente)
      .order('data_atendimento', { ascending: false });
    if (data) setHistorico(data);
  }

  async function salvarProntuario() {
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('prontuarios').insert([{
      id_paciente: paciente.id_paciente,
      tenant_id: user?.id,
      queixa_principal: queixa,
      conduta: conduta
    }]);
    setSalvando(false);
    setQueixa('');
    setConduta('');
    buscarHistorico();
  }

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={onClose}><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-6">Prontuário: {paciente.nome}</h2>
        
        <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <input className="w-full p-3 rounded-lg border" placeholder="Queixa Principal..." value={queixa} onChange={e => setQueixa(e.target.value)} />
          <textarea className="w-full p-3 rounded-lg border h-24" placeholder="Conduta/Prescrição..." value={conduta} onChange={e => setConduta(e.target.value)} />
          <button onClick={salvarProntuario} disabled={salvando} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
            <Save size={18} /> Salvar Atendimento
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Clock size={20} /> Histórico</h3>
          {historico.map(p => (
            <div key={p.id_prontuario} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
              <p className="text-xs text-gray-500 font-bold">{new Date(p.data_atendimento).toLocaleDateString()}</p>
              <p className="text-sm font-semibold text-gray-800">{p.queixa_principal}</p>
              <p className="text-sm text-gray-600 italic">{p.conduta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}