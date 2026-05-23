import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FileText, Save, Search, User, Clock, Plus } from "lucide-react";

export default function Prontuario() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [evolucoes, setEvolucoes] = useState<any[]>([]);
  const [novoTexto, setNovoTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  // 1. Carregar lista de pacientes para busca
  useEffect(() => {
    async function carregarPacientes() {
      const { data } = await supabase
        .from("pacientes")
        .select("*")
        .ilike("nome", `%${busca}%`);
      if (data) setPacientes(data);
    }
    if (busca.length > 2) carregarPacientes();
  }, [busca]);

  // 2. Carregar histórico clínico ao selecionar um paciente
  async function selecionarPaciente(paciente: any) {
    setPacienteSelecionado(paciente);
    const { data } = await supabase
      .from("evolucoes")
      .select("*")
      .eq("id_paciente", paciente.id_paciente)
      .order("criado_em", { ascending: false });
    if (data) setEvolucoes(data);
  }

  // 3. Salvar nova evolução clínica
  async function salvarEvolucao() {
    if (!novoTexto.trim()) return;
    setSalvando(true);

    // NOTA: Em produção, id_usuario viria do login. Usaremos o ID do Dr. Rafael que criamos no SQL.
    const idUsuario = "3887c79e-4a62-4217-a065-276c9f69707e"; // ID FAKE DO SQL
    const tenantId = "6341a790-df59-481f-abe2-500e4393a4fe";

    const { error } = await supabase.from("evolucoes").insert([
      {
        id_paciente: pacienteSelecionado.id_paciente,
        id_usuario: idUsuario,
        tenant_id: tenantId,
        texto: novoTexto,
      },
    ]);

    if (!error) {
      setNovoTexto("");
      selecionarPaciente(pacienteSelecionado); // Atualiza a lista
    }
    setSalvando(false);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="text-blue-600" /> Prontuário Eletrônico
      </h1>

      {/* BUSCA DE PACIENTE */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar paciente pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {pacientes.length > 0 && !pacienteSelecionado && (
          <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg">
            {pacientes.map((p) => (
              <button
                key={p.id_paciente}
                onClick={() => selecionarPaciente(p)}
                className="w-full text-left p-4 hover:bg-blue-50 flex items-center gap-3 border-b last:border-0"
              >
                <User size={18} className="text-gray-400" />
                <span className="font-medium">{p.nome}</span>
                <span className="text-xs text-gray-400">CPF: {p.cpf}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {pacienteSelecionado ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA: PERFIL E NOVA EVOLUÇÃO */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="text-green-500" /> Nova Evolução Clínica
              </h2>
              <textarea
                className="w-full border-gray-200 rounded-xl p-4 min-h-[200px] focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva aqui os sintomas, diagnóstico e conduta médica..."
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
              />
              <button
                onClick={salvarEvolucao}
                disabled={salvando}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {salvando ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save size={20} /> Salvar no Prontuário
                  </>
                )}
              </button>
            </div>

            {/* HISTÓRICO */}
            <div className="space-y-4">
              <h2 className="font-bold text-gray-700">
                Histórico de Atendimentos
              </h2>
              {evolucoes.map((e) => (
                <div
                  key={e.id_evolucao}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-medium">
                    <Clock size={14} /> {new Date(e.criado_em).toLocaleString()}
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {e.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: DADOS DO PACIENTE */}
          <div className="space-y-6">
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <User size={32} />
              </div>
              <h3 className="text-xl font-bold">{pacienteSelecionado.nome}</h3>
              <p className="opacity-80 text-sm mt-1">
                CPF: {pacienteSelecionado.cpf}
              </p>
              <hr className="my-4 border-blue-400" />
              <p className="text-sm">
                Telefone: {pacienteSelecionado.phone_number}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">
            Busque e selecione um paciente para abrir o prontuário.
          </p>
        </div>
      )}
    </div>
  );
}
