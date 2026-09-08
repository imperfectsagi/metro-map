import { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
  colours?: string[];
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  options: Option[];
  placeholder?: string;
  ariaLabel?: string;
}

export default function StationSearch({ value, onChange, options, placeholder = 'Search', ariaLabel }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.id === value);
  const selectedName = selectedOption?.name || '';

  // Derived during render — no effect needed, avoids an extra cascading render on every keystroke
  const filtered: Option[] = (() => {
    if (!query.trim()) return options.slice(0, 40);
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q) || o.id.includes(q)).slice(0, 30);
  })();

  const handleSelect = (opt: Option) => {
    onChange(opt.id);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        setQuery('');
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        handleSelect(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Keep the active option scrolled into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className="relative">
      <div className="relative">
        {selectedOption && !open && selectedOption.colours?.length ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-0.5" aria-hidden>
            {selectedOption.colours.slice(0, 3).map((c) => (
              <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </span>
        ) : (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            🔍
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `opt-${filtered[activeIndex]?.id}` : undefined}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50
                     text-base focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent
                     placeholder:text-slate-400"
          placeholder={selectedName || placeholder}
          value={open ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
            setActiveIndex(-1);
          }}
          onBlur={() => {
            // delay to allow click
            setTimeout(() => setOpen(false), 180);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-40 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200
                     bg-white shadow-lg py-1"
        >
          {filtered.map((opt, idx) => (
            <li
              key={opt.id}
              id={`opt-${opt.id}`}
              role="option"
              aria-selected={opt.id === value}
              className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-2 ${
                idx === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-100'
              } active:bg-slate-200`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {opt.colours?.length ? (
                <span className="flex gap-0.5 shrink-0" aria-hidden>
                  {opt.colours.slice(0, 3).map((c) => (
                    <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
              ) : null}
              <span className="truncate">{opt.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
