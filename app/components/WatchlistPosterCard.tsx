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
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'watching' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {item.status.replace('-', ' ')}
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
