import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Search, Plus, CheckCircle, Clock, CreditCard, Loader2, X, FileText, Banknote, Trash2 } from 'lucide-react';

export default function Faturamento() {
  const [faturamentos, setFaturamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [consultasPendentes, setConsultasPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Resumo Financeiro
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalPendente, setTotalPendente] = useState(0);

  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [consultaSelecionada, setConsultaSelecionada] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [formaPagamento, setFormaPagamento] = useState('PIX');

  useEffect(() => {
    buscarDados();
  }, []);

  useEffect(() => {
    if (pacienteSelecionado) {
      buscarConsultasDoPaciente(pacienteSelecionado);
    } else {
      setConsultasPendentes([]);
    }
  }, [pacienteSelecionado]);

  async function buscarDados() {
    setLoading(true);
    
    const { data: dadosFaturamento } = await supabase
      .from('faturamentos')
      .select('*, pacientes(nome, cpf), consultas(data_hora, tipo_atendimento)')
      .order('data_emissao', { ascending: false });

    if (dadosFaturamento) {
      setFaturamentos(dadosFaturamento);
      
      const recebido = dadosFaturamento.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + Number(curr.valor), 0);
      const pendente = dadosFaturamento.filter(f => f.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.valor), 0);
      setTotalRecebido(recebido);
      setTotalPendente(pendente);
    }

    const { data: dadosPacientes } = await supabase.from('pacientes').select('id_paciente, nome, cpf').order('nome');
    if (dadosPacientes) setPacientes(dadosPacientes);

    setLoading(false);
  }

  async function buscarConsultasDoPaciente(idPaciente: string) {
    const { data } = await supabase
      .from('consultas')
      .select('id_consulta, data_hora, tipo_atendimento')
      .eq('id_paciente', idPaciente)
      .order('data_hora', { ascending: false });
    
    if (data) setConsultasPendentes(data);
  }

  async function salvarFaturamento(e: any) {
    e.preventDefault();
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();

    const dadosLancamento = {
      tenant_id: user?.id,
      id_paciente: pacienteSelecionado,
      id_consulta: consultaSelecionada || null,
      valor: parseFloat(valor.replace(',', '.')),
      status,
      forma_pagamento: formaPagamento,
      data_pagamento: status === 'Pago' ? new Date().toISOString() : null
    };

    const { error } = await supabase.from('faturamentos').insert([dadosLancamento]);

    if (!error) {
      setShowModal(false);
      resetarFormulario();
      buscarDados();
    } else {
      alert("Erro ao salvar faturamento: " + error.message);
    }
    setSalvando(false);
  }

  async function marcarComoPago(idFaturamento: string) {
    await supabase
      .from('faturamentos')
      .update({ status: 'Pago', data_pagamento: new Date().toISOString() })
      .eq('id_faturamento', idFaturamento);
    buscarDados();
  }

  async function excluirFaturamento(idFaturamento: string) {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    await supabase.from('faturamentos').delete().eq('id_faturamento', idFaturamento);
    buscarDados();
  }

  function resetarFormulario() {
    setPacienteSelecionado('');
    setConsultaSelecionada('');
    setValor('');
    setStatus('Pendente');
    setFormaPagamento('PIX');
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const filtrados = faturamentos.filter(f => 
    f.pacientes?.nome.toLowerCase().includes(busca.toLowerCase()) || 
    f.pacientes?.cpf.includes(busca.replace(/\D/g, ''))
  );

  return (
    <div className="w-full pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-500 mt-1">Acompanhamento de faturamento e recebimentos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 transition cursor-pointer">
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 bg-green-50 w-24 h-24 rounded-full opacity-50 pointer-events-none"></div>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Recebido</p>
            <h2 className="text-4xl font-extrabold text-gray-900">{formatarMoeda(totalRecebido)}</h2>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 bg-orange-50 w-24 h-24 rounded-full opacity-50 pointer-events-none"></div>
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">A Receber (Pendentes)</p>
            <h2 className="text-4xl font-extrabold text-gray-900">{formatarMoeda(totalPendente)}</h2>
          </div>
        </div>
      </div>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
        <input 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition"
          placeholder="Buscar faturamento por nome ou CPF..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto text-blue-600 mt-10" size={40} /> : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Referência</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Forma de Pag.</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length > 0 ? filtrados.map(f => (
                <tr key={f.id_faturamento} className="hover:bg-blue-50/30 transition duration-150">
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900 text-base">{f.pacientes?.nome}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <FileText size={14} className="text-gray-400" />
                      {f.pacientes?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600">
                    {f.consultas ? (
                      <div>
                        <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{f.consultas.tipo_atendimento || 'Consulta'}</span>
                        <p className="mt-2 text-xs text-gray-400 font-medium">
                          {new Date(f.consultas.data_hora).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Avulso</span>
                    )}
                  </td>
                  <td className="px-6 py-5 font-extrabold text-gray-900 text-lg">
                    {formatarMoeda(f.valor)}
                  </td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-2 text-sm text-gray-600 font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                      {f.forma_pagamento === 'PIX' ? <Banknote size={16} className="text-teal-600"/> : <CreditCard size={16} className="text-indigo-600"/>}
                      {f.forma_pagamento}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {f.status === 'Pago' ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-green-200">
                        <CheckCircle size={16} /> Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-orange-200">
                        <Clock size={16} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    {f.status === 'Pendente' && (
                      <button 
                        onClick={() => marcarComoPago(f.id_faturamento)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm cursor-pointer"
                      >
                        Baixar
                      </button>
                    )}
                    <button 
                      onClick={() => excluirFaturamento(f.id_faturamento)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer inline-flex items-center justify-center align-middle"
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                    Nenhum lançamento financeiro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE NOVO LANÇAMENTO */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md relative shadow-2xl">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition bg-gray-100 hover:bg-gray-200 p-2 rounded-full cursor-pointer" onClick={() => { setShowModal(false); resetarFormulario(); }}><X size={20}/></button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Novo Lançamento</h2>
            
            <form onSubmit={salvarFaturamento} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Paciente</label>
                <select required className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={pacienteSelecionado} onChange={e => setPacienteSelecionado(e.target.value)}>
                  <option value="" disabled>Selecione o paciente...</option>
                  {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nome}</option>)}
                </select>
              </div>

              {pacienteSelecionado && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Vincular Consulta (Opcional)</label>
                  <select className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={consultaSelecionada} onChange={e => setConsultaSelecionada(e.target.value)}>
                    <option value="">Sem vínculo (Avulso)</option>
                    {consultasPendentes.map(c => (
                      <option key={c.id_consulta} value={c.id_consulta}>
                        {new Date(c.data_hora).toLocaleDateString('pt-BR')} - {c.tipo_atendimento || 'Consulta'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Forma de Pagamento</label>
                <select className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Convênio">Convênio Médico</option>
                </select>
              </div>

              <button type="submit" disabled={salvando} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 mt-6 transition shadow-md cursor-pointer disabled:opacity-70">
                {salvando ? <Loader2 className="animate-spin" /> : <DollarSign size={20} />} Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}