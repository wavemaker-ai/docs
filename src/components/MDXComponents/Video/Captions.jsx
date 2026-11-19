import React from 'react';
import { selectTextTrack, useActiveTextCues, usePlayer } from '@videojs/react';
import styles from './Video.module.css';

// Module scope: the hook compares a filter by identity.
const CAPTION_TRACKS = { kind: ['subtitles', 'captions'] };

// A WebVTT cue can carry markup (<i>, <v Speaker>, <c.cls>) and entities. Show the plain text.
function plainText(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Draws the active subtitle cues itself, one block per cue.
 *
 * The browser draws cues too, but Chrome fixes their background and corner radius with !important
 * user-agent rules (they follow the user's caption settings), so a site cannot restyle them: a
 * two-line cue always gets two boxes of different widths. Drawing them here gives every line the
 * same box. The native cues are hidden in VideoPlayer.css. Which track is on, and the Captions
 * button, are still handled by Video.js.
 */
export default function Captions() {
  const tracks = usePlayer(selectTextTrack);
  const cues = useActiveTextCues(CAPTION_TRACKS);
  if (!tracks?.subtitlesShowing || cues.length === 0) return null;

  return (
    <div className={styles.captions}>
      {cues.map((cue) => (
        <span key={cue.id} className={styles.caption}>
          {plainText(cue.text)}
        </span>
      ))}
    </div>
  );
}
