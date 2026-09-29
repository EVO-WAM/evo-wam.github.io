'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${name}"></use></svg>`;
const status = $('#playback-status');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = $('#hero-video');
const motionButton = $('#motion-toggle');
let motionWanted = !reduceMotion.matches && innerWidth > 760 && !navigator.connection?.saveData;
let heroVisible = true;

async function playVideo(video) {
  try { await video.play(); return true; }
  catch (error) {
    if (error.name !== 'AbortError') status.textContent = 'Playback could not start. Use the video controls or download the clip.';
    return false;
  }
}

function metadata(video) {
  if (video.readyState >= 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timer;
    const cleanup = () => { clearTimeout(timer); video.removeEventListener('loadedmetadata', loaded); video.removeEventListener('error', failed); };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('Video could not be loaded.')); };
    video.addEventListener('loadedmetadata', loaded);
    video.addEventListener('error', failed);
    timer = setTimeout(failed, 20000);
    // Explicit user controls may request metadata for a video with preload="none".
    // Calling load() alone can leave such a video suspended without metadata.
    if (video.preload === 'none') { video.preload = 'metadata'; video.load(); }
    else if (video.networkState === HTMLMediaElement.NETWORK_EMPTY || video.networkState === HTMLMediaElement.NETWORK_IDLE) video.load();
  });
}

function updateMotionLabel() {
  const playing = motionWanted && !hero.paused;
  motionButton.innerHTML = `${playing ? 'Pause' : 'Play'} background ${icon(playing ? 'pause' : 'play')}`;
}
async function setMotion(wanted) {
  motionWanted = wanted;
  if (wanted && heroVisible && !document.hidden) {
    if (!hero.src) hero.src = hero.dataset.src;
    const played = await playVideo(hero);
    if (!played) motionWanted = false;
  } else hero.pause();
  updateMotionLabel();
}
motionButton.hidden = false;
updateMotionLabel();
motionButton.addEventListener('click', () => setMotion(!motionWanted));
reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) setMotion(false); });
hero.addEventListener('pause', updateMotionLabel);
hero.addEventListener('play', updateMotionLabel);

const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.target === hero) {
      heroVisible = entry.isIntersecting;
      if (!heroVisible) hero.pause();
      else if (motionWanted) setMotion(true);
    } else if (!entry.isIntersecting) entry.target.pause();
  });
}, { threshold: 0.05 });
function observeVideos(context = document) { $$('video', context).forEach(video => videoObserver.observe(video)); }
observeVideos();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) $$('video').forEach(video => video.pause());
  else if (motionWanted) setMotion(true);
});

const before = $('#before-video');
const after = $('#after-video');
const pair = [before, after];
const pairPlay = $('#pair-play');
let pairAction = 0;
function updatePairLabel() {
  const playing = pair.some(video => !video.paused && !video.ended);
  pairPlay.innerHTML = `${icon(playing ? 'pause' : 'play')} ${playing ? 'Pause' : 'Play'} both`;
}
pair.forEach(video => ['play', 'pause', 'ended', 'emptied'].forEach(event => video.addEventListener(event, updatePairLabel)));
pairPlay.addEventListener('click', async () => {
  const action = ++pairAction;
  if (pair.some(video => !video.paused && !video.ended)) { pair.forEach(video => video.pause()); return; }
  pairPlay.disabled = true;
  try {
    await Promise.all(pair.map(metadata));
    if (action !== pairAction) return;
    if (pair.some(video => video.ended)) pair.forEach(video => { video.currentTime = 0; });
    await Promise.all(pair.map(playVideo));
  } catch { status.textContent = 'The comparison could not load. Try each video’s controls or download the clips.'; }
  finally { pairPlay.disabled = false; updatePairLabel(); }
});
$('#pair-reset').addEventListener('click', () => { ++pairAction; pair.forEach(video => { video.pause(); if (video.readyState) video.currentTime = 0; }); });

let caseData = [];
let activeCase = 'real-ducks';
function selectCase(data) {
  ++pairAction;
  activeCase = data.id;
  $('#case-title').textContent = data.title;
  $('#case-note').textContent = data.note;
  pair.forEach((video, i) => {
    video.pause();
    video.poster = data.clips[i].poster;
    video.src = data.clips[i].src;
    video.setAttribute('aria-label', `${data.title} ${i ? 'updated' : 'earlier'} policy execution`);
    $(`#${i ? 'after' : 'before'}-round`).textContent = data.clips[i].round;
    $(`#${i ? 'after' : 'before'}-download`).href = data.clips[i].src;
  });
  $$('#task-tabs button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.case === data.id)));
  updatePairLabel();
}
function selectGroup(group, initial = false) {
  $$('.environment-tabs button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.group === group)));
  const tasks = caseData.filter(data => data.group === group);
  $('#task-tabs').replaceChildren(...tasks.map(data => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = data.title; button.dataset.case = data.id;
    button.setAttribute('aria-pressed', String(data.id === activeCase));
    button.addEventListener('click', () => selectCase(data));
    return button;
  }));
  if (!initial) selectCase(tasks[0]);
}
fetch('cases.json').then(response => {
  if (!response.ok) throw new Error('Case data unavailable');
  return response.json();
}).then(data => {
  caseData = data;
  selectGroup('real', true);
  $$('.environment-tabs button').forEach(button => button.addEventListener('click', () => selectGroup(button.dataset.group)));
}).catch(() => {
  $$('.environment-tabs button').forEach(button => { button.disabled = true; });
  $('#task-tabs').textContent = 'The task list could not load. The duck-placement comparison remains available below.';
});

const overview = $('#overview-video');
const demoCoverButton = $('#demo-cover-play');
demoCoverButton.hidden = false;
overview.controls = false;
demoCoverButton.addEventListener('click', async () => {
  const playing = await playVideo(overview);
  if (!playing) demoCoverButton.hidden = false;
});
overview.addEventListener('play', () => { demoCoverButton.hidden = true; overview.controls = true; });
const chapters = $$('.chapters button');
let chapterAction = 0;
chapters.forEach(button => button.addEventListener('click', async () => {
  const action = ++chapterAction;
  $$('video').filter(video => video !== overview && video !== hero).forEach(video => video.pause());
  try {
    await metadata(overview);
    if (action !== chapterAction) return;
    overview.currentTime = Number(button.dataset.time);
    await playVideo(overview);
  } catch { status.textContent = 'The overview could not load. Please use the video player controls.'; }
}));
overview.addEventListener('timeupdate', () => {
  const current = chapters.filter(button => Number(button.dataset.time) <= overview.currentTime).at(-1);
  chapters.forEach(button => { button.classList.toggle('active', button === current); button.setAttribute('aria-pressed', String(button === current)); });
});

function selectMethod(step) {
  $$('.method-steps button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.step === step)));
  $$('[data-method-panel]').forEach(panel => {
    const active = panel.dataset.methodPanel === step;
    if (!active) $$('video', panel).forEach(video => video.pause());
    panel.hidden = !active;
  });
}
$$('.method-steps button').forEach(button => button.addEventListener('click', () => selectMethod(button.dataset.step)));
