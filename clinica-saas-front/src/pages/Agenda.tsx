import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Clipboard, Clock, User, Plus, X, CheckCircle, Loader2, Edit2, Trash2, Activity, FileText } from 'lucide-react';

export default function Agenda() {
  const [consultas, setConsultas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Estados do Formulário
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [idPacienteSelecionado, setIdPacienteSelecionado] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarDados();
  }, []);

  async function buscarDados() {
    setLoading(true);
    
    // 1. Busca as consultas incluindo o NOME e o CPF da tabela relacionável de pacientes
    const { data: dadosConsultas } = await supabase
      .from('consultas')
      .select(`
        id_consulta, 
        data_hora, 
        status, 
        id_paciente, 
        tipo_atendimento, 
        pacientes (
          nome,
          cpf
        )
      `)
      .order('data_hora', { ascending: true });

    if (dadosConsultas) setConsultas(dadosConsultas);

    // 2. Busca os pacientes trazendo o id, nome e cpf para montar a busca do dropdown
    const { data: dadosPacientes } = await supabase
      .from('pacientes')
      .select('id_paciente, nome, cpf')
      .order('nome');
      
    if (dadosPacientes) setPacientes(dadosPacientes);

    setLoading(false);
  }

  function formatarDataParaInput(dataIso: string) {
    const data = new Date(dataIso);
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    return data.toISOString().slice(0, 16);
  }

  // Máscara para exibir o CPF formatado no card e no dropdown
  function formatarCpf(cpfCru: string) {
    if (!cpfCru) return '';
    return cpfCru.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function abrirEdicao(consulta: any) {
    setIdEditando(consulta.id_consulta);
    setIdPacienteSelecionado(consulta.id_paciente);
    setTipoAtendimento(consulta.tipo_atendimento || '');
    setDataHora(formatarDataParaInput(consulta.data_hora));
    setShowModal(true);
  }

  function abrirNovo() {
    setIdEditando(null);
    setIdPacienteSelecionado('');
    setTipoAtendimento('');
    setDataHora('');
    setShowModal(true);
  }

  async function excluirConsulta(id: string) {
    if (!window.confirm(`Tem certeza que deseja excluir este agendamento?`)) return;

    const { error } = await supabase.from('consultas').delete().eq('id_consulta', id);
    if (!error) {
      buscarDados();
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  }

  async function agendarConsulta(e: any) {
    e.preventDefault();
    setSalvando(true);

    const { data: { user } } = await supabase.auth.getUser();

    let error;
    const dadosConsulta = { 
      id_paciente: idPacienteSelecionado, 
      data_hora: dataHora, 
      tipo_atendimento: tipoAtendimento 
    };

    if (idEditando) {
      const res = await supabase.from('consultas').update(dadosConsulta).eq('id_consulta', idEditando);
      error = res.error;
    } else {
      const res = await supabase.from('consultas').insert([
        { ...dadosConsulta, status: 'Agendado', tenant_id: user?.id, id_usuario: user?.id }
      ]);
      error = res.error;
    }

    if (!error) {
      setShowModal(false);
      buscarDados();
    } else {
      alert("Erro ao agendar: " + error.message);
    }
    setSalvando(false);
  }

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Agenda de Consultas</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Gerencie os atendimentos da clínica</p>
        </div>
        <button onClick={abrirNovo} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 cursor-pointer transition">
          <Plus size={20} /> Novo Agendamento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : consultas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 text-center shadow-sm">
          <CalendarIcon className="mx-auto text-gray-300 mb-4" size={56} />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Nenhuma consulta agendada</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {consultas.map((consulta) => (
            <div key={consulta.id_consulta} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative group flex flex-col justify-between">
              
              {/* 📱 Correção Mobile: Opacidade 100% por padrão, escondido apenas com hover no PC */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 z-10">
                <button onClick={() => abrirEdicao(consulta)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => excluirConsulta(consulta.id_consulta)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Tags Responsivas (Agendado / Tipo de Atendimento) */}
              <div className="flex flex-wrap gap-2 items-center mb-4 pr-16">
                <div className="bg-green-50 text-green-700 px-2.5 py-1 md:px-3 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1">
                  <CheckCircle size={14} /> {consulta.status}
                </div>
                <div className="bg-gray-100 text-gray-700 px-2.5 py-1 md:px-3 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1 truncate max-w-full">
                  <Activity size={14} className="text-blue-500 shrink-0" /> 
                  <span className="truncate">{consulta.tipo_atendimento || 'Consulta'}</span>
                </div>
              </div>

              {/* Informações do Paciente no Card: Nome e CPF */}
              <div className="space-y-1.5 mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 line-clamp-1" title={consulta.pacientes?.nome || 'Paciente não encontrado'}>
                  <User size={20} className="text-gray-400 shrink-0" />
                  {consulta.pacientes?.nome || 'Paciente não encontrado'}
                </h3>
                <div className="text-sm text-gray-500 flex items-center gap-2 font-medium pl-0.5">
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <span>CPF: {formatarCpf(consulta.pacientes?.cpf)}</span>
                </div>
              </div>

              {/* Data e Hora */}
              <div className="flex items-center gap-2 text-gray-600 text-sm md:text-base font-medium pt-3 border-t border-gray-50">
                <Clock size={18} className="text-blue-500 shrink-0" />
                {formatarData(consulta.data_hora)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          {/* max-h-[90vh] e overflow-y-auto garantem que o modal não passe do tamanho da tela no celular */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 md:top-6 right-4 md:right-6 text-gray-400 hover:text-gray-600 cursor-pointer bg-gray-100 md:bg-transparent p-1 rounded-full" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-6 pr-8">{idEditando ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            
            <form onSubmit={agendarConsulta} className="space-y-4 md:space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">Buscar/Selecionar Paciente (Por CPF)</label>
                <select required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 bg-white transition text-sm md:text-base" value={idPacienteSelecionado} onChange={(e) => setIdPacienteSelecionado(e.target.value)}>
                  <option value="" disabled>Escolha o paciente pelo CPF...</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.id_paciente} value={paciente.id_paciente}>
                      {formatarCpf(paciente.cpf)} - {paciente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">Tipo de Atendimento / Procedimento</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Primeira Consulta, Exame, Retorno..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 transition text-sm md:text-base" 
                  value={tipoAtendimento} 
                  onChange={(e) => setTipoAtendimento(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2">Data e Hora</label>
                <input type="datetime-local" required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 transition text-sm md:text-base" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
              </div>

              <button type="submit" disabled={salvando} className="w-full bg-blue-600 text-white py-3.5 md:py-4 rounded-xl font-bold flex justify-center mt-6 cursor-pointer hover:bg-blue-700 transition shadow-md">
                {salvando ? <Loader2 className="animate-spin" size={24} /> : idEditando ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}