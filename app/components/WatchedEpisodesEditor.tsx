'use client';

import { useState } from 'react';

type SeasonItem = {
  season: number;
  episodes: number;
  startEpisode: number;
  endEpisode: number;
};

type SeasonLink = {
  season: number;
  link?: string | null;
};

export default function WatchedEpisodesEditor({
  seasons,
  watchedEpisodes,
  seasonLinks = [],
}: {
  seasons: SeasonItem[];
  watchedEpisodes: number[];
  seasonLinks?: SeasonLink[];
}) {
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>(watchedEpisodes);

  const toggleEpisode = (episode: number) => {
    setSelectedEpisodes((current) => {
      if (current.includes(episode)) {
        return current.filter((value) => value < episode).sort((a, b) => a - b);
      }

      const next = new Set([...current, ...Array.from({ length: episode }, (_, index) => index + 1)]);
      return Array.from(next).sort((a, b) => a - b);
    });
  };

  return (
    <div>
      <input type="hidden" name="watched_episodes" value={JSON.stringify(selectedEpisodes)} />
      <h3 className="text-sm font-semibold mb-3">Seasons & Episodes</h3>
      <div className="space-y-4">
        {seasons.map((season) => {
          const seasonLink = seasonLinks.find((item) => Number(item.season) === Number(season.season))?.link;

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
                {Array.from({ length: season.episodes }, (_, index) => {
                  const localEpisode = index + 1;
                  const globalEpisode = season.startEpisode + index;
                  const isWatched = selectedEpisodes.includes(globalEpisode);

                  return (
                    <button
                      key={globalEpisode}
                      type="button"
                      onClick={() => toggleEpisode(globalEpisode)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isWatched ? 'bg-blue-600 text-white' : 'bg-transparent border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}
                    >
                      Ep {localEpisode}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}