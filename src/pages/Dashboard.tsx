import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar, DollarSign, ArrowUpRight, Clock, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalPacientes: 0,
    consultasHoje: 0,
    faturamentoMes: 0
  });
  const [proximasConsultas, setProximasConsultas] = useState<any[]>([]);
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarDadosDashboard();
  }, []);

  async function buscarDadosDashboard() {
    setLoading(true);
    const hoje = new Date().toISOString().split('T')[0];
    const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // 1. Total de Pacientes
    const { count: contagemPacientes } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true });

    // 2. Consultas de Hoje
    const { count: contagemHoje } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora', `${hoje}T00:00:00`)
      .lte('data_hora', `${hoje}T23:59:59`);

    // 3. Faturamento do Mês (Somente o que foi Pago)
    const { data: faturamentosMes } = await supabase
      .from('faturamentos')
      .select('valor')
      .eq('status', 'Pago')
      .gte('data_pagamento', primeiroDiaMes);

    const totalFaturado = faturamentosMes?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

    // 4. Próximos Atendimentos de Hoje
    const { data: proximas } = await supabase
      .from('consultas')
      .select('id_consulta, data_hora, tipo_atendimento, pacientes(nome)')
      .gte('data_hora', `${hoje}T00:00:00`)
      .lte('data_hora', `${hoje}T23:59:59`)
      .order('data_hora', { ascending: true })
      .limit(5);

    // 5. Últimas Movimentações Financeiras
    const { data: movs } = await supabase
      .from('faturamentos')
      .select('id_faturamento, valor, data_emissao, status, pacientes(nome)')
      .order('data_emissao', { ascending: false })
      .limit(5);

    setStats({
      totalPacientes: contagemPacientes || 0,
      consultasHoje: contagemHoje || 0,
      faturamentoMes: totalFaturado
    });
    setProximasConsultas(proximas || []);
    setUltimasMovimentacoes(movs || []);
    setLoading(false);
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      
      {/* 1. KPIs SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Total Pacientes */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total de Pacientes</p>
            <h2 className="text-4xl font-black text-gray-900">{stats.totalPacientes}</h2>
          </div>
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
        </div>

        {/* Card Consultas Hoje */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Consultas de Hoje</p>
            <h2 className="text-4xl font-black text-gray-900">{stats.consultasHoje}</h2>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <Calendar size={28} />
          </div>
        </div>

        {/* Card Faturamento Mensal */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Faturamento (Mês)</p>
            <h2 className="text-3xl font-black text-green-600">{formatarMoeda(stats.faturamentoMes)}</h2>
          </div>
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
        </div>

      </div>

      {/* 2. CONTEÚDO PRINCIPAL (GRID 2/3 e 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Próximos Atendimentos */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Próximos Atendimentos de Hoje
            </h3>
            <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="p-6">
            {proximasConsultas.length === 0 ? (
              <div className="py-20 text-center">
                <Calendar className="mx-auto text-gray-200 mb-4" size={64} />
                <p className="text-gray-400 font-medium">Nenhum paciente agendado para o dia de hoje.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proximasConsultas.map((consulta) => (
                  <div 
                    key={consulta.id_consulta} 
                    onClick={() => navigate('/agenda')}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 cursor-pointer rounded-2xl border border-gray-100 transition duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                        {new Date(consulta.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{consulta.pacientes?.nome}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{consulta.tipo_atendimento || 'Consulta Geral'}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="text-gray-300 group-hover:text-blue-600 transition" size={20} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimas Movimentações Financeiras */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-xl font-bold text-gray-900">Últimas Movimentações Financeiras</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {ultimasMovimentacoes.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Nenhuma movimentação.</p>
              ) : (
                ultimasMovimentacoes.map((mov) => (
                  <div key={mov.id_faturamento} className="flex flex-col gap-1 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <p className="font-bold text-gray-900">{mov.pacientes?.nome || 'Paciente Avulso'}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(mov.data_emissao).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm font-bold ${mov.status === 'Pago' ? 'text-green-600' : 'text-orange-500'}`}>
                        {formatarMoeda(mov.valor)}
                      </span>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${mov.status === 'Pago' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                        {mov.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}