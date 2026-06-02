import { createClient } from '@/lib/supabase/server';
import WatchlistForm from '../../components/WatchlistForm';
import BackButton from '@/app/components/BackButton';
import { notFound, redirect } from 'next/navigation';
import EditSavePanel from '@/app/components/EditSavePanel';
import fs from 'fs';
import path from 'path';

function normalizeReturnTo(value?: string) {
  return value && value.startsWith('/') ? value : '/';
}

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ returnTo?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const returnTo = normalizeReturnTo(resolvedSearchParams?.returnTo);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  
  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const isSeriesType = (t: string) => t === 'series' || t === 'series anime';

  const seasonList = Array.isArray(data.seasons) && data.seasons.length > 0
    ? data.seasons
    : isSeriesType(data.type) && data.total_episodes
      ? [{ season: 1, part: null, episodes: data.total_episodes }]
      : [];

  const episodesBySeason = seasonList.map((season: { season: number; part?: number | null; episodes: number }, index: number) => {
    const episodeCount = Math.max(Number(season.episodes) || 0, 0);
    const startEpisode = seasonList.slice(0, index).reduce((sum: number, current: { episodes: number }) => sum + (Number(current.episodes) || 0), 0) + 1;

    return {
      season: Number(season.season) || index + 1,
      episodes: episodeCount,
      startEpisode,
      endEpisode: startEpisode + episodeCount - 1,
      localStartEpisode: 1,
      localEndEpisode: episodeCount,
      part: season.part ?? null,
    };
  });

  // Read available poster files from public/posters
  const postersDir = path.join(process.cwd(), 'public', 'posters');
  let posterFiles: string[] = [];
  try {
    if (fs.existsSync(postersDir)) {
      posterFiles = fs.readdirSync(postersDir).filter((f) => /\.(jpe?g|png|webp|svg)$/i.test(f));
    }
  } catch (e) {
    console.error('Failed reading posters directory', e);
  }

  return (
    <main className="mx-auto p-6">
      <div className="mb-6">
        <BackButton href={returnTo} />
      </div>
      <h1 className="text-3xl font-bold mb-8">Edit Watchlist</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <WatchlistForm 
            initialData={{
              id: data.id,
              title: data.title,
              type: data.type,
              status: data.status as "plan-to-watch" | "watching" | "completed" | "on-hold" | "dropped" | "upcoming",
              total_episodes: data.total_episodes,
              seasons: seasonList,
              links: data.links ?? null,
              link: typeof data.links === 'string' ? data.links : null,
              poster_url: data.poster_url ?? null,
              last_read: data.last_read ?? null,
              private: data.private ?? false,
            }} 
            returnTo={returnTo}
          />
        </div>

        <aside className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <EditSavePanel
              id={data.id}
              title={data.title}
              posterUrl={data.poster_url}
              posterFiles={posterFiles}
              isSeries={isSeriesType(data.type) && episodesBySeason.length > 0}
              seasons={episodesBySeason}
              watchedEpisodes={Array.isArray(data.watched_episodes) ? data.watched_episodes : []}
              seasonLinks={Array.isArray(data.links) ? (data.links as { season: number; part?: number | null; link?: string | null }[]) : []}
            />

            <h2 className="mt-4 text-lg font-bold">{data.title}</h2>
            <div className="text-sm text-gray-500">{data.type} • {String(data.status).replace('-', ' ')}</div>
          </div>

        </aside>
      </div>
    </main>
  );
}
