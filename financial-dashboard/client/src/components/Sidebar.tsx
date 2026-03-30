import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, MessageSquare, Settings, LogOut, WalletCards, Bell, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Accounts", path: "/accounts", icon: Wallet },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { name: "Budgets", path: "/budgets", icon: PiggyBank },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "AI", path: "/chat", icon: MessageSquare },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-xl shadow-md border border-slate-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 lg:pt-6 pt-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#5c4b99] p-2 rounded-lg text-white">
              <WalletCards size={20} />
            </div>
            <span className="font-serif font-bold text-xl text-[#1e293b]">Findash</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
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
          {user && (
            <div className="px-4 py-2 mb-2">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name || user.email}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[64px]",
                  isActive ? "text-[#0ea5e9]" : "text-slate-400"
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[64px] text-slate-400"
          >
            <Menu size={20} />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
