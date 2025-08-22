import { X } from 'lucide-react';
import { AutoGrowTextarea } from './AutoGrowTextarea';

export function GhostItemRow({
  value, onChange, onRemove, placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  placeholder?: string;
}) {
  return (
    <li className="group flex items-start">
      <AutoGrowTextarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button
        onClick={onRemove}
        className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
        aria-label="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </li>
  );
}
