import React, { useEffect, useRef, useState } from 'react';
import {
  Video as PlayerVideo,
  VideoPlayer,
  VideoSkin,
} from '@videojs/react/video';
import './VideoPlayer.css';
import styles from './Video.module.css';

const DEFAULT_RATIO = { css: '16 / 9', value: 16 / 9 };

function toRatio(width, height) {
  const w = Number(width);
  const h = Number(height);
  return w > 0 && h > 0 ? { css: `${w} / ${h}`, value: w / h } : null;
}

/**
 * Registered as the MDX `video` element (see plugins/video-player/remark.cjs), so every <video> in
 * the docs and blogs renders with the Video.js player (default skin). Authors keep writing plain
 * HTML:
 *
 *   <video controls width="100%" muted poster={poster}>
 *     <source src={video} type="video/mp4" />
 *   </video>
 *
 * The player is imported statically and rendered on the server, so the first paint is already the
 * final player: nothing is swapped in later, which is what made a lazy-loaded version flash.
 *
 * Aspect ratio:
 *  - Numeric `width` and `height` (like <img>) set it up front, so the page reserves the right
 *    space. They set the ratio, not the pixel size.
 *  - Otherwise (missing, or a value such as "100%") the box starts at 16:9 and switches to the
 *    file's own ratio once its metadata has loaded.
 *
 * Native attributes (`muted`, `loop`, `autoPlay`, `preload`, `playsInline`, `poster`) and
 * `<source>` / `<track>` children are passed to the player. `controls` is accepted and ignored:
 * the player always has its own controls.
 */
export default function Video({
  width,
  height,
  className,
  poster,
  controls: _controls, // the skin supplies the controls; forwarding it would show two sets
  playsInline = true,
  preload = 'metadata',
  children,
  ...mediaProps
}) {
  const declared = toRatio(width, height);
  const [measured, setMeasured] = useState(null);
  const boxRef = useRef(null);
  const ratio = declared ?? measured ?? DEFAULT_RATIO;

  // No declared ratio: read it from the video. Its metadata may have loaded before hydration
  // (the server-rendered <video> starts loading right away), so check readyState first.
  useEffect(() => {
    const video = boxRef.current?.querySelector('video');
    if (declared || !video) return undefined;
    const read = () => {
      if (video.videoWidth && video.videoHeight) {
        setMeasured(toRatio(video.videoWidth, video.videoHeight));
      }
    };
    if (video.readyState >= 1) {
      read();
      return undefined;
    }
    video.addEventListener('loadedmetadata', read);
    return () => video.removeEventListener('loadedmetadata', read);
  }, [declared]);

  return (
    <div
      ref={boxRef}
      className={[styles.box, className].filter(Boolean).join(' ')}
      style={{
        aspectRatio: ratio.css,
        // Keeps a portrait video from growing taller than the screen on a wide column.
        maxWidth: `calc(var(--wm-video-max-height, 80vh) * ${ratio.value})`,
      }}
    >
      <VideoPlayer poster={poster}>
        <VideoSkin style={{ width: '100%', aspectRatio: ratio.css }}>
          <PlayerVideo
            playsInline={playsInline}
            preload={preload}
            {...mediaProps}
          >
            {children}
          </PlayerVideo>
        </VideoSkin>
      </VideoPlayer>
    </div>
  );
}
