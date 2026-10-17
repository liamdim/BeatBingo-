import { Track, Playlist } from '../types';

interface ITunesTrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  releaseDate?: string;
}

export class MusicService {
  /**
   * Search iTunes/Apple Music API for tracks
   */
  public static async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const encoded = encodeURIComponent(query.trim());
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      return (data.results || []).map((item: ITunesTrackResult) => ({
        id: `itunes_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        previewUrl: item.previewUrl,
        artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : undefined,
        genre: item.primaryGenreName,
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : undefined,
        duration: 30,
      }));
    } catch (err) {
      console.warn('iTunes search failed, returning simulated search:', err);
      return this.fallbackSearch(query);
    }
  }

  /**
   * Fallback search generator if external API is offline
   */
  private static fallbackSearch(query: string): Track[] {
    const qLower = query.toLowerCase();
    const curated = this.getCuratedPlaylists().flatMap((p) => p.tracks);
    const matches = curated.filter(
      (t) => t.title.toLowerCase().includes(qLower) || t.artist.toLowerCase().includes(qLower)
    );
    if (matches.length > 0) return matches;

    return [
      {
        id: `sim_${Date.now()}_1`,
        title: `${query} (Party Mix)`,
        artist: 'BeatBingo All-Stars',
        album: 'Dance Floor Essentials',
        genre: 'Pop / Dance',
        year: '2024',
      },
      {
        id: `sim_${Date.now()}_2`,
        title: `Singalong to ${query}`,
        artist: 'The Crowd Pleasers',
        album: 'Live at the Arena',
        genre: 'Rock',
        year: '2023',
      },
    ];
  }

  /**
   * Parse Spotify or Apple Music URLs or raw track text
   */
  public static async parsePlaylistImport(
    input: string
  ): Promise<{ title: string; tracks: Track[]; detectedSource: string; coverUrl?: string }> {
    const cleanInput = input.trim();
    let detectedSource = 'Custom Text';
    let playlistTitle = 'Imported Musical Bingo Playlist';
    let coverUrl: string | undefined = undefined;

    const isSpotify = cleanInput.includes('spotify.com');
    const isApple = cleanInput.includes('music.apple.com');

    if (isSpotify) {
      detectedSource = 'Spotify';
    } else if (isApple) {
      detectedSource = 'Apple Music';
    }

    const lines = cleanInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const isUrl = lines.length === 1 && lines[0].startsWith('http');

    if (isUrl) {
      const url = lines[0];

      if (isSpotify) {
        // Step 1: Call Spotify public oEmbed endpoint
        try {
          const oembedResp = await fetch(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
          );
          if (oembedResp.ok) {
            const data = await oembedResp.json();
            if (data.title) {
              playlistTitle = data.title;
            }
            if (data.thumbnail_url) {
              coverUrl = data.thumbnail_url;
            }
          }
        } catch (err) {
          console.warn('Spotify oEmbed query error:', err);
        }

        // Clean playlist title
        let searchPhrase = playlistTitle
          .replace(/Spotify - /i, '')
          .replace(/ \| Spotify/i, '')
          .replace(/Playlist/i, '')
          .trim();

        if (!searchPhrase || searchPhrase.length < 3) {
          searchPhrase = 'Party Hits';
        }

        // Step 2: Fetch tracks matching this Spotify playlist title from iTunes with real audio previews
        let resolvedTracks = await this.searchTracks(searchPhrase, 35);

        // If fewer than 24 tracks, add top party hits to meet 5x5 bingo requirements
        if (resolvedTracks.length < 24) {
          const extraHits = await this.searchTracks('Pop Hits', 30);
          resolvedTracks = [
            ...resolvedTracks,
            ...extraHits.filter((eh) => !resolvedTracks.some((rt) => rt.id === eh.id)),
          ];
        }

        // If still under 24, add curated party tracks
        if (resolvedTracks.length < 24) {
          const curated = this.getCuratedPlaylists()[3].tracks;
          resolvedTracks = [
            ...resolvedTracks,
            ...curated.filter((c) => !resolvedTracks.some((rt) => rt.id === c.id)),
          ];
        }

        return {
          title: playlistTitle !== 'Imported Musical Bingo Playlist' ? playlistTitle : 'Spotify Party Playlist',
          tracks: resolvedTracks.slice(0, 45),
          detectedSource: 'Spotify',
          coverUrl,
        };
      }

      if (isApple) {
        const parts = url.split('/');
        const slug = parts[parts.length - 2] || 'Pop Hits';
        const formattedTitle = slug.replace(/-/g, ' ');
        const resolved = await this.searchTracks(formattedTitle, 35);
        return {
          title: `Apple Music · ${formattedTitle.replace(/\b\w/g, (c) => c.toUpperCase())}`,
          tracks: resolved.length >= 24 ? resolved : this.getCuratedPlaylists()[3].tracks,
          detectedSource: 'Apple Music',
        };
      }
    }

    // Step 3: Handle pasted Spotify track links or text tracklist lines
    const parsedTracks: Track[] = [];
    const isSpotifyTracks = lines.some((l) => l.includes('spotify.com/track/'));

    if (isSpotifyTracks) {
      detectedSource = 'Spotify Tracklist';
      for (let i = 0; i < Math.min(lines.length, 35); i++) {
        const line = lines[i];
        if (line.includes('spotify.com/track/')) {
          try {
            const oembedResp = await fetch(
              `https://open.spotify.com/oembed?url=${encodeURIComponent(line)}`
            );
            if (oembedResp.ok) {
              const d = await oembedResp.json();
              parsedTracks.push({
                id: `sp_track_${Date.now()}_${i}`,
                title: d.title || `Track ${i + 1}`,
                artist: d.author_name || 'Spotify Artist',
                artworkUrl: d.thumbnail_url,
                genre: 'Spotify',
              });
            }
          } catch {}
        }
      }

      if (parsedTracks.length >= 10) {
        return {
          title: 'Imported Spotify Track Selection',
          tracks: parsedTracks,
          detectedSource: 'Spotify',
        };
      }
    }

    // Standard text parsing: "Artist - Title" or "Title by Artist"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/^\d+[\.\)]\s*/, '');
      let artist = 'Various Artists';
      let title = line;

      if (line.includes(' - ')) {
        const parts = line.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else if (line.includes(' by ')) {
        const parts = line.split(' by ');
        title = parts[0].trim();
        artist = parts[1].trim();
      }

      parsedTracks.push({
        id: `imp_${Date.now()}_${i}`,
        title: title || `Track ${i + 1}`,
        artist: artist || 'Artist',
        album: 'Imported Collection',
        genre: 'Musical Bingo',
      });
    }

    return {
      title: playlistTitle,
      tracks: parsedTracks,
      detectedSource,
    };
  }

  /**
   * Curated ready-to-play music bingo playlists
   */
  public static getCuratedPlaylists(): Playlist[] {
    return [
      {
        id: 'curated_80s',
        title: '80s Rewind Anthems',
        description: '35 iconic chart-toppers from Michael Jackson, Queen, Whitney Houston, Madonna and more!',
        category: '80s Classics',
        createdAt: 1710000000000,
        createdBy: 'BeatBingo Curators',
        tracks: [
          { id: '80_1', title: 'Livin\' on a Prayer', artist: 'Bon Jovi', year: '1986', genre: 'Rock' },
          { id: '80_2', title: 'Billie Jean', artist: 'Michael Jackson', year: '1982', genre: 'Pop' },
          { id: '80_3', title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', year: '1987', genre: 'Rock' },
          { id: '80_4', title: 'I Wanna Dance with Somebody', artist: 'Whitney Houston', year: '1987', genre: 'Pop' },
          { id: '80_5', title: 'Take On Me', artist: 'a-ha', year: '1985', genre: 'Synth-Pop' },
          { id: '80_6', title: 'Don\'t Stop Believin\'', artist: 'Journey', year: '1981', genre: 'Rock' },
          { id: '80_7', title: 'Like a Prayer', artist: 'Madonna', year: '1989', genre: 'Pop' },
          { id: '80_8', title: 'Wake Me Up Before You Go-Go', artist: 'Wham!', year: '1984', genre: 'Pop' },
          { id: '80_9', title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper', year: '1983', genre: 'Pop' },
          { id: '80_10', title: 'Eye of the Tiger', artist: 'Survivor', year: '1982', genre: 'Rock' },
          { id: '80_11', title: 'Never Gonna Give You Up', artist: 'Rick Astley', year: '1987', genre: 'Dance' },
          { id: '80_12', title: 'Another One Bites the Dust', artist: 'Queen', year: '1980', genre: 'Rock' },
          { id: '80_13', title: 'Every Breath You Take', artist: 'The Police', year: '1983', genre: 'Rock' },
          { id: '80_14', title: 'Africa', artist: 'TOTO', year: '1982', genre: 'Pop' },
          { id: '80_15', title: 'Down Under', artist: 'Men at Work', year: '1981', genre: 'Pop' },
          { id: '80_16', title: 'Footloose', artist: 'Kenny Loggins', year: '1984', genre: 'Rock' },
          { id: '80_17', title: 'Karma Chameleon', artist: 'Culture Club', year: '1983', genre: 'Pop' },
          { id: '80_18', title: 'Come On Eileen', artist: 'Dexys Midnight Runners', year: '1982', genre: 'Celtic Pop' },
          { id: '80_19', title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', year: '1983', genre: 'Rock' },
          { id: '80_20', title: 'Careless Whisper', artist: 'George Michael', year: '1984', genre: 'Pop' },
          { id: '80_21', title: 'Jump', artist: 'Van Halen', year: '1984', genre: 'Rock' },
          { id: '80_22', title: 'Beat It', artist: 'Michael Jackson', year: '1982', genre: 'Pop/Rock' },
          { id: '80_23', title: 'Summer of \'69', artist: 'Bryan Adams', year: '1984', genre: 'Rock' },
          { id: '80_24', title: 'You Spin Me Round (Like a Record)', artist: 'Dead or Alive', year: '1985', genre: 'Hi-NRG' },
          { id: '80_25', title: 'Tainted Love', artist: 'Soft Cell', year: '1981', genre: 'Synth-Pop' },
          { id: '80_26', title: 'Walking on Sunshine', artist: 'Katrina and the Waves', year: '1985', genre: 'Pop' },
          { id: '80_27', title: 'I Love Rock \'n\' Roll', artist: 'Joan Jett', year: '1981', genre: 'Rock' },
          { id: '80_28', title: 'Don\'t You (Forget About Me)', artist: 'Simple Minds', year: '1985', genre: 'New Wave' },
          { id: '80_29', title: 'Super Freak', artist: 'Rick James', year: '1981', genre: 'Funk' },
          { id: '80_30', title: '9 to 5', artist: 'Dolly Parton', year: '1980', genre: 'Country Pop' },
          { id: '80_31', title: 'Uptown Girl', artist: 'Billy Joel', year: '1983', genre: 'Pop' },
          { id: '80_32', title: 'Should I Stay or Should I Go', artist: 'The Clash', year: '1982', genre: 'Punk Rock' },
          { id: '80_33', title: 'Ain\'t Nobody', artist: 'Chaka Khan', year: '1983', genre: 'R&B/Funk' },
          { id: '80_34', title: 'Blue Monday', artist: 'New Order', year: '1983', genre: 'Electronic' },
          { id: '80_35', title: 'We Will Rock You', artist: 'Queen', year: '1980', genre: 'Rock' },
        ],
      },
      {
        id: 'curated_90s',
        title: '90s Pop & Dance Nostalgia',
        description: 'Spice Girls, Backstreet Boys, Britney Spears, TLC, and euro-dance party anthems.',
        category: '90s Pop',
        createdAt: 1710100000000,
        createdBy: 'BeatBingo Curators',
        tracks: [
          { id: '90_1', title: 'Wannabe', artist: 'Spice Girls', year: '1996', genre: 'Pop' },
          { id: '90_2', title: '...Baby One More Time', artist: 'Britney Spears', year: '1998', genre: 'Pop' },
          { id: '90_3', title: 'Everybody (Backstreet\'s Back)', artist: 'Backstreet Boys', year: '1997', genre: 'Pop' },
          { id: '90_4', title: 'Wonderwall', artist: 'Oasis', year: '1995', genre: 'Britpop' },
          { id: '90_5', title: 'No Scrubs', artist: 'TLC', year: '1999', genre: 'R&B' },
          { id: '90_6', title: 'Man! I Feel Like a Woman!', artist: 'Shania Twain', year: '1997', genre: 'Country Pop' },
          { id: '90_7', title: 'Say My Name', artist: 'Destiny\'s Child', year: '1999', genre: 'R&B' },
          { id: '90_8', title: 'Waterfalls', artist: 'TLC', year: '1994', genre: 'R&B' },
          { id: '90_9', title: 'Torn', artist: 'Natalie Imbruglia', year: '1997', genre: 'Pop' },
          { id: '90_10', title: 'Barbie Girl', artist: 'Aqua', year: '1997', genre: 'Eurodance' },
          { id: '90_11', title: 'Believe', artist: 'Cher', year: '1998', genre: 'Dance' },
          { id: '90_12', title: 'MMMBop', artist: 'Hanson', year: '1997', genre: 'Pop' },
          { id: '90_13', title: 'U Can\'t Touch This', artist: 'MC Hammer', year: '1990', genre: 'Hip Hop' },
          { id: '90_14', title: 'Gettin\' Jiggy Wit It', artist: 'Will Smith', year: '1997', genre: 'Hip Hop' },
          { id: '90_15', title: 'Tubthumping (I Get Knocked Down)', artist: 'Chumbawamba', year: '1997', genre: 'Alt-Rock' },
          { id: '90_16', title: 'Rhythm Is a Dancer', artist: 'Snap!', year: '1992', genre: 'Eurodance' },
          { id: '90_17', title: 'What Is Love', artist: 'Haddaway', year: '1993', genre: 'Eurodance' },
          { id: '90_18', title: 'Ice Ice Baby', artist: 'Vanilla Ice', year: '1990', genre: 'Hip Hop' },
          { id: '90_19', title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991', genre: 'Grunge' },
          { id: '90_20', title: 'Don\'t Speak', artist: 'No Doubt', year: '1995', genre: 'Pop Rock' },
          { id: '90_21', title: 'Genie in a Bottle', artist: 'Christina Aguilera', year: '1999', genre: 'Pop' },
          { id: '90_22', title: 'Bitter Sweet Symphony', artist: 'The Verve', year: '1997', genre: 'Britpop' },
          { id: '90_23', title: 'Parklife', artist: 'Blur', year: '1994', genre: 'Britpop' },
          { id: '90_24', title: 'Black or White', artist: 'Michael Jackson', year: '1991', genre: 'Pop' },
          { id: '90_25', title: 'I\'m Gonna Be (500 Miles)', artist: 'The Proclaimers', year: '1993', genre: 'Folk Pop' },
          { id: '90_26', title: 'Jump Around', artist: 'House of Pain', year: '1992', genre: 'Hip Hop' },
          { id: '90_27', title: 'Show Me Love', artist: 'Robin S', year: '1993', genre: 'House' },
          { id: '90_28', title: 'All Star', artist: 'Smash Mouth', year: '1999', genre: 'Alt-Rock' },
          { id: '90_29', title: 'Zombie', artist: 'The Cranberries', year: '1994', genre: 'Rock' },
          { id: '90_30', title: 'Smooth', artist: 'Santana ft. Rob Thomas', year: '1999', genre: 'Latin Rock' },
        ],
      },
      {
        id: 'curated_rock',
        title: 'Rock & Indie Anthems',
        description: 'High-octane stadium rock, guitar solos, and festival singalongs from Queen to The Killers.',
        category: 'Rock',
        createdAt: 1710200000000,
        createdBy: 'BeatBingo Curators',
        tracks: [
          { id: 'rk_1', title: 'Mr. Brightside', artist: 'The Killers', year: '2004', genre: 'Indie Rock' },
          { id: 'rk_2', title: 'Bohemian Rhapsody', artist: 'Queen', year: '1975', genre: 'Classic Rock' },
          { id: 'rk_3', title: 'Sex on Fire', artist: 'Kings of Leon', year: '2008', genre: 'Rock' },
          { id: 'rk_4', title: 'Seven Nation Army', artist: 'The White Stripes', year: '2003', genre: 'Garage Rock' },
          { id: 'rk_5', title: 'I Bet You Look Good on the Dancefloor', artist: 'Arctic Monkeys', year: '2006', genre: 'Indie Rock' },
          { id: 'rk_6', title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', year: '1974', genre: 'Southern Rock' },
          { id: 'rk_7', title: 'Sweet Caroline', artist: 'Neil Diamond', year: '1969', genre: 'Pop Rock' },
          { id: 'rk_8', title: 'Song 2', artist: 'Blur', year: '1997', genre: 'Alt-Rock' },
          { id: 'rk_9', title: 'Are You Gonna Be My Girl', artist: 'Jet', year: '2003', genre: 'Rock' },
          { id: 'rk_10', title: 'Last Nite', artist: 'The Strokes', year: '2001', genre: 'Indie Rock' },
          { id: 'rk_11', title: 'Ruby', artist: 'Kaiser Chiefs', year: '2007', genre: 'Indie Rock' },
          { id: 'rk_12', title: 'Chelsea Dagger', artist: 'The Fratellis', year: '2006', genre: 'Indie Rock' },
          { id: 'rk_13', title: 'Learn to Fly', artist: 'Foo Fighters', year: '1999', genre: 'Rock' },
          { id: 'rk_14', title: 'All the Small Things', artist: 'blink-182', year: '1999', genre: 'Pop Punk' },
          { id: 'rk_15', title: 'Basket Case', artist: 'Green Day', year: '1994', genre: 'Punk Rock' },
          { id: 'rk_16', title: 'Stacy\'s Mom', artist: 'Fountains of Wayne', year: '2003', genre: 'Pop Rock' },
          { id: 'rk_17', title: 'Teenage Dirtbag', artist: 'Wheatus', year: '2000', genre: 'Alt-Rock' },
          { id: 'rk_18', title: 'Use Somebody', artist: 'Kings of Leon', year: '2008', genre: 'Rock' },
          { id: 'rk_19', title: 'Highway to Hell', artist: 'AC/DC', year: '1979', genre: 'Hard Rock' },
          { id: 'rk_20', title: 'Back in Black', artist: 'AC/DC', year: '1980', genre: 'Hard Rock' },
          { id: 'rk_21', title: 'Born to Run', artist: 'Bruce Springsteen', year: '1975', genre: 'Rock' },
          { id: 'rk_22', title: 'Go Your Own Way', artist: 'Fleetwood Mac', year: '1977', genre: 'Rock' },
          { id: 'rk_23', title: 'Hotel California', artist: 'Eagles', year: '1976', genre: 'Rock' },
          { id: 'rk_24', title: 'Paradise City', artist: 'Guns N\' Roses', year: '1987', genre: 'Hard Rock' },
          { id: 'rk_25', title: 'Paint It Black', artist: 'The Rolling Stones', year: '1966', genre: 'Classic Rock' },
          { id: 'rk_26', title: 'You Really Got Me', artist: 'The Kinks', year: '1964', genre: 'Garage Rock' },
          { id: 'rk_27', title: 'Fat Bottomed Girls', artist: 'Queen', year: '1978', genre: 'Rock' },
          { id: 'rk_28', title: 'Creep', artist: 'Radiohead', year: '1992', genre: 'Alt-Rock' },
          { id: 'rk_29', title: 'Take Me Out', artist: 'Franz Ferdinand', year: '2004', genre: 'Post-Punk' },
          { id: 'rk_30', title: 'Somebody to Love', artist: 'Queen', year: '1976', genre: 'Classic Rock' },
        ],
      },
      {
        id: 'curated_party',
        title: 'Ultimate Party Bangers & Singalongs',
        description: 'Universal party starters that get everyone dabbing their tickets and chanting the chorus.',
        category: 'Party Bangers',
        createdAt: 1710300000000,
        createdBy: 'BeatBingo Curators',
        tracks: [
          { id: 'pty_1', title: 'Dancing Queen', artist: 'ABBA', year: '1976', genre: 'Disco' },
          { id: 'pty_2', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', year: '2014', genre: 'Funk' },
          { id: 'pty_3', title: 'September', artist: 'Earth, Wind & Fire', year: '1978', genre: 'Disco/Soul' },
          { id: 'pty_4', title: 'Stayin\' Alive', artist: 'Bee Gees', year: '1977', genre: 'Disco' },
          { id: 'pty_5', title: 'Hey Jude', artist: 'The Beatles', year: '1968', genre: 'Pop' },
          { id: 'pty_6', title: 'Don\'t Stop Me Now', artist: 'Queen', year: '1978', genre: 'Rock' },
          { id: 'pty_7', title: 'Happy', artist: 'Pharrell Williams', year: '2013', genre: 'Pop' },
          { id: 'pty_8', title: 'Shut Up and Dance', artist: 'WALK THE MOON', year: '2014', genre: 'Pop Rock' },
          { id: 'pty_9', title: 'Can\'t Stop the Feeling!', artist: 'Justin Timberlake', year: '2016', genre: 'Pop' },
          { id: 'pty_10', title: 'Mamma Mia', artist: 'ABBA', year: '1975', genre: 'Pop' },
          { id: 'pty_11', title: 'Valerie', artist: 'Mark Ronson ft. Amy Winehouse', year: '2007', genre: 'Soul' },
          { id: 'pty_12', title: 'I Gotta Feeling', artist: 'Black Eyed Peas', year: '2009', genre: 'Dance' },
          { id: 'pty_13', title: 'Single Ladies (Put a Ring on It)', artist: 'Beyoncé', year: '2008', genre: 'R&B' },
          { id: 'pty_14', title: 'Crazy in Love', artist: 'Beyoncé ft. JAY-Z', year: '2003', genre: 'R&B' },
          { id: 'pty_15', title: 'Y.M.C.A.', artist: 'Village People', year: '1978', genre: 'Disco' },
          { id: 'pty_16', title: 'Blame It on the Boogie', artist: 'The Jacksons', year: '1978', genre: 'Disco' },
          { id: 'pty_17', title: 'Gimme! Gimme! Gimme!', artist: 'ABBA', year: '1979', genre: 'Disco' },
          { id: 'pty_18', title: 'Sweet Dreams (Are Made of This)', artist: 'Eurythmics', year: '1983', genre: 'Synth-Pop' },
          { id: 'pty_19', title: 'Celebration', artist: 'Kool & The Gang', year: '1980', genre: 'Disco' },
          { id: 'pty_20', title: 'Hey Ya!', artist: 'Outkast', year: '2003', genre: 'Hip Hop' },
          { id: 'pty_21', title: 'Shake It Off', artist: 'Taylor Swift', year: '2014', genre: 'Pop' },
          { id: 'pty_22', title: 'Levitating', artist: 'Dua Lipa', year: '2020', genre: 'Disco-Pop' },
          { id: 'pty_23', title: 'Wake Me Up', artist: 'Avicii', year: '2013', genre: 'EDM' },
          { id: 'pty_24', title: 'Titanium', artist: 'David Guetta ft. Sia', year: '2011', genre: 'Dance' },
          { id: 'pty_25', title: 'Firework', artist: 'Katy Perry', year: '2010', genre: 'Pop' },
          { id: 'pty_26', title: 'Party Rock Anthem', artist: 'LMFAO', year: '2011', genre: 'Dance' },
          { id: 'pty_27', title: 'Sugar', artist: 'Maroon 5', year: '2014', genre: 'Pop' },
          { id: 'pty_28', title: 'Rock DJ', artist: 'Robbie Williams', year: '2000', genre: 'Pop' },
          { id: 'pty_29', title: 'Angels', artist: 'Robbie Williams', year: '1997', genre: 'Pop' },
          { id: 'pty_30', title: 'Wonderwall', artist: 'Oasis', year: '1995', genre: 'Britpop' },
          { id: 'pty_31', title: 'Sweet Caroline', artist: 'Neil Diamond', year: '1969', genre: 'Pop' },
          { id: 'pty_32', title: 'Build Me Up Buttercup', artist: 'The Foundations', year: '1968', genre: 'Soul' },
        ],
      },
      {
        id: 'curated_soundtracks',
        title: 'Movie & TV Soundtracks',
        description: 'Iconic themes from Disney, Grease, Dirty Dancing, The Greatest Showman, and Bond.',
        category: 'Soundtracks',
        createdAt: 1710400000000,
        createdBy: 'BeatBingo Curators',
        tracks: [
          { id: 'st_1', title: '(I\'ve Had) The Time of My Life', artist: 'Bill Medley & Jennifer Warnes', year: '1987', album: 'Dirty Dancing' },
          { id: 'st_2', title: 'You\'re the One That I Want', artist: 'John Travolta & Olivia Newton-John', year: '1978', album: 'Grease' },
          { id: 'st_3', title: 'This Is Me', artist: 'Keala Settle & The Greatest Showman', year: '2017', album: 'The Greatest Showman' },
          { id: 'st_4', title: 'A Whole New World', artist: 'Brad Kane & Lea Salonga', year: '1992', album: 'Aladdin' },
          { id: 'st_5', title: 'Let It Go', artist: 'Idina Menzel', year: '2013', album: 'Frozen' },
          { id: 'st_6', title: 'Ghostbusters', artist: 'Ray Parker Jr.', year: '1984', album: 'Ghostbusters' },
          { id: 'st_7', title: 'Danger Zone', artist: 'Kenny Loggins', year: '1986', album: 'Top Gun' },
          { id: 'st_8', title: 'Men in Black', artist: 'Will Smith', year: '1997', album: 'Men in Black' },
          { id: 'st_9', title: 'Skyfall', artist: 'Adele', year: '2012', album: 'Skyfall (007)' },
          { id: 'st_10', title: 'Circle of Life', artist: 'Elton John', year: '1994', album: 'The Lion King' },
          { id: 'st_11', title: 'I Will Always Love You', artist: 'Whitney Houston', year: '1992', album: 'The Bodyguard' },
          { id: 'st_12', title: 'Eye of the Tiger', artist: 'Survivor', year: '1982', album: 'Rocky III' },
          { id: 'st_13', title: 'My Heart Will Go On', artist: 'Celine Dion', year: '1997', album: 'Titanic' },
          { id: 'st_14', title: 'Greased Lightnin\'', artist: 'John Travolta', year: '1978', album: 'Grease' },
          { id: 'st_15', title: 'Can You Feel the Love Tonight', artist: 'Elton John', year: '1994', album: 'The Lion King' },
          { id: 'st_16', title: 'Hakuna Matata', artist: 'Nathan Lane & Ernie Sabella', year: '1994', album: 'The Lion King' },
          { id: 'st_17', title: 'Footloose', artist: 'Kenny Loggins', year: '1984', album: 'Footloose' },
          { id: 'st_18', title: 'Stayin\' Alive', artist: 'Bee Gees', year: '1977', album: 'Saturday Night Fever' },
          { id: 'st_19', title: 'Don\'t You (Forget About Me)', artist: 'Simple Minds', year: '1985', album: 'The Breakfast Club' },
          { id: 'st_20', title: 'Shallow', artist: 'Lady Gaga & Bradley Cooper', year: '2018', album: 'A Star Is Born' },
          { id: 'st_21', title: 'How Far I\'ll Go', artist: 'Auli\'i Cravalho', year: '2016', album: 'Moana' },
          { id: 'st_22', title: 'You\'ve Got a Friend in Me', artist: 'Randy Newman', year: '1995', album: 'Toy Story' },
          { id: 'st_23', title: 'We Don\'t Talk About Bruno', artist: 'Encanto Cast', year: '2021', album: 'Encanto' },
          { id: 'st_24', title: 'I\'m a Believer', artist: 'Smash Mouth', year: '2001', album: 'Shrek' },
          { id: 'st_25', title: 'Holding Out for a Hero', artist: 'Bonnie Tyler', year: '1984', album: 'Footloose' },
        ],
      },
    ];
  }
}
