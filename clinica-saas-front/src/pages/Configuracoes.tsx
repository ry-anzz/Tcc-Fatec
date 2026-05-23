import StatusWhatsApp from '../components/StatusWhatsApp';

export default function Configuracoes() {
  const tenantId = "6341a790-df59-481f-abe2-500e4393a4fe"; 

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StatusWhatsApp tenantId={tenantId} />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-2">Dados da Clínica</h3>
          <p className="text-gray-500 text-sm">Gerencie o nome, logo e informações de contato.</p>
          <button className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">Editar Informações</button>
        </div>
      </div>
    </div>
  );
}