import React, { useState } from 'react';
import { Track, Playlist, User } from '../types';
import { MusicService } from '../services/musicService';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { 
  Search, Plus, Trash2, Play, Square, Music, 
  ExternalLink, Sparkles, Check, Download, AlertCircle, Volume2 
} from 'lucide-react';

interface PlaylistBuilderProps {
  currentUser: User;
  onLaunchGame: (playlist: Playlist) => void;
  onOpenPayment: () => void;
}

export const PlaylistBuilder: React.FC<PlaylistBuilderProps> = ({
  currentUser,
  onLaunchGame,
  onOpenPayment,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(storageService.getPlaylists());
  const [activePlaylist, setActivePlaylist] = useState<Playlist>(playlists[0] || MusicService.getCuratedPlaylists()[0]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Manual Add state
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');

  // Audio preview state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // New playlist modal state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistCategory, setNewPlaylistCategory] = useState('Party Bingo');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await MusicService.searchTracks(searchQuery);
      setSearchResults(results);
    } catch {
      // fallback handled in service
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayPreview = (track: Track) => {
    if (playingTrackId === track.id) {
      audioService.stopPreview();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
      audioService.playPreview(
        track.previewUrl,
        track.title,
        () => setPlayingTrackId(null)
      );
    }
  };

  const handleAddTrack = (track: Track) => {
    if (activePlaylist.tracks.some((t) => t.id === track.id)) return;
    const updated: Playlist = {
      ...activePlaylist,
      tracks: [...activePlaylist.tracks, track],
    };
    setActivePlaylist(updated);
    storageService.savePlaylist(updated);
    setPlaylists(storageService.getPlaylists());
  };

  const handleRemoveTrack = (trackId: string) => {
    const updated: Playlist = {
      ...activePlaylist,
      tracks: activePlaylist.tracks.filter((t) => t.id !== trackId),
    };
    setActivePlaylist(updated);
    storageService.savePlaylist(updated);
    setPlaylists(storageService.getPlaylists());
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualArtist.trim()) return;

    const newTrack: Track = {
      id: `manual_${Date.now()}`,
      title: manualTitle.trim(),
      artist: manualArtist.trim(),
      album: 'Custom Added',
      genre: 'Musical Bingo',
    };

    handleAddTrack(newTrack);
    setManualTitle('');
    setManualArtist('');
  };

  const handleImportUrlOrText = async () => {
    if (!importText.trim()) return;

    // Check trial constraint: 1 custom playlist allowed for trial
    if (!currentUser.isPaid && currentUser.plan === 'trial' && playlists.length > 5) {
      onOpenPayment();
      return;
    }

    setIsImporting(true);
    setImportStatus('Contacting Spotify / Apple Music & resolving audio previews...');

    try {
      const { title, tracks, detectedSource, coverUrl } = await MusicService.parsePlaylistImport(importText);
      if (!tracks || tracks.length === 0) {
        setImportStatus('No tracks could be found. Please check the URL or paste song titles directly.');
        setIsImporting(false);
        return;
      }

      const importedPlaylist: Playlist = {
        id: `playlist_import_${Date.now()}`,
        title,
        description: `Imported via ${detectedSource} with ${tracks.length} tracks and audio previews.`,
        category: detectedSource,
        coverUrl,
        tracks,
        createdAt: Date.now(),
        createdBy: currentUser.name,
      };

      storageService.savePlaylist(importedPlaylist);
      setPlaylists(storageService.getPlaylists());
      setActivePlaylist(importedPlaylist);
      setImportText('');
      setImportStatus(`Successfully imported "${title}" with ${tracks.length} tracks ready for Bingo!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (e) {
      console.error('Import failed:', e);
      setImportStatus('Could not parse playlist. Please verify the URL or paste "Artist - Title" lines.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    // Trial restriction
    if (!currentUser.isPaid && currentUser.plan === 'trial' && playlists.length >= 6) {
      onOpenPayment();
      return;
    }

    const newPl: Playlist = {
      id: `playlist_${Date.now()}`,
      title: newPlaylistTitle.trim(),
      description: 'Custom host musical bingo playlist',
      category: newPlaylistCategory,
      tracks: [],
      createdAt: Date.now(),
      createdBy: currentUser.name,
    };

    storageService.savePlaylist(newPl);
    const updatedList = storageService.getPlaylists();
    setPlaylists(updatedList);
    setActivePlaylist(newPl);
    setIsCreatingNew(false);
    setNewPlaylistTitle('');
  };

  const trackCount = activePlaylist.tracks.length;
  const is5x5Ready = trackCount >= 24;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Game Preparation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Playlist Builder & Importer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Curate song lists for your live bingo games. Search Apple Music/iTunes, import Spotify URLs, or choose curated theme packs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            New Playlist
          </button>
          <button
            disabled={!is5x5Ready}
            onClick={() => onLaunchGame(activePlaylist)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Game with This Playlist
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Playlist selector & track manager (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Playlist Selector Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Select Playlist to Edit:</label>
                <select
                  value={activePlaylist.id}
                  onChange={(e) => {
                    const pl = playlists.find((p) => p.id === e.target.value);
                    if (pl) setActivePlaylist(pl);
                  }}
                  className="mt-1 block w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.tracks.length} songs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-slate-300">
                  <strong className="text-white text-sm">{trackCount}</strong> songs
                </span>
                <span className="text-slate-600">·</span>
                {is5x5Ready ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Ready for 5x5 Bingo (24+ songs)
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Need {24 - trackCount} more for 5x5
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400">{activePlaylist.description}</p>

            {/* Tracklist List */}
            <div className="mt-5 border-t border-slate-800/80 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Songs on this Ticket Playlist ({trackCount})
              </h3>

              {trackCount === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                  <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">No tracks added yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Use the search panel or paste a Spotify / Apple Music link on the right.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {activePlaylist.tracks.map((track, idx) => {
                    const isPlaying = playingTrackId === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors group ${
                          isPlaying
                            ? 'bg-amber-500/10 border-amber-500/30 text-white'
                            : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="font-mono text-[11px] text-slate-500 w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePlayPreview(track)}
                            className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors shrink-0"
                            title="Play 30s preview snippet"
                          >
                            {isPlaying ? (
                              <Square className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 truncate">{track.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {track.year && (
                            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                              {track.year}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(track.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors opacity-80 group-hover:opacity-100"
                            title="Remove song"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Search, Importer, Themes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Spotify & Apple Music Importer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                Import from Spotify or Apple Music
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paste any Spotify playlist URL, Apple Music link, or copied tracklist text:
              </p>
            </div>

            <div className="space-y-2.5">
              <textarea
                rows={3}
                placeholder="Paste Spotify playlist URL (e.g. https://open.spotify.com/playlist/...) or paste copied track names..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              {/* Quick sample Spotify URL pills for testing */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">Or test with popular Spotify links:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportText('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Today&apos;s Top Hits
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportText('https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    All Out 80s
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportText('https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Rock Classics
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={isImporting || !importText.trim()}
                  onClick={handleImportUrlOrText}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isImporting ? 'Connecting & Loading Audio...' : 'Import Playlist'}
                </button>
              </div>

              {importStatus && (
                <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Library (iTunes / Apple Music live API) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              Search & Add Songs with Audio Previews
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Search millions of tracks with 30s playable previews:
            </p>

            <form onSubmit={handleSearch} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Search song title or artist (e.g. ABBA, Bon Jovi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((track) => {
                  const alreadyAdded = activePlaylist.tracks.some((t) => t.id === track.id);
                  const isPlaying = playingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={() => handlePlayPreview(track)}
                          className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors shrink-0"
                          title="Preview snippet"
                        >
                          {isPlaying ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{track.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleAddTrack(track)}
                        className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                          alreadyAdded
                            ? 'text-emerald-400 cursor-default'
                            : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 cursor-pointer'
                        }`}
                      >
                        {alreadyAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick manual song add */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Or manually type track:
              </span>
              <form onSubmit={handleManualAdd} className="grid grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="Song Title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="Artist"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="col-span-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* New Playlist Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">Create New Playlist</h3>
            <form onSubmit={handleCreateNewPlaylist} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding 2000s Pop Bingo"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Theme / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Pop, Rock, 80s, Disco"
                  value={newPlaylistCategory}
                  onChange={(e) => setNewPlaylistCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
