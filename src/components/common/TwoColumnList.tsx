import React from 'react';
import { Plus } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { GhostList } from './GhostList';

export function TwoColumnList({
  left, right
}: {
  left: { title: string; items: string[]; onAdd: () => void; onUpdate: (i: number, v: string) => void; onRemove: (i: number) => void; placeholder?: string; };
  right:{ title: string; items: string[]; onAdd: () => void; onUpdate: (i: number, v: string) => void; onRemove: (i: number) => void; placeholder?: string; };
}) {
  const AddBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
      <Plus className="w-4 h-4 mr-1" /> Add
    </button>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SectionCard title={left.title} action={<AddBtn onClick={left.onAdd} />}>
        <GhostList items={left.items} onUpdate={left.onUpdate} onRemove={left.onRemove} placeholder={left.placeholder} />
      </SectionCard>
      <SectionCard title={right.title} action={<AddBtn onClick={right.onAdd} />}>
        <GhostList items={right.items} onUpdate={right.onUpdate} onRemove={right.onRemove} placeholder={right.placeholder} />
      </SectionCard>
    </div>
  );
}
