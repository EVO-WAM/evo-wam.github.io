# EVO-WAM project website

**EVO-WAM: Evolving World Action Models through Video-Action Verification**

Static HTML, CSS, and JavaScript for the EVO-WAM research homepage.

## Preview locally

```sh
node serve.mjs
```

Open http://127.0.0.1:4173/. This server supports byte ranges for video seeking. A local HTTP server is needed for the task browser and captions.

## Content

- `index.html`: manuscript metadata, authors, method, and results.
- `cases.json`: six case studies, video paths, policy rounds, and comparison notes.
- `site.js`: task selection, paired playback, chapters, method exploration, and background motion.
- `styles.css`: responsive page styles, including reduced-motion support.
- `assets/paper.pdf`: compiled manuscript, including the current author contact details.
- `assets/videos/`: recorded execution clips, generated candidate clips, narrated overview, and a lightweight hero loop. The 2026-09-29 overview revision changes one narration sentence to “Visual voting rejects this candidate,” with synchronized on-screen and WebVTT captions.
- `assets/images/`: posters, paper framework figure, social preview, and Cosmos3 R0–R4 teaser plots from paper Table 3.
- `assets/verification/`: visual evidence frames and IDM mean-error plots from the demo candidates.
- `assets/fonts/`: locally served Sora and Manrope, with their licenses.
- `demo-cover.html`: editable 1280 × 720 cover layout using three frames from the existing real-robot clips; its rendered JPEG is used as the overview poster.
- `assets/icons.svg`: selected Lucide 1.8.0 icons; the ISC license is included in `assets/LUCIDE-LICENSE.txt`. The header uses the project name as a plain wordmark.

The arXiv and method-code links are marked “Coming soon” until their URLs are available. Author homepage links can be added once verified. Citation content is omitted until the arXiv reference is available.

Contact: Shiyang Zhou, `shiyangzhou@stu.hit.edu.cn`. Corresponding author: Zhuotao Tian, `tianzhuotao@hit.edu.cn`. Both emails link to `mailto:` addresses on the website and in the manuscript; the manuscript places Contact below Project Page.

## Method explorer

Imagine shows the four duck-placement candidates in the same order as the narrated demo. Verify keeps those Candidate 1–4 identities: missed blue-duck placement, object inconsistency, action mismatch, and the retained candidate. Small frames show both subgoals. Candidate 3 distinguishes its accepted initial visual scan from final endpoint votes, which were not run after IDM rejection.

Only Candidates 3 and 4 show IDM results. Their mean reconstruction errors are 0.008226 (Fail) and 0.006650 (Pass), against the fixed threshold 0.008111. Plots average squared differences across all action dimensions and accumulated scored actions. No dimension selector is shown. Demo frame-review explanations are labeled separately from recorded endpoint votes. Shared backgrounds connect each visual check with its action check, including on mobile. Improve shows the learning step and a recorded physical execution.

## Hosting

This site is compatible with GitHub Pages from the root directory. `.nojekyll` disables Jekyll processing. No build tool, external JavaScript dependency, analytics, or third-party media service is required.
