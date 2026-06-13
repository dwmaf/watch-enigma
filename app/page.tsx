import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Film, Tv, Search } from 'lucide-react';
import Icon from "./components/Icon";
import HomeScrollRestorer from './components/HomeScrollRestorer';
import LogoutButton from './components/LogoutButton';
import WatchlistPosterCard, { type WatchlistPosterCardItem } from './components/WatchlistPosterCard';

export const revalidate = 0;

export default async function Home(props: { searchParams: Promise<{ q?: string, view?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const view = searchParams?.view || '';
  const currentOverviewPath = (() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (view) params.set('view', view);
    const query = params.toString();
    return query ? `/?${query}` : '/';
  })();
  const encodedReturnTo = encodeURIComponent(currentOverviewPath);

  const supabase = await createClient();

  // Check auth user
  const { data: { user } } = await supabase.auth.getUser();

  let queryBuilder = supabase
    .from('watchlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) {
    queryBuilder = queryBuilder.ilike('title', `%${q}%`);
  }

  const { data: watchlists, error } = await queryBuilder;

  const allItems = watchlists || [];
  const movieItems = allItems.filter(i => i.type === 'movie');
  const seriesItems = allItems.filter(i => i.type === 'series');
  const animeMovieItems = allItems.filter(i => i.type === 'movie anime');
  const animeSeriesItems = allItems.filter(i => i.type === 'series anime');
  const mangaItems = allItems.filter(i => i.type === 'manga');
  const manhwaItems = allItems.filter(i => i.type === 'manhwa');

  const hasPrimaryLink = (item: { type: string; links?: string | { season: number; part?: number | null; link?: string | null }[] | null }) => {
    if (item.type === 'movie' || item.type === 'movie anime') {
      return typeof item.links === 'string' && item.links.trim().length > 0;
    }

    if (!Array.isArray(item.links)) {
      return false;
    }

    return item.links.some((link) => typeof link?.link === 'string' && link.link.trim().length > 0);
  };

  // --- Sorting Logic ---
  const movieSeriesStatusOrder: Record<string, number> = {
    'watching': 1,
    'on-hold': 2,
    'plan-to-watch': 3,
    'upcoming': 4,
    'completed': 5,
    'dropped': 6,
  };

  const mangaManhwaStatusOrder: Record<string, number> = {
    'reading': 1,
    'on-hold': 2,
    'plan-to-read': 3,
    'upcoming': 4,
    'completed': 5,
    'dropped': 6,
  };

  const getStatusOrderValue = (item: { type: string, status: string }) => {
    const isMangaOrManhwa = item.type === 'manga' || item.type === 'manhwa';
    const orderMap = isMangaOrManhwa ? mangaManhwaStatusOrder : movieSeriesStatusOrder;
    return orderMap[item.status] || 99; // Fallback for unknown statuses
  };

  const sortWatchlistItems = <T extends { type: string; status: string; links?: string; }>(items: T[]) => {
    return [...items].sort((a, b) => {
      // Priority 1: Status order
      const statusOrderA = getStatusOrderValue(a);
      const statusOrderB = getStatusOrderValue(b);
      if (statusOrderA !== statusOrderB) {
        return statusOrderA - statusOrderB;
      }

      // Priority 2: Has link (within the same status)
      const aHasLink = hasPrimaryLink(a);
      const bHasLink = hasPrimaryLink(b);
      if (aHasLink !== bHasLink) {
        return aHasLink ? -1 : 1; // true (has link) comes before false
      }

      // Priority 3: Creation date (pre-sorted by DB query). Return 0 to maintain order.
      return 0;
    });
  };
  
  const categoryViews = {
    movie: 'movie',
    series: 'series',
    animeMovie: 'anime-movie',
    animeSeries: 'anime-series',
    manga: 'manga',
    manhwa: 'manhwa',
  } as const;

  const getDisplayItems = (categoryView: string, items: typeof allItems) => (
    (q || view === categoryView) ? items : items.slice(0, 14)
  );

  const sortedMovies = sortWatchlistItems(movieItems);
  const sortedSeries = sortWatchlistItems(seriesItems);
  const sortedAnimeMovies = sortWatchlistItems(animeMovieItems);
  const sortedAnimeSeries = sortWatchlistItems(animeSeriesItems);
  const sortedManga = sortWatchlistItems(mangaItems);
  const sortedManhwa = sortWatchlistItems(manhwaItems);

  const displayMovies = getDisplayItems(categoryViews.movie, sortedMovies);
  const displaySeries = getDisplayItems(categoryViews.series, sortedSeries);
  const displayAnimeMovies = getDisplayItems(categoryViews.animeMovie, sortedAnimeMovies);
  const displayAnimeSeries = getDisplayItems(categoryViews.animeSeries, sortedAnimeSeries);
  const displayManga = getDisplayItems(categoryViews.manga, sortedManga);
  const displayManhwa = getDisplayItems(categoryViews.manhwa, sortedManhwa);

  const showMore = (categoryView: string, items: typeof allItems) => !q && view !== categoryView && items.length > 14;
  
  const showMoviesBtn = showMore(categoryViews.movie, movieItems);
  const showSeriesBtn = showMore(categoryViews.series, seriesItems);
  const showAnimeMoviesBtn = showMore(categoryViews.animeMovie, animeMovieItems);
  const showAnimeSeriesBtn = showMore(categoryViews.animeSeries, animeSeriesItems);
  const showMangaBtn = showMore(categoryViews.manga, mangaItems);
  const showManhwaBtn = showMore(categoryViews.manhwa, manhwaItems);

  if (error) {
    console.error('Failed to load watchlists', error);
  }

  const isSeriesType = (type: string) => type === 'series' || type === 'series anime';
  const isMangaType = (type: string) => type === 'manga' || type === 'manhwa';

  const getProgressLabel = (item: {
    type: string;
    status: string;
    seasons?: { season: number; part?: number | null; episodes: number }[] | null;
    watched_episodes?: number[] | null;
    last_read?: number | null;
  }) => {
    if (isSeriesType(item.type)) {
      const seasonList = Array.isArray(item.seasons) && item.seasons.length > 0
        ? item.seasons
        : [];

      if (item.status === 'plan-to-watch') {
        if (!seasonList.length) {
          return null;
        }

        const latestSeason = seasonList.reduce((latest, current) => (
          Number(current.season) > Number(latest.season) ? current : latest
        ));
        const latestPart = latestSeason.part == null ? null : Number(latestSeason.part) || null;

        return latestPart
          ? `S${Number(latestSeason.season) || 1}P${latestPart}`
          : `S${Number(latestSeason.season) || 1}`;
      }

      if (item.status !== 'watching') {
        return null;
      }

      const watchedEpisodes = Array.isArray(item.watched_episodes)
        ? item.watched_episodes.filter((episode) => Number.isFinite(episode))
        : [];

      if (!watchedEpisodes.length) {
        return null;
      }

      const lastEpisode = Math.max(...watchedEpisodes);
      const effectiveSeasonList = seasonList.length > 0
        ? seasonList
        : [{ season: 1, episodes: lastEpisode }];

      let runningTotal = 0;
      for (const season of effectiveSeasonList) {
        const seasonEpisodes = Math.max(Number(season.episodes) || 0, 0);
        const seasonStart = runningTotal + 1;
        const seasonEnd = runningTotal + seasonEpisodes;

        if (lastEpisode >= seasonStart && lastEpisode <= seasonEnd) {
          const localEpisode = lastEpisode - runningTotal;
          const partLabel = season.part == null ? '' : `P${Number(season.part) || 1}`;
          return `S${Number(season.season) || 1}${partLabel}E${localEpisode}`;
        }

        runningTotal += seasonEpisodes;
      }

      return `S1E${lastEpisode}`;
    }

    if (isMangaType(item.type)) {
      if (item.status === 'completed') {
        return null;
      }

      const lastRead = Number(item.last_read);
      if (!Number.isFinite(lastRead) || lastRead <= 0) {
        return null;
      }

      return `Ch ${lastRead}`;
    }

    return null;
  };

  // Poster-only card for grid view (image, name, status)
  const renderPosterCard = (item: WatchlistPosterCardItem) => {
    // hide entire item for anonymous users when private flag is set
    if (!user && item.private) {
      return null;
    }

    const itemHasPrimaryLink = hasPrimaryLink(item);

    return (
      <WatchlistPosterCard
        key={item.id}
        item={item}
        href={user ? `/edit/${item.id}?returnTo=${encodedReturnTo}` : `/`}
        progressLabel={getProgressLabel(item)}
        hasPrimaryLink={itemHasPrimaryLink}
      />
    );
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6">
      <HomeScrollRestorer />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold font-got">Screen Enigma</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={`/add?returnTo=${encodedReturnTo}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={20} /> Add
              </Link>
              <LogoutButton></LogoutButton>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      <form method="GET" action="/" className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search anime, movies, or series by name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition font-medium">
          Search
        </button>
        {q && (
          <Link href="/" className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition border border-gray-200 dark:border-gray-800">
            Clear
          </Link>
        )}
      </form>

      {view && !q && (
        <div className="mb-6">
          <Link href="/" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition">
            &larr; Back to Overview
          </Link>
        </div>
      )}

      {(!view || view === categoryViews.movie) && displayMovies.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Film className="text-blue-500" /> Movies
            </h2>
            {showMoviesBtn && (
              <Link href="/?view=movie" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({movieItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayMovies.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === categoryViews.series) && displaySeries.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Tv className="text-green-500" /> Series
            </h2>
            {showSeriesBtn && (
              <Link href="/?view=series" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({seriesItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displaySeries.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === categoryViews.animeMovie) && displayAnimeMovies.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Film className="text-purple-500" /> Anime Movies
            </h2>
            {showAnimeMoviesBtn && (
              <Link href="/?view=anime-movie" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({animeMovieItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayAnimeMovies.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === categoryViews.animeSeries) && displayAnimeSeries.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Tv className="text-purple-500" /> Anime Series
            </h2>
            {showAnimeSeriesBtn && (
              <Link href="/?view=anime-series" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({animeSeriesItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayAnimeSeries.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === categoryViews.manga) && displayManga.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Icon
                name="book"
                className="w-5 h-5 text-emerald-500"
              /> Manga
            </h2>
            {showMangaBtn && (
              <Link href="/?view=manga" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({mangaItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayManga.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === categoryViews.manhwa) && displayManhwa.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Icon
                name="book"
                className="w-5 h-5 text-blue-500"
              /> Manhwa
            </h2>
            {showManhwaBtn && (
              <Link href="/?view=manhwa" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({manhwaItems.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayManhwa.map(renderPosterCard)}
          </div>
        </div>
      )}

      {!movieItems.length && !seriesItems.length && !animeMovieItems.length && !animeSeriesItems.length && !mangaItems.length && !manhwaItems.length && (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          {q ? "No results found for your search." : "You don't have anything in your watchlist yet."}
        </div>
      )}

      <div
        className="pt-4 border-t border-slate-200 dark:border-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        {(() => {
          const currentYear = new Date().getFullYear();
          return (
            <p className="text-xs tracking-widest font-black text-slate-500 ">
              &copy; {currentYear} Screen Enigma. Crafted with ❤️ by Dawam AF
            </p>
          );
        })()}

        <div className="flex items-center gap-2 opacity-80">
          <span className="text-xs tracking-widest font-black text-slate-500">Built
            with</span>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <Image src="/favicon.ico" width={16} height={16} alt="Next Logo" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">Next</span>
            </div>
          </div>
        </div>
    </main>
  );
}
