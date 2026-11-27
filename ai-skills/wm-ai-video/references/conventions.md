# Video conventions

The authoritative rules are in `AGENTS.md` (**Videos**, **Subtitles**) and `CONTRIBUTING.md` (**Asset size limits**). This file collects them in one place for the video workflow.

## Where the files go

- Docs page: `docs/<section>/assets/vids/<name>.mp4`, `<name>.vtt`, `poster.jpg`, next to the page.
- Blog post: `assets/videos/<slug>/`. Feature announcement: `blogs/feature-announcements/assets/videos/<slug>/`.
- Never under `static/img/`. Never a hand-made pointer file: the asset pipeline writes pointers.
- Size limit: video 50 MB, image 2 MB. `npm run check-assets` checks the branch locally.

## Embed (MDX)

One `import` per asset right after the frontmatter, then a blank line (the ESM block ends at the first blank line). Name each import in camelCase with a `Video`, `Image`, or `Subtitles` suffix so it cannot clash with a globally registered component.

```mdx
import demoPoster from './assets/vids/poster.jpg';
import demoVideo from './assets/vids/demo.mp4';
import demoSubtitles from './assets/vids/demo.vtt';

<video controls width="100%" playsInline poster={demoPoster}>
  <source src={demoVideo} type="video/mp4" />
  <track kind="subtitles" srcLang="en" label="English" src={demoSubtitles} default />
</video>
```

- Use the imported value directly; there is no `.default`.
- Add `muted` only for a silent video. A narrated video must not be muted.
- One `<track>` per language (`demo.fr.vtt` for French), each with its own `srcLang` and `label`, and `default` on one only.
- Do not import `VideoCard` or `AcademyCard`: they are global. Academy URLs come from the user (`https://academy.wavemaker.ai/Watch?wm=<ID>`), never invented.
- Add alt-style context in the paragraph before the video: say in a sentence what it shows, because the player has no alt text.

## WebVTT

```
WEBVTT

00:03.600 --> 00:05.837
This video shows how to add a page.

00:05.887 --> 00:08.540
Open the Pages panel and click the plus icon.
```

- Starts with `WEBVTT` and a blank line. Cues as `mm:ss.mmm --> mm:ss.mmm` (or `hh:mm:ss.mmm`).
- At most 2 lines per cue, about 42 characters per line, each cue on screen 1 to 7 seconds, break at natural phrases.
- Plain text only: no `position:` or `align:` settings, no `STYLE` blocks, no `<v>` or `<c>` tags.
- The text matches the spoken words. Take cue times from the real voice take: split each line at its pauses (silence detection), snap each cue start to the pause that is closest to the phrase boundary, and end each cue just before the next starts.
- Separate cues with exactly one blank line. A missing blank line merges two cues.

## Encode

```bash
# encode the video first, then add the audio without re-encoding the video
ffmpeg -y -nostdin -framerate 60 -i frames/f%05d.png -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 60 video-only.mp4
ffmpeg -y -nostdin -i video-only.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest name.mp4
ffmpeg -y -nostdin -ss 6.9 -i name.mp4 -frames:v 1 -q:v 3 poster.jpg
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact name.mp4
```

A one-minute 1080p video made mostly of screenshots is usually well under the 50 MB limit at CRF 18.
