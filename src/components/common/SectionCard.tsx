import React from 'react';
export function SectionCard({ title, action, children, className = '' }: {
  title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={"border rounded-xl p-4 bg-white flex flex-col overflow-hidden min-h-0 " + className}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        {action}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">{children}</div>
    </section>
  );
}
