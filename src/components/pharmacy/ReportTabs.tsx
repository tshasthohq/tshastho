'use client';

// Tab switcher for reports dashboard

interface Tab { id: string; label: string; icon?: string; }

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export default function ReportTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-t-md px-3 py-2 text-sm font-medium transition ${
            active === t.id
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {t.icon && <span className="mr-1">{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}
