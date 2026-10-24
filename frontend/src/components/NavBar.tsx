import { GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/learn", label: "Learn" },
  { to: "/viva", label: "Viva" },
  { to: "/gaps", label: "My Gaps" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-primary/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
            <GraduationCap size={20} />
          </span>
          Viva<span className="text-accent">Bridge</span>
        </NavLink>
        <div className="flex gap-1 overflow-x-auto text-sm font-medium">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-2 transition sm:px-4 ${
                  isActive ? "bg-lavender text-primary" : "text-ink/70 hover:text-primary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
