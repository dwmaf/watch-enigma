'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addWatchlistEntry, updateWatchlistEntry } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

const watchlistSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['film', 'movie', 'series', 'movie anime', 'series anime']),
  status: z.enum(['plan-to-watch', 'watching', 'completed', 'on-hold', 'dropped']),
  total_episodes: z.number().nullable().optional(),
  link: z.string().nullable().optional(),
});

type WatchlistFormValues = z.infer<typeof watchlistSchema>;

type SeasonRow = {
  season: number;
  episodes: number;
};

export default function WatchlistForm({
  initialData,
}: {
  initialData?: {
    id: string;
    title: string;
    type: 'movie' | 'series' | 'movie anime' | 'series anime';
    status: 'plan-to-watch' | 'watching' | 'completed' | 'on-hold' | 'dropped';
    total_episodes: number | null;
    seasons?: SeasonRow[] | null;
    // For movies: single nullable link. For series: array of { season, link }
    links?: string | { season: number; link?: string | null }[] | null;
  };
}) {
  const router = useRouter();
  const isSeriesType = (t: string) => t === 'series' || t === 'series anime';
  const defaultSeasons = initialData?.seasons && initialData.seasons.length > 0
    ? initialData.seasons
    : [{ season: 1, episodes: 1 }];
  const [seasons, setSeasons] = useState<SeasonRow[]>(defaultSeasons);
  // seasonLinks aligns with `seasons` array for series; for movies we use form `link`
  const defaultSeasonLinks = Array.isArray(initialData?.links)
    ? (initialData?.links as { season: number; link?: string | null }[]).map(s => s.link || '')
    : defaultSeasons.map(() => '');
  const [seasonLinks, setSeasonLinks] = useState<string[]>(defaultSeasonLinks);
  
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: initialData || {
      title: '',
        type: 'movie',
      status: 'plan-to-watch',
      total_episodes: null,
    },
  });

  const typeWatch = useWatch({ control, name: 'type' });

  const updateSeason = (index: number, key: keyof SeasonRow, value: number) => {
    setSeasons((current) => current.map((season, seasonIndex) => (
      seasonIndex === index ? { ...season, [key]: value } : season
    )));
  };

  const addSeason = () => {
    setSeasons((current) => [...current, { season: current.length + 1, episodes: 1 }]);
    setSeasonLinks((current) => [...current, '']);
  };

  const removeSeason = (index: number) => {
    setSeasons((current) => current.filter((_, seasonIndex) => seasonIndex !== index));
    setSeasonLinks((current) => current.filter((_, i) => i !== index));
  };

  const updateSeasonLink = (index: number, value: string) => {
    setSeasonLinks((current) => current.map((l, i) => (i === index ? value : l)));
  };

  const onSubmit = async (data: WatchlistFormValues) => {
    try {
      const normalizedSeasons = seasons
        .map((season) => ({
          season: Number(season.season) || 1,
          episodes: Number(season.episodes) || 0,
        }))
        .filter((season) => season.episodes > 0)
        .sort((a, b) => a.season - b.season);

      const isSeriesType = (t: string) => t === 'series' || t === 'series anime';

      const resolvedSeasons = isSeriesType(data.type) && normalizedSeasons.length === 0
        ? [{ season: 1, episodes: 1 }]
        : normalizedSeasons;

      const totalEpisodes = isSeriesType(data.type)
        ? resolvedSeasons.reduce((sum, season) => sum + season.episodes, 0)
        : null;

      // Prepare links payload: for films a single nullable link, for series an array aligned with seasons
      let linksPayload: string | { season: number; link?: string | null }[] | null = null;
      const isSeries = isSeriesType(data.type);
      if (isSeries) {
        linksPayload = resolvedSeasons.map((s, idx) => ({
          season: s.season,
          link: (seasonLinks[idx] || null),
        }));
      } else {
        linksPayload = data.link || null;
      }

      if (initialData?.id) {
        await updateWatchlistEntry(initialData.id, data.title, data.type, data.status, totalEpisodes, resolvedSeasons, linksPayload);
      } else {
        await addWatchlistEntry(data.title, data.type, data.status, totalEpisodes, resolvedSeasons, linksPayload);
      }
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      console.error(error);
      alert('Something went wrong!');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input 
          {...register('title')} 
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" 
          placeholder="e.g. Inception or Attack on Titan"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select 
            {...register('type')} 
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="movie">Movie</option>
            <option value="film">Film (legacy)</option>
            <option value="series">Series</option>
            <option value="movie anime">Movie Anime</option>
            <option value="series anime">Series Anime</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select 
            {...register('status')} 
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="plan-to-watch">Plan to Watch</option>
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
      </div>

      {isSeriesType(String(typeWatch)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Seasons</label>
            <button type="button" onClick={addSeason} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              + Add season
            </button>
          </div>

          <div className="space-y-3">
            {seasons.map((season, index) => (
              <div key={`${season.season}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 p-3 border rounded-lg dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium mb-1">Season</label>
                  <input
                    type="number"
                    min={1}
                    value={season.season}
                    onChange={(event) => updateSeason(index, 'season', Number(event.target.value))}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Episodes</label>
                  <input
                    type="number"
                    min={1}
                    value={season.episodes}
                    onChange={(event) => updateSeason(index, 'episodes', Number(event.target.value))}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Link (optional)</label>
                  <input
                    type="text"
                    value={seasonLinks[index] || ''}
                    onChange={(e) => updateSeasonLink(index, e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeSeason(index)}
                    disabled={seasons.length === 1}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg border text-red-600 disabled:opacity-40 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movie single link input */}
      {!isSeriesType(String(typeWatch)) && (
        <div>
          <label className="block text-sm font-medium mb-1">Link (optional)</label>
          <input
            {...register('link')}
            type="text"
            placeholder="https://..."
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button 
          type="button" 
          onClick={() => router.push('/')}
          className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Watchlist'}
        </button>
      </div>
    </form>
  );
}
