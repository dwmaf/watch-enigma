import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Film, Tv, LogOut, Search } from 'lucide-react';

export const revalidate = 0;

export default async function Home(props: { searchParams: Promise<{ q?: string, view?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const view = searchParams?.view || '';

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

  // Sort by status putting 'watching' at the top
  const sortedWatchlists = (watchlists || []).sort((a, b) => {
    if (a.status === 'watching' && b.status !== 'watching') return -1;
    if (a.status !== 'watching' && b.status === 'watching') return 1;
    return 0;
  });

  const allSeries = sortedWatchlists.filter(i => i.type === 'series' || i.type === 'series anime');
  const allFilms = sortedWatchlists.filter(i => i.type === 'movie' || i.type === 'movie anime');

  const displaySeries = (view === 'series' || q) ? allSeries : allSeries.slice(0, 14);
  const displayFilms = (view === 'film' || q) ? allFilms : allFilms.slice(0, 14);

  const showSeriesBtn = !q && view !== 'series' && allSeries.length > 14;
  const showFilmsBtn = !q && view !== 'film' && allFilms.length > 14;

  if (error) {
    console.error('Failed to load watchlists', error);
  }

  // Poster-only card for grid view (image, name, status)
  const renderPosterCard = (item: {
    id: string;
    title: string;
    type: string;
    status: string;
    poster_url?: string | null;
  }) => (
    <Link
      key={item.id}
      href={user ? `/edit/${item.id}` : `/`}
      className="group block"
    >
      <div className="relative w-full aspect-2/3 bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-2xl">
        <Image
          src={item.poster_url || '/posters/placeholder.svg'}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 space-y-1 px-1">
        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {item.title}
        </div>
        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'watching' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
          {item.status.replace('-', ' ')}
        </div>
      </div>
    </Link>
  );

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Watchdeck</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link 
                href="/add" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={20} /> Add to list
              </Link>
              <form action="/login/logout" method="GET">
                <button 
                  type="submit" 
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex items-center gap-2 transition"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </form>
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

      {(!view || view === 'series') && displaySeries.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Tv className="text-green-500" /> Series
            </h2>
            {showSeriesBtn && (
              <Link href="/?view=series" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({allSeries.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displaySeries.map(renderPosterCard)}
          </div>
        </div>
      )}

      {(!view || view === 'film') && displayFilms.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Film className="text-blue-500" /> Films
            </h2>
            {showFilmsBtn && (
              <Link href="/?view=film" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                Lihat Semua ({allFilms.length})
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {displayFilms.map(renderPosterCard)}
          </div>
        </div>
      )}

      {!allSeries.length && !allFilms.length && (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          {q ? "No results found for your search." : "You don't have anything in your watchlist yet."}
        </div>
      )}
    </main>
  );
}
