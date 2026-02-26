import './style.css';
import {
  allGroups,
  convert,
  decodeState,
  encodeState,
  lookupChar,
  modeLabels,
  rovingIndex,
  summarizeChanges,
} from './lib';
import type { CharInfo, ChangeSummary, Mode } from './lib';
import {
  isThemePref,
  nextThemePref,
  resolveTheme,
  THEME_KEY,
  themeLabels,
  type ThemePref,
} from './theme';

const STORE_KEY = 'itaiji:text';
const MODE_KEY = 'itaiji:mode';

const SAMPLE_TEXT = [
  '昭和二十年代の新聞には、國家の經濟、藝術の價値、學問の發展といった舊字體の見出しが竝ぶ。',
  '當時の讀者にとって、これらの字は日常の文字であった。',
].join('\n');

/** ヒーローで字形の変化を見せるための、表示専用の旧→新ペア。 */
const MORPH_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['舊', '旧'],
  ['國', '国'],
  ['學', '学'],
  ['藝', '芸'],
  ['體', '体'],
  ['鐵', '鉄'],
  ['廣', '広'],
  ['樂', '楽'],
];

const icons = {
  logo: `<svg viewBox="0 0 64 64" class="logo" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="19" width="24" height="26" rx="5"/><path d="M10 27h14"/><path d="M10 33h14"/><path d="M10 39h10"/>
    </g>
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="35" y="19" width="24" height="26" rx="5"/><path d="M40 30h14"/><path d="M47 26v14"/>
    </g>
    <path d="M27 12c3-4 7-4 10 0" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
    <path d="M35 9.5l2.5 2.5-3.4 1.2z" fill="var(--accent)"/>
  </svg>`,
  arrow: `<svg class="morph-arrow" viewBox="0 0 36 18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h30"/><path d="M26 3l7 6-7 6"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5A8 8 0 1 1 10.5 4a6.4 6.4 0 0 0 9.5 9.5Z"/></svg>`,
  auto: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17" /><path d="M12 20.5a8.5 8.5 0 0 0 0-17" fill="currentColor" stroke="none"/></svg>`,
  github: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
  clear: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>`,
  sample: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v16l-7-3-7 3Z"/><path d="M9 9h6M9 12h6"/></svg>`,
  swap: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5 4 8l3 3"/><path d="M4 8h13a3 3 0 0 1 0 6h-1"/><path d="M17 19l3-3-3-3"/><path d="M20 16H7a3 3 0 0 1 0-6h1"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/></svg>`,
  link: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M8 11 6 13a3.5 3.5 0 0 0 5 5l2-2"/><path d="M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2"/></svg>`,
} as const;

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`${selector} が見つからない`);
  return el;
}

const app = mustFind<HTMLDivElement>('#app');
const MODES: Mode[] = ['to-shinjitai', 'to-kyujitai', 'normalize-variants'];

app.innerHTML = `
  <header class="site-header">
    <div class="shell">
      <a class="brand" href="https://github.com/miruky/itaiji" rel="noopener">
        ${icons.logo}<span class="wordmark">itaiji</span>
      </a>
      <div class="header-actions">
        <button type="button" id="theme-toggle" class="icon-btn theme-toggle"></button>
        <a class="icon-btn" href="https://github.com/miruky/itaiji" rel="noopener" aria-label="GitHubのソースコード">${icons.github}<span>Source</span></a>
      </div>
    </div>
  </header>

  <section class="hero">
    <div class="shell">
      <div class="hero-lede">
        <span class="kicker" data-reveal>旧字体 / 異体字</span>
        <h1 data-reveal>字形を<span class="turn">あらためる</span></h1>
        <p data-reveal>戦前の文書や戸籍の旧字体を現代の字体へ、題字には康熙字典体へ。髙・﨑・𠮷のような人名の異体字も、根拠の字典つきでその場でたどれる。すべてブラウザの中で完結する。</p>
      </div>
      <div class="hero-figures">
        <figure class="hero-photo" data-reveal>
          <img src="https://picsum.photos/seed/itaiji-katsuji/900/720" width="900" height="720"
            alt="活字を並べた組版の写真" loading="lazy" decoding="async" />
          <figcaption>活版・組版</figcaption>
        </figure>
        <div class="morph" data-reveal>
          <span class="glyph-old" id="morph-old">${MORPH_PAIRS[0]?.[0] ?? ''}</span>
          ${icons.arrow}
          <span class="glyph-new" id="morph-new">${MORPH_PAIRS[0]?.[1] ?? ''}</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="convert" aria-label="字体の変換">
    <div class="shell">
      <div class="section-head" data-reveal>
        <div class="head-text">
          <span class="kicker">変換</span>
          <h2>文章を貼って、字体を移す</h2>
        </div>
        <p class="head-note">変換した字には下線がつく。クリックすると下の字典でその字のグループへ飛べる。</p>
      </div>
      <div class="modes" role="tablist" aria-label="変換の向き" id="modes" data-reveal></div>
      <div class="editor" data-reveal>
        <div class="col input">
          <div class="col-bar">
            <span class="col-label">入力</span>
            <button type="button" class="txt-btn" id="btn-sample">${icons.sample}<span>例文</span></button>
            <button type="button" class="txt-btn" id="btn-clear">${icons.clear}<span>消去</span></button>
          </div>
          <textarea id="input" spellcheck="false" aria-label="変換する文章"
            placeholder="ここに文章を貼り付けると、その場で変換されます。"></textarea>
        </div>
        <div class="col output">
          <div class="col-bar">
            <span class="col-label">出力</span>
            <button type="button" class="txt-btn" id="btn-share">${icons.link}<span>リンク</span></button>
            <button type="button" class="txt-btn" id="btn-swap">${icons.swap}<span>入力へ</span></button>
            <button type="button" class="txt-btn is-accent" id="btn-copy">${icons.copy}<span>コピー</span></button>
          </div>
          <div class="result" id="output" aria-live="polite"></div>
        </div>
      </div>
      <div class="stats" id="stats" aria-live="polite"></div>
      <ul class="changes" id="changes" aria-label="変換した字の一覧" hidden></ul>
    </div>
  </section>

  <section class="section" id="dict" aria-label="字典">
    <div class="shell">
      <div class="section-head" data-reveal>
        <div class="head-text">
          <span class="kicker">字典</span>
          <h2>対応表を引く</h2>
        </div>
        <div class="dict-search-wrap">
          ${icons.search}
          <input id="dict-search" type="search" aria-label="字典を検索"
            placeholder="調べたい字(例 學・髙)" maxlength="6" />
        </div>
      </div>
      <div class="dict-detail" id="dict-detail" hidden></div>
      <ul class="dict-grid" id="dict-grid" data-reveal></ul>
      <p class="dict-empty" id="dict-empty" hidden></p>
    </div>
  </section>

  <footer class="site-footer">
    <div class="shell">
      <p>変換はすべてこのページの中で行われ、文章はどこにも送られない。固有名詞の字体は本人の表記が正であり、機械的な正規化は下書きの確認に使う。</p>
      <span class="colophon">itaiji — MIT License</span>
    </div>
  </footer>
`;

const textarea = mustFind<HTMLTextAreaElement>('#input');
const output = mustFind<HTMLDivElement>('#output');
const modesBox = mustFind<HTMLDivElement>('#modes');
const statsBar = mustFind<HTMLDivElement>('#stats');
const changesBox = mustFind<HTMLUListElement>('#changes');
const dictSearch = mustFind<HTMLInputElement>('#dict-search');
const dictDetail = mustFind<HTMLDivElement>('#dict-detail');
const dictGrid = mustFind<HTMLUListElement>('#dict-grid');
const dictEmpty = mustFind<HTMLParagraphElement>('#dict-empty');
const btnSample = mustFind<HTMLButtonElement>('#btn-sample');
const btnClear = mustFind<HTMLButtonElement>('#btn-clear');
const btnSwap = mustFind<HTMLButtonElement>('#btn-swap');
const btnCopy = mustFind<HTMLButtonElement>('#btn-copy');
const btnShare = mustFind<HTMLButtonElement>('#btn-share');
const themeToggle = mustFind<HTMLButtonElement>('#theme-toggle');

let mode: Mode = 'to-shinjitai';
let convertedText = '';
let themePref: ThemePref = 'auto';
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const GROUPS = allGroups();

/* ---- テーマ ---- */

const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(): void {
  const resolved = resolveTheme(themePref, themeMedia.matches);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  themeToggle.innerHTML =
    themePref === 'auto' ? icons.auto : resolved === 'dark' ? icons.moon : icons.sun;
  themeToggle.setAttribute('aria-label', `テーマ: ${themeLabels[themePref]}。クリックで切り替え`);
  themeToggle.title = `テーマ: ${themeLabels[themePref]}`;
}

themeToggle.addEventListener('click', () => {
  themePref = nextThemePref(themePref);
  try {
    localStorage.setItem(THEME_KEY, themePref);
  } catch {
    // 保存できなくても切り替えは効く
  }
  applyTheme();
});

themeMedia.addEventListener('change', () => {
  if (themePref === 'auto') applyTheme();
});

/* ---- 変換 ---- */

function selectMode(m: Mode): void {
  mode = m;
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {
    // 保存できなくても動作は続ける
  }
  renderModes();
  renderResult();
  syncUrl();
}

function renderModes(): void {
  modesBox.textContent = '';
  MODES.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode';
    btn.setAttribute('role', 'tab');
    const selected = mode === m;
    btn.setAttribute('aria-selected', String(selected));
    // ロービングtabindex: 選択中のタブだけをタブ順に置き、矢印で移動する
    btn.tabIndex = selected ? 0 : -1;
    btn.textContent = modeLabels[m];
    btn.addEventListener('click', () => selectMode(m));
    btn.addEventListener('keydown', (e) => {
      const next = rovingIndex(i, MODES.length, e.key);
      if (next === null) return;
      e.preventDefault();
      const target = MODES[next];
      if (!target) return;
      selectMode(target);
      (modesBox.children[next] as HTMLElement | undefined)?.focus();
    });
    modesBox.append(btn);
  });
}

function renderResult(): void {
  const result = convert(textarea.value, mode);
  convertedText = result.text;
  output.textContent = '';

  if (textarea.value.trim() === '') {
    const ph = document.createElement('p');
    ph.className = 'placeholder';
    ph.textContent = '左に文章を入力すると、ここに結果が出る。';
    output.append(ph);
  } else {
    for (const seg of result.segments) {
      if (seg.from === undefined) {
        output.append(document.createTextNode(seg.text));
      } else {
        const mark = document.createElement('mark');
        mark.textContent = seg.text;
        mark.title = `元の字: ${seg.from}`;
        mark.tabIndex = 0;
        mark.setAttribute('role', 'button');
        mark.setAttribute('aria-label', `${seg.from}を${seg.text}に変換。字典で確認`);
        const open = () => showDetail(lookupChar(seg.text) ?? lookupChar(seg.from ?? ''));
        mark.addEventListener('click', open);
        mark.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
        output.append(mark);
      }
    }
  }

  const chars = [...textarea.value.replace(/\s/g, '')].length;
  statsBar.innerHTML = `<span><b>${chars}</b> 字</span><span>変換 <b>${result.changed}</b> 字</span>`;
  renderChanges(summarizeChanges(result));
  btnCopy.disabled = convertedText === '';
  btnShare.disabled = textarea.value.trim() === '';
  btnSwap.disabled = convertedText === '' || convertedText === textarea.value;
}

function renderChanges(summary: ChangeSummary[]): void {
  changesBox.textContent = '';
  if (summary.length === 0) {
    changesBox.hidden = true;
    return;
  }
  changesBox.hidden = false;
  for (const c of summary) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'change-chip';
    btn.setAttribute(
      'aria-label',
      `${c.from}を${c.to}に変換${c.count > 1 ? `(${c.count}回)` : ''}。字典で確認`,
    );
    const from = document.createElement('span');
    from.className = 'chip-from';
    from.textContent = c.from;
    const to = document.createElement('span');
    to.className = 'chip-to';
    to.textContent = c.to;
    btn.append(from, to);
    if (c.count > 1) {
      const n = document.createElement('span');
      n.className = 'chip-count';
      n.textContent = String(c.count);
      btn.append(n);
    }
    btn.addEventListener('click', () => showDetail(lookupChar(c.to) ?? lookupChar(c.from)));
    li.append(btn);
    changesBox.append(li);
  }
}

function showDetail(info: CharInfo | undefined): void {
  if (!info) {
    dictDetail.hidden = true;
    return;
  }
  dictDetail.hidden = false;
  dictDetail.textContent = '';

  const chips = document.createElement('div');
  chips.className = 'group-chars';
  info.group.forEach((ch, i) => {
    const chip = document.createElement('span');
    chip.className = `glyph${i === 0 ? ' canonical' : ''}`;
    chip.textContent = ch;
    chips.append(chip);
  });

  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  const kind = document.createElement('span');
  kind.className = 'badge';
  kind.textContent = info.kind === 'kyujitai' ? '新旧字体' : '人名異体字';
  const copyGlyph = document.createElement('button');
  copyGlyph.type = 'button';
  copyGlyph.className = 'copy-glyph';
  copyGlyph.textContent = 'グループをコピー';
  copyGlyph.addEventListener('click', () => {
    void navigator.clipboard?.writeText(info.group.join('・')).then(() => {
      copyGlyph.textContent = 'コピーした';
      setTimeout(() => (copyGlyph.textContent = 'グループをコピー'), 1400);
    });
  });
  meta.append(kind, copyGlyph);

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = info.note ?? '先頭が新字体。残りは旧字体で、戦前の印刷物などで使われた字形。';

  dictDetail.append(chips, meta, note);
  // 切り替えのたびに入場アニメを焚き直す(reduced-motion時はCSSで無効)
  dictDetail.classList.remove('is-in');
  void dictDetail.offsetWidth;
  dictDetail.classList.add('is-in');
  dictDetail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderDict(): void {
  const q = dictSearch.value.trim();
  const filtered =
    q === '' ? GROUPS : GROUPS.filter((g) => [...q].some((ch) => g.group.includes(ch)));
  dictGrid.textContent = '';

  for (const g of filtered) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dict-item kind-${g.kind}`;
    const lead = document.createElement('span');
    lead.className = 'lead';
    lead.textContent = g.group[0] ?? '';
    btn.append(lead, document.createTextNode(' ' + g.group.slice(1).join(' ')));
    btn.addEventListener('click', () => showDetail(lookupChar(g.group[0] ?? '')));
    li.append(btn);
    dictGrid.append(li);
  }

  const empty = filtered.length === 0;
  dictGrid.hidden = empty;
  dictEmpty.hidden = !empty;
  if (empty) dictEmpty.textContent = `「${q}」は字典にない。新字体・旧字体のどちらでも引ける。`;
}

function persist(): void {
  try {
    localStorage.setItem(STORE_KEY, textarea.value);
  } catch {
    // 保存できなくても動作は続ける
  }
}

/** 現在のモードと本文をURLのハッシュへ反映し、そのまま共有・再読込できるようにする。 */
function syncUrl(): void {
  const hash = encodeState({ mode, text: textarea.value });
  history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`);
}

/* ---- イベント ---- */

textarea.addEventListener('input', () => {
  persist();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    renderResult();
    syncUrl();
  }, 140);
});

dictSearch.addEventListener('input', () => {
  renderDict();
  const first = [...dictSearch.value.trim()][0];
  if (first) showDetail(lookupChar(first));
});

dictSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dictSearch.value !== '') {
    e.stopPropagation();
    dictSearch.value = '';
    renderDict();
    dictDetail.hidden = true;
  }
});

btnSample.addEventListener('click', () => {
  textarea.value = SAMPLE_TEXT;
  persist();
  renderResult();
  syncUrl();
});

btnClear.addEventListener('click', () => {
  textarea.value = '';
  persist();
  renderResult();
  syncUrl();
  textarea.focus();
});

btnSwap.addEventListener('click', () => {
  if (convertedText === '') return;
  textarea.value = convertedText;
  persist();
  renderResult();
  syncUrl();
});

btnCopy.addEventListener('click', () => {
  if (convertedText === '') return;
  void navigator.clipboard?.writeText(convertedText).then(() => {
    const label = btnCopy.querySelector('span');
    if (!label) return;
    label.textContent = 'コピーした';
    setTimeout(() => (label.textContent = 'コピー'), 1500);
  });
});

btnShare.addEventListener('click', () => {
  syncUrl();
  void navigator.clipboard?.writeText(location.href).then(() => {
    const label = btnShare.querySelector('span');
    if (!label) return;
    label.textContent = 'コピーした';
    setTimeout(() => (label.textContent = 'リンク'), 1500);
  });
});

// 「/」で字典検索へ移動する(入力中のフィールドにいるときは素通り)
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  e.preventDefault();
  dictSearch.focus();
});

/* ---- 初期化 ---- */

try {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (isThemePref(storedTheme)) themePref = storedTheme;
  const storedMode = localStorage.getItem(MODE_KEY);
  if (
    storedMode === 'to-kyujitai' ||
    storedMode === 'to-shinjitai' ||
    storedMode === 'normalize-variants'
  ) {
    mode = storedMode;
  }
  textarea.value = localStorage.getItem(STORE_KEY) ?? SAMPLE_TEXT;
} catch {
  textarea.value = SAMPLE_TEXT;
}

// 共有リンク(URLのハッシュ)があれば、保存済みの状態より優先する
const shared = decodeState(location.hash);
if (shared.mode) mode = shared.mode;
if (shared.text !== undefined) textarea.value = shared.text;

window.addEventListener('hashchange', () => {
  const next = decodeState(location.hash);
  if (next.mode) mode = next.mode;
  if (next.text !== undefined) textarea.value = next.text;
  persist();
  renderModes();
  renderResult();
});

applyTheme();
renderModes();
renderResult();
renderDict();

/* ---- モーション ---- */

void initMotion();

async function initMotion(): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  document.documentElement.classList.add('anim-ready');

  // ヒーローの入場
  const heroTargets = document.querySelectorAll('.hero [data-reveal]');
  gsap.to(heroTargets, {
    opacity: 1,
    y: 0,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.09,
    delay: 0.05,
  });

  // 下のセクションはスクロールで出す
  document.querySelectorAll('.section [data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // 字形の移り変わりをループで見せる
  const oldEl = document.getElementById('morph-old');
  const newEl = document.getElementById('morph-new');
  if (oldEl && newEl && MORPH_PAIRS.length > 1) {
    let i = 0;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.1 });
    tl.to([oldEl, newEl], {
      opacity: 0,
      y: -8,
      duration: 0.4,
      ease: 'power2.in',
      delay: 2.1,
      onComplete: () => {
        i = (i + 1) % MORPH_PAIRS.length;
        const pair = MORPH_PAIRS[i];
        if (pair) {
          oldEl.textContent = pair[0];
          newEl.textContent = pair[1];
        }
      },
    }).fromTo(
      [oldEl, newEl],
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
    );
  }
}
