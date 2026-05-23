import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function Agenda() {
  const [consultas, setConsultas] = useState<any[]>([]);

  useEffect(() => {
    async function carregarAgenda() {
      const { data } = await supabase
        .from("consultas")
        .select("*, pacientes(nome)")
        .order("data_hora", { ascending: true });

      if (data) setConsultas(data);
    }
    carregarAgenda();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CalendarIcon className="text-purple-600" /> Agenda de Consultas
      </h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4">Horário</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {consultas.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-4 font-mono font-medium">
                  {new Date(c.data_hora).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-4 font-semibold">
                  {c.pacientes?.nome || "N/A"}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${c.status === "Confirmado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
