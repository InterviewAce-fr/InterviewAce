import React from 'react';
import { GhostItemRow } from './GhostItemRow';

export function GhostList({
  items = [], onUpdate, onRemove, placeholder = 'Add…'
}: {
  items: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
}) {
  if (!items.length) return <p className="text-gray-500 text-sm italic">No items yet</p>;
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((v, i) => (
        <GhostItemRow
          key={i}
          value={v}
          onChange={(nv) => onUpdate(i, nv)}
          onRemove={() => onRemove(i)}
          placeholder={placeholder}
        />
      ))}
    </ul>
  );
}
