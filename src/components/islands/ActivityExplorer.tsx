import { useState, useMemo } from 'react';
import type { Activity, Locale } from '../../lib/types';

interface Props {
  activities: Activity[];
  lang: Locale;
  strings: {
    semua: string;
    aktivitasInti: string;
    kelasLainnya: string;
    tutup: string;
    minPeserta: string;
    lihatDokumentasi: string;
    dokumentasiSegera: string;
  };
}

type Filter = 'semua' | 'inti' | 'kelas-lainnya';

export default function ActivityExplorer({ activities, lang, strings }: Props) {
  const [filter, setFilter] = useState<Filter>('semua');
  const [active, setActive] = useState<Activity | null>(null);

  const filtered = useMemo(
    () => (filter === 'semua' ? activities : activities.filter((a) => a.category === filter)),
    [activities, filter]
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: 'semua', label: strings.semua },
    { key: 'inti', label: strings.aktivitasInti },
    { key: 'kelas-lainnya', label: strings.kelasLainnya },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter aktivitas">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === tab.key ? 'bg-folly text-white' : 'bg-white border-2 border-ink/10 text-ink hover:border-folly/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((activity) => (
          <button
            key={activity.slug}
            onClick={() => setActive(activity)}
            className="card text-left p-5 hover:shadow-lift transition-shadow focus-visible:outline focus-visible:outline-3 focus-visible:outline-folly"
          >
            <span className="eyebrow">{activity.category === 'inti' ? strings.aktivitasInti : strings.kelasLainnya}</span>
            <h3 className="font-display text-lg font-semibold mt-1 mb-2">
              {lang === 'id' ? activity.name.id : activity.name.en}
            </h3>
            <p className="text-sm text-ink-soft line-clamp-2">
              {lang === 'id' ? activity.summary.id : activity.summary.en}
            </p>
            {activity.minParticipants && (
              <p className="text-xs text-byzantine font-semibold mt-3">
                {strings.minPeserta}: {activity.minParticipants}
              </p>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="bg-white rounded-t-md sm:rounded-md max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border-2 border-ink/10 hover:border-folly"
              aria-label={strings.tutup}
            >
              ×
            </button>

            <span className="eyebrow">{active.category === 'inti' ? strings.aktivitasInti : strings.kelasLainnya}</span>
            <h3 id="activity-modal-title" className="font-display text-h3 font-semibold mt-1 mb-3">
              {lang === 'id' ? active.name.id : active.name.en}
            </h3>
            <p className="text-sm text-ink-soft mb-4">{lang === 'id' ? active.summary.id : active.summary.en}</p>

            {active.includes.length > 0 && (
              <ul className="space-y-1 mb-4">
                {active.includes.map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-kiwi mt-0.5">✓</span>
                    <span>{lang === 'id' ? item.id : item.en}</span>
                  </li>
                ))}
              </ul>
            )}

            {active.images.length === 0 && (
              <div className="stitch-border rounded-sm p-4 text-center text-xs text-ink-soft mb-4">
                {strings.dokumentasiSegera}
              </div>
            )}

            <p className="text-xs text-ink-soft">
              {lang === 'id' ? active.driveFolderHint.id : active.driveFolderHint.en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
