import { useState, useEffect } from 'react';

export default function StatusWhatsApp({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState('DESCONECTADO');
  const [qr, setQr] = useState(null);

  async function verificarStatus() {
    const res = await fetch(`http://localhost:3000/status?tenantId=${tenantId}`);
    const data = await res.json();
    setStatus(data.status);
    setQr(data.qrcode);
  }

  useEffect(() => {
    verificarStatus();
    const interval = setInterval(verificarStatus, 3000); // Checa a cada 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Conexão WhatsApp</h3>
      
      {status === 'CONECTADO' ? (
        <div className="text-green-600 font-bold p-4 bg-green-50 rounded-lg">✅ Sistema Conectado</div>
      ) : status === 'QRCODE' && qr ? (
        <div className="flex flex-col items-center">
          <img src={qr} alt="Scan me" className="w-64 h-64 border p-2" />
          <p className="mt-2 text-sm text-gray-500">Escaneie o QR Code para ativar a recepção</p>
        </div>
      ) : (
        <button 
          onClick={() => fetch('http://localhost:3000/iniciar', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ tenantId }) 
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Iniciar Conexão
        </button>
      )}
    </div>
  );
}