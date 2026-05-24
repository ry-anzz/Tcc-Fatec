import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  FileText,
  Settings,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Pacientes", path: "/pacientes", icon: Users },
    { name: "Agenda", path: "/agenda", icon: Calendar },
    { name: "Prontuários", path: "/prontuarios", icon: FileText },
    { name: "Faturamento", path: "/faturamento", icon: Wallet },
    { name: "Configurações", path: "/config", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-2 ">
        <img 
      src="/logo.png" 
      alt="Logo Facility Health" 
      className="h-25 w-auto" // Ajuste o 'h-10' para aumentar ou diminuir a logo
    />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>


      {/* Botão de Logout fixado no rodapé */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
