import { FaHome, FaTicketAlt, FaImages, FaUsers } from "react-icons/fa";

const items = [
  { id: "hero", label: "Home", icon: FaHome },
  { id: "experience", label: "Vibe", icon: FaUsers },
  { id: "register", label: "Tickets", icon: FaTicketAlt },
  { id: "gallery", label: "Gallery", icon: FaImages },
];

export default function BottomNav() {
  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex justify-around border-t border-white/10 bg-[#0a192f]/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
      aria-label="Quick sections"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-bold text-white/80 active:scale-95"
        >
          <Icon className="text-lg text-[#ffd700]" aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}
