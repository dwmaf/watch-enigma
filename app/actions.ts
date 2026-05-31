'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addWatchlistEntry(
  title: string,
  type: 'film' | 'movie' | 'series' | 'movie anime' | 'series anime',
  status: string,
  total_episodes: number | null,
  seasons: { season: number; episodes: number }[] = [],
  // For films: string|null. For series: array of { season, link }
  links: string | { season: number; link?: string | null }[] | null = null,
) {
  const supabase = await createClient();
  const isFilmType = (t: string) => t === 'film' || t === 'movie' || t === 'movie anime';

  const { error } = await supabase.from('watchlists').insert([
    {
      title,
      type,
      status,
      total_episodes: isFilmType(type) ? null : total_episodes,
      seasons: isFilmType(type) ? [] : seasons,
      links: isFilmType(type) ? (typeof links === 'string' ? links : null) : (Array.isArray(links) ? links : []),
      watched_episodes: [],
    },
  ]);

  if (error) {
    console.error('Error inserting data:', error);
    throw new Error(`Failed to insert data: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);
  }

  revalidatePath('/');
  redirect('/');
}

export async function updateWatchlistEntry(
  id: string,
  title: string,
  type: 'film' | 'movie' | 'series' | 'movie anime' | 'series anime',
  status: string,
  total_episodes: number | null,
  seasons: { season: number; episodes: number }[] = []
  ,
  links: string | { season: number; link?: string | null }[] | null = null
) {
  const supabase = await createClient();
  const payload: {
    title: string;
    type: 'film' | 'movie' | 'series' | 'movie anime' | 'series anime';
    status: string;
    total_episodes: number | null;
    seasons: { season: number; episodes: number }[];
    watched_episodes?: number[];
    links?: string | { season: number; link?: string | null }[] | null;
  } = {
    title,
    type,
    status,
    total_episodes: null,
    seasons: [],
  };
  const isFilmType = (t: string) => t === 'film' || t === 'movie' || t === 'movie anime';

  // normalize film/series fields
  payload.total_episodes = isFilmType(type) ? null : total_episodes;
  payload.seasons = isFilmType(type) ? [] : seasons;
  payload.links = isFilmType(type) ? (typeof links === 'string' ? links : null) : (Array.isArray(links) ? links : []);
  const isSeriesType = (t: string) => t === 'series' || t === 'series anime';

  // If marking a series as completed and we know total_episodes, mark all episodes watched
  if (isSeriesType(type) && status === 'completed' && total_episodes && Number.isFinite(total_episodes) && total_episodes > 0) {
    payload.watched_episodes = Array.from({ length: total_episodes }, (_, i) => i + 1);
  }

  const { error } = await supabase.from('watchlists').update(payload).eq('id', id);

  if (error) {
    console.error('Error updating data:', error);
    throw new Error('Failed to update data');
  }

  revalidatePath('/');
  redirect('/');
}

export async function deleteWatchlistEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('watchlists').delete().eq('id', id);

  if (error) {
    console.error('Error deleting data:', error);
    throw new Error('Failed to delete data');
  }

  revalidatePath('/');
}

export async function toggleEpisode(id: string, episode: number, currentWatched: number[]) {
  const supabase = await createClient();
  // Fetch existing meta to be resilient against stale client data
  const { data: row, error: fetchErr } = await supabase
    .from('watchlists')
    .select('watched_episodes, total_episodes')
    .eq('id', id)
    .single();

  if (fetchErr) {
    console.error('Error fetching watchlist row:', fetchErr);
    throw new Error('Failed to fetch watchlist');
  }

  const existing: number[] = Array.isArray(row?.watched_episodes) ? row.watched_episodes : Array.isArray(currentWatched) ? currentWatched : [];
  const totalEpisodes: number | null = row?.total_episodes ?? null;

  let updatedWatched: number[] = [];

  if (existing.includes(episode)) {
    // Unmarking: remove this episode and any episodes after it (keep earlier episodes)
    updatedWatched = existing.filter(e => e < episode).sort((a, b) => a - b);
  } else {
    // Marking: mark all episodes up to and including the tapped one
    const max = totalEpisodes && Number.isFinite(totalEpisodes) ? Math.min(episode, totalEpisodes) : episode;
    const toAdd = Array.from({ length: max }, (_, i) => i + 1);
    updatedWatched = Array.from(new Set([...existing, ...toAdd])).sort((a, b) => a - b);
  }

  const { error } = await supabase
    .from('watchlists')
    .update({ watched_episodes: updatedWatched })
    .eq('id', id);

  if (error) {
    console.error('Error updating episode:', error);
    throw new Error('Failed to update episode status');
  }

  // Revalidate home and edit page to reflect changes
  try {
    revalidatePath('/');
    revalidatePath(`/edit/${id}`);
  } catch {
    // ignore revalidate errors in edge cases
  }
}

export async function setPosterUrl(id: string, poster_url: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('watchlists')
    .update({ poster_url })
    .eq('id', id);

  if (error) {
    console.error('Error updating poster_url:', error);
    throw new Error('Failed to update poster url');
  }

  try {
    revalidatePath('/');
    revalidatePath(`/edit/${id}`);
  } catch {
    // ignore
  }
}
