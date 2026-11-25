import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function InstitutionSearchInput({
  label,
  placeholder,
  value,
  onValueChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        aria-label={label}
        className="ps-9"
        type="search"
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
      />
    </div>
  );
}
