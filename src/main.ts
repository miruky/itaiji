import './style.css';
import { allGroups, convert, lookupChar, modeLabels } from './lib';
import type { CharInfo, Mode } from './lib';

const STORE_KEY = 'itaiji:text';
const MODE_KEY = 'itaiji:mode';

const SAMPLE_TEXT = [
  '昭和二十年代の新聞には、國家の經濟、藝術の價値、學問の發展といった舊字體の見出しが竝ぶ。',
  '當時の讀者にとって、これらの字は日常の文字であった。',
].join('\n');

const LOGO_SVG = `<svg viewBox="0 0 64 64" role="img" aria-label="itaijiのロゴ" class="logo">
  <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="19" width="24" height="26" rx="5"/>
    <path d="M10 27h14"/><path d="M10 33h14"/><path d="M10 39h10"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="35" y="19" width="24" height="26" rx="5"/>
    <path d="M40 30h14"/><path d="M47 26v14"/>
  </g>
  <path d="M27 12c3-4 7-4 10 0" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
  <path d="M35 10l2 2-2.6 1.4z" fill="var(--accent)"/>
</svg>`;

const MODES: Mode[] = ['to-shinjitai', 'to-kyujitai', 'normalize-variants'];

function mustFind<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`${selector} が見つからない`);
  return el;
}

const app = mustFind<HTMLDivElement>('#app');

app.innerHTML = `
  <header class="site-header">
    <div class="brand">
      ${LOGO_SVG}
      <div>
        <h1>itaiji</h1>
        <p class="tagline">旧字体と新字体、人名異体字を相互に変換する字体ツール</p>
      </div>
    </div>
    <a class="repo-link" href="https://github.com/miruky/itaiji" rel="noopener">GitHub</a>
  </header>
  <main class="layout">
    <section class="pane" aria-label="本文の入力">
      <div class="toolbar">
        <button type="button" id="btn-sample">サンプル文</button>
        <button type="button" id="btn-clear">クリア</button>
        <span class="spacer"></span>
        <button type="button" id="btn-swap">出力を入力へ</button>
      </div>
      <textarea id="input" spellcheck="false" aria-label="変換する文章"
        placeholder="ここに文章を貼り付けると、その場で変換されます。"></textarea>
      <div class="statusbar" id="stats" aria-live="polite"></div>
    </section>
    <section class="pane" aria-label="変換結果">
      <div class="toolbar">
        <div class="tabs" role="tablist" aria-label="変換の向き" id="tabs"></div>
        <span class="spacer"></span>
        <button type="button" id="btn-copy" class="primary">コピー</button>
      </div>
      <div class="output" id="output" aria-live="polite"></div>
    </section>
  </main>
  <section class="pane dict-pane" aria-label="字典">
    <div class="toolbar">
      <h2 class="dict-title">字典</h2>
      <input id="dict-search" type="search" aria-label="字典を検索"
        placeholder="調べたい字(例: 學・髙)" maxlength="4" />
      <span class="spacer"></span>
      <span class="dict-count" id="dict-count"></span>
    </div>
    <div class="dict-detail" id="dict-detail" hidden></div>
    <ul class="dict-grid" id="dict-grid"></ul>
  </section>
  <footer class="site-footer">
    <p>変換はすべてこのページの中で行われる。固有名詞の字体は本人の表記が正であり、機械的な正規化は下書きの確認用に使う。MIT License</p>
  </footer>
`;

const textarea = mustFind<HTMLTextAreaElement>('#input');
const output = mustFind<HTMLDivElement>('#output');
const tabsBox = mustFind<HTMLDivElement>('#tabs');
const statsBar = mustFind<HTMLDivElement>('#stats');
const dictSearch = mustFind<HTMLInputElement>('#dict-search');
const dictDetail = mustFind<HTMLDivElement>('#dict-detail');
const dictGrid = mustFind<HTMLUListElement>('#dict-grid');
const dictCount = mustFind<HTMLSpanElement>('#dict-count');
const btnSample = mustFind<HTMLButtonElement>('#btn-sample');
const btnClear = mustFind<HTMLButtonElement>('#btn-clear');
const btnSwap = mustFind<HTMLButtonElement>('#btn-swap');
const btnCopy = mustFind<HTMLButtonElement>('#btn-copy');

let mode: Mode = 'to-shinjitai';
let convertedText = '';
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const GROUPS = allGroups();

function renderTabs(): void {
  tabsBox.textContent = '';
  for (const m of MODES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tab${mode === m ? ' active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(mode === m));
    btn.textContent = modeLabels[m];
    btn.addEventListener('click', () => {
      mode = m;
      try {
        localStorage.setItem(MODE_KEY, m);
      } catch {
        // 保存できなくても動作は続ける
      }
      renderTabs();
      renderResult();
    });
    tabsBox.append(btn);
  }
}

function renderResult(): void {
  const result = convert(textarea.value, mode);
  convertedText = result.text;
  output.textContent = '';

  if (textarea.value.trim() === '') {
    output.innerHTML = `<p class="placeholder">左に文章を入力すると、ここに結果が出る。</p>`;
  } else {
    const box = document.createElement('div');
    box.className = 'result-text';
    for (const seg of result.segments) {
      if (seg.from === undefined) {
        box.append(document.createTextNode(seg.text));
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
        box.append(mark);
      }
    }
    output.append(box);
  }

  const chars = [...textarea.value.replace(/\s/g, '')].length;
  statsBar.innerHTML = [`<span>${chars}字</span>`, `<span>変換${result.changed}字</span>`].join('');
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
  const kind = document.createElement('span');
  kind.className = 'badge';
  kind.textContent = info.kind === 'kyujitai' ? '新旧字体' : '人名異体字';
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = info.note ?? `先頭が新字体。残りは旧字体で、戦前の印刷物などで使われた字形`;
  dictDetail.append(chips, kind, note);
  dictDetail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderDict(): void {
  const q = dictSearch.value.trim();
  const filtered =
    q === '' ? GROUPS : GROUPS.filter((g) => [...q].some((ch) => g.group.includes(ch)));
  dictGrid.textContent = '';
  filtered.forEach((g, idx) => {
    const li = document.createElement('li');
    li.style.setProperty('--d', `${Math.min(idx, 12) * 12}ms`);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dict-item kind-${g.kind}`;
    btn.textContent = g.group.join(' ');
    btn.addEventListener('click', () => {
      const first = g.group[0] ?? '';
      showDetail(lookupChar(first));
    });
    li.append(btn);
    dictGrid.append(li);
  });
  dictCount.textContent = `${filtered.length}グループ`;
}

function persist(): void {
  try {
    localStorage.setItem(STORE_KEY, textarea.value);
  } catch {
    // 保存できなくても動作は続ける
  }
}

textarea.addEventListener('input', () => {
  persist();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(renderResult, 150);
});

dictSearch.addEventListener('input', () => {
  renderDict();
  const first = [...dictSearch.value.trim()][0];
  if (first) showDetail(lookupChar(first));
});

btnSample.addEventListener('click', () => {
  textarea.value = SAMPLE_TEXT;
  persist();
  renderResult();
});

btnClear.addEventListener('click', () => {
  textarea.value = '';
  persist();
  renderResult();
  textarea.focus();
});

btnSwap.addEventListener('click', () => {
  if (convertedText === '') return;
  textarea.value = convertedText;
  persist();
  renderResult();
});

btnCopy.addEventListener('click', () => {
  void navigator.clipboard.writeText(convertedText).then(() => {
    btnCopy.textContent = 'コピーした';
    setTimeout(() => {
      btnCopy.textContent = 'コピー';
    }, 1500);
  });
});

try {
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

renderTabs();
renderResult();
renderDict();
