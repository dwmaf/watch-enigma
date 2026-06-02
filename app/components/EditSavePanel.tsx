'use client';

import { useState } from 'react';
import Image from 'next/image';
import WatchedEpisodesEditor from '@/app/components/WatchedEpisodesEditor';
import { savePosterAndWatchedEpisodes } from '@/app/actions';
import { useToast } from './ToastProvider';

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
  posterUrl,
  posterFiles,
  isSeries,
  seasons,
  watchedEpisodes,
  seasonLinks,
}: {
  id: string;
  title: string;
  posterUrl?: string | null;
  posterFiles: string[];
  isSeries: boolean;
  seasons: SeasonItem[];
  watchedEpisodes: number[];
  seasonLinks: SeasonLink[];
}) {
  const [selectedPoster, setSelectedPoster] = useState(posterUrl || '');
  const { showToast } = useToast();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      formData.set('id', id);
      formData.set('poster', selectedPoster || '');
      await savePosterAndWatchedEpisodes(formData);
      showToast('Saved successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Save failed', 'error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="mb-4 space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="block text-xs font-medium mb-2">Choose poster</label>
      <div className="flex gap-2">
        <select
          name="poster"
          value={selectedPoster}
          onChange={(event) => setSelectedPoster(event.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
        >
          <option value="">-- none / placeholder --</option>
          {posterFiles.map((file) => (
            <option key={file} value={`/posters/${file}`}>{file}</option>
          ))}
        </select>
        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">Save</button>
      </div>

      {isSeries && seasons.length > 0 && (
        <WatchedEpisodesEditor
          seasons={seasons}
          watchedEpisodes={watchedEpisodes}
          seasonLinks={seasonLinks}
        />
      )}

      <div className="relative w-full max-w-xs mx-auto aspect-2/3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <Image
          src={selectedPoster || '/posters/placeholder.svg'}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
    </form>
  );
}
