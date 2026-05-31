import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import WatchlistForm from '../../components/WatchlistForm';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { toggleEpisode, setPosterUrl } from '../../actions';
import fs from 'fs';
import path from 'path';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
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
      ? [{ season: 1, episodes: data.total_episodes }]
      : [];

  const episodesBySeason = seasonList.map((season: { season: number; episodes: number }, index: number) => {
    const startEpisode = seasonList.slice(0, index).reduce((sum: number, current: { episodes: number }) => sum + (Number(current.episodes) || 0), 0) + 1;
    return {
      season: Number(season.season) || index + 1,
      episodes: Number(season.episodes) || 0,
      startEpisode,
      endEpisode: startEpisode + Math.max(Number(season.episodes) || 0, 0) - 1,
    };
  });

  // Helper action to toggle episode from the edit page
  async function submitToggle(formData: FormData) {
    'use server';
    const idFromForm = formData.get('id') as string;
    const epNum = parseInt(formData.get('episode') as string, 10);
    const watchedStr = formData.get('watched') as string;
    const watched = watchedStr ? JSON.parse(watchedStr) : [];
    await toggleEpisode(idFromForm, epNum, watched);
  }

  // Helper action to set poster url from dropdown
  async function submitSetPoster(formData: FormData) {
    'use server';
    const idFromForm = formData.get('id') as string;
    const poster = formData.get('poster') as string;
    await setPosterUrl(idFromForm, poster || null);
  }

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
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition">
          &larr; Back to Overview
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Edit Watchlist</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <WatchlistForm 
            initialData={{
              id: data.id,
              title: data.title,
              type: data.type,
              status: data.status as "plan-to-watch" | "watching" | "completed" | "on-hold" | "dropped",
              total_episodes: data.total_episodes,
              seasons: seasonList,
              links: data.links ?? null,
            }} 
          />
        </div>

        <aside className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <form action={submitSetPoster} className="mb-4">
              <input type="hidden" name="id" value={data.id} />
              <label className="block text-xs font-medium mb-2">Choose poster</label>
              <div className="flex gap-2">
                <select name="poster" defaultValue={data.poster_url || ''} className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800">
                  <option value="">-- none / placeholder --</option>
                  {posterFiles.map((f) => (
                    <option key={f} value={`/posters/${f}`}>{f}</option>
                  ))}
                </select>
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </form>

            <div className="relative w-full max-w-xs mx-auto aspect-2/3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={data.poster_url || '/posters/placeholder.svg'}
                alt={data.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <h2 className="mt-4 text-lg font-bold">{data.title}</h2>
            <div className="text-sm text-gray-500">{data.type} • {String(data.status).replace('-', ' ')}</div>
          </div>

          {isSeriesType(data.type) && episodesBySeason.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Seasons & Episodes</h3>
              <div className="space-y-4">
                {episodesBySeason.map((season: { season: number; episodes: number; startEpisode: number; endEpisode: number }) => {
                  const seasonLink = Array.isArray(data.links)
                    ? (data.links as { season: number; link?: string | null }[]).find((l) => Number(l?.season) === Number(season.season))?.link
                    : null;

                  return (
                    <div key={season.season} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold flex items-center gap-3">
                          <span>Season {season.season}</span>
                          {seasonLink && (
                            <a href={String(seasonLink)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              Open link
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{season.episodes} episodes</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: season.episodes }, (_, index) => season.startEpisode + index).map((ep) => {
                          const isWatched = Array.isArray(data.watched_episodes) ? data.watched_episodes.includes(ep) : false;

                          return (
                            <form key={ep} action={submitToggle}>
                              <input type="hidden" name="id" value={data.id} />
                              <input type="hidden" name="episode" value={ep} />
                              <input type="hidden" name="watched" value={JSON.stringify(data.watched_episodes || [])} />
                              <button type="submit" className={`px-3 py-2 rounded-md text-sm font-medium ${isWatched ? 'bg-blue-600 text-white' : 'bg-transparent border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}>
                                Ep {ep}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
