import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ModalPaciente({ tenantId, onSave }: any) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");

  const handleSave = async (e: any) => {
    e.preventDefault();
    await supabase
      .from("pacientes")
      .insert([{ tenant_id: tenantId, nome, cpf }]);
    onSave();
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white p-6 rounded-lg shadow-md border"
    >
      <h3 className="font-bold mb-4">Novo Paciente</h3>
      <input
        className="block w-full border p-2 mb-2"
        placeholder="Nome"
        onChange={(e) => setNome(e.target.value)}
      />
      <input
        className="block w-full border p-2 mb-4"
        placeholder="CPF"
        onChange={(e) => setCpf(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Salvar Paciente
      </button>
    </form>
  );
}
