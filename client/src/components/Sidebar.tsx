import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, TrendingUp, MessageSquare, Settings, LogOut, ChevronLeft, WalletCards } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Accounts", path: "/accounts", icon: Wallet },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { name: "Budgets", path: "/budgets", icon: PiggyBank },
  { name: "Investments", path: "/investments", icon: TrendingUp },
  { name: "AI Assistant", path: "/chat", icon: MessageSquare },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#5c4b99] p-2 rounded-lg text-white">
            <WalletCards size={20} />
          </div>
          <span className="font-serif font-bold text-xl text-[#1e293b]">Findash</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#0ea5e9] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
