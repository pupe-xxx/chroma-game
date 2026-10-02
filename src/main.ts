// 入口。共通部分（kit）・ルール（game）・画面（ui）をつなぐ。
import './ui/style.css';
import { colorSimilarityDetail, mixPaint, toHex, type Amounts, type Pigment, type Rgb, type SimilarityDetail } from './game/color';
import { createDeck } from './game/deck';
import { clearGrid, createGrid, judgeZones, paintAt, restore, sampleAt, snapshot } from './game/paint';
import { PATTERNS, type Pattern } from './game/patterns';
import { loadPlatform } from './kit/platform';
import { createRng } from './kit/rng';
import { createSave } from './kit/save';
import { fitCanvas } from './kit/scale';
import { CELL, clearPreview, createPaintLayer, draw, drawPreview, GRID, VIEW } from './ui/render';

const HISTORY_MAX = 10;
const MAX_CUSTOM = 15;
/** 筆を動かした時、これより近い位置には塗り足さない（論理サイズ） */
const MIN_DRAG_DIST = 10;
const HINT_PAINT = '絵の具を選んでタップ＆ドラッグ（Ctrl+Z でアンドゥ）';

type Mode = 'paint' | 'eyedrop' | 'customEyedrop';

/** 塗る面から吸い取って作った色 */
interface CustomColor {
  ryb: Amounts;
  rgb: Rgb;
}

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const pure = (pigment: Pigment): Amounts => ({ red: 0, yellow: 0, blue: 0, white: 0, black: 0, [pigment]: 1 });

const emojiFor = (score: number) => (score >= 95 ? '🎯' : score >= 80 ? '👍' : score >= 65 ? '😊' : score >= 45 ? '🤔' : '💪');

async function start(): Promise<void> {
  const stage = byId('stage');
  const canvas = byId<HTMLCanvasElement>('game');
  const ctx = canvas.getContext('2d')!;
  const targetCanvas = byId<HTMLCanvasElement>('targetCanvas');
  const mixCanvas = byId<HTMLCanvasElement>('mixCanvas');
  const mixLabel = byId('mixLabel');
  const judgeBtn = byId('judgeBtn');
  const nextBtn = byId('nextBtn');
  const clearBtn = byId('clearBtn');
  const eyedropBtn = byId('eyedropBtn');
  const customEyedropBtn = byId('customEyedropBtn');
  const pendingBar = byId('pendingBar');
  const pendingPreview = byId('pendingPreview');
  const discardPendingBtn = byId('discardPendingBtn');
  const simEl = byId('similarity');
  const detailEl = byId('simDetail');
  const detailL = byId('detailL');
  const detailC = byId('detailC');
  const colorNameEl = byId('colorName');
  const guideChk = byId<HTMLInputElement>('guideMode');
  const hintEl = byId('hint');
  const customSlots = byId('customSlots');
  const blobs = Array.from(document.querySelectorAll<HTMLButtonElement>('.blob'));

  const platform = await loadPlatform();
  await platform.init();

  const deck = createDeck(PATTERNS.length, createRng());
  const save = createSave('chroma.v1', { custom: [] as CustomColor[], guide: false });
  const record = save.load();
  const customPalette = record.custom;

  const grid = createGrid(GRID.cols, GRID.rows);
  const layer = createPaintLayer();
  const undoStack: Float32Array[] = [];

  let pattern: Pattern = PATTERNS[deck.next()];
  let target: Rgb = mixPaint(pattern.zones[0].recipe);
  let brush: Amounts | null = null;
  let selectedCustomIdx = -1;
  let mode: Mode = 'paint';
  let sampledColor: Rgb | null = null; // 判定に出す「あなたの色」
  let pendingCustom: CustomColor | null = null; // カスタムが満杯の時に、入れ替え先を待っている色
  let isDrawing = false;
  let lastPos: { x: number; y: number } | null = null;
  let guideMode = record.guide;
  let judged = false;
  let dragSrcIdx = -1;

  const redraw = () => draw(ctx, layer, pattern, guideMode);
  const fit = fitCanvas(canvas, VIEW, redraw);

  const persist = () => {
    record.guide = guideMode;
    save.save(record);
  };

  // ── 近さの表示 ──
  const showSim = (d: SimilarityDetail) => {
    simEl.textContent = `${emojiFor(d.overall)} ${d.overall}%`;
    simEl.classList.add('visible');
    colorNameEl.textContent = `「${pattern.name}」`;
    colorNameEl.classList.add('visible');
    detailL.textContent = `${d.lightness}%`;
    detailC.textContent = `${d.chroma}%`;
    detailEl.classList.add('visible');
  };

  const hideSim = () => {
    simEl.classList.remove('visible');
    colorNameEl.classList.remove('visible');
    detailEl.classList.remove('visible');
    detailL.textContent = '—';
    detailC.textContent = '—';
  };

  const setAnswer = (color: Rgb | null) => {
    sampledColor = color;
    if (!color) {
      clearPreview(mixCanvas, pattern.zones);
      return;
    }
    drawPreview(mixCanvas, pattern.zones, [color]);
    if (guideMode) showSim(colorSimilarityDetail(target, color));
  };

  // ── モード切替 ──
  const setMode = (m: Mode) => {
    mode = m;
    eyedropBtn.classList.toggle('active', m === 'eyedrop');
    customEyedropBtn.classList.toggle('active', m === 'customEyedrop');
    stage.classList.toggle('eyedrop-mode', m !== 'paint');

    if (m === 'eyedrop') {
      hintEl.textContent = '「あなたの色」にしたい場所をクリック、またはカスタムスロットをクリック';
      hintEl.classList.add('eyedrop-mode');
    } else if (m === 'customEyedrop') {
      hintEl.textContent = 'カスタムに追加したい色の場所をクリック';
      hintEl.classList.add('eyedrop-mode');
    } else if (!pendingCustom) {
      hintEl.textContent = HINT_PAINT;
      hintEl.classList.remove('eyedrop-mode');
    }
  };

  const clearSelection = () => {
    brush = null;
    selectedCustomIdx = -1;
    blobs.forEach((b) => b.classList.remove('selected'));
  };

  // ── カスタムパレット ──
  const renderCustomSlots = () => {
    customSlots.innerHTML = '';

    customPalette.forEach((entry, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-slot';
      btn.classList.toggle('selected', i === selectedCustomIdx);
      btn.classList.toggle('replaceable', pendingCustom !== null);
      btn.style.setProperty('--c', toHex(entry.rgb));
      btn.draggable = !pendingCustom;
      btn.title = pendingCustom
        ? 'この色と入れ替える'
        : mode === 'eyedrop'
          ? 'この色を「あなたの色」にする'
          : 'この色で描く（ドラッグで並び替え）';

      btn.addEventListener('click', () => {
        if (pendingCustom) {
          customPalette[i] = pendingCustom;
          persist();
          discardPending();
          return;
        }
        if (mode === 'eyedrop') {
          setAnswer({ ...entry.rgb });
          setMode('paint');
          return;
        }
        clearSelection();
        brush = { ...entry.ryb };
        selectedCustomIdx = i;
        renderCustomSlots();
      });

      // ドラッグで並び替え（入れ替え先を待っている間は無効）
      if (!pendingCustom) {
        btn.addEventListener('dragstart', (e) => {
          dragSrcIdx = i;
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => btn.classList.add('dragging'), 0);
        });
        btn.addEventListener('dragend', () => {
          btn.classList.remove('dragging');
          dragSrcIdx = -1;
        });
        btn.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        });
        btn.addEventListener('dragenter', () => {
          if (dragSrcIdx >= 0 && dragSrcIdx !== i) btn.classList.add('drag-over');
        });
        btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));
        btn.addEventListener('drop', (e) => {
          e.preventDefault();
          btn.classList.remove('drag-over');
          if (dragSrcIdx < 0 || dragSrcIdx === i) return;
          const moved = customPalette[dragSrcIdx];
          customPalette[dragSrcIdx] = customPalette[i];
          customPalette[i] = moved;
          if (selectedCustomIdx === dragSrcIdx) selectedCustomIdx = i;
          else if (selectedCustomIdx === i) selectedCustomIdx = dragSrcIdx;
          persist();
          renderCustomSlots();
        });
      }

      customSlots.appendChild(btn);
    });

    for (let i = customPalette.length; i < MAX_CUSTOM; i++) {
      const empty = document.createElement('div');
      empty.className = 'custom-slot empty';
      customSlots.appendChild(empty);
    }
  };

  function discardPending(): void {
    pendingCustom = null;
    pendingBar.classList.remove('visible');
    hintEl.textContent = HINT_PAINT;
    hintEl.classList.remove('eyedrop-mode');
    renderCustomSlots();
  }

  // ── 吸い取り ──
  const sampleForAnswer = (cx: number, cy: number) => {
    setAnswer(sampleAt(grid, cx, cy)?.rgb ?? null);
    setMode('paint');
  };

  const sampleForCustom = (cx: number, cy: number) => {
    const sample = sampleAt(grid, cx, cy);
    if (sample && customPalette.length < MAX_CUSTOM) {
      customPalette.push(sample);
      persist();
      renderCustomSlots();
    } else if (sample) {
      // 満杯：入れ替えるスロットを選んでもらう
      pendingCustom = sample;
      pendingPreview.style.background = toHex(sample.rgb);
      pendingBar.classList.add('visible');
      hintEl.textContent = '↓ 入れ替えるスロットをクリック、または捨てる';
      hintEl.classList.add('eyedrop-mode');
      renderCustomSlots();
    }
    setMode('paint');
  };

  // ── 元に戻す ──
  const saveHistory = () => {
    undoStack.push(snapshot(grid));
    if (undoStack.length > HISTORY_MAX) undoStack.shift();
  };

  const undo = () => {
    const saved = undoStack.pop();
    if (!saved) return;
    restore(grid, saved);
    layer.update(grid);
    redraw();
    setAnswer(null);
    if (!judged) hideSim();
  };

  const clearCanvas = () => {
    saveHistory();
    clearGrid(grid);
    layer.update(grid);
    redraw();
    setAnswer(null);
    judged = false;
    hideSim();
  };

  // ── お題 ──
  const loadPattern = (next: Pattern) => {
    pattern = next;
    target = mixPaint(pattern.zones[0].recipe);
    const isMulti = pattern.zones.length > 1;
    eyedropBtn.style.display = isMulti ? 'none' : '';
    mixLabel.textContent = isMulti ? '結果' : 'あなたの色';
    drawPreview(targetCanvas, pattern.zones);
    clearPreview(mixCanvas, pattern.zones);
    redraw();
  };

  // ── 塗る面の操作 ──
  const cellOf = (e: PointerEvent) => {
    const { x, y } = fit.toLogical(e.clientX, e.clientY);
    return { x, y, cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) };
  };

  const stroke = (cx: number, cy: number) => {
    if (!brush) return;
    layer.update(grid, paintAt(grid, cx, cy, brush));
    redraw();
  };

  canvas.addEventListener('pointerdown', (e) => {
    const pos = cellOf(e);
    if (mode === 'eyedrop') return sampleForAnswer(pos.cx, pos.cy);
    if (mode === 'customEyedrop') return sampleForCustom(pos.cx, pos.cy);
    if (!brush) return;
    canvas.setPointerCapture(e.pointerId);
    saveHistory();
    isDrawing = true;
    lastPos = null;
    stroke(pos.cx, pos.cy);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (mode !== 'paint' || !isDrawing) return;
    const pos = cellOf(e);
    if (lastPos && Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y) < MIN_DRAG_DIST) return;
    lastPos = pos;
    stroke(pos.cx, pos.cy);
  });

  const stopDrawing = () => {
    isDrawing = false;
  };
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // ── ボタン ──
  blobs.forEach((btn) => {
    btn.addEventListener('click', () => {
      clearSelection();
      brush = pure(btn.dataset.color as Pigment);
      btn.classList.add('selected');
      renderCustomSlots();
      if (mode !== 'paint') setMode('paint');
    });
  });

  eyedropBtn.addEventListener('click', () => setMode(mode === 'eyedrop' ? 'paint' : 'eyedrop'));
  customEyedropBtn.addEventListener('click', () => setMode(mode === 'customEyedrop' ? 'paint' : 'customEyedrop'));
  discardPendingBtn.addEventListener('click', discardPending);
  clearBtn.addEventListener('click', clearCanvas);

  judgeBtn.addEventListener('click', () => {
    if (pattern.zones.length > 1) {
      const { colors, detail } = judgeZones(grid, pattern.zones);
      drawPreview(mixCanvas, pattern.zones, colors);
      showSim(detail);
      judged = true;
      return;
    }
    if (!sampledColor) {
      simEl.textContent = '🎯 スポイトで色を取ってください';
      simEl.classList.add('visible');
      return;
    }
    judged = true;
    showSim(colorSimilarityDetail(target, sampledColor));
  });

  guideChk.checked = guideMode;
  guideChk.addEventListener('change', () => {
    guideMode = guideChk.checked;
    persist();
    redraw();
    if (guideMode && sampledColor) showSim(colorSimilarityDetail(target, sampledColor));
    else if (!judged) hideSim();
  });

  nextBtn.addEventListener('click', async () => {
    platform.gameplayStop();
    await platform.commercialBreak();
    clearCanvas();
    discardPending();
    setMode('paint');
    clearSelection();
    renderCustomSlots();
    loadPattern(PATTERNS[deck.next()]);
    platform.gameplayStart();
  });

  // ── 始める ──
  renderCustomSlots();
  setMode('paint');
  loadPattern(pattern);
  platform.loadingFinished();
  platform.gameplayStart();
}

void start();
