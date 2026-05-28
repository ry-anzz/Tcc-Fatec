import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Save, Trash2, Edit2, Loader2, User, Phone, FileText, Check, X, Printer } from 'lucide-react';

export default function ProntuarioEletronico() {
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [paciente, setPaciente] = useState<any>(null);
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [textoEvolucao, setTextoEvolucao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Estados para Edição In-line
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');

  // 1. Efeito de Busca Automática (Autosuggest)
  useEffect(() => {
    if (busca.length < 2) {
      setSugestoes([]);
      return;
    }
    
    const fetchSugestoes = async () => {
      // Tira os pontos do CPF para a busca funcionar perfeitamente
      const buscaLimpa = busca.replace(/\D/g, ''); 
      const queryBusca = buscaLimpa.length > 0 ? `%${buscaLimpa}%` : `%${busca}%`;

      const { data } = await supabase
        .from('pacientes')
        .select('id_paciente, nome, cpf, phone_number')
        .or(`nome.ilike.%${busca}%,cpf.ilike.${queryBusca}`)
        .limit(5);

      if (data) setSugestoes(data);
    };

    // Pequeno delay (debounce) para não sobrecarregar o banco ao digitar rápido
    const delay = setTimeout(fetchSugestoes, 300);
    return () => clearTimeout(delay);
  }, [busca]);

  function selecionarPaciente(p: any) {
    setPaciente(p);
    setBusca('');
    setSugestoes([]);
    buscarHistorico(p.id_paciente);
  }

  async function buscarHistorico(idPaciente: string) {
    const { data } = await supabase
      .from('prontuarios')
      .select('*')
      .eq('id_paciente', idPaciente)
      .order('data_atendimento', { ascending: false });
    if (data) setHistorico(data);
  }

  // 2. Salvar nova evolução
  async function salvarEvolucao() {
    if (!paciente || !textoEvolucao.trim()) return;
    setSalvando(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('prontuarios').insert([{
      id_paciente: paciente.id_paciente,
      anamnese: textoEvolucao,
      tenant_id: user?.id
    }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setTextoEvolucao('');
      buscarHistorico(paciente.id_paciente);
    }
    setSalvando(false);
  }

  // 3. Funções de Edição
  function iniciarEdicao(prontuario: any) {
    setEditandoId(prontuario.id_prontuario);
    setTextoEdicao(prontuario.anamnese || prontuario.queixa_principal || '');
  }

  async function confirmarEdicao() {
    if (!editandoId) return;
    
    const { error } = await supabase
      .from('prontuarios')
      .update({ anamnese: textoEdicao })
      .eq('id_prontuario', editandoId);

    if (error) {
      alert("Erro ao editar: " + error.message);
    } else {
      setEditandoId(null);
      setTextoEdicao('');
      buscarHistorico(paciente.id_paciente);
    }
  }

  // 4. Função de Excluir
  async function excluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este registro do prontuário? Essa ação não pode ser desfeita.")) return;
    
    const { error } = await supabase.from('prontuarios').delete().eq('id_prontuario', id);
    
    if (error) {
      alert("Erro ao excluir. O banco bloqueou a ação: " + error.message);
    } else {
      buscarHistorico(paciente.id_paciente);
    }
  }

  // 5. Motor de PDF Estruturado e Bonito
  // 5. Motor de PDF Estruturado e Bonito (Sem cabeçalhos do navegador)
  function exportarPDF(prontuario: any) {
    const dataAtendimento = new Date(prontuario.data_atendimento).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
     const cpfFormatado = paciente.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || 'N/A';
    const telefone = paciente.phone_number?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || 'N/A';
    
    const janela = window.open('', '_blank', 'width=800,height=600');
    if (!janela) return alert("Habilite os pop-ups do seu navegador para gerar o PDF.");

    const htmlLayout = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prontuário - ${paciente.nome}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0 auto; max-width: 800px; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
            .patient-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .patient-box table { width: 100%; text-align: left; border-collapse: collapse; }
            .patient-box td { padding: 4px 15px 4px 0; font-size: 14px; }
            .patient-box td strong { color: #334155; }
            .record-box { margin-bottom: 30px; }
            .record-header { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; font-weight: bold; color: #1d4ed8; margin-bottom: 15px; }
            .record-content { font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap; text-align: justify; }
            .signature { margin-top: 80px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto 10px auto; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            
            /* A MÁGICA ACONTECE AQUI */
            @media print { 
              @page { margin: 0; } /* Remove o about:blank e a data do navegador */
              body { padding: 2cm; } /* Devolve o respiro das bordas do papel */
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Registro Clínico</h1>
            <p>Documento gerado eletronicamente</p>
          </div>
          
          <div class="patient-box">
            <table>
              <tr>
                <td><strong>Paciente:</strong> ${paciente.nome}</td>
                <td><strong>CPF:</strong> ${cpfFormatado}</td>
              </tr>
              <tr>
                <td><strong>Telefone:</strong> ${telefone}</td>
                <td><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</td>
              </tr>
            </table>
          </div>

          <div class="record-box">
            <div class="record-header">Data do Atendimento: ${dataAtendimento}</div>
            <div class="record-content">${prontuario.anamnese || prontuario.queixa_principal || ''}</div>
          </div>

          <div class="signature">
            <div class="signature-line"></div>
            <p>Assinatura do Profissional</p>
          </div>

          <div class="footer">
            Gerado pelo Sistema de Gestão de Clínicas &copy; ${new Date().getFullYear()} - Documento Confidencial
          </div>
        </body>
      </html>
    `;

    janela.document.write(htmlLayout);
    janela.document.close();
    
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 250);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Prontuário Eletrônico</h1>
        <p className="text-gray-500 mt-1">Busque um paciente para iniciar ou revisar o atendimento.</p>
      </div>
      
      {/* Barra de Busca com AutoSuggest */}
      <div className="relative w-full mb-8 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-gray-400" size={20} />
          <input 
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm" 
            placeholder="Digite o nome ou CPF do paciente..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
          />
        </div>
        
        {/* Dropdown de Resultados */}
        {sugestoes.length > 0 && (
          <div className="absolute w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
            {sugestoes.map(s => (
              <div 
                key={s.id_paciente} 
                onClick={() => selecionarPaciente(s)}
                className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex items-center justify-between transition"
              >
                <div>
                  <p className="font-bold text-gray-900">{s.nome}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FileText size={14}/> {s.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Check size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace do Paciente */}
      {paciente && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda: Nova Evolução e Histórico */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Caixa de Nova Evolução */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Edit2 size={20} className="text-blue-500"/> Nova Evolução Clínica
              </h2>
              <textarea 
                className="w-full h-40 p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-700 leading-relaxed" 
                placeholder="Descreva os sintomas, diagnóstico, conduta médica..." 
                value={textoEvolucao} 
                onChange={e => setTextoEvolucao(e.target.value)} 
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={salvarEvolucao} 
                  disabled={salvando || !textoEvolucao.trim()}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {salvando ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
                  Salvar Registro
                </button>
              </div>
            </div>

            {/* Linha do Tempo (Histórico) */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Histórico do Paciente</h2>
              
              {historico.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500">Nenhum atendimento registrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historico.map(h => (
                    <div key={h.id_prontuario} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                      
                      {/* Botões de Ação (Exportar, Editar, Excluir) */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => exportarPDF(h)} 
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Imprimir Receita/Atestado"
                        >
                          <Printer size={18}/>
                        </button>
                        
                        {editandoId !== h.id_prontuario && (
                          <button 
                            onClick={() => iniciarEdicao(h)} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 size={18}/>
                          </button>
                        )}
                        
                        <button 
                          onClick={() => excluir(h.id_prontuario)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>

                      <div className="mb-3">
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {new Date(h.data_atendimento).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      {/* Lógica de Alternância entre Visualizar e Editar */}
                      {editandoId === h.id_prontuario ? (
                        <div className="mt-4">
                          <textarea 
                            className="w-full h-32 p-3 border border-blue-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50" 
                            value={textoEdicao} 
                            onChange={e => setTextoEdicao(e.target.value)} 
                          />
                          <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => setEditandoId(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={confirmarEdicao} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                              <Check size={18}/> Confirmar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed pr-24 whitespace-pre-wrap">
                          {h.anamnese || h.queixa_principal}
                        </p>
                      )}
                      
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Coluna da Direita: Perfil do Paciente Fixo */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-3xl shadow-lg sticky top-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <User size={40} className="text-white" />
              </div>
              <h3 className="font-extrabold text-2xl mb-1">{paciente.nome}</h3>
              
              <div className="space-y-4 pt-6 border-t border-white/20">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-lg"><FileText size={18} /></div>
                  <div>
                    <p className="text-xs text-blue-200">CPF</p>
                    <p className="font-medium">{paciente.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-lg"><Phone size={18} /></div>
                  <div>
                    <p className="text-xs text-blue-200">Telefone</p>
                    <p className="font-medium">{paciente.phone_number?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}