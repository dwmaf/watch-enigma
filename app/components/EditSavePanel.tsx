'use client';

import { useState } from 'react';
import Image from 'next/image';
import WatchedEpisodesEditor from '@/app/components/WatchedEpisodesEditor';
import { savePosterAndWatchedEpisodes } from '@/app/actions';
import { useToast } from './ToastProvider';
import { progressBarEvents } from '@/lib/progress-bar-events';

type SeasonItem = {
  season: number;
  part?: number | null;
  episodes: number;
  startEpisode: number;
  endEpisode: number;
};

type SeasonLink = {
  season: number;
  part?: number | null;
  link?: string | null;
};

export default function EditSavePanel({
  id,
  title,
  type,
  status,
  posterUrl,
  posterFiles,
  isSeries,
  seasons,
  watchedEpisodes,
  seasonLinks,
}: {
  id: string;
  title: string;
  type: string;
  status: string;
  posterUrl?: string | null;
  posterFiles: string[];
  isSeries: boolean;
  seasons: SeasonItem[];
  watchedEpisodes: number[];
  seasonLinks: SeasonLink[];
}) {
  const [selectedPoster, setSelectedPoster] = useState(posterUrl || '');
  const [isSaving, setIsSaving] = useState(false); // Tambahkan state untuk indikator loading
  const { showToast } = useToast();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    progressBarEvents.start();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set('id', id);
      formData.set('poster', selectedPoster || '');
      await savePosterAndWatchedEpisodes(formData);
      showToast('Saved successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Save failed', 'error');
    } finally {
      progressBarEvents.finish();
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="id" value={id} />

      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <div className="text-sm text-gray-500 capitalize">{type} • {status.replace('-', ' ')}</div>
        </div>
        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Choose poster</label>
        <select
          name="poster"
          value={selectedPoster}
          onChange={(event) => setSelectedPoster(event.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">-- none / placeholder --</option>
          {posterFiles.map((file) => (
            <option key={file} value={`/posters/${file}`}>{file}</option>
          ))}
        </select>
      </div>

      {isSeries && seasons.length > 0 && (
        <WatchedEpisodesEditor
          seasons={seasons}
          watchedEpisodes={watchedEpisodes}
          seasonLinks={seasonLinks}
        />
      )}

      <div className="relative w-full max-w-43.75 mx-auto aspect-2/3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <Image
          src={selectedPoster || '/posters/placeholder.svg'}
          alt={title}
          fill
          sizes="175px"
          className="object-cover"
        />
      </div>
    </form>
  );
}
