import Image from 'next/image';
import { Link2 } from 'lucide-react';
import PosterLink from './PosterLink';

export type WatchlistPosterCardItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  // when true, poster should be hidden for anonymous users
  private?: boolean | null;
  poster_url?: string | null;
  seasons?: { season: number; part?: number | null; episodes: number }[] | null;
  watched_episodes?: number[] | null;
  links?: string | { season: number; part?: number | null; link?: string | null }[] | null;
};

/**
 * Maps a status string to its corresponding display label and Tailwind CSS classes.
 * @param status - The status from the watchlist item.
 * @returns An object with the label and className.
 */
const getStatusAttributes = (status: WatchlistPosterCardItem['status']) => {
  const attributes: { [key: string]: { label: string; className: string } } = {
    watching:      { label: 'Watching', className: 'bg-blue-600 text-white' },
    reading:       { label: 'Reading',  className: 'bg-blue-600 text-white' },
    'plan-to-watch': { label: 'Planned',  className: 'bg-green-600 text-white' },
    'plan-to-read':  { label: 'Planned',  className: 'bg-green-600 text-white' },
    completed:     { label: 'Completed',className: 'bg-slate-600 text-slate-100' },
    'on-hold':     { label: 'Hold',     className: 'bg-amber-500 text-black' },
    dropped:       { label: 'Dropped',  className: 'bg-red-600 text-white' },
    upcoming:      { label: 'Upcoming', className: 'bg-purple-600 text-white' },
  };

  const defaultAttribute = {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    className: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return attributes[status] || defaultAttribute;
};

export default function WatchlistPosterCard({
  item,
  href,
  progressLabel,
  hasPrimaryLink,
}: {
  item: WatchlistPosterCardItem;
  href: string;
  progressLabel?: string | null;
  hasPrimaryLink?: boolean;
}) {
  const { label: statusLabel, className: statusClassName } = getStatusAttributes(item.status);

  return (
    <PosterLink href={href} className="group block">
      <div className={`relative w-full aspect-2/3 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 ${hasPrimaryLink ? 'ring-2 ring-emerald-500/40' : ''}`}>
        <Image
          src={item.poster_url || '/posters/placeholder.svg'}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {hasPrimaryLink && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <Link2 size={11} />
            Link
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 px-1">
        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {item.title}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusClassName}`}>
            {statusLabel}
          </div>
          {progressLabel && (
            <div className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {progressLabel}
            </div>
          )}
        </div>
      </div>
    </PosterLink>
  );
}
