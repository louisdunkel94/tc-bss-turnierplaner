// ── PocketBase ────────────────────────────────────────────────
const POCKETBASE_URL = (typeof CONFIG !== 'undefined' ? CONFIG.POCKETBASE_URL : null) || 'YOUR_POCKETBASE_URL'
const DEMO_MODE = POCKETBASE_URL === 'YOUR_POCKETBASE_URL'
const pb = DEMO_MODE ? null : new PocketBase(POCKETBASE_URL)

let currentUser = null
let currentProfile = null
let activeTournamentId = null
let _showArchive = false

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  if (sessionStorage.getItem('tc_auth') !== '1') { window.location.replace('index.html'); return }

  currentUser = { id: 'admin' }
  currentProfile = { id: 'admin', display_name: 'TC BSS', role: 'admin' }

  if (DEMO_MODE) {
    const banner = document.createElement('div')
    banner.className = 'fixed top-0 left-0 right-0 z-[100] bg-yellow-500/90 text-black text-xs font-headline font-bold text-center py-1.5 px-4'
    banner.textContent = '⚠ Lokaler Modus – Daten werden nur in diesem Browser gespeichert.'
    document.body.prepend(banner)
    document.querySelector('header').style.top = '28px'
  }

  const chip = document.getElementById('user-chip')
  chip.classList.remove('hidden'); chip.classList.add('flex')
  document.getElementById('user-avatar').textContent = 'TC'
  document.getElementById('user-name').textContent = 'TC BSS'
  document.getElementById('user-role-badge').textContent = 'Administrator'

  render()
}

function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

// ── Render ───────────────────────────────────────────────────
async function render() {
  await renderVeranstalter(document.getElementById('app'))
}

// ── Demo store (localStorage fallback) ───────────────────────
const DS = {
  get tourneys()  { try { return JSON.parse(localStorage.getItem('tc_tourneys')||'[]') } catch{ return [] } },
  set tourneys(v) { localStorage.setItem('tc_tourneys', JSON.stringify(v)) },
  get regs()      { try { return JSON.parse(localStorage.getItem('tc_regs')||'[]') } catch{ return [] } },
  set regs(v)     { localStorage.setItem('tc_regs', JSON.stringify(v)) },
}

const _cache = { tourneys: [] }

async function dbTourneys(statusFilter) {
  if (DEMO_MODE) {
    let t = DS.tourneys
    if (statusFilter) t = t.filter(x => statusFilter.includes(x.status))
    const result = t.map(t => ({ ...t, _participant_count: DS.regs.filter(r=>r.tournament_id===t.id).length }))
    _cache.tourneys = DS.tourneys
    return result
  }

  let filter = ''
  if (statusFilter) filter = statusFilter.map(s => `status = "${s}"`).join(' || ')

  const [tourneys, allParticipants] = await Promise.all([
    pb.collection('tournaments').getFullList({ filter, sort: '-created' }),
    pb.collection('participants').getFullList({ fields: 'tournament' })
  ])

  const countMap = {}
  allParticipants.forEach(p => { countMap[p.tournament] = (countMap[p.tournament] || 0) + 1 })

  const result = tourneys.map(t => ({ ...t, _participant_count: countMap[t.id] || 0 }))
  _cache.tourneys = tourneys
  return result
}

function findCachedTourney(id) {
  return _cache.tourneys.find(t => t.id === id) || DS.tourneys.find(t => t.id === id)
}

async function dbMyRegs() {
  if (DEMO_MODE) return DS.regs.filter(r => r.user_id === currentUser.id)
  return []
}

// ── Mitglied ─────────────────────────────────────────────────
async function renderMitglied(app) {
  const tourneys = await dbTourneys(['open','running'])
  const myRegs   = await dbMyRegs()
  const myIds    = new Set(myRegs.map(r => r.tournament_id))

  app.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-headline font-bold text-white tracking-tight">Willkommen${currentProfile?.display_name ? ', ' + esc(currentProfile.display_name.split(' ')[0]) : ''}</h1>
      <p class="text-white/40 font-body mt-1">Hier sind die aktuellen Turniere.</p>
    </div>
    ${!tourneys?.length
      ? `<div class="text-center py-20 text-white/30 font-body">
           <span class="material-symbols-outlined text-4xl block mb-3">event_busy</span>
           Keine offenen Turniere gerade
         </div>`
      : `<div class="grid gap-4 md:grid-cols-2">${tourneys.map(t => tournamentCard(t, myIds.has(t.id), false)).join('')}</div>`}
  `
}

// ── Veranstalter ─────────────────────────────────────────────
async function renderVeranstalter(app) {
  const tourneys = await dbTourneys()
  const myRegs   = await dbMyRegs()
  const myIds    = new Set(myRegs.map(r => r.tournament_id))

  const active   = (tourneys||[]).filter(t => t.status !== 'closed')
  const archived = (tourneys||[]).filter(t => t.status === 'closed')

  app.innerHTML = `
    <div class="flex items-start justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-headline font-bold text-white tracking-tight">Turniere</h1>
        <p class="text-white/40 font-body mt-1">Verwalte und erstelle Turniere.</p>
      </div>
      <button onclick="openCreateModal()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
        <span class="material-symbols-outlined text-base">add</span>Turnier erstellen
      </button>
    </div>
    ${!active.length && !archived.length
      ? `<div class="text-center py-16 text-white/30 font-body">
           <span class="material-symbols-outlined text-4xl block mb-3">add_circle</span>
           <p class="mb-5">Noch keine Turniere — erstelle das erste!</p>
           <button onclick="loadExampleTournament()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-semibold bg-white/5 text-white/30 hover:text-secondary-fixed hover:bg-white/8 transition-colors">
             <span class="material-symbols-outlined text-sm">science</span>Beispielturnier laden
           </button>
         </div>`
      : `
        ${active.length
          ? `<div class="grid gap-4 md:grid-cols-2">${active.map(t => tournamentCard(t, myIds.has(t.id), true)).join('')}</div>`
          : `<div class="text-center py-12 text-white/30 font-body">
               <span class="material-symbols-outlined text-3xl block mb-2">event_busy</span>
               Keine aktiven Turniere
             </div>`}
        ${archived.length ? `
        <section class="mt-10">
          <button onclick="_showArchive=!_showArchive;render()" class="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors font-headline font-semibold text-sm mb-1">
            <span class="material-symbols-outlined text-base">inventory_2</span>
            Archiv <span class="text-white/25 font-normal">(${archived.length})</span>
            <span class="material-symbols-outlined text-base ml-1">${_showArchive ? 'expand_less' : 'expand_more'}</span>
          </button>
          ${_showArchive ? `<div class="grid gap-4 md:grid-cols-2 mt-4 opacity-60">${archived.map(t => tournamentCard(t, myIds.has(t.id), true)).join('')}</div>` : ''}
        </section>` : ''}
        ${DEMO_MODE ? `<div class="text-center mt-6">
          <button onclick="loadExampleTournament()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-headline font-semibold text-white/20 hover:text-secondary-fixed hover:bg-white/5 transition-colors">
            <span class="material-symbols-outlined text-sm">science</span>Beispielturnier neu laden
          </button>
        </div>` : ''}`}
  `
}

// ── Admin ─────────────────────────────────────────────────────
async function renderAdmin(app) {
  const [tourneys, members, myRegs] = await Promise.all([dbTourneys(), dbMembers(), dbMyRegs()])
  const myIds = new Set(myRegs.map(r => r.tournament_id))

  app.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-headline font-bold text-white tracking-tight">Admin</h1>
      <p class="text-white/40 font-body mt-1">Übersicht aller Mitglieder und Turniere.</p>
    </div>

    <section class="mb-10">
      <h2 class="text-lg font-headline font-bold text-white mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-white/40">group</span>
        Mitglieder <span class="text-white/30 font-normal text-sm">(${members?.length||0})</span>
      </h2>
      <div class="rounded-2xl border border-white/5 overflow-hidden bg-black/20">
        <div class="overflow-x-auto">
          <table class="w-full text-sm font-body">
            <thead>
              <tr class="border-b border-white/5 text-white/30 text-xs font-headline uppercase tracking-wider">
                <th class="text-left px-4 py-3">Name</th>
                <th class="text-left px-4 py-3 hidden md:table-cell">E-Mail</th>
                <th class="text-left px-4 py-3">Rolle</th>
                <th class="text-left px-4 py-3 hidden md:table-cell">Dabei seit</th>
              </tr>
            </thead>
            <tbody>
              ${(members||[]).map(m => `
                <tr class="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-secondary-fixed/15 flex items-center justify-center text-xs font-headline font-bold text-secondary-fixed flex-shrink-0">
                        ${(m.display_name||m.email).slice(0,2).toUpperCase()}
                      </div>
                      <span class="font-semibold text-white">${esc(m.display_name||'–')}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-white/50 hidden md:table-cell">${esc(m.email)}</td>
                  <td class="px-4 py-3">
                    <select onchange="changeRole('${m.id}', this.value)" ${m.id===currentUser.id?'disabled':''} class="bg-transparent border-none text-sm font-body cursor-pointer focus:outline-none">
                      ${['mitglied','veranstalter','admin'].map(r => `<option value="${r}" ${m.role===r?'selected':''} class="bg-[#1a3320]">${roleLabel(r)}</option>`).join('')}
                    </select>
                  </td>
                  <td class="px-4 py-3 text-white/30 hidden md:table-cell">${new Date(m.created_at||m.created).toLocaleDateString('de-DE')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-headline font-bold text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-white/40">emoji_events</span>
          Turniere <span class="text-white/30 font-normal text-sm">(${tourneys?.length||0})</span>
        </h2>
        <button onclick="openCreateModal()" class="flex items-center gap-1.5 text-sm text-white/40 hover:text-secondary-fixed transition-colors font-headline font-semibold px-3 py-1.5 rounded-xl hover:bg-white/5">
          <span class="material-symbols-outlined text-sm">add</span>Neu
        </button>
      </div>
      <div class="grid gap-4 md:grid-cols-2">${(tourneys||[]).map(t => tournamentCard(t, myIds.has(t.id), true)).join('')}</div>
    </section>
  `
}

// ── Tournament card ───────────────────────────────────────────
function tournamentCard(t, isRegistered, isOrganizer) {
  const statusConfig = {
    draft:   { label: 'Entwurf',      color: 'bg-white/10 text-white/40' },
    open:    { label: 'Offen',        color: 'bg-secondary-fixed/15 text-secondary-fixed' },
    running: { label: 'Läuft',        color: 'bg-green-500/15 text-green-400' },
    closed:  { label: 'Abgeschlossen',color: 'bg-white/5 text-white/25' },
  }
  const modeLabels = Object.fromEntries(Object.entries(MODES).map(([k,v]) => [k, v.label]))
  const genderLabels = { mixed: 'Mixed', herren: 'Nur Herren', damen: 'Nur Damen', offen: 'Offen' }
  const sc = statusConfig[t.status] || statusConfig.draft
  const count = t._participant_count ?? 0
  const full = count >= t.max_participants
  const canRegister = t.status === 'open' && !isRegistered && !full

  const dateStr = t.start_at
    ? new Date(t.start_at).toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    : '–'

  return `
    <div class="rounded-2xl bg-black/25 border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
      <div class="px-5 pt-5 pb-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <h3 class="font-headline font-bold text-white text-base leading-tight">${esc(t.name)}</h3>
          <span class="text-[11px] font-headline font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${sc.color}">${sc.label}</span>
        </div>
        <div class="space-y-1.5 text-xs text-white/45 font-body">
          <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-xs">schedule</span>${dateStr}${t.duration_hours ? ` · ${t.duration_hours}h` : ''}</div>
          <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-xs">sports_tennis</span>${modeLabels[t.game_mode]||t.game_mode} · ${genderLabels[t.gender_requirement]||t.gender_requirement}</div>
          ${t.skill_requirement ? `<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-xs">leaderboard</span>${esc(t.skill_requirement)}</div>` : ''}
          <button onclick="openParticipantsModal('${t.id}',${isOrganizer})" class="flex items-center gap-1.5 hover:text-white/70 transition-colors text-left"><span class="material-symbols-outlined text-xs">group</span>${count} / ${t.max_participants} Spieler${full ? ' · <span class="text-red-400">Voll</span>' : ''}</button>
        </div>
      </div>
      <div class="px-5 pb-4 flex gap-2 flex-wrap">
        ${canRegister ? `<button onclick="registerForTournament('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
          <span class="material-symbols-outlined text-xs">how_to_reg</span>Anmelden
        </button>` : ''}
        ${isRegistered && t.status === 'open' ? `<button onclick="unregisterFromTournament('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-red-900/30 hover:text-red-300 transition-colors">
          <span class="material-symbols-outlined text-xs">person_remove</span>Abmelden
        </button>` : ''}
        ${isRegistered && t.status !== 'open' ? `<span class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-secondary-fixed/10 text-secondary-fixed/60">
          <span class="material-symbols-outlined text-xs">check</span>Angemeldet
        </span>` : ''}
        ${isOrganizer ? `
          ${t.status === 'draft' ? `<button onclick="setTournamentStatus('${t.id}','open')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">public</span>Veröffentlichen
          </button>` : ''}
          ${t.status === 'open' ? `<button onclick="setTournamentStatus('${t.id}','running')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">play_arrow</span>Starten
          </button>` : ''}
          ${t.status === 'running' ? `<a href="tournament.html?id=${t.id}" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors no-underline">
            <span class="material-symbols-outlined text-xs">open_in_new</span>Spielplan
          </a>` : ''}
          ${(t.status === 'open' || t.status === 'running') ? `<button onclick="openQR('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">qr_code_2</span>Check-in
          </button>` : ''}
          ${t.status !== 'closed' ? `<button onclick="openEmailModal('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">mail</span>Info-Mail
          </button>` : ''}
          ${t.status === 'running' ? `<button onclick="setTournamentStatus('${t.id}','closed')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/50 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">stop</span>Beenden
          </button>` : ''}
          ${t.status !== 'running' ? `<button onclick="openEditModal('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">edit</span>Bearbeiten
          </button>` : ''}
          <button onclick="saveAsTemplate('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            <span class="material-symbols-outlined text-xs">bookmark_add</span>Vorlage
          </button>
          ${t.status === 'draft' ? `<button onclick="deleteTournament('${t.id}')" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/5 text-white/30 hover:bg-red-900/30 hover:text-red-300 transition-colors">
            <span class="material-symbols-outlined text-xs">delete</span>Löschen
          </button>` : ''}
        ` : ''}
      </div>
    </div>`
}

// ── Actions ───────────────────────────────────────────────────
async function registerForTournament(id) {
  if (DEMO_MODE) {
    DS.regs = [...DS.regs, { tournament_id: id, user_id: currentUser.id, gender: currentProfile?.gender || 'offen' }]
    toast('Erfolgreich angemeldet!'); render(); return
  }
  try {
    await pb.collection('participants').create({ tournament: id, user: currentUser.id, gender: currentProfile?.gender })
    toast('Erfolgreich angemeldet!'); render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

async function unregisterFromTournament(id) {
  if (DEMO_MODE) {
    DS.regs = DS.regs.filter(r => !(r.tournament_id === id && r.user_id === currentUser.id))
    toast('Abgemeldet.'); render(); return
  }
  try {
    const record = await pb.collection('participants').getFirstListItem(`tournament = "${id}" && user = "${currentUser.id}"`)
    await pb.collection('participants').delete(record.id)
    toast('Abgemeldet.'); render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

async function setTournamentStatus(id, status) {
  if (DEMO_MODE) {
    DS.tourneys = DS.tourneys.map(t => t.id === id ? { ...t, status } : t)
    toast(`Status: ${status}`); render(); return
  }
  try {
    await pb.collection('tournaments').update(id, { status })
    toast(`Status: ${status}`); render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

async function changeRole(userId, role) {
  if (DEMO_MODE) { toast('Im Demo-Modus nicht verfügbar'); return }
  try {
    await pb.collection('users').update(userId, { role })
    toast(`Rolle geändert: ${roleLabel(role)}`)
  } catch(e) { toast('Fehler: ' + e.message) }
}

// ── Tournament Modes ─────────────────────────────────────────
const MODES = {
  geloste_paarungen: { label: 'Geloste Paarungen',       icon: 'shuffle',      desc: 'Zufällige Mixed-Teams jede Runde per 3-Topf-Losverfahren. Punkte laufen individuell.' },
  americano:         { label: 'Amerikanisches Turnier',  icon: 'sync_alt',     desc: 'Spieler rotieren Partner jede Runde – soziales Format, jeder spielt mit jedem zusammen.' },
  round_robin:       { label: 'Jeder gegen jeden',       icon: 'grid_view',    desc: 'Alle spielen gegen alle in festen Paarungen. Die Tabelle entscheidet den Sieger.' },
  gruppenphase_ko:   { label: 'Gruppenphase + KO',       icon: 'account_tree', desc: 'Gruppenspiele in Pools, dann KO-Runden für die Besten jeder Gruppe.' },
  einfaches_ko:      { label: 'Einfaches KO',            icon: 'trophy',       desc: 'Klassisches Bracket – wer verliert, scheidet sofort aus.' },
  doppeltes_ko:      { label: 'Doppeltes KO',            icon: 'repeat_on',    desc: 'Verlierer kommen ins Verlierer-Bracket und haben eine zweite Chance.' },
  schweizer_system:  { label: 'Schweizer System',        icon: 'leaderboard',  desc: 'Spieler mit ähnlicher Punktzahl spielen gegeneinander. Keine Ausscheidung.' },
}

function renderModeCards(selected) {
  const container = document.getElementById('mode-cards')
  if (!container) return
  container.innerHTML = Object.entries(MODES).map(([key, m]) => {
    const active = key === selected
    return `<button type="button" onclick="selectMode('${key}')"
      class="w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all ${active
        ? 'border-secondary-fixed/60 bg-secondary-fixed/10'
        : 'border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/15'}">
      <span class="material-symbols-outlined text-lg mt-0.5 flex-shrink-0 ${active ? 'text-secondary-fixed' : 'text-white/40'}">${m.icon}</span>
      <div>
        <div class="font-headline font-bold text-sm ${active ? 'text-secondary-fixed' : 'text-white/85'}">${m.label}</div>
        <div class="text-xs text-white/35 font-body mt-0.5 leading-snug">${m.desc}</div>
      </div>
    </button>`
  }).join('')
  document.getElementById('t-mode').value = selected
}

function selectMode(key) { renderModeCards(key) }

// ── Create / Edit Tournament ──────────────────────────────────
let _editingId = null

function openCreateModal() {
  _editingId = null
  document.getElementById('modal-create-title').textContent = 'Turnier erstellen'
  document.getElementById('form-create').reset()
  document.getElementById('template-row').style.display = ''
  refreshTemplateSelect()
  renderModeCards('geloste_paarungen')
  document.getElementById('modal-create').showModal()
}

function openEditModal(id) {
  const t = findCachedTourney(id)
  if (!t) return
  _editingId = id
  document.getElementById('modal-create-title').textContent = 'Turnier bearbeiten'
  document.getElementById('template-row').style.display = 'none'
  document.getElementById('t-name').value = t.name || ''
  renderModeCards(t.game_mode || 'geloste_paarungen')
  document.getElementById('t-gender').value = t.gender_requirement || 'mixed'
  document.getElementById('t-skill').value = t.skill_requirement || ''
  if (t.start_at) document.getElementById('t-start').value = t.start_at.slice(0, 16)
  document.getElementById('t-duration').value = t.duration_hours || 3
  document.getElementById('t-maxp').value = t.max_participants || 30
  document.getElementById('t-courts').value = t.num_courts || 6
  document.getElementById('t-rounds').value = t.num_rounds || 5
  document.getElementById('modal-create').showModal()
}

function closeModal() { document.getElementById('modal-create').close() }

async function handleCreateTournament(e) {
  e.preventDefault()
  const btn = document.getElementById('btn-create')
  btn.disabled = true; btn.textContent = '…'

  const payload = {
    name: document.getElementById('t-name').value.trim(),
    game_mode: document.getElementById('t-mode').value,
    gender_requirement: document.getElementById('t-gender').value,
    skill_requirement: document.getElementById('t-skill').value.trim() || null,
    start_at: document.getElementById('t-start').value || null,
    duration_hours: parseInt(document.getElementById('t-duration').value) || 3,
    max_participants: parseInt(document.getElementById('t-maxp').value) || 30,
    num_courts: parseInt(document.getElementById('t-courts').value) || 6,
    num_rounds: parseInt(document.getElementById('t-rounds').value) || 5,
  }

  if (DEMO_MODE) {
    if (_editingId) {
      DS.tourneys = DS.tourneys.map(t => t.id === _editingId ? { ...t, ...payload } : t)
      toast('Turnier gespeichert!')
    } else {
      DS.tourneys = [{ ...payload, id: 'demo_' + Date.now(), created_by: currentUser.id, status: 'draft', created_at: new Date().toISOString() }, ...DS.tourneys]
      toast('Turnier erstellt!')
    }
    btn.disabled = false; btn.textContent = 'Speichern'
    closeModal(); render(); return
  }

  try {
    if (_editingId) {
      await pb.collection('tournaments').update(_editingId, payload)
      toast('Turnier gespeichert!')
    } else {
      await pb.collection('tournaments').create({ ...payload, status: 'draft' })
      toast('Turnier erstellt!')
    }
    btn.disabled = false; btn.textContent = 'Speichern'
    closeModal(); render()
  } catch(e) {
    btn.disabled = false; btn.textContent = 'Speichern'
    toast('Fehler: ' + e.message)
  }
}

// ── Delete Tournament ─────────────────────────────────────────
async function deleteTournament(id) {
  if (!confirm('Turnier wirklich löschen?')) return
  if (DEMO_MODE) {
    DS.tourneys = DS.tourneys.filter(t => t.id !== id)
    DS.regs = DS.regs.filter(r => r.tournament_id !== id)
    toast('Turnier gelöscht'); render(); return
  }
  try {
    await pb.collection('tournaments').delete(id)
    toast('Turnier gelöscht'); render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

// ── Templates ─────────────────────────────────────────────────
function getTemplates() { try { return JSON.parse(localStorage.getItem('tc_templates')||'[]') } catch { return [] } }
function setTemplates(v) { localStorage.setItem('tc_templates', JSON.stringify(v)) }

function saveAsTemplate(id) {
  const t = findCachedTourney(id)
  if (!t) return
  const tpl = {
    id: 'tpl_' + Date.now(),
    name: t.name,
    game_mode: t.game_mode,
    gender_requirement: t.gender_requirement,
    skill_requirement: t.skill_requirement,
    duration_hours: t.duration_hours,
    max_participants: t.max_participants,
    num_courts: t.num_courts,
    num_rounds: t.num_rounds,
  }
  setTemplates([tpl, ...getTemplates().filter(x => x.name !== tpl.name)])
  toast('Als Vorlage gespeichert: ' + tpl.name)
}

function refreshTemplateSelect() {
  const sel = document.getElementById('t-template')
  if (!sel) return
  const templates = getTemplates()
  sel.innerHTML = '<option value="">— Vorlage wählen —</option>' +
    templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')
}

function loadTemplate(id) {
  if (!id) return
  const t = getTemplates().find(x => x.id === id)
  if (!t) return
  document.getElementById('t-name').value = t.name || ''
  renderModeCards(t.game_mode || 'geloste_paarungen')
  document.getElementById('t-gender').value = t.gender_requirement || 'mixed'
  document.getElementById('t-skill').value = t.skill_requirement || ''
  document.getElementById('t-duration').value = t.duration_hours || 3
  document.getElementById('t-maxp').value = t.max_participants || 30
  document.getElementById('t-courts').value = t.num_courts || 6
  document.getElementById('t-rounds').value = t.num_rounds || 5
}

// ── Email Modal ───────────────────────────────────────────────
function openEmailModal(tournamentId) {
  activeTournamentId = tournamentId
  document.getElementById('modal-email').showModal()
}

async function sendEmail() {
  const subject = document.getElementById('email-subject').value.trim()
  const body = document.getElementById('email-body').value.trim()
  if (!subject || !body) { toast('Betreff und Nachricht ausfüllen'); return }

  const btn = document.getElementById('btn-send-email')
  btn.disabled = true

  if (DEMO_MODE) {
    btn.disabled = false
    document.getElementById('modal-email').close()
    toast('Demo-Modus: E-Mail würde versendet werden'); return
  }

  try {
    await fetch(POCKETBASE_URL + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': pb.authStore.token },
      body: JSON.stringify({ tournament_id: activeTournamentId, subject, body })
    })
    document.getElementById('modal-email').close()
    document.getElementById('email-subject').value = ''
    document.getElementById('email-body').value = ''
    toast('E-Mails versendet!')
  } catch(e) {
    toast('Fehler beim Senden: ' + e.message)
  } finally {
    btn.disabled = false
  }
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
  if (DEMO_MODE) sessionStorage.removeItem('tc_auth')
  else pb.authStore.clear()
  window.location.replace('index.html')
}

// ── QR Code ───────────────────────────────────────────────────
let _qrTournamentId = null

function openQR(tournamentId) {
  _qrTournamentId = tournamentId
  const tournamentName = findCachedTourney(tournamentId)?.name || ''
  document.getElementById('qr-tourney-name').textContent = tournamentName
  const base = location.href.replace(/[^/]*(\?.*)?$/, '')
  const url  = base + 'checkin.html?t=' + tournamentId
  const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url) + '&bgcolor=ffffff&color=0a1f0b&margin=10'
  document.getElementById('qr-img').src = qrSrc
  document.getElementById('modal-qr').showModal()
}

function printQR() {
  const name = document.getElementById('qr-tourney-name').textContent
  const img  = document.getElementById('qr-img').src
  if (!img) return
  const scriptOpen  = '<scr' + 'ipt>'
  const scriptClose = '<\/scr' + 'ipt>'
  const html = [
    '<!DOCTYPE html><html>',
    '<head><title>Check-in QR</title>',
    '<style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:#fff;}',
    'h2{font-size:1.4rem;font-weight:900;color:#003908;margin-bottom:1rem;text-align:center;}',
    'p{color:#555;font-size:.9rem;margin-top:.75rem;}</style>',
    '</head><body>',
    '<h2>' + esc(name) + '</h2>',
    '<img src="' + img + '" width="280"/>',
    '<p>QR-Code scannen zum Einchecken</p>',
    scriptOpen + 'window.onload=function(){window.print();window.close()}' + scriptClose,
    '</body></html>'
  ].join('')
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(function(){ URL.revokeObjectURL(url) }, 5000)
}

// ── Check-in overview ─────────────────────────────────────────
async function openCheckinOverview() {
  document.getElementById('modal-checkin').showModal()
  await refreshCheckins()
}

async function refreshCheckins() {
  const list = document.getElementById('checkin-list')
  list.innerHTML = '<div class="text-white/30 text-sm font-body text-center py-4">Lade…</div>'

  let participants = []

  if (DEMO_MODE) {
    const regs = DS.regs.filter(r => r.tournament_id === _qrTournamentId)
    participants = regs.map(r => ({
      display_name: r.display_name || (r.user_id === 'demo' ? (currentProfile?.display_name || 'Demo User') : r.user_id),
      email: r.user_id === 'demo' ? currentUser.email : '',
      gender: r.gender,
      checked_in: r.checked_in || false,
    }))
  } else {
    const items = await pb.collection('participants').getFullList({
      filter: `tournament = "${_qrTournamentId}"`,
      expand: 'user',
      sort: '-checked_in'
    })
    participants = items.map(p => ({
      display_name: p.expand?.user?.display_name || p.display_name || p.expand?.user?.email || '–',
      gender: p.gender,
      checked_in: p.checked_in || false,
      checked_in_at: p.checked_in_at || null
    }))
  }

  const checkedIn = participants.filter(p => p.checked_in).length
  document.getElementById('checkin-count').textContent = `${checkedIn} / ${participants.length} da`

  if (!participants.length) {
    list.innerHTML = '<p class="text-white/30 text-sm font-body text-center py-6">Keine Anmeldungen</p>'
    return
  }

  list.innerHTML = participants.map(p => {
    const name = p.display_name || '–'
    const ic   = p.gender === 'herr' ? 'text-blue-400' : 'text-pink-400'
    return `<div class="flex items-center gap-3 px-3 py-2.5 rounded-xl ${p.checked_in ? 'bg-secondary-fixed/8 border border-secondary-fixed/15' : 'bg-white/5 border border-white/5'}">
      <span class="material-symbols-outlined text-base ${ic}">person</span>
      <span class="flex-1 text-sm font-body font-medium ${p.checked_in ? 'text-white' : 'text-white/40'}">${esc(name)}</span>
      ${p.checked_in
        ? `<span class="flex items-center gap-1 text-xs font-headline font-bold text-secondary-fixed"><span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">check_circle</span>Da</span>`
        : `<span class="text-xs text-white/20 font-body">Ausstehend</span>`}
    </div>`
  }).join('')
}

// ── Participants Modal ────────────────────────────────────────
let _participantsTournamentId = null
let _participantsIsOrganizer = false

async function openParticipantsModal(tournamentId, isOrganizer) {
  _participantsTournamentId = tournamentId
  _participantsIsOrganizer = isOrganizer
  const tournamentName = findCachedTourney(tournamentId)?.name || ''
  document.getElementById('participants-title').textContent = tournamentName
  document.getElementById('add-participant-form').style.display = isOrganizer ? '' : 'none'
  document.getElementById('modal-participants').showModal()
  await refreshParticipants()
}

async function refreshParticipants() {
  const list = document.getElementById('participants-list')
  list.innerHTML = '<div class="text-white/30 text-sm font-body text-center py-4">Lade…</div>'
  let participants = []

  if (DEMO_MODE) {
    const regs = DS.regs.filter(r => r.tournament_id === _participantsTournamentId)
    participants = regs.map(r => ({
      id: r.user_id,
      display_name: r.display_name || r.user_id,
      gender: r.gender,
      checked_in: r.checked_in || false,
    }))
  } else {
    const items = await pb.collection('participants').getFullList({
      filter: `tournament = "${_participantsTournamentId}"`,
      expand: 'user'
    })
    participants = items.map(p => ({
      id: p.id,
      display_name: p.expand?.user?.display_name || p.display_name || p.expand?.user?.email || '–',
      gender: p.gender,
      checked_in: p.checked_in || false,
    }))
  }

  if (!participants.length) {
    list.innerHTML = '<p class="text-white/30 text-sm font-body text-center py-6">Noch keine Anmeldungen</p>'
    return
  }

  list.innerHTML = participants.map(p => {
    const ic = p.gender === 'herr' ? 'text-blue-400' : 'text-pink-400'
    const removeBtn = _participantsIsOrganizer
      ? `<button onclick="removeParticipant('${p.id}')" class="text-white/20 hover:text-red-400 transition-colors"><span class="material-symbols-outlined text-sm">person_remove</span></button>`
      : ''
    return `<div class="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
      <span class="material-symbols-outlined text-base ${ic}">person</span>
      <span class="flex-1 text-sm font-body font-medium text-white/70">${esc(p.display_name)}</span>
      ${p.checked_in ? `<span class="text-xs font-headline font-bold text-secondary-fixed">Da</span>` : ''}
      ${removeBtn}
    </div>`
  }).join('')
}

async function addManualParticipant() {
  const name = document.getElementById('p-name').value.trim().slice(0, 60)
  const gender = document.getElementById('p-gender').value
  if (!name) return

  if (DEMO_MODE) {
    const reg = { tournament_id: _participantsTournamentId, user_id: 'manual_' + Date.now(), display_name: name, gender, checked_in: false }
    DS.regs = [...DS.regs, reg]
    document.getElementById('p-name').value = ''
    await refreshParticipants()
    render()
    return
  }

  try {
    await pb.collection('participants').create({
      tournament: _participantsTournamentId,
      display_name: name,
      gender,
      checked_in: false
    })
    document.getElementById('p-name').value = ''
    await refreshParticipants()
    render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

async function importCSV(input) {
  const file = input.files[0]
  if (!file) return
  const text = await file.text()
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  let added = 0
  for (const line of lines) {
    const parts = line.split(/[;,]/).map(p => p.trim())
    const name = parts[0]
    if (!name || name.toLowerCase() === 'name') continue

    let gender = ''
    if (parts[1]) {
      const g = parts[1].toLowerCase()
      if (g === 'dame' || g === 'w' || g === 'f' || g === 'weiblich') gender = 'dame'
      else if (g === 'herr' || g === 'm' || g === 'männlich') gender = 'herr'
    }

    if (DEMO_MODE) {
      DS.regs = [...DS.regs, {
        tournament_id: _participantsTournamentId,
        user_id: 'manual_' + Date.now() + '_' + added,
        display_name: name,
        gender,
        checked_in: false
      }]
    } else {
      try {
        await pb.collection('participants').create({ tournament: _participantsTournamentId, display_name: name, gender, checked_in: false })
      } catch(e) { toast('Fehler bei ' + name + ': ' + e.message); continue }
    }
    added++
  }

  input.value = ''
  await refreshParticipants()
  render()
  toast(`${added} Spieler importiert`)
}

async function removeParticipant(id) {
  if (!confirm('Teilnehmer entfernen?')) return
  if (DEMO_MODE) {
    DS.regs = DS.regs.filter(r => !(r.tournament_id === _participantsTournamentId && r.user_id === id))
    await refreshParticipants()
    render()
    return
  }
  try {
    await pb.collection('participants').delete(id)
    await refreshParticipants()
    render()
  } catch(e) { toast('Fehler: ' + e.message) }
}

// ── Beispielturnier ───────────────────────────────────────────
function loadExampleTournament() {
  const id = 'example_' + Date.now()
  const start = new Date()
  start.setDate(start.getDate() + 7)
  start.setHours(14, 0, 0, 0)

  const tourney = {
    id,
    name: 'Donatocup 2025',
    created_by: 'demo',
    game_mode: 'geloste_paarungen',
    gender_requirement: 'mixed',
    skill_requirement: 'LK 10–25',
    start_at: start.toISOString(),
    duration_hours: 4,
    max_participants: 24,
    num_courts: 6,
    num_rounds: 5,
    status: 'open',
    created_at: new Date().toISOString()
  }

  const names = [
    { name: 'Max Müller',      gender: 'herr' },
    { name: 'Felix Wagner',    gender: 'herr' },
    { name: 'Tobias Klein',    gender: 'herr' },
    { name: 'Jonas Becker',    gender: 'herr' },
    { name: 'Stefan Braun',    gender: 'herr' },
    { name: 'Lukas Hoffmann',  gender: 'herr' },
    { name: 'Anna Schmidt',    gender: 'dame' },
    { name: 'Laura Fischer',   gender: 'dame' },
    { name: 'Sarah Meyer',     gender: 'dame' },
    { name: 'Julia Weber',     gender: 'dame' },
    { name: 'Lisa Schulz',     gender: 'dame' },
    { name: 'Marie Richter',   gender: 'dame' },
  ]

  const regs = names.map((p, i) => ({
    tournament_id: id,
    user_id: 'player_' + i,
    gender: p.gender,
    display_name: p.name,
    checked_in: i < 8,
  }))

  DS.tourneys = [tourney, ...DS.tourneys.filter(t => !t.id.startsWith('example_'))]
  DS.regs = [...DS.regs.filter(r => r.tournament_id !== id), ...regs]
  toast('Beispielturnier erstellt!')
  render()
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.remove('opacity-0', 'translate-x-4')
  el.classList.add('opacity-100', 'translate-x-0')
  clearTimeout(el._t)
  el._t = setTimeout(() => {
    el.classList.add('opacity-0', 'translate-x-4')
    el.classList.remove('opacity-100', 'translate-x-0')
  }, 2800)
}

boot()
