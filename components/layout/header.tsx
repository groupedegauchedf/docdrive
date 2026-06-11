import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
}

export function Header({ title, searchPlaceholder, actions }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        {searchPlaceholder && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              className="w-64 pl-9"
            />
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}
