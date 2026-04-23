// ─────────────────────────────────────────────────────────────────────────────
//  FLINGO TIERS — MAIN SCRIPT (Firebase Realtime Edition)
// ─────────────────────────────────────────────────────────────────────────────

/* ── FIREBASE CONFIG ─────────────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            "AIzaSyAT9YzdiAoDxTRyTicpgLa9-twp1Z1iWfo",
  authDomain:        "flingotier.firebaseapp.com",
  projectId:         "flingotier",
  storageBucket:     "flingotier.firebasestorage.app",
  messagingSenderId: "536966599201",
  appId:             "1:536966599201:web:b68ead39395de5b8d0c960",
  measurementId:     "G-G4EY2Z0QSV"
};

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */
const TIER_POINTS = {
  HT1:100, HT2:95, HT3:90, HT4:85, HT5:80,
  LT1:75,  LT2:70, LT3:65, LT4:60, LT5:55,
};

const GM_META = [
  { key:'vanilla', label:'Vanilla', img:'vanilla.png'   },
  { key:'sword',   label:'Sword',   img:'sword.png'     },
  { key:'uhc',     label:'UHC',     img:'uhc.png'       },
  { key:'pot',     label:'Pot',     img:'potion.png'    },
  { key:'nethop',  label:'NethOP',  img:'nethpot.png'   },
  { key:'smp',     label:'SMP',     img:'smp.png'       },
  { key:'axe',     label:'Axe',     img:'axe.png'       },
  { key:'mace',    label:'Mace',    img:'Mace.png'      },
  { key:'spear',   label:'Spear',   img:'Netherite_Spear.png' },
];

const TAB_META = [
  { key:'overall', label:'Overall', img:'over_all.png'  },
  { key:'vanilla', label:'Vanilla', img:'vanilla.png'   },
  { key:'sword',   label:'Sword',   img:'sword.png'     },
  { key:'uhc',     label:'UHC',     img:'uhc.png'       },
  { key:'pot',     label:'Pot',     img:'potion.png'    },
  { key:'nethop',  label:'NethOP',  img:'nethpot.png'   },
  { key:'smp',     label:'SMP',     img:'smp.png'       },
  { key:'axe',     label:'Axe',     img:'axe.png'       },
  { key:'mace',    label:'Mace',    img:'Mace.png'      },
  { key:'spear',   label:'Spear',   img:'Netherite_Spear.png' },
];

const ALL_TIER_OPTS = ['','HT1','HT2','HT3','HT4','HT5','LT1','LT2','LT3','LT4','LT5'];

/* ── AUTH ────────────────────────────────────────────────────────────────── */
const A_KEY = 'ft_v5_admin';
const isAdmin     = ()    => sessionStorage.getItem(A_KEY) === '1';
const loginAdmin  = (u,p) => { if(u==='flingo'&&p==='yuggiman066'){ sessionStorage.setItem(A_KEY,'1'); return true; } return false; };
const logoutAdmin = ()    => sessionStorage.removeItem(A_KEY);

/* ── FIREBASE INIT ───────────────────────────────────────────────────────── */
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ── FIRESTORE CRUD ──────────────────────────────────────────────────────── */
async function fbAddPlayer(player) {
  await db.collection('players').add({
    ...player,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbDeletePlayer(docId) {
  await db.collection('players').doc(docId).delete();
}
async function fbUpdatePlayer(docId, player) {
  await db.collection('players').doc(docId).set({
    ...player,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function calcPoints(tiers) {
  if (!tiers) return 0;
  return Object.values(tiers).reduce((s,t) => s + (TIER_POINTS[t]||0), 0);
}
function getSkin(p) {
  if (p.customSkin && p.customSkin.trim()) return p.customSkin.trim();
  return `https://mc-heads.net/body/${encodeURIComponent(p.name)}/left`;
}
function getHeadSkin(p) {
  if (p.customSkin && p.customSkin.trim()) return p.customSkin.trim();
  return `https://mc-heads.net/avatar/${encodeURIComponent(p.name)}/100`;
}
function tierCls(t) {
  if (!t) return '';
  if (t.startsWith('HT')) return `tb-HT${t[2]}`;
  if (t.startsWith('LT')) return `tb-LT${t[2]}`;
  return '';
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── ANIMATED COUNTER ────────────────────────────────────────────────────── */
function animCount(el, target, dur=550) {
  if (!el) return;
  const from = parseInt(el.textContent)||0;
  if (from===target) { el.textContent=target; return; }
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now-t0)/dur,1);
    const e = 1-Math.pow(1-p,3);
    el.textContent = Math.round(from+(target-from)*e);
    if (p<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function updateCount(n) {
  const el = document.getElementById('count-badge');
  if (el) animCount(el, n);
}

/* ── BUILD TIER BADGES ───────────────────────────────────────────────────── */
function buildBadges(tiers, activeTab) {
  const modes = (activeTab && activeTab !== 'overall')
    ? GM_META.filter(g => g.key === activeTab)
    : GM_META;
  return modes
    .filter(g => tiers && tiers[g.key] && TIER_POINTS[tiers[g.key]])
    .map(g => `<span class="tb ${tierCls(tiers[g.key])}" title="${g.label}"><img class="tb-icon" src="${g.img}" alt="${g.label}"/><span class="tb-tier">${tiers[g.key]}</span></span>`)
    .join('');
}

/* ── PLAYER POPUP ────────────────────────────────────────────────────────── */
function openPopup(player, allPlayers) {
  const pts  = calcPoints(player.tiers);
  const ov   = document.getElementById('popup-overlay');
  if (!ov) return;
  const sorted = [...allPlayers].sort((a,b) => calcPoints(b.tiers)-calcPoints(a.tiers));
  const rank   = sorted.findIndex(p => p.name === player.name) + 1;
  const tiersHtml = GM_META.map(g => {
    const t = player.tiers && player.tiers[g.key];
    if (!t || !TIER_POINTS[t]) return '';
    return `<div class="popup-tier-chip ${tierCls(t)}">
      <div class="popup-tier-icon-wrap"><img class="popup-tier-icon" src="${g.img}" alt="${g.label}"/></div>
      <span class="popup-tier-label">${t}</span>
      <div class="popup-tier-tooltip">${g.label}</div>
    </div>`;
  }).join('');
  ov.innerHTML = `
    <div class="modal-card popup-v2">
      <button class="popup-v2-close" id="popup-close">&#x2715;</button>
      <div class="popup-v2-avatar-ring">
        <img class="popup-v2-avatar" src="${getHeadSkin(player)}" alt="${escHtml(player.name)}" loading="lazy"
          onerror="this.onerror=null;this.src='https://mc-heads.net/avatar/Steve/100'"/>
      </div>
      <div class="popup-v2-name">${escHtml(player.name)}</div>
      ${player.title ? `<div class="popup-v2-title-badge">
        <svg class="popup-v2-title-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63L2 9.24L7 13.47L5.82 20.16L12 16.56L18.18 20.16L17 13.47L22 9.24L14.81 8.63L12 2Z"/></svg>
        ${escHtml(player.title)}</div>` : ''}
      <div class="popup-v2-position-block">
        <div class="popup-v2-position-label">POSITION</div>
        <div class="popup-v2-position-row">
          <div class="popup-v2-rank-badge">${rank ? rank+'.' : '—'}</div>
          <div class="popup-v2-overall">
            <span class="popup-v2-trophy">🏆</span>
            <span class="popup-v2-overall-label">OVERALL</span>
            <span class="popup-v2-overall-pts">(${pts} points)</span>
          </div>
        </div>
      </div>
      ${tiersHtml
        ? `<div class="popup-v2-tiers-section"><div class="popup-v2-tiers-label">TIERS</div><div class="popup-v2-tiers-grid">${tiersHtml}</div></div>`
        : '<div class="popup-v2-no-tiers">No tiers assigned yet</div>'}
    </div>`;
  ov.classList.add('open');
  ov.querySelector('#popup-close').addEventListener('click', () => ov.classList.remove('open'));
  ov.addEventListener('click', e => { if(e.target===ov) ov.classList.remove('open'); });
}

/* ── BUILD PLAYER ROW ────────────────────────────────────────────────────── */
const GLINTS = ['glint-gold','glint-silver','glint-bronze','glint-red','glint-red'];
function buildRow(player, rank, activeTab, allPlayers) {
  const pts     = calcPoints(player.tiers);
  const rankCls = rank<=5 ? ` r${rank}` : '';
  const glint   = rank<=5 ? ` ${GLINTS[rank-1]}` : '';
  const div = document.createElement('div');
  div.className = `prow${rankCls}${glint}`;
  div.style.animationDelay = `${Math.min((rank-1)*.04,.7)}s`;
  const titleHtml = player.title
    ? `<div class="row-title-line"><div class="row-title-icon"></div><span class="row-title">${escHtml(player.title)} (${pts} pts)</span></div>`
    : `<div class="row-title-line"><div class="row-title-icon"></div><span class="row-title">${pts} pts</span></div>`;
  div.innerHTML = `
    <div class="row-rank-block">
      <div class="row-rank">${rank}.</div>
      <div class="row-skin-wrap">
        <div class="skin-container">
          <img class="player-skin" src="${getSkin(player)}" alt="${escHtml(player.name)}" loading="lazy"
            onerror="this.onerror=null;this.src='https://mc-heads.net/body/Steve/left'"/>
        </div>
      </div>
    </div>
    <div class="row-main">
      <div class="row-info">
        <div class="row-name" title="${escHtml(player.name)}">${escHtml(player.name)}</div>
        ${titleHtml}
      </div>
      <div class="row-badges">${buildBadges(player.tiers||{}, activeTab)}</div>
      <div class="row-admin">
        <button class="btn-edit">Edit</button>
        <button class="btn-danger">Del</button>
      </div>
    </div>`;
  div.addEventListener('click', e => {
    if (e.target.closest('.row-admin')) return;
    openPopup(player, allPlayers);
  });
  div.querySelector('.btn-danger').addEventListener('click', async e => {
    e.stopPropagation();
    if (!isAdmin()) return;
    if (!confirm(`Remove "${player.name}"?`)) return;
    try { await fbDeletePlayer(player._docId); }
    catch(err) { alert('Error: ' + err.message); }
  });
  div.querySelector('.btn-edit').addEventListener('click', e => {
    e.stopPropagation();
    if (!isAdmin()) return;
    openEditModal(player);
  });
  return div;
}

/* ── RENDER LEADERBOARD ──────────────────────────────────────────────────── */
function renderLeaderboard(container, tab, query, players) {
  let list = [...players];
  if (tab && tab !== 'overall') {
    list = list.filter(p => p.tiers && typeof p.tiers[tab]==='string' && TIER_POINTS[p.tiers[tab]]);
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }
  list.sort((a,b) => calcPoints(b.tiers) - calcPoints(a.tiers));
  list = list.slice(0, 100);
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div class="lb-empty">No players found</div>';
    return 0;
  }
  list.forEach((p,i) => container.appendChild(buildRow(p, i+1, tab, players)));
  return list.length;
}

/* ── TABS ────────────────────────────────────────────────────────────────── */
function buildTabs(wrap, active, onChange) {
  wrap.innerHTML = '';
  TAB_META.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (t.key===active ? ' active' : '');
    btn.innerHTML = `<img class="tab-icon" src="${t.img}" alt="${t.label}"/><span>${t.label}</span>`;
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(t.key);
    });
    wrap.appendChild(btn);
  });
}

/* ── ADMIN STATE ─────────────────────────────────────────────────────────── */
function applyAdminUI() {
  const a = isAdmin();
  document.body.classList.toggle('admin-mode', a);
  const pill = document.getElementById('admin-pill');
  if (pill) pill.classList.toggle('visible', a);
  const loginBtn  = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('btn-logout');
  if (loginBtn)  loginBtn.style.display  = a ? 'none'  : 'block';
  if (logoutBtn) logoutBtn.style.display = a ? 'block' : 'none';
}

/* ── LOGIN MODAL ─────────────────────────────────────────────────────────── */
function mountLoginModal() {
  const loginBtn  = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('btn-logout');
  const ov        = document.getElementById('login-overlay');
  if (!ov) return;
  function doLogin() {
    const u = document.getElementById('l-u').value.trim();
    const p = document.getElementById('l-p').value;
    if (loginAdmin(u,p)) {
      ov.classList.remove('open');
      applyAdminUI();
    } else {
      document.getElementById('login-err').style.display = 'block';
    }
  }
  document.getElementById('l-btn').addEventListener('click', doLogin);
  document.getElementById('l-p').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  ov.addEventListener('click', e => { if(e.target===ov) ov.classList.remove('open'); });
  if (loginBtn)  loginBtn.addEventListener('click',  () => ov.classList.add('open'));
  if (logoutBtn) logoutBtn.addEventListener('click',  () => { logoutAdmin(); applyAdminUI(); });
}

/* ── EDIT MODAL ──────────────────────────────────────────────────────────── */
function openEditModal(player) {
  const ov   = document.getElementById('edit-overlay');
  if (!ov) return;
  const card = document.getElementById('edit-card');
  const gmHtml = GM_META.map(g => `
    <div class="fg">
      <label class="fl">${g.label}</label>
      <select class="fs" id="e-${g.key}">
        ${ALL_TIER_OPTS.map(v=>`<option value="${v}"${(player.tiers&&player.tiers[g.key]===v)?' selected':''}>${v||'Unrated'}</option>`).join('')}
      </select>
    </div>`).join('');
  card.innerHTML = `
    <div class="modal-head">
      <div class="modal-title" style="margin:0">Edit Player</div>
      <button class="modal-close" id="edit-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-grid-2">
        <div class="fg"><label class="fl">Username</label><input class="fi" id="e-name" value="${escHtml(player.name)}"/></div>
        <div class="skin-preview-area">
          <label class="fl">Skin Preview</label>
          <div class="skin-preview-box">
            <img id="e-prev" src="${getSkin(player)}" onerror="this.onerror=null;this.src='https://mc-heads.net/body/Steve/left'"/>
          </div>
        </div>
      </div>
      <div class="fg"><label class="fl">Custom Skin URL (optional)</label><input class="fi" id="e-skin" value="${escHtml(player.customSkin||'')}" placeholder="https://..."/></div>
      <div class="fg"><label class="fl">Title (optional)</label><input class="fi" id="e-title" value="${escHtml(player.title||'')}" placeholder="e.g. Combat Master"/></div>
      <div class="gm-section-lbl">Gamemode Tiers</div>
      <div class="gm-grid">${gmHtml}</div>
      <button class="btn btn-primary w100" id="e-save">Save Changes</button>
      <div class="form-msg" id="e-msg"></div>
    </div>`;
  ov.classList.add('open');
  function syncPrev() {
    const u = document.getElementById('e-skin').value.trim();
    const n = document.getElementById('e-name').value.trim();
    document.getElementById('e-prev').src = u || `https://mc-heads.net/body/${encodeURIComponent(n||'Steve')}/left`;
  }
  document.getElementById('e-skin').addEventListener('input', syncPrev);
  document.getElementById('e-name').addEventListener('input', syncPrev);
  document.getElementById('edit-close').addEventListener('click', () => ov.classList.remove('open'));
  ov.addEventListener('click', e => { if(e.target===ov) ov.classList.remove('open'); });
  document.getElementById('e-save').addEventListener('click', async () => {
    const msg = document.getElementById('e-msg');
    const updated = {
      name:       document.getElementById('e-name').value.trim() || player.name,
      customSkin: document.getElementById('e-skin').value.trim(),
      title:      document.getElementById('e-title').value.trim(),
      tiers: {},
    };
    GM_META.forEach(g => { updated.tiers[g.key] = document.getElementById(`e-${g.key}`).value; });
    try {
      await fbUpdatePlayer(player._docId, updated);
      msg.textContent = 'Saved!';
      msg.className = 'form-msg ok'; msg.style.display = 'block';
      setTimeout(() => { ov.classList.remove('open'); msg.style.display='none'; }, 1200);
    } catch(err) {
      msg.textContent = 'Error: ' + err.message;
      msg.className = 'form-msg err'; msg.style.display = 'block';
    }
  });
}

/* ── ADMIN ADD-PLAYER PANEL ──────────────────────────────────────────────── */
function mountAdminPanel() {
  const wrap = document.getElementById('admin-section');
  if (!wrap) return;
  const gmHtml = GM_META.map(g => `
    <div class="fg">
      <label class="fl">${g.label}</label>
      <select class="fs" id="f-${g.key}">
        ${ALL_TIER_OPTS.map(v=>`<option value="${v}">${v||'Unrated'}</option>`).join('')}
      </select>
    </div>`).join('');
  wrap.innerHTML = `
    <div class="admin-wrap">
      <div class="admin-card">
        <div class="admin-card-head">
          <div class="admin-card-title"><em>Add</em> Player</div>
        </div>
        <div class="admin-card-body">
          <div class="form-grid-2">
            <div>
              <div class="fg"><label class="fl">Username</label><input class="fi" id="f-name" placeholder="ExactUsername" autocomplete="off"/></div>
              <div class="fg"><label class="fl">Custom Skin URL (optional)</label><input class="fi" id="f-skin-url" placeholder="https://... or leave blank"/></div>
              <div class="fg"><label class="fl">Upload Skin File (optional)</label><input class="fi" id="f-skin-file" type="file" accept="image/*" style="cursor:pointer"/></div>
              <div class="skin-status" id="f-skin-status"></div>
            </div>
            <div class="skin-preview-area" style="padding-top:1.5rem">
              <div class="fl">Preview</div>
              <div class="skin-preview-box">
                <img id="f-prev" src="" alt="preview" style="opacity:.3" onerror="this.onerror=null;this.style.opacity='.2'"/>
              </div>
            </div>
          </div>
          <div class="fg"><label class="fl">Custom Title (optional)</label><input class="fi" id="f-title" placeholder="e.g. Combat Master"/></div>
          <div class="gm-section-lbl">Gamemode Tiers</div>
          <div class="gm-grid">${gmHtml}</div>
          <button class="btn btn-primary w100" id="f-add">Add Player</button>
          <div class="form-msg" id="f-msg"></div>
        </div>
      </div>
    </div>`;
  const nameEl   = document.getElementById('f-name');
  const urlEl    = document.getElementById('f-skin-url');
  const fileEl   = document.getElementById('f-skin-file');
  const prevImg  = document.getElementById('f-prev');
  const statusEl = document.getElementById('f-skin-status');
  let uploadedDataUrl = '';
  function updatePreview() {
    const custom = uploadedDataUrl || urlEl.value.trim();
    const name   = nameEl.value.trim();
    statusEl.textContent = '';
    if (custom) {
      prevImg.style.opacity = '1'; prevImg.src = custom;
      statusEl.textContent = uploadedDataUrl ? 'Uploaded file skin' : 'Custom URL skin';
    } else if (name) {
      prevImg.style.opacity = '1';
      prevImg.src = `https://mc-heads.net/body/${encodeURIComponent(name)}/left`;
      statusEl.textContent = 'Auto skin from mc-heads';
    } else {
      prevImg.style.opacity = '.3'; prevImg.src = '';
    }
  }
  nameEl.addEventListener('input', updatePreview);
  urlEl.addEventListener('input', () => { uploadedDataUrl = ''; updatePreview(); });
  fileEl.addEventListener('change', () => {
    const file = fileEl.files[0];
    if (!file) { uploadedDataUrl = ''; updatePreview(); return; }
    if (!file.type.startsWith('image/')) { statusEl.textContent = 'Not an image'; return; }
    const reader = new FileReader();
    reader.onload = e => { uploadedDataUrl = e.target.result; updatePreview(); };
    reader.readAsDataURL(file);
  });
  document.getElementById('f-add').addEventListener('click', async () => {
    const name = nameEl.value.trim();
    const msg  = document.getElementById('f-msg');
    if (!name) {
      msg.textContent = 'Please enter a username.';
      msg.className = 'form-msg err'; msg.style.display = 'block';
      return;
    }
    const tiers = {};
    GM_META.forEach(g => { tiers[g.key] = document.getElementById(`f-${g.key}`).value; });
    const player = { name, customSkin: uploadedDataUrl || urlEl.value.trim(), title: document.getElementById('f-title').value.trim(), tiers };
    try {
      await fbAddPlayer(player);
      msg.textContent = `${name} added!`;
      msg.className = 'form-msg ok'; msg.style.display = 'block';
      nameEl.value = ''; urlEl.value = ''; fileEl.value = '';
      document.getElementById('f-title').value = '';
      GM_META.forEach(g => { document.getElementById(`f-${g.key}`).value = ''; });
      uploadedDataUrl = ''; prevImg.style.opacity = '.3'; prevImg.src = ''; statusEl.textContent = '';
      setTimeout(() => { msg.style.display = 'none'; }, 3000);
    } catch(err) {
      msg.textContent = 'Error: ' + err.message;
      msg.className = 'form-msg err'; msg.style.display = 'block';
    }
  });
}

/* ── PAGE INIT ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const lbEl = document.getElementById('leaderboard');
  if (lbEl) {
    const tabsWrap = document.getElementById('tabs');
    const searchEl = document.getElementById('search');
    let activeTab  = 'overall';
    let allPlayers = [];

    if (tabsWrap) buildTabs(tabsWrap, activeTab, key => { activeTab = key; doRender(); });
    if (searchEl) searchEl.addEventListener('input', doRender);

    function doRender() {
      const n = renderLeaderboard(lbEl, activeTab, searchEl ? searchEl.value : '', allPlayers);
      updateCount(n);
    }

    // REAL-TIME — all users see updates instantly
    db.collection('players')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        allPlayers = snapshot.docs.map(doc => ({ ...doc.data(), _docId: doc.id }));
        doRender();
      }, err => {
        console.error('Firestore error:', err);
        lbEl.innerHTML = '<div class="lb-empty">Failed to load. Check console.</div>';
      });

    mountAdminPanel();
    mountLoginModal();
    applyAdminUI();
    return;
  }

  // HOME PAGE
  mountLoginModal();
  applyAdminUI();
});
