import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview", icon: "◉" },
  { to: "/network", label: "Network Log", icon: "⇄" },
  { to: "/alerts", label: "Alerts", icon: "▲" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
        <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-xs font-bold text-white">
          S
        </div>
        <span className="font-bold text-sm">ShieldBrowser</span>
      </div>
      <nav className="flex-1 py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-[10px] text-gray-600">ShieldBrowser v0.1.0</p>
      </div>
    </aside>
  );
}
