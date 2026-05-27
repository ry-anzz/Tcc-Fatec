import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, X, Search, Phone, FileText, Mail, MapPin, Loader2, Edit2, Trash2 } from 'lucide-react';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [buscaCpf, setBuscaCpf] = useState('');

  // Estados do Formulário
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarPacientes();
  }, []);

  async function buscarPacientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      setPacientes(data);
    }
    setLoading(false);
  }

  function abrirEdicao(paciente: any) {
    setIdEditando(paciente.id_paciente);
    setNome(paciente.nome);
    setCpf(paciente.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '');
    setTelefone(paciente.phone_number?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || '');
    setEmail(paciente.email || '');
    setEndereco(paciente.endereco || '');
    setShowModal(true);
  }

  function abrirNovo() {
    setIdEditando(null);
    setNome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setEndereco('');
    setShowModal(true);
  }

  async function excluirPaciente(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o paciente ${nome}?`)) return;

    const { error } = await supabase.from('pacientes').delete().eq('id_paciente', id);
    if (!error) {
      buscarPacientes();
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  }

  async function salvarPaciente(e: any) {
    e.preventDefault();
    setSalvando(true);

    const { data: { user } } = await supabase.auth.getUser();
    const cpfLimpo = cpf.replace(/\D/g, '');
    const telefoneLimpo = telefone.replace(/\D/g, '');

    let error;

    const dadosPaciente = { 
      nome, 
      cpf: cpfLimpo, 
      phone_number: telefoneLimpo, 
      email: email || null, 
      endereco: endereco || null 
    };

    if (idEditando) {
      const res = await supabase.from('pacientes').update(dadosPaciente).eq('id_paciente', idEditando);
      error = res.error;
    } else {
      const res = await supabase.from('pacientes').insert([{ ...dadosPaciente, tenant_id: user?.id }]);
      error = res.error;
    }

    if (!error) {
      setShowModal(false);
      buscarPacientes();
    } else {
      alert("Erro ao salvar paciente: " + error.message);
    }
    setSalvando(false);
  }

  // Máscara para o formulário de cadastro/edição
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  // Máscara exclusiva para a barra de pesquisa
  const handleBuscaCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setBuscaCpf(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    setTelefone(value);
  };

  // Lógica de filtro atualizada para buscar apenas os números limpos do CPF
  const pacientesFiltrados = pacientes.filter(p => {
    if (!buscaCpf) return true;
    const buscaLimpa = buscaCpf.replace(/\D/g, '');
    return p.cpf?.includes(buscaLimpa);
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 mt-1">Gestão de cadastros da clínica</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por CPF..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
              value={buscaCpf} 
              onChange={handleBuscaCpfChange}
            />
          </div>
          <button onClick={abrirNovo} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 cursor-pointer">
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum paciente encontrado</h3>
          <p className="text-gray-500">Verifique o CPF digitado ou cadastre um novo paciente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacientesFiltrados.map((paciente) => (
            <div key={paciente.id_paciente} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative group flex flex-col justify-between">
              <div>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEdicao(paciente)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => excluirPaciente(paciente.id_paciente, paciente.nome)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  {paciente.nome.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 pr-16">{paciente.nome}</h3>
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <span className="text-blue-700">{paciente.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || 'Sem CPF'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <span>{paciente.phone_number?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm break-all">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <span>{paciente.email || 'Sem e-mail'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600 text-sm mt-1">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{paciente.endereco || 'Sem endereço cadastrado'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">{idEditando ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
            
            <form onSubmit={salvarPaciente} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
                <input type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CPF</label>
                  <input type="text" required maxLength={14} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300" value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                  <input type="text" required maxLength={15} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300" value={telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">E-mail (Opcional)</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Endereço Residencial (Opcional)</label>
                <textarea rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 resize-none" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade..." />
              </div>
              <button type="submit" disabled={salvando} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex justify-center mt-6 cursor-pointer hover:bg-blue-700 transition">
                {salvando ? <Loader2 className="animate-spin" size={24} /> : idEditando ? 'Salvar Alterações' : 'Salvar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}