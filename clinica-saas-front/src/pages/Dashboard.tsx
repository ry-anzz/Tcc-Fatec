import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Users, Calendar, Clock, Activity } from "lucide-react";

export default function Dashboard() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // NOTA: Em produção, o tenant_id virá do login do utilizador.
  // Para testes, coloque o ID da clínica que está a usar no backend.
  const tenantId = "COLOQUE_AQUI_O_SEU_TENANT_ID";

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);

      // 1. Buscar Pacientes
      const { data: dadosPacientes } = await supabase
        .from("pacientes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("criado_em", { ascending: false });

      if (dadosPacientes) setPacientes(dadosPacientes);

      // 2. Buscar Consultas (Agenda)
      const { data: dadosConsultas } = await supabase
        .from("consultas")
        .select(
          `
          *,
          pacientes (nome, cpf)
        `,
        )
        .eq("tenant_id", tenantId)
        .order("data_hora", { ascending: true });

      if (dadosConsultas) setConsultas(dadosConsultas);

      setLoading(false);
    }

    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600" />
            Facility <span className="text-gray-400 font-light">| Health</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Gestão de Consultório e Agendamentos
          </p>
        </div>
      </header>

      {loading ? (
        <p className="text-gray-500 animate-pulse">
          A carregar dados do consultório...
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PAINEL DE PACIENTES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 bg-blue-50/50 border-b border-gray-100 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">
                Pacientes Recentes
              </h2>
            </div>

            <div className="p-5">
              {pacientes.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhum paciente registado.
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {pacientes.map((p) => (
                    <li
                      key={p.id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {p.nome || "Nome pendente"}
                        </p>
                        <p className="text-sm text-gray-500">
                          CPF: {p.cpf || "A aguardar envio..."}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {p.phone_number}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* PAINEL DE AGENDA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 bg-purple-50/50 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="text-purple-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">
                Agenda de Consultas
              </h2>
            </div>
            <div className="p-5">
              {consultas.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhuma consulta agendada.
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {consultas.map((c) => (
                    <li key={c.id} className="py-4 flex gap-4">
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3 min-w-[80px]">
                        <Clock size={18} className="text-gray-400 mb-1" />
                        <span className="text-sm font-bold text-gray-700">
                          {new Date(c.data_hora).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {c.pacientes?.nome || "Paciente Desconhecido"}
                        </p>
                        <p className="text-sm text-gray-500 mb-1">
                          {c.tipo_atendimento || "Consulta Geral"}
                        </p>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs rounded-md">
                          {c.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
