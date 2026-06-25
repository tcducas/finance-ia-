import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      className={`p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 cursor-pointer ${
        isDark
          ? "bg-[#0a0a0a] border-[#CD9C20]/40 text-[#F5CB5C] hover:bg-[#CD9C20]/10"
          : "bg-white border-[#CD9C20]/50 text-[#CD9C20] hover:bg-stone-150"
      }`}
      aria-label="Alternar tema"
    >
      {isDark ? (
        <>
          <Sun className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-medium hidden sm:inline">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-xs font-medium hidden sm:inline">Modo Escuro</span>
        </>
      )}
    </button>
  );
}
