import React, { useRef, useLayoutEffect } from 'react';
export function AutoGrowTextarea({
  value, onChange, placeholder, className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = '0px'; el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={
        'w-full bg-transparent border-0 px-0 py-2 text-sm text-gray-900 ' +
        'placeholder-gray-400 focus:outline-none focus:ring-0 ' +
        'group-hover:bg-gray-50 rounded resize-none overflow-hidden leading-snug ' +
        className
      }
    />
  );
}
