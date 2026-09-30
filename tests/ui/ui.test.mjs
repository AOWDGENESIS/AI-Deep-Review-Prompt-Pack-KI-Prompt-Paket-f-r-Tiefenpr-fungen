/* =====================================================================
   RepairCenter - Oberflaechentests (jsdom)
   Prueft die Oberflaeche ohne Browser und ohne laufendes Backend:
   fetch wird durch eine Attrappe ersetzt, die die echten Sprachpakete
   von der Platte liefert und die API mit Beispieldaten beantwortet.

   Ausfuehren:  npm install && npm test
   Die Anwendung selbst braucht kein Node.js - nur diese Tests.
   MIT-Lizenz - Copyright (c) 2026 AOWD GENESIS
   ===================================================================== */
import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const webDir = join(root, 'web');

const html = readFileSync(join(webDir, 'index.html'), 'utf8');
const appJs = readFileSync(join(webDir, 'assets', 'app.js'), 'utf8');
const de = JSON.parse(readFileSync(join(webDir, 'i18n', 'de.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(webDir, 'i18n', 'en.json'), 'utf8'));

/* ------------------------- Beispieldaten ------------------------- */
const systemFixture = {
  computer: 'TESTPC', os: 'Windows 11 Pro', build: '22631', psVersion: '5.1.22621.4391',
  isAdmin: true, is64BitProcess: true, freeSpaceGB: 41.2, totalSpaceGB: 475.9,
  uptimeDays: 3.4, pendingReboot: ['Windows Update'], componentStore: 'Healthy',
  disks: [{ name: 'Samsung SSD 990', media: 'SSD', health: 'Healthy', sizeGB: 1000 }],
  maintenanceBusy: [], demo: true, logRoot: 'C:\\RepairLogs'
};

const runFixture = {
  runId: '20260929-120000', mode: 'Repair', optimize: 'Standard', demo: true,
  status: 'done', overall: 'REPAIRED', progress: 100, currentStep: '', durationSec: 42,
  startTime: new Date().toISOString(),
  steps: [
    { name: 'Preflight', status: 'PASS', detail: '', durationSec: 1 },
    { name: 'SFC', status: 'REPAIRED', detail: '2 Datei(en) repariert', durationSec: 21 },
    { name: 'OPT_Bereinigung', status: 'PASS', detail: '1.284 Dateien', durationSec: 7 }
  ],
  findings: [{ level: 'warn', text: 'SFC hat 2 Datei(en) repariert - Neustart erforderlich.' }],
  restartRequired: true, restartReasons: ['SFC hat Systemdateien repariert'],
  reclaimedGB: 2.4,
  log: [
    { t: '12:00:01', kind: 'section', text: 'Preflight' },
    { t: '12:00:02', kind: 'tool', text: '> dism.exe /Online' },
    { t: '12:00:03', kind: 'ok', text: 'Alles gut' }
  ]
};

const historyFixture = [
  { runId: '20260929-120000', mode: 'Repair', optimize: 'Standard', status: 'done', overall: 'REPAIRED', startTime: runFixture.startTime, durationSec: 42, demo: true, restartRequired: true, reclaimedGB: 2.4 },
  { runId: '20260928-090000', mode: 'Diagnose', optimize: 'None', status: 'done', overall: 'HEALTHY', startTime: runFixture.startTime, durationSec: 611, demo: false, restartRequired: false, reclaimedGB: 0 }
];

const configFixture = { version: '1.1.0', logRoot: 'C:\\RepairLogs', demo: true, isWindows: true, port: 8720 };

const disksFixture = [
  {
    number: 0, friendlyName: 'Samsung SSD 990 PRO 1TB', serial: 'S6Z1', busType: 'NVMe', mediaType: 'SSD',
    sizeBytes: 1000204886016, partitionStyle: 'GPT', isSystem: true, isBoot: true, isReadOnly: false,
    healthStatus: 'Healthy', bitlocker: 'On', protected: true, protectReason: 'Systemdatenträger',
    volumes: [{ driveLetter: 'C', label: 'Windows', fileSystem: 'NTFS', sizeBytes: 999000000000, freeBytes: 412000000000, isSystem: true }]
  },
  {
    number: 1, friendlyName: 'Seagate IronWolf 8TB', serial: 'ZA1', busType: 'SATA', mediaType: 'HDD',
    sizeBytes: 8001563222016, partitionStyle: 'GPT', isSystem: false, isBoot: false, isReadOnly: false,
    healthStatus: 'Healthy', bitlocker: 'Off', protected: false, protectReason: '',
    volumes: [{ driveLetter: 'D', label: 'Archiv', fileSystem: 'NTFS', sizeBytes: 8000000000000, freeBytes: 1200000000000, isSystem: false }]
  },
  {
    number: 2, friendlyName: 'SanDisk Ultra USB 64GB', serial: '4C5', busType: 'USB', mediaType: 'Unspecified',
    sizeBytes: 61530439680, partitionStyle: 'MBR', isSystem: false, isBoot: false, isReadOnly: false,
    healthStatus: 'Healthy', bitlocker: 'Off', protected: false, protectReason: '',
    volumes: [{ driveLetter: 'E', label: 'STICK', fileSystem: 'FAT32', sizeBytes: 61000000000, freeBytes: 60000000000, isSystem: false }]
  }
];

const estimateFixture = {
  strategy: 'Zero', seconds: 11704, readable: '3 h 15 min', throughputMBs: 190,
  note: 'Ungepuffert, 32-MiB-Blöcke, Warteschlangentiefe 4', confirmationToken: 'DISK1',
  protected: false, protectReason: ''
};

const targetsFixture = [
  { driveLetter: 'D', label: 'Archiv', fileSystem: 'NTFS', freeBytes: 1200000000000, sizeBytes: 8000000000000, diskNumber: 1, deviceKind: 'Festplatte', isSystem: false },
  { driveLetter: 'F', label: 'KAMERA', fileSystem: 'exFAT', freeBytes: 31000000000, sizeBytes: 127000000000, diskNumber: 3, deviceKind: 'Speicherkarte', isSystem: false }
];

const measureFixture = { files: 18342, bytes: 53000000000, readable: '49,4 GB', volumes: ['E'] };

const diskJobFixture = {
  jobId: 'wipe-20260929-140000', action: 'Wipe', status: 'running', ok: false, percent: 42,
  bytesDone: 3360000000000, bytesTotal: 8001563222016, throughput: 188, secondsLeft: 6800,
  strategy: 'Zero', stage: 'wipe',
  stages: [{ name: 'rescue', status: 'PASS', detail: '49,4 GB kopiert' }, { name: 'wipe', status: 'running', detail: '' }],
  log: [{ t: '14:00:01', kind: 'info', text: 'Verfahren Zero - geschätzte Dauer 3 h 15 min' }]
};

/* --------------------------- Umgebung ---------------------------- */
let dom, win, doc, calls, jobPolls;

function makeFetch() {
  return (url, options) => {
    calls.push({
      url: String(url), method: (options && options.method) || 'GET',
      body: options && options.body, headers: (options && options.headers) || {}
    });
    const u = String(url);
    const json = (obj) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(obj), text: () => Promise.resolve(JSON.stringify(obj)) });
    const text = (s) => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(s), json: () => Promise.resolve({}) });

    if (u.endsWith('i18n/de.json')) { return json(de); }
    if (u.endsWith('i18n/en.json')) { return json(en); }
    if (u === '/api/config') { return json(configFixture); }
    if (u === '/api/system') { return json(systemFixture); }
    if (u === '/api/runs') { return json(historyFixture); }
    if (u === '/api/schedule') { return json({ supported: true, exists: false }); }
    if (u === '/api/disks') { return json(disksFixture); }
    if (u.startsWith('/api/disk/estimate')) { return json(estimateFixture); }
    if (u.startsWith('/api/disk/targets')) { return json(targetsFixture); }
    if (u.startsWith('/api/disk/measure')) { return json(measureFixture); }
    if (u.startsWith('/api/disk/job/')) {
      jobPolls++;
      if (jobPolls <= 2) { return json(diskJobFixture); }
      return json(Object.assign({}, diskJobFixture, {
        status: 'done', ok: true, percent: 100, secondsLeft: 0,
        detail: '7,3 TB in 3 h 12 min ueberschrieben (193 MB/s)'
      }));
    }
    if (u === '/api/disk/wipe' || u === '/api/disk/format' || u === '/api/disk/convert') {
      return json({ jobId: diskJobFixture.jobId, pid: 1234 });
    }
    if (u.startsWith('/api/run/')) { return json(runFixture); }
    if (u === '/api/run') { return json({ runId: '20260929-130000', pid: 4711 }); }
    if (u.startsWith('/api/report/')) { return text('=== Beispielbericht ===\nGesamtstatus: REPAIRED'); }
    return json({});
  };
}

async function boot() {
  dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8720/', pretendToBeVisual: true });
  win = dom.window;
  doc = win.document;
  calls = [];
  jobPolls = 0;
  win.fetch = makeFetch();
  win.confirm = () => true;
  win.navigator.clipboard = { writeText: () => Promise.resolve() };
  win.eval(appJs);
  // auf die asynchrone Initialisierung warten
  for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 5)); }
}

function stopTimers() {
  if (!win) { return; }
  const ui = win.RepairCenterUI;
  if (ui && ui.state && ui.state.timer) { win.clearInterval(ui.state.timer); ui.state.timer = null; }
  if (ui && ui.disks && ui.disks.timer) { win.clearInterval(ui.disks.timer); ui.disks.timer = null; }
  if (win.close) { win.close(); }
}

const $ = (sel) => doc.querySelector(sel);
const $$ = (sel) => Array.from(doc.querySelectorAll(sel));
const click = (sel) => $(sel).dispatchEvent(new win.Event('click', { bubbles: true }));
const change = (el) => el.dispatchEvent(new win.Event('change', { bubbles: true }));

/* ============================= Tests ============================= */

describe('Grundzustand', () => {
  before(boot);
  after(stopTimers);

  test('Vorgabe ist Deutsch', () => {
    assert.equal(doc.documentElement.lang, 'de');
    assert.equal($('.lang-btn[data-lang=de]').classList.contains('active'), true);
    assert.equal($('[data-tab=run]').textContent, 'Reparatur');
    assert.equal($('[data-i18n="run.modeTitle"]').textContent, '1. Was soll geschehen?');
  });

  test('Vorgabe ist das dunkle Design', () => {
    assert.equal(doc.body.getAttribute('data-theme'), 'dark');
  });

  test('Alle sieben Reiter sind vorhanden', () => {
    const tabs = $$('.tab').map((t) => t.getAttribute('data-tab'));
    assert.deepEqual(tabs, ['run', 'system', 'history', 'report', 'disks', 'schedule', 'about']);
  });

  test('Alle Bedienelemente der Engine sind vorhanden', () => {
    ['Quick', 'Diagnose', 'Repair', 'Full'].forEach((m) =>
      assert.ok($(`input[name=mode][value=${m}]`), 'Modus fehlt: ' + m));
    ['None', 'Safe', 'Standard', 'Aggressive'].forEach((o) =>
      assert.ok($(`input[name=optimize][value=${o}]`), 'Stufe fehlt: ' + o));
    ['#optWhatIf', '#optSkipDism', '#optSkipSfc', '#optSkipDisk', '#optNoEscalate',
      '#optNoRestorePoint', '#optDemo', '#optTempAge', '#optMinFree', '#optScenario',
      '#startBtn', '#cancelBtn'].forEach((sel) => assert.ok($(sel), 'Element fehlt: ' + sel));
  });

  test('Alle fuenf Testszenarien sind waehlbar', () => {
    const opts = $$('#optScenario option').map((o) => o.value);
    assert.deepEqual(opts, ['Healthy', 'Repaired', 'Escalation', 'Failed', 'Preflight']);
  });

  test('Systemdaten werden angezeigt', () => {
    const txt = $('#systemGrid').textContent;
    assert.match(txt, /TESTPC/);
    assert.match(txt, /Windows 11 Pro/);
    assert.match(txt, /41\.2 GB \/ 475\.9 GB/);
    assert.match($('#pendingList').textContent, /Windows Update/);
    assert.match($('#diskTable').textContent, /Samsung SSD 990/);
  });

  test('Demomodus wird aus der Konfiguration uebernommen', () => {
    assert.equal($('#optDemo').checked, true);
    assert.equal($('#demoBadge').classList.contains('hidden'), false);
  });
});

describe('Sprachumschaltung', () => {
  before(boot);
  after(stopTimers);

  test('Umschalten auf Englisch aendert alle Beschriftungen', async () => {
    click('.lang-btn[data-lang=en]');
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(doc.documentElement.lang, 'en');
    assert.equal($('[data-tab=run]').textContent, 'Repair');
    assert.equal($('[data-i18n="run.modeTitle"]').textContent, '1. What should happen?');
  });

  test('Zurueck auf Deutsch stellt alles wieder her', async () => {
    click('.lang-btn[data-lang=de]');
    await new Promise((r) => setTimeout(r, 30));
    assert.equal($('[data-tab=run]').textContent, 'Reparatur');
    assert.equal($('[data-i18n="tabs.schedule"]').textContent, 'Planung');
  });

  test('Beide Sprachpakete haben identische Schluessel', () => {
    const kde = Object.keys(de).sort();
    const ken = Object.keys(en).sort();
    assert.deepEqual(kde, ken);
  });

  test('Jeder im HTML verwendete Schluessel existiert', () => {
    const used = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
    const missing = used.filter((k) => !(k in de));
    assert.deepEqual(missing, []);
  });
});

describe('Design', () => {
  before(boot);
  after(stopTimers);

  test('Umschalten auf hell und zurueck', () => {
    click('#themeBtn');
    assert.equal(doc.body.getAttribute('data-theme'), 'light');
    click('#themeBtn');
    assert.equal(doc.body.getAttribute('data-theme'), 'dark');
  });
});

describe('Eingaben und Start', () => {
  beforeEach(boot);
  after(stopTimers);

  test('Formular wird vollstaendig in die Anfrage uebernommen', () => {
    $('input[name=mode][value=Full]').checked = true;
    $('input[name=optimize][value=Standard]').checked = true;
    $('#optWhatIf').checked = true;
    $('#optSkipDisk').checked = true;
    $('#optNoRestorePoint').checked = true;
    $('#optTempAge').value = '7';
    $('#optMinFree').value = '15';
    $('#optScenario').value = 'Escalation';

    const p = win.RepairCenterUI.collectPayload();
    assert.equal(p.mode, 'Full');
    assert.equal(p.optimize, 'Standard');
    assert.equal(p.whatIf, true);
    assert.equal(p.skipDisk, true);
    assert.equal(p.noRestorePoint, true);
    assert.equal(p.tempFileAgeDays, 7);
    assert.equal(p.minFreeSpaceGB, 15);
    assert.equal(p.demoScenario, 'Escalation');
  });

  test('Diagnose erzwingt Wartungsstufe "Keine"', () => {
    const diag = $('input[name=mode][value=Diagnose]');
    diag.checked = true;
    change(diag);
    assert.equal($('input[name=optimize][value=None]').checked, true);
  });

  test('Aggressiv blendet die Warnung ein', () => {
    const agg = $('input[name=optimize][value=Aggressive]');
    agg.checked = true;
    change(agg);
    assert.equal($('#aggressiveWarn').classList.contains('hidden'), false);
    assert.match($('#aggressiveWarn').textContent, /ResetBase/);
  });

  test('Start schickt POST /api/run und aktiviert Abbrechen', async () => {
    click('#startBtn');
    await new Promise((r) => setTimeout(r, 30));
    const post = calls.find((c) => c.url === '/api/run' && c.method === 'POST');
    assert.ok(post, 'kein POST /api/run');
    const body = JSON.parse(post.body);
    assert.equal(body.mode, 'Repair');
    assert.equal($('#startBtn').disabled, true);
    assert.equal($('#cancelBtn').classList.contains('hidden'), false);
  });

  test('Abbrechen schickt den Abbruchbefehl', async () => {
    click('#startBtn');
    await new Promise((r) => setTimeout(r, 30));
    click('#cancelBtn');
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(calls.find((c) => /\/api\/run\/.+\/cancel/.test(c.url) && c.method === 'POST'));
    assert.equal($('#startBtn').disabled, false);
  });
});

describe('Laufanzeige', () => {
  before(boot);
  after(stopTimers);

  test('Schritte, Befunde, Protokoll und Status werden dargestellt', () => {
    win.RepairCenterUI.renderRun(runFixture);
    assert.equal($('#progressBar').style.width, '100%');
    assert.equal($$('#stepsTable tbody tr').length, 3);
    assert.match($('#stepsTable').textContent, /Systemdateiprüfung/);
    assert.match($('#stepsTable').textContent, /REPARIERT/);
    assert.equal($$('#findings .finding').length, 1);
    assert.equal($('#overallBadge').textContent, 'REPARIERT');
    assert.equal($$('#console div').length, 3);
    assert.match($('#spaceInfo').textContent, /\+2\.4 GB/);
  });

  test('Neustart-Hinweis erscheint mit Begruendung', () => {
    assert.equal($('#restartBanner').classList.contains('hidden'), false);
    assert.match($('#restartReasons').textContent, /SFC hat Systemdateien repariert/);
  });

  test('Werkzeugzeilen lassen sich ausblenden', () => {
    const cb = $('#showToolLines');
    cb.checked = false;
    change(cb);
    assert.equal($('#console').classList.contains('hide-tools'), true);
    assert.equal($$('#console .is-tool').length, 1);
  });

  test('Neustart erfordert Bestaetigung und ruft die API', async () => {
    click('#restartBtn');
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(calls.find((c) => c.url === '/api/restart' && c.method === 'POST'));
  });

  test('Fremdtext wird escaped (kein HTML aus Protokollzeilen)', () => {
    win.RepairCenterUI.state.logCount = 0;
    win.RepairCenterUI.renderRun(Object.assign({}, runFixture, {
      log: [{ t: '12:00:09', kind: 'info', text: '<img src=x onerror=alert(1)>' }]
    }));
    assert.equal($('#console').querySelectorAll('img').length, 0);
    assert.match($('#console').textContent, /<img src=x/);
  });
});

describe('Verlauf und Bericht', () => {
  before(boot);
  after(stopTimers);

  test('Verlauf zeigt alle Laeufe mit uebersetztem Ergebnis', () => {
    assert.equal($$('#historyTable tbody tr').length, 2);
    assert.match($('#historyTable').textContent, /REPARIERT/);
    assert.match($('#historyTable').textContent, /SAUBER/);
    assert.equal($('#historyEmpty').classList.contains('hidden'), true);
  });

  test('Klick auf "Bericht" wechselt in den Berichtsreiter und laedt den Text', async () => {
    $('#historyTable tbody button[data-run]').dispatchEvent(new win.Event('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));
    assert.equal($('#tab-report').classList.contains('active'), true);
    assert.match($('#reportView').textContent, /Beispielbericht/);
  });

  test('Formatumschaltung fragt das richtige Format an', async () => {
    calls.length = 0;
    $$('.fmt-btn').find((b) => b.getAttribute('data-fmt') === 'cbs')
      .dispatchEvent(new win.Event('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(calls.find((c) => c.url.includes('format=cbs')), 'CBS-Format nicht angefordert');
  });
});

describe('Planung', () => {
  before(boot);
  after(stopTimers);

  test('Zustand der Aufgabe wird angezeigt', async () => {
    win.RepairCenterUI.switchTab('schedule');
    await new Promise((r) => setTimeout(r, 30));
    assert.match($('#scheduleState').textContent, /keine Wartungsaufgabe/i);
  });

  test('Aufgabe anlegen schickt die gewaehlten Werte', async () => {
    $('#schedDay').value = 'WED';
    $('#schedTime').value = '02:30';
    $('#schedMode').value = 'Repair';
    calls.length = 0;
    click('#schedCreate');
    await new Promise((r) => setTimeout(r, 30));
    const post = calls.find((c) => c.url === '/api/schedule' && c.method === 'POST');
    assert.ok(post, 'kein POST /api/schedule');
    const body = JSON.parse(post.body);
    assert.equal(body.day, 'WED');
    assert.equal(body.time, '02:30');
    assert.equal(body.mode, 'Repair');
  });

  test('Aufgabe entfernen schickt DELETE', async () => {
    calls.length = 0;
    click('#schedDelete');
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(calls.find((c) => c.url === '/api/schedule' && c.method === 'DELETE'));
  });

  test('Dienstdaten werden angezeigt', () => {
    assert.match($('#configGrid').textContent, /C:\\RepairLogs/);
    assert.match($('#configGrid').textContent, /localhost:8720/);
    assert.match($('#configGrid').textContent, /Demomodus/);
  });
});


describe('Datenträgerverwaltung', () => {
  before(boot);
  after(stopTimers);

  test('Reiter vorhanden und Warnhinweis sichtbar', async () => {
    win.RepairCenterUI.switchTab('disks');
    await new Promise((r) => setTimeout(r, 40));
    assert.equal($('#tab-disks').classList.contains('active'), true);
    assert.match($('.banner-danger').textContent, /vernichten Daten endgültig/);
  });

  test('Alle Datenträger werden mit Kennwerten dargestellt', () => {
    const cards = $$('.disk-card');
    assert.equal(cards.length, 3);
    assert.match(cards[0].textContent, /Samsung SSD 990 PRO 1TB/);
    assert.match(cards[1].textContent, /8\.0 TB|7\.3 TB/);
    assert.match(cards[2].textContent, /FAT32/);
  });

  test('Systemdatenträger bietet kein Löschen und kein Formatieren an', () => {
    const sys = $$('.disk-card')[0];
    assert.equal(sys.querySelectorAll('button[data-wipe]').length, 0);
    assert.equal(sys.querySelectorAll('button[data-format]').length, 0);
    assert.match(sys.textContent, /geschützt/);
    assert.equal(sys.classList.contains('is-protected'), true);
  });

  test('Nicht geschützte Datenträger bieten Löschen und Formatieren an', () => {
    const hdd = $$('.disk-card')[1];
    assert.equal(hdd.querySelectorAll('button[data-wipe]').length, 1);
    assert.equal(hdd.querySelectorAll('button[data-format]').length, 1);
    assert.equal(hdd.querySelectorAll('button[data-convert]').length, 1);
  });

  test('Löschdialog zeigt Verfahren und geschätzte Dauer', async () => {
    $$('.disk-card')[1].querySelector('button[data-wipe]')
      .dispatchEvent(new win.Event('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));
    assert.equal($('#diskOpCard').classList.contains('hidden'), false);
    assert.equal($('#diskWipePanel').classList.contains('hidden'), false);
    assert.match($('#wipeEstimate').textContent, /3 h 15 min/);
    assert.match($('#wipeEstimate').textContent, /190 MB\/s/);
  });

  test('Ausführen bleibt gesperrt, bis der Schlüssel exakt eingetippt ist', () => {
    assert.equal($('#diskOpStart').disabled, true);
    $('#diskConfirm').value = 'DISK';
    $('#diskConfirm').dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal($('#diskOpStart').disabled, true);
    $('#diskConfirm').value = 'DISK2';
    $('#diskConfirm').dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal($('#diskOpStart').disabled, true, 'falscher Schlüssel darf nicht freischalten');
    $('#diskConfirm').value = 'disk1';
    $('#diskConfirm').dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal($('#diskOpStart').disabled, false, 'richtiger Schlüssel schaltet frei');
  });

  test('Start schickt Verfahren, Blockgröße und Bestätigung an die API', async () => {
    $('#wipeBuffer').value = '64';
    $('#wipeQueue').value = '8';
    calls.length = 0;
    click('#diskOpStart');
    await new Promise((r) => setTimeout(r, 40));
    const post = calls.find((c) => c.url === '/api/disk/wipe' && c.method === 'POST');
    assert.ok(post, 'kein POST /api/disk/wipe');
    const body = JSON.parse(post.body);
    assert.equal(body.diskNumber, 1);
    assert.equal(body.confirmation, 'DISK1');
    assert.equal(body.bufferMiB, 64);
    assert.equal(body.queueDepth, 8);
  });

  test('Fortschritt zeigt Prozent, Datenmenge, Durchsatz und Restzeit', async () => {
    await new Promise((r) => setTimeout(r, 900));
    assert.equal($('#diskJobBox').classList.contains('hidden'), false);
    assert.equal($('#diskJobBar').style.width, '42%');
    assert.match($('#diskJobStatus').textContent, /42 %/);
    assert.match($('#diskJobSpeed').textContent, /188 MB\/s/);
    assert.match($('#diskJobSpeed').textContent, /1 h 53 min/);
  });

  test('Abschluss beendet die Abfrage und meldet Fertig', async () => {
    await new Promise((r) => setTimeout(r, 1800));
    assert.match($('#diskJobStatus').textContent, /Fertig/);
    assert.equal($('#diskJobBar').style.width, '100%');
    assert.equal(win.RepairCenterUI.disks.timer, null, 'Abfragetimer laeuft weiter');
  });

  test('Dateisystemwechsel weist verlustfrei und verlustbehaftet korrekt aus', async () => {
    win.RepairCenterUI.openDiskOp('convert', null, 'E');
    await new Promise((r) => setTimeout(r, 20));
    $('#fmtFileSystem').value = 'NTFS';
    change($('#fmtFileSystem'));
    assert.match($('#fmtHint').textContent, /verlustfrei/);
    assert.equal($('#fmtHint').classList.contains('notice-ok'), true);

    $('#fmtFileSystem').value = 'exFAT';
    change($('#fmtFileSystem'));
    assert.match($('#fmtHint').textContent, /Daten auf dem Volume gehen verloren/);
    assert.equal($('#fmtHint').classList.contains('notice-warn'), true);
  });

  test('Größen und Zeiten werden lesbar formatiert', () => {
    const ui = win.RepairCenterUI;
    assert.equal(ui.fmtBytes(0), '0 B');
    assert.equal(ui.fmtBytes(1536), '1.5 KB');
    assert.equal(ui.fmtBytes(8001563222016), '7.3 TB');
    assert.equal(ui.fmtSeconds(45), '45 s');
    assert.equal(ui.fmtSeconds(3725), '1 h 2 min');
  });
});


describe('Schutz vor Anfragen fremder Webseiten', () => {
  before(boot);
  after(stopTimers);

  test('Jede Anfrage trägt den Zusatzkopf X-RepairCenter', () => {
    assert.ok(calls.length > 0, 'keine Anfragen aufgezeichnet');
    const ohne = calls.filter((c) => !c.url.startsWith('i18n/') && c.headers['X-RepairCenter'] !== '1');
    assert.deepEqual(ohne.map((c) => c.url), [], 'Anfragen ohne Zusatzkopf');
  });

  test('Auch schreibende Anfragen tragen ihn zusätzlich zum Inhaltstyp', async () => {
    calls.length = 0;
    click('#startBtn');
    await new Promise((r) => setTimeout(r, 40));
    const post = calls.find((c) => c.method === 'POST');
    assert.ok(post, 'kein POST abgesetzt');
    assert.equal(post.headers['X-RepairCenter'], '1');
    assert.equal(post.headers['Content-Type'], 'application/json');
  });

  test('Auch der Abruf von Berichten trägt den Kopf', async () => {
    calls.length = 0;
    win.RepairCenterUI.switchTab('report');
    await new Promise((r) => setTimeout(r, 60));
    const rep = calls.find((c) => c.url.startsWith('/api/report/'));
    assert.ok(rep, 'kein Berichtsabruf');
    assert.equal(rep.headers['X-RepairCenter'], '1');
  });
});

describe('Datenrettung vor dem Löschen', () => {
  before(boot);
  after(stopTimers);

  test('Der Sicherungsbereich ist zunächst eingeklappt', async () => {
    win.RepairCenterUI.switchTab('disks');
    await new Promise((r) => setTimeout(r, 40));
    win.RepairCenterUI.openDiskOp('wipe', 1, null);
    await new Promise((r) => setTimeout(r, 40));
    assert.equal($('#rescueEnabled').checked, false);
    assert.equal($('#rescueOptions').classList.contains('hidden'), true);
  });

  test('Einschalten lädt Ziele und ermittelt die Datenmenge', async () => {
    $('#rescueEnabled').checked = true;
    change($('#rescueEnabled'));
    await new Promise((r) => setTimeout(r, 60));
    assert.equal($('#rescueOptions').classList.contains('hidden'), false);
    const opts = $$('#rescueTarget option').map((o) => o.value);
    assert.deepEqual(opts, ['D', 'F']);
    assert.match($('#rescueTarget').textContent, /Archiv/);
    assert.match($('#rescueMeasure').textContent, /49\.4 GB|49,4 GB/);
    assert.match($('#rescueMeasure').textContent, /18.342|18,342/);
  });

  test('Passendes Ziel wird als ausreichend gemeldet', () => {
    $('#rescueTarget').value = 'D';
    change($('#rescueTarget'));
    assert.equal($('#rescueSpace').classList.contains('notice-ok'), true);
    assert.match($('#rescueSpace').textContent, /Passt/);
  });

  test('Zu kleines Ziel blockiert den Start trotz richtigem Schlüssel', () => {
    $('#rescueTarget').value = 'F';
    change($('#rescueTarget'));
    assert.equal($('#rescueSpace').classList.contains('notice-warn'), true);
    assert.match($('#rescueSpace').textContent, /Zu wenig Platz/);
    $('#diskConfirm').value = 'DISK1';
    $('#diskConfirm').dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal($('#diskOpStart').disabled, true, 'Start darf bei Platzmangel nicht freigegeben werden');
  });

  test('Mit passendem Ziel und Schlüssel wird der Start freigegeben', () => {
    $('#rescueTarget').value = 'D';
    change($('#rescueTarget'));
    $('#diskConfirm').value = 'DISK1';
    $('#diskConfirm').dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal($('#diskOpStart').disabled, false);
  });

  test('Die Anfrage enthält Ziel, Verfahren, Fäden und Puffereinstellung', async () => {
    $('#rescueMode').value = 'Move';
    $('#rescueThreads').value = '64';
    $('#rescueFolder').value = 'Rettung-2026';
    $('#rescueUnbuffered').checked = true;
    calls.length = 0;
    click('#diskOpStart');
    await new Promise((r) => setTimeout(r, 40));
    const post = calls.find((c) => c.url === '/api/disk/wipe' && c.method === 'POST');
    assert.ok(post, 'kein POST /api/disk/wipe');
    const body = JSON.parse(post.body);
    assert.equal(body.rescueTarget, 'D:\\Rettung-2026');
    assert.equal(body.rescueMode, 'Move');
    assert.equal(body.rescueThreads, 64);
    assert.equal(body.rescueUnbuffered, true);
    assert.equal(body.confirmation, 'DISK1');
  });

  test('Die beiden Abschnitte werden mit ihrem Zustand angezeigt', async () => {
    await new Promise((r) => setTimeout(r, 900));
    const stages = $$('#stageList .stage');
    assert.equal(stages.length, 2);
    assert.match(stages[0].textContent, /Daten sichern/);
    assert.equal(stages[0].classList.contains('is-pass'), true);
    assert.match(stages[1].textContent, /Löschen/);
    assert.equal(stages[1].classList.contains('is-running'), true);
    assert.match($('#diskJobStatus').textContent, /Löschen · 42 %/);
  });
});
