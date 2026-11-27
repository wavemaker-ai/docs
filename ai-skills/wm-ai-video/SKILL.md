---
name: wm-ai-video
description: >
  Use this skill when creating or adding a narrated video for the WaveMaker docs: a short walkthrough or
  explainer for a docs page, guide, blog post, or feature announcement. Activate when the user asks to make
  a video, add narration or subtitles, make a poster, or embed a local video (mp4, vtt) in a page.
---

# WaveMaker Video Maker

You help a writer or developer make a short narrated video and add it to a WaveMaker docs page (Docusaurus + MDX). The rules for where video files live and how they are embedded are in `AGENTS.md` (**Videos** and **Subtitles**). This skill covers the work before that: planning, script, voice, and the files to hand over.

Rendering uses the WaveMaker film kit (`wm-film-kit`) when it is available. If it is not, ask which tool to use. The rules below apply either way.

---

## Steps

Pause after steps 2, 3, and 5 and get the owner's approval before moving on.

1. **Brief.** Send one message with every open question: what the video shows, who it is for, how long it should be, whether it has music, and which page it goes on. Do not guess. Mark anything you assume.
2. **Script and facts.** Write the script and a facts table (`assets/video-script-template.md`). Each shot has one short voice-over line and at most 7 words on screen.
3. **Voice.** Make the whole narration in one take with one voice, and let the owner listen before you build the video.
4. **Build.** Make the shots from real screenshots, timed to the voice. Use the WaveMaker theme: the WaveMaker logo, the brand blue (`#1794EF`), and the Manrope font.
5. **Review.** Run the checks below, produce the files, and share them with the owner.

When the owner asks for changes, change only what they name and run the checks again.

## Script

- The voice explains. It does not read out what is already on screen.
- Aim for about 2.5 spoken words per second. Short sentences work best.
- Every claim has a source in the facts table: a file, a doc, or a test you ran on a deployed build. Mark it `verified` or `not verified`.
- If a claim is not verified, or depends on a change that is not released yet, tell the owner. Do not present it as fact in the voice-over.
- Use real screenshots of the product. Keep passwords, tokens, personal data, and customer names out of the frame.
- If you change a demo project to take a screenshot, put it back exactly as it was.

## Voice

- Generate the narration in one request, not line by line. Separate requests change the tone.
- Let the owner pick the speaker from a few short samples.
- Keep API keys in the environment. Never print or commit them.
- Check the result against the script. If a word is wrong or unclear, ask the owner to listen to that line.
- Set the loudness to about -14 LUFS.

## Files to deliver

For a video named `<name>`, next to its page (see `AGENTS.md` for the folder):

| File         | Rule                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `<name>.mp4` | H.264, 1080p, with audio, under 50 MB.                                                           |
| `<name>.vtt` | Subtitles from the script, timed to the real voice. Follow the rules in `AGENTS.md` → Subtitles. |
| `poster.jpg` | One frame that makes sense without sound.                                                        |

Tell the owner to review the `.vtt` before it merges. Embed the video as shown in `references/conventions.md`. If the user supplies an Academy link, use `<VideoCard>`. Never make up a link.

## Checks before sharing

- Nothing in the video is cut off, overlapping, or unreadable.
- Every claim matches the facts table, and open flags are reported.
- The spoken words match the script, and every line ends cleanly.
- The mp4 plays at 1080p, has the right length, and is under 50 MB.
- `npm run lint` and `npm run build` pass after the embed is added.

Finish by telling the owner what you changed, what you checked, and what you could not verify.

## Common problems

- **`ffmpeg` stalls in a background job.** Add `-nostdin`. If a combined video and audio encode stalls, encode the video alone, then add the audio with `-c copy`.
- **Frames take a lot of disk space.** Check free space before rendering and delete the frames after encoding.
- **Speech-to-text mishears product names.** Use it as a hint, not a verdict. Ask the owner to listen.

## Reference files

- Embed markup, subtitle format, and encode commands: `references/conventions.md`
- Script and facts table: `assets/video-script-template.md`
