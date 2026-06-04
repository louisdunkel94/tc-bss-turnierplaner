// ── PocketBase ────────────────────────────────────────────────
const POCKETBASE_URL = (typeof CONFIG !== 'undefined' ? CONFIG.POCKETBASE_URL : null) || 'YOUR_POCKETBASE_URL'
const DEMO_MODE = POCKETBASE_URL === 'YOUR_POCKETBASE_URL'
const pb = DEMO_MODE ? null : new PocketBase(POCKETBASE_URL)

let currentUser = null
let currentProfile = null
let activeTournamentId = null
let _showArchive = false
let _showSgForm = false

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  const authEmail = sessionStorage.getItem('tc_auth')
  if (!authEmail) { window.location.replace('index.html'); return }

  currentUser = { id: authEmail }
  const saved = getProfile(authEmail)
  currentProfile = {
    id: authEmail,
    display_name: saved.display_name,
    role: saved.role,
    lk: saved.lk,
    gender: saved.gender || null,
    avatar: saved.avatar,
    privacy: saved.privacy,
    notifications: saved.notifications,
  }

  if (DEMO_MODE) {
    const banner = document.createElement('div')
    banner.className = 'fixed top-0 left-0 right-0 z-[100] bg-yellow-500/90 text-black text-xs font-headline font-bold text-center py-1.5 px-4'
    banner.textContent = '⚠ Lokaler Modus – Daten werden nur in diesem Browser gespeichert.'
    document.body.prepend(banner)
    document.querySelector('header').style.top = '28px'
  }

  const chip = document.getElementById('user-chip')
  chip.classList.remove('hidden'); chip.classList.add('flex')

  const avatarEl = document.getElementById('user-avatar')
  if (currentProfile.avatar) {
    avatarEl.innerHTML = `<img src="${currentProfile.avatar}" class="w-full h-full rounded-full object-cover" alt=""/>`
    avatarEl.textContent = ''
  } else {
    avatarEl.textContent = (currentProfile.display_name || '?')[0].toUpperCase()
  }

  document.getElementById('user-name').textContent = currentProfile.display_name
  document.getElementById('user-role-badge').textContent = currentProfile.role === 'admin' ? 'Administrator' : 'Mitglied'

  await render()
  checkBackupWarning()
}

function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

// ── Render ───────────────────────────────────────────────────
async function render() {
  const app = document.getElementById('app')
  if (currentProfile?.role === 'mitglied') {
    await renderMitglied(app)
  } else if (currentProfile?.role === 'admin') {
    await renderAdmin(app)
  } else {
    await renderVeranstalter(app)
  }
}

// ── Safe localStorage write ───────────────────────────────────
function safeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch(e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      toast('⚠️ Speicher voll! Bitte Backup erstellen und Browser-Cache leeren.')
    }
    return false
  }
}

// ── Demo store (localStorage fallback) ───────────────────────
const DS = {
  get tourneys()  { try { return JSON.parse(localStorage.getItem('tc_tourneys')||'[]') } catch{ return [] } },
  set tourneys(v) { safeStore('tc_tourneys', v) },
  get regs()      { try { return JSON.parse(localStorage.getItem('tc_regs')||'[]') } catch{ return [] } },
  set regs(v)     { safeStore('tc_regs', v) },
}

function getProfiles() { try { return JSON.parse(localStorage.getItem('tc_profiles')||'{}') } catch { return {} } }

function getBookings() { try { return JSON.parse(localStorage.getItem('tc_bookings')||'[]') } catch { return [] } }
function getTodayBookings() {
  const today = new Date()
  const iso = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0')
  return getBookings().filter(b => b.date === iso).sort((a,b) => a.timeStart.localeCompare(b.timeStart))
}

function isoToday() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function getMyBookings() {
  const uid  = currentUser?.id
  const name = currentProfile?.display_name
  return getBookings().filter(b => (uid && b.userId === uid) || (name && b.memberName === name))
}

function getNextMyBooking() {
  const now = new Date()
  const todayIso = isoToday()
  const nowHHMM  = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0')
  return getMyBookings()
    .filter(b => b.date > todayIso || (b.date === todayIso && b.timeEnd >= nowHHMM))
    .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.timeStart.localeCompare(b.timeStart))[0] || null
}

function getMyTourneys(regs, tourneys) {
  const myIds = new Set(regs.map(r => r.tournament_id))
  return (tourneys || []).filter(t => myIds.has(t.id) && (t.status === 'open' || t.status === 'running'))
}

function lkInRange(profileLk, skillReq) {
  if (!skillReq || !profileLk) return true
  const m = skillReq.match(/(\d+)\s*[–\-]\s*(\d+)/)
  if (!m) return true
  const n = parseInt(profileLk)
  return n >= parseInt(m[1]) && n <= parseInt(m[2])
}

function getSuggestedTourneys(regs, tourneys, profile) {
  const myIds = new Set(regs.map(r => r.tournament_id))
  return (tourneys || []).filter(t => {
    if (t.status !== 'open') return false
    if (myIds.has(t.id)) return false
    const gr = t.gender_requirement
    const gOk = gr === 'offen' || gr === 'mixed' || !profile?.gender ||
                (gr === 'herren' && profile.gender === 'herr') ||
                (gr === 'damen'  && profile.gender === 'dame')
    if (!gOk) return false
    return lkInRange(profile?.lk, t.skill_requirement)
  }).sort((a, b) => new Date(a.start_at||0) - new Date(b.start_at||0)).slice(0, 3)
}

function fmtTime(mins) {
  return String(Math.floor(mins / 60)).padStart(2,'0') + ':' + String(mins % 60).padStart(2,'0')
}

function renderCourtTimeline(todayBookings, numCourts) {
  const START = 8 * 60, END = 22 * 60, RANGE = END - START
  const colors = ['bg-emerald-500','bg-lime-500','bg-blue-400','bg-purple-400','bg-orange-400','bg-pink-400','bg-cyan-400','bg-teal-400']
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowPct  = (nowMins >= START && nowMins <= END) ? ((nowMins - START) / RANGE * 100).toFixed(1) : null

  let rows = ''
  for (let c = 1; c <= numCourts; c++) {
    const blocks = todayBookings.filter(b => b.court === c).map(b => {
      const [sh, sm] = b.timeStart.split(':').map(Number)
      const [eh, em] = b.timeEnd.split(':').map(Number)
      const s = sh * 60 + sm, e = eh * 60 + em
      const left  = ((s - START) / RANGE * 100).toFixed(1)
      const width = ((e - s) / RANGE * 100).toFixed(1)
      const col   = colors[(c - 1) % colors.length]
      const label = esc((b.memberName || '').split(' ')[0])
      return `<div class="${col} absolute top-0 bottom-0 flex items-center px-1 overflow-hidden opacity-85" style="left:${left}%;width:${width}%" title="${esc(b.memberName)} · ${b.timeStart}–${b.timeEnd}">
        <span class="text-[10px] font-headline font-bold text-white truncate leading-none select-none">${label}</span>
      </div>`
    }).join('')
    const nowLine = nowPct !== null
      ? `<div class="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none" style="left:${nowPct}%"></div>` : ''
    rows += `<div class="flex items-center gap-2">
      <span class="text-xs text-white/40 font-body w-14 flex-shrink-0 text-right">Platz ${c}</span>
      <div class="flex-1 h-5 rounded-md bg-green-500/10 border border-green-500/10 relative overflow-hidden">${blocks}${nowLine}</div>
    </div>`
  }

  const axis = `<div class="flex items-center gap-2 mt-1.5">
    <div class="w-14 flex-shrink-0"></div>
    <div class="flex-1 flex justify-between">
      ${['08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'].map(t => `<span class="text-[9px] text-white/20 font-body">${t}</span>`).join('')}
    </div>
  </div>`

  return rows ? rows + axis : '<p class="text-white/30 font-body text-sm">Keine Plätze konfiguriert.</p>'
}

function getFreeSlots(todayBookings, numCourts) {
  const START = 8 * 60, END = 22 * 60, SLOT = 30
  const now = new Date()
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  const fromMins = Math.ceil(nowMins / SLOT) * SLOT

  const results = []
  for (let c = 1; c <= numCourts; c++) {
    const booked = new Set()
    todayBookings.filter(b => b.court === c).forEach(b => {
      const [sh, sm] = b.timeStart.split(':').map(Number)
      const [eh, em] = b.timeEnd.split(':').map(Number)
      for (let m = sh * 60 + sm; m < eh * 60 + em; m += SLOT) booked.add(m)
    })
    let blockStart = null
    for (let m = Math.max(START, fromMins); m < END; m += SLOT) {
      if (!booked.has(m)) {
        if (blockStart === null) blockStart = m
      } else {
        if (blockStart !== null && m - blockStart >= 60) results.push({ court: c, timeStart: fmtTime(blockStart), timeEnd: fmtTime(m) })
        blockStart = null
      }
    }
    if (blockStart !== null && END - blockStart >= 60) results.push({ court: c, timeStart: fmtTime(blockStart), timeEnd: fmtTime(END) })
  }
  return results.sort((a, b) => a.timeStart.localeCompare(b.timeStart) || a.court - b.court).slice(0, 6)
}

function getProfile(email) {
  const saved = getProfiles()[email] || {}
  const isAdmin = email === 'admin@tennisclub-bss.de'
  return {
    display_name: saved.display_name || (isAdmin ? 'TC BSS Admin' : 'Testmitglied'),
    role: saved.role || (isAdmin ? 'admin' : 'mitglied'),
    lk: saved.lk || '',
    gender: saved.gender || null,
    avatar: saved.avatar || null,
    notifications: { tournament_invite: true, match_results: true, ...(saved.notifications || {}) },
    privacy: { show_lk: true, show_matches: true, show_email: false, ...(saved.privacy || {}) },
  }
}

// ── Vereinsmitglieder ─────────────────────────────────────────
function getMembers() { try { return JSON.parse(localStorage.getItem('tc_members')||'[]') } catch { return [] } }
function setMembers(v) { safeStore('tc_members', v) }

function addMember(name, gender) {
  const members = getMembers()
  if (!name || members.some(m => m.name.toLowerCase() === name.toLowerCase())) return false
  setMembers([...members, { name: name.trim(), gender }])
  return true
}

function removeMember(name) {
  setMembers(getMembers().filter(m => m.name !== name))
}

function importMembersFromTourneys() {
  const existing = new Set(getMembers().map(m => m.name.toLowerCase()))
  const toAdd = []
  DS.tourneys.forEach(t => {
    const state = t.state || {}
    ;(state.herren || []).forEach(n => { if (n && !existing.has(n.toLowerCase())) { toAdd.push({ name: n, gender: 'herr' }); existing.add(n.toLowerCase()) } })
    ;(state.damen  || []).forEach(n => { if (n && !existing.has(n.toLowerCase())) { toAdd.push({ name: n, gender: 'dame' }); existing.add(n.toLowerCase()) } })
  })
  DS.regs.forEach(r => {
    const n = r.display_name
    if (n && !existing.has(n.toLowerCase())) {
      toAdd.push({ name: n, gender: r.gender || 'herr' })
      existing.add(n.toLowerCase())
    }
  })
  if (toAdd.length) setMembers([...getMembers(), ...toAdd])
  return toAdd.length
}

// ── Backup ─────────────────────────────────────────────────────
function exportAllData() {
  const date = new Date().toISOString().slice(0, 10)
  const data = {
    _backup: true, _version: 2,
    exported_at: new Date().toISOString(),
    tc_tourneys: DS.tourneys,
    tc_regs: DS.regs,
    tc_members: getMembers(),
    tc_profiles: getProfiles(),
  }
  const a = document.createElement('a')
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
  a.download = `tc_bss_backup_${date}.json`
  a.click()
  localStorage.setItem('tc_last_backup', new Date().toISOString())
  toast('Backup gespeichert!')
  document.getElementById('backup-warning-banner')?.remove()
}

function checkBackupWarning() {
  if (!DS.tourneys.length) return
  const lastBackup = localStorage.getItem('tc_last_backup')
  const app = document.getElementById('app')
  if (!app) return
  let msg, color
  if (!lastBackup) {
    msg = 'Noch kein Backup erstellt – Daten können bei Cache-Löschung verloren gehen!'
    color = 'bg-yellow-500/15 border-yellow-500/30 text-yellow-200'
  } else {
    const days = Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000)
    if (days < 7) return
    msg = `Letztes Backup: vor ${days} Tagen`
    color = 'bg-orange-500/15 border-orange-500/30 text-orange-200'
  }
  const banner = document.createElement('div')
  banner.id = 'backup-warning-banner'
  banner.className = `flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-6 border ${color}`
  banner.innerHTML = `
    <div class="flex items-center gap-2 min-w-0">
      <span class="material-symbols-outlined text-base flex-shrink-0">warning</span>
      <span class="text-sm font-body truncate">${msg}</span>
    </div>
    <button onclick="exportAllData()" class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-bold text-xs bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap">
      <span class="material-symbols-outlined text-xs">save</span>Jetzt sichern
    </button>`
  app.prepend(banner)
}

// ── Members Modal ─────────────────────────────────────────────
function openMembersModal() {
  document.getElementById('modal-members').showModal()
  renderMembersList()
}

function renderMembersList() {
  const members = getMembers()
  const list = document.getElementById('members-list')
  if (!list) return
  if (!members.length) {
    list.innerHTML = '<p class="text-white/30 text-sm font-body text-center py-4">Noch keine Mitglieder — importieren oder manuell hinzufügen</p>'
    return
  }
  const herren = members.filter(m => m.gender === 'herr').sort((a,b) => a.name.localeCompare(b.name, 'de'))
  const damen  = members.filter(m => m.gender === 'dame').sort((a,b) => a.name.localeCompare(b.name, 'de'))
  const section = (title, arr, g) => arr.length ? `
    <div class="mb-3">
      <div class="flex items-center gap-1.5 text-[10px] font-headline uppercase tracking-widest text-white/30 mb-1.5">
        <div class="w-2 h-2 rounded-full ${g==='herr'?'bg-blue-400':'bg-pink-400'}"></div>${title} (${arr.length})
      </div>
      ${arr.map(m => `
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 mb-1">
          <span class="flex-1 text-sm font-body text-white/80">${esc(m.name)}</span>
          <button onclick="removeMemberUI(${JSON.stringify(m.name)})" class="text-white/20 hover:text-red-400 transition-colors">
            <span class="material-symbols-outlined text-sm">person_remove</span>
          </button>
        </div>`).join('')}
    </div>` : ''
  list.innerHTML = section('Herren', herren, 'herr') + section('Damen', damen, 'dame')
}

function addMemberUI() {
  const name = document.getElementById('m-name').value.trim().slice(0, 60)
  const gender = document.getElementById('m-gender').value
  if (!name) return
  if (!addMember(name, gender)) { toast('Bereits vorhanden'); return }
  document.getElementById('m-name').value = ''
  renderMembersList()
  toast('Mitglied hinzugefügt')
}

function removeMemberUI(name) {
  removeMember(name)
  renderMembersList()
  toast('Mitglied entfernt')
}

function importMembersUI() {
  const count = importMembersFromTourneys()
  renderMembersList()
  toast(count ? `${count} Mitglieder importiert` : 'Keine neuen Mitglieder gefunden')
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
  const [tourneys, myRegs] = await Promise.all([dbTourneys(['open','running']), dbMyRegs()])

  const todayBookings = getTodayBookings()
  const numCourts  = Math.max(1, Math.min(12, (JSON.parse(localStorage.getItem('tc_settings')||'{}').numCourts) || 6))
  const nextBooking  = getNextMyBooking()
  const myTourneys   = getMyTourneys(myRegs, tourneys)
  const suggested    = getSuggestedTourneys(myRegs, tourneys, currentProfile)
  const announcements = getAnnouncements().slice(0, 3)
  const freeSlots    = getFreeSlots(todayBookings, numCourts)
  const spielgesuche = getSpielgesuche()
  const myGesuch     = spielgesuche.find(g => g.userId === currentUser?.id)
  const otherGesuche = spielgesuche.filter(g => g.userId !== currentUser?.id)

  const statusConf = {
    open:    { label: 'Offen',  color: 'bg-secondary-fixed/15 text-secondary-fixed' },
    running: { label: 'Läuft', color: 'bg-green-500/15 text-green-400' },
  }
  const modeLabels = Object.fromEntries(Object.entries(MODES).map(([k,v]) => [k, v.label]))

  const relativeDate = iso => {
    const d = new Date(iso + 'T00:00:00')
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = Math.round((d - today) / 86400000)
    if (diff === 0) return 'Heute'
    if (diff === 1) return 'Morgen'
    return d.toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short' })
  }

  const relativeDateAnn = iso => {
    const d = new Date(iso)
    const today = new Date(); today.setHours(0,0,0,0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
    if (d >= today) return 'Heute'
    if (d >= yesterday) return 'Gestern'
    return d.toLocaleDateString('de-DE', { day:'numeric', month:'short' })
  }

  const nextBookingHtml = nextBooking ? (() => {
    const d = new Date(nextBooking.date + 'T00:00:00')
    const dayLabel  = d.toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short' })
    const typeLabel = nextBooking.type === 'doubles' ? 'Doppel' : 'Einzel'
    return `<div class="space-y-2.5">
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-secondary-fixed">calendar_month</span>
        <span class="font-headline font-bold text-white">${dayLabel}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-white/40">schedule</span>
        <span class="text-white/70 font-body text-sm">${nextBooking.timeStart}–${nextBooking.timeEnd}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-white/40">sports_tennis</span>
        <span class="text-white/70 font-body text-sm">Platz ${nextBooking.court} · ${typeLabel}</span>
      </div>
    </div>`
  })() : `<div class="flex flex-col items-center justify-center h-full py-2 gap-3">
    <p class="text-white/40 font-body text-sm text-center">Keine Buchung geplant.</p>
    <a href="booking.html" class="inline-flex items-center gap-1 text-xs font-headline font-bold text-secondary-fixed hover:underline">
      Jetzt buchen <span class="material-symbols-outlined text-sm">arrow_forward</span>
    </a>
  </div>`

  const miniTourneyCard = t => {
    const sc = statusConf[t.status] || statusConf.open
    const dateStr = t.start_at
      ? new Date(t.start_at).toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
      : '–'
    return `<div class="rounded-2xl bg-white/6 border border-white/10 p-4 flex flex-col gap-1">
      <div class="flex items-start justify-between gap-2">
        <span class="font-headline font-bold text-white text-sm leading-tight">${esc(t.name)}</span>
        <span class="text-[10px] font-headline font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.color}">${sc.label}</span>
      </div>
      <div class="text-xs text-white/40 font-body">${dateStr}</div>
      <div class="text-xs text-white/30 font-body">${esc(modeLabels[t.game_mode] || t.game_mode || '')}</div>
    </div>`
  }

  const announcementsHtml = announcements.length ? `
    <div class="mb-6 space-y-2">
      ${announcements.map(a => `
        <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-secondary-fixed/8 border border-secondary-fixed/15">
          <span class="material-symbols-outlined text-secondary-fixed text-base flex-shrink-0 mt-0.5">campaign</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-body text-white/85 leading-relaxed">${esc(a.text)}</p>
            <p class="text-xs text-white/30 font-body mt-0.5">${relativeDateAnn(a.createdAt)}</p>
          </div>
        </div>`).join('')}
    </div>` : ''

  const freeSlotsHtml = `
    <section class="mb-6">
      <h2 class="font-headline font-bold text-white text-base mb-3 flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-white/40">event_available</span>
        Freie Slots heute
      </h2>
      ${freeSlots.length
        ? `<div class="flex flex-wrap gap-2">${freeSlots.map(s => `
            <a href="booking.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-bold bg-white/8 text-white/70 hover:bg-secondary-fixed/15 hover:text-secondary-fixed transition-colors no-underline border border-white/8 hover:border-secondary-fixed/20">
              <span class="material-symbols-outlined text-xs">schedule</span>
              ${s.timeStart}–${s.timeEnd} · Platz ${s.court}
            </a>`).join('')}</div>`
        : `<p class="text-white/25 font-body text-sm">Heute keine freien Blöcke ≥ 1h mehr verfügbar.</p>`}
    </section>`

  const sgCardOther = g => {
    const hasInterest = g.interested?.includes(currentUser?.id)
    const typeLabel = g.type === 'doubles' ? 'Doppel' : 'Einzel'
    return `<div class="rounded-2xl bg-white/6 border border-white/10 p-4 flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="font-headline font-bold text-white text-sm">${esc(g.memberName)}</span>
          ${g.lkLabel ? `<span class="ml-1.5 text-xs text-white/30 font-body">LK ${esc(g.lkLabel)}</span>` : ''}
        </div>
        <span class="text-[10px] font-body text-white/30 flex-shrink-0">${relativeDate(g.date)}</span>
      </div>
      <div class="text-xs text-white/50 font-body flex items-center gap-3">
        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">schedule</span>${g.timeStart}–${g.timeEnd}</span>
        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">sports_tennis</span>${typeLabel}</span>
      </div>
      ${g.message ? `<p class="text-xs text-white/60 font-body leading-relaxed">${esc(g.message)}</p>` : ''}
      <button onclick="toggleInterest('${g.id}')" class="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-bold transition-colors ${hasInterest ? 'bg-secondary-fixed/15 text-secondary-fixed border border-secondary-fixed/20' : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/80 border border-white/8'}">
        <span class="material-symbols-outlined text-xs">favorite</span>
        ${hasInterest ? 'Interesse signalisiert' : 'Interesse zeigen'}
        ${g.interested?.length ? `<span class="ml-1 text-white/30">(${g.interested.length})</span>` : ''}
      </button>
    </div>`
  }

  const sgFormHtml = _showSgForm ? `
    <div class="mb-4 rounded-2xl bg-white/6 border border-white/10 p-4 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-white/40 font-body block mb-1">Datum</label>
          <input type="date" id="sg-date" min="${isoToday()}" value="${isoToday()}" class="w-full bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary-fixed"/>
        </div>
        <div>
          <label class="text-xs text-white/40 font-body block mb-1">Spielart</label>
          <select id="sg-type" class="w-full bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary-fixed">
            <option value="singles">Einzel</option>
            <option value="doubles">Doppel</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-white/40 font-body block mb-1">Von</label>
          <input type="time" id="sg-start" value="10:00" class="w-full bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary-fixed"/>
        </div>
        <div>
          <label class="text-xs text-white/40 font-body block mb-1">Bis</label>
          <input type="time" id="sg-end" value="12:00" class="w-full bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary-fixed"/>
        </div>
      </div>
      <div>
        <label class="text-xs text-white/40 font-body block mb-1">Kurze Nachricht (optional)</label>
        <input type="text" id="sg-msg" maxlength="100" placeholder="z.B. Suche Doppelpartner für lockeres Spiel" class="w-full bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:border-secondary-fixed placeholder:text-white/20"/>
      </div>
      <div class="flex gap-2 justify-end">
        <button onclick="_showSgForm=false;render()" class="px-4 py-2 rounded-xl font-headline font-bold text-sm bg-white/8 text-white/50 hover:bg-white/12 transition-colors">Abbrechen</button>
        <button onclick="submitSpielgesuch()" class="flex items-center gap-1.5 px-4 py-2 rounded-xl font-headline font-bold text-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
          <span class="material-symbols-outlined text-base">send</span>Veröffentlichen
        </button>
      </div>
    </div>` : ''

  const spielgesucheHtml = `
    <section class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-headline font-bold text-white text-base flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-white/40">group_add</span>
          Mitspieler suchen
        </h2>
        ${!myGesuch ? `<button onclick="_showSgForm=!_showSgForm;render()" class="flex items-center gap-1 text-xs font-headline font-bold text-secondary-fixed hover:underline">
          <span class="material-symbols-outlined text-sm">${_showSgForm ? 'close' : 'add'}</span>${_showSgForm ? 'Schließen' : 'Gesuch erstellen'}
        </button>` : ''}
      </div>
      ${sgFormHtml}
      ${myGesuch ? `
        <div class="mb-3 rounded-2xl bg-secondary-fixed/8 border border-secondary-fixed/20 p-4">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="text-xs font-headline font-bold text-secondary-fixed uppercase tracking-wider">Mein Gesuch</span>
            <button onclick="deleteMeinGesuch('${myGesuch.id}')" class="text-white/20 hover:text-red-400 transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <div class="text-xs text-white/50 font-body flex flex-wrap items-center gap-3 mt-1">
            <span>${relativeDate(myGesuch.date)}</span>
            <span>${myGesuch.timeStart}–${myGesuch.timeEnd}</span>
            <span>${myGesuch.type === 'doubles' ? 'Doppel' : 'Einzel'}</span>
          </div>
          ${myGesuch.message ? `<p class="text-xs text-white/60 font-body mt-1">${esc(myGesuch.message)}</p>` : ''}
          <p class="text-xs text-white/30 font-body mt-2">${myGesuch.interested?.length || 0} Interessent${myGesuch.interested?.length !== 1 ? 'en' : ''}</p>
        </div>` : ''}
      ${otherGesuche.length
        ? `<div class="grid gap-3 md:grid-cols-2">${otherGesuche.map(sgCardOther).join('')}</div>`
        : `<div class="rounded-2xl bg-white/5 border border-white/8 px-5 py-5 text-center text-white/25 font-body text-sm">
            <span class="material-symbols-outlined text-2xl block mb-2">group_add</span>
            Noch keine offenen Spielgesuche. Erstelle das erste!
           </div>`}
    </section>`

  app.innerHTML = `
    <div class="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-headline font-bold text-white tracking-tight">Willkommen${currentProfile?.display_name ? ', ' + esc(currentProfile.display_name.split(' ')[0]) : ''}</h1>
        <p class="text-white/40 font-body mt-1">Dein Überblick.</p>
      </div>
      <a href="stats.html" class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-headline font-bold text-sm bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/80 transition-colors no-underline flex-shrink-0">
        <span class="material-symbols-outlined text-base">bar_chart</span><span class="hidden md:inline">Statistiken</span>
      </a>
    </div>

    ${announcementsHtml}

    <!-- Platzauslastung + Nächste Buchung -->
    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="md:col-span-2 rounded-2xl bg-white/6 border border-white/10 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-headline font-bold text-white text-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-secondary-fixed">sports_tennis</span>
            Platzauslastung heute
          </h2>
          <a href="booking.html" class="text-xs font-headline font-bold text-secondary-fixed hover:underline flex items-center gap-0.5">
            Alle<span class="material-symbols-outlined text-sm">chevron_right</span>
          </a>
        </div>
        <div class="space-y-1.5">${renderCourtTimeline(todayBookings, numCourts)}</div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-xs text-white/30 font-body">${todayBookings.length} Buchung${todayBookings.length !== 1 ? 'en' : ''} heute</span>
          <a href="booking.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-bold bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors no-underline">
            Platz buchen
          </a>
        </div>
      </div>

      <div class="rounded-2xl bg-white/6 border border-white/10 p-5 flex flex-col">
        <h2 class="font-headline font-bold text-white text-sm flex items-center gap-1.5 mb-4">
          <span class="material-symbols-outlined text-sm text-secondary-fixed">event_upcoming</span>
          Meine nächste Buchung
        </h2>
        <div class="flex-1">${nextBookingHtml}</div>
      </div>
    </div>

    ${freeSlotsHtml}

    ${spielgesucheHtml}

    <!-- Meine Turniere -->
    <section class="mb-6">
      <h2 class="font-headline font-bold text-white text-base mb-3 flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-white/40">emoji_events</span>
        Meine Turniere
      </h2>
      ${myTourneys.length
        ? `<div class="grid gap-3 md:grid-cols-2">${myTourneys.map(miniTourneyCard).join('')}</div>`
        : `<div class="rounded-2xl bg-white/5 border border-white/8 px-5 py-6 text-center text-white/30 font-body text-sm">
            <span class="material-symbols-outlined text-2xl block mb-2">event_busy</span>
            Du bist bei keinem aktiven Turnier angemeldet.
           </div>`}
    </section>

    <!-- Vorgeschlagene Turniere -->
    <section>
      <h2 class="font-headline font-bold text-white text-base mb-3 flex items-center gap-2">
        <span class="material-symbols-outlined text-base text-white/40">recommend</span>
        Turniervorschläge
        ${!currentProfile?.gender && !currentProfile?.lk ? `<span class="text-xs font-body font-normal text-white/30 ml-1">(<a href="profile.html" class="text-secondary-fixed hover:underline">Profil vervollständigen</a> für bessere Matches)</span>` : ''}
      </h2>
      ${suggested.length
        ? `<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">${suggested.map(t => tournamentCard(t, false, false)).join('')}</div>`
        : `<div class="rounded-2xl bg-white/5 border border-white/8 px-5 py-6 text-center text-white/30 font-body text-sm">
            <span class="material-symbols-outlined text-2xl block mb-2">search_off</span>
            Keine passenden offenen Turniere gefunden.
           </div>`}
    </section>
  `
}

// ── Veranstalter ─────────────────────────────────────────────
async function renderVeranstalter(app) {
  const tourneys = await dbTourneys()
  const myRegs   = await dbMyRegs()
  const myIds    = new Set(myRegs.map(r => r.tournament_id))

  const active   = (tourneys||[]).filter(t => t.status !== 'closed')
  const archived = (tourneys||[]).filter(t => t.status === 'closed')

  const todayBookings = getTodayBookings()
  const todayBookingsHtml = todayBookings.length
    ? `<div class="space-y-1.5 mb-3">${todayBookings.map(b => `
        <div class="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm">
          <span class="font-headline font-bold text-secondary-fixed w-5 text-center">${b.court}</span>
          <span class="text-white/40 font-body text-xs">${b.timeStart}–${b.timeEnd}</span>
          <span class="font-body text-white/80 flex-1 truncate">${esc(b.memberName)}</span>
          ${b.note ? `<span class="text-white/30 text-xs font-body truncate max-w-[100px]">${esc(b.note)}</span>` : ''}
        </div>`).join('')}</div>`
    : `<p class="text-white/30 font-body text-sm mb-3">Heute keine Buchungen.</p>`

  app.innerHTML = `
    <section class="mb-10 p-5 rounded-2xl bg-black/10 border border-white/8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary-fixed text-xl">sports_tennis</span>
          <h2 class="font-headline font-bold text-white text-base">Platzbuchungen heute</h2>
        </div>
        <a href="booking.html" class="text-xs font-headline font-bold text-secondary-fixed hover:underline flex items-center gap-0.5">
          Alle<span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
      ${todayBookingsHtml}
      <a href="booking.html" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-headline font-bold bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors no-underline">
        <span class="material-symbols-outlined text-base">add</span>Platz buchen
      </a>
    </section>
    <div class="flex items-start justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-headline font-bold text-white tracking-tight">Turniere</h1>
        <p class="text-white/40 font-body mt-1">Verwalte und erstelle Turniere.</p>
      </div>
      <div class="flex items-center gap-2">
        <a href="stats.html" class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-headline font-bold text-sm bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/80 transition-colors no-underline">
          <span class="material-symbols-outlined text-base">bar_chart</span><span class="hidden md:inline">Statistiken</span>
        </a>
        <button onclick="openMembersModal()" class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-headline font-bold text-sm bg-white/8 text-white/60 hover:bg-white/12 hover:text-white/80 transition-colors">
          <span class="material-symbols-outlined text-base">group</span><span class="hidden md:inline">Mitglieder</span>
        </button>
        <button onclick="openCreateModal()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
          <span class="material-symbols-outlined text-base">add</span>Turnier erstellen
        </button>
      </div>
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

// ── Booking rules (admin) ─────────────────────────────────────
function getBookingRules() {
  const def = {
    mitglied:     { singles: { maxDurationMins: 90,  maxPerPeriod: 2,  periodDays: 7 }, doubles: { maxDurationMins: 120, maxPerPeriod: 3,  periodDays: 7 } },
    veranstalter: { singles: { maxDurationMins: 180, maxPerPeriod: 10, periodDays: 7 }, doubles: { maxDurationMins: 180, maxPerPeriod: 10, periodDays: 7 } }
  }
  const saved = JSON.parse(localStorage.getItem('tc_settings') || '{}').bookingRules || {}
  return {
    mitglied:     { singles: { ...def.mitglied.singles,     ...(saved.mitglied?.singles     || {}) }, doubles: { ...def.mitglied.doubles,     ...(saved.mitglied?.doubles     || {}) } },
    veranstalter: { singles: { ...def.veranstalter.singles, ...(saved.veranstalter?.singles || {}) }, doubles: { ...def.veranstalter.doubles, ...(saved.veranstalter?.doubles || {}) } }
  }
}

function saveBookingRules() {
  const n = id => parseInt(document.getElementById(id)?.value) || 0
  const rules = {
    mitglied:     { singles: { maxDurationMins: n('rule-m-s-dur')||90,  maxPerPeriod: n('rule-m-s-cnt')||2,  periodDays: n('rule-m-s-days')||7 },
                    doubles: { maxDurationMins: n('rule-m-d-dur')||120, maxPerPeriod: n('rule-m-d-cnt')||3,  periodDays: n('rule-m-d-days')||7 } },
    veranstalter: { singles: { maxDurationMins: n('rule-v-s-dur')||180, maxPerPeriod: n('rule-v-s-cnt')||10, periodDays: n('rule-v-s-days')||7 },
                    doubles: { maxDurationMins: n('rule-v-d-dur')||180, maxPerPeriod: n('rule-v-d-cnt')||10, periodDays: n('rule-v-d-days')||7 } }
  }
  const s = JSON.parse(localStorage.getItem('tc_settings') || '{}')
  s.bookingRules = rules
  localStorage.setItem('tc_settings', JSON.stringify(s))
  toast('Buchungsregeln gespeichert')
}

function renderBookingRulesEditor() {
  const r = getBookingRules()
  const inp = (id, val, mn, mx) =>
    `<input type="number" id="${id}" value="${val}" min="${mn}" max="${mx}" class="w-16 bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1 text-sm font-body text-center focus:outline-none focus:border-secondary-fixed"/>`
  const cells = (label, prefix, rules) =>
    `<td class="px-4 py-2.5 text-white/60 whitespace-nowrap font-body text-sm">${label}</td>
     <td class="px-4 py-2.5 text-center">${inp(prefix+'-dur',  rules.maxDurationMins, 30, 480)}</td>
     <td class="px-4 py-2.5 text-center">${inp(prefix+'-cnt',  rules.maxPerPeriod,    1,  99)}</td>
     <td class="px-4 py-2.5 text-center">${inp(prefix+'-days', rules.periodDays,       1, 365)}</td>`
  return `
    <section class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-headline font-bold text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-white/40">rule</span>
          Buchungsregeln
        </h2>
        <button onclick="saveBookingRules()" class="flex items-center gap-1.5 px-4 py-2 rounded-xl font-headline font-bold text-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors">
          <span class="material-symbols-outlined text-base">save</span>Speichern
        </button>
      </div>
      <div class="rounded-2xl border border-white/5 overflow-hidden bg-black/20">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead><tr class="border-b border-white/5 text-white/30 uppercase tracking-wider">
              <th class="text-left px-4 py-3">Gruppe</th>
              <th class="text-center px-4 py-3">Max. Dauer (min)</th>
              <th class="text-center px-4 py-3">Max. Buchungen</th>
              <th class="text-center px-4 py-3">pro … Tage</th>
            </tr></thead>
            <tbody class="divide-y divide-white/5">
              <tr>${cells('Mitglied · Einzel',     'rule-m-s', r.mitglied.singles)}</tr>
              <tr>${cells('Mitglied · Doppel',     'rule-m-d', r.mitglied.doubles)}</tr>
              <tr>${cells('Veranstalter · Einzel', 'rule-v-s', r.veranstalter.singles)}</tr>
              <tr>${cells('Veranstalter · Doppel', 'rule-v-d', r.veranstalter.doubles)}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="text-xs text-white/30 font-body mt-2">Admins sind von diesen Regeln ausgenommen.</p>
    </section>`
}

// ── Announcements ─────────────────────────────────────────────
function getAnnouncements() {
  try { return JSON.parse(localStorage.getItem('tc_announcements') || '[]') } catch { return [] }
}

function saveAnnouncement(text) {
  const ann = getAnnouncements()
  ann.unshift({ id: 'ann_' + Date.now(), text: text.trim(), createdAt: new Date().toISOString(), authorName: currentProfile?.display_name || 'Admin' })
  localStorage.setItem('tc_announcements', JSON.stringify(ann))
}

function deleteAnnouncement(id) {
  localStorage.setItem('tc_announcements', JSON.stringify(getAnnouncements().filter(a => a.id !== id)))
}

function renderAnnouncementsEditor() {
  const ann = getAnnouncements()
  const fmtAnnDate = iso => {
    const d = new Date(iso)
    const today = new Date(); today.setHours(0,0,0,0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
    if (d >= today) return 'Heute'
    if (d >= yesterday) return 'Gestern'
    return d.toLocaleDateString('de-DE', { day:'numeric', month:'short' })
  }
  return `
    <section class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-headline font-bold text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-white/40">campaign</span>
          Ankündigungen
        </h2>
      </div>
      <div class="flex gap-2 mb-4">
        <textarea id="ann-text" rows="2" placeholder="Ankündigung eingeben…" class="flex-1 bg-white/8 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-body resize-none focus:outline-none focus:border-secondary-fixed placeholder:text-white/25"></textarea>
        <button onclick="adminSaveAnnouncement()" class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-headline font-bold text-sm bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim transition-colors self-end">
          <span class="material-symbols-outlined text-base">send</span>Posten
        </button>
      </div>
      ${ann.length
        ? `<div class="space-y-2">${ann.map(a => `
            <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-body text-white/80 leading-relaxed">${esc(a.text)}</p>
                <p class="text-xs text-white/25 font-body mt-0.5">${fmtAnnDate(a.createdAt)} · ${esc(a.authorName)}</p>
              </div>
              <button onclick="adminDeleteAnnouncement('${a.id}')" class="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors mt-0.5">
                <span class="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>`).join('')}</div>`
        : '<p class="text-white/25 font-body text-sm">Noch keine Ankündigungen.</p>'}
    </section>`
}

async function adminSaveAnnouncement() {
  const text = document.getElementById('ann-text')?.value?.trim()
  if (!text) return
  saveAnnouncement(text)
  document.getElementById('ann-text').value = ''
  await renderAdmin(document.getElementById('app'))
  toast('Ankündigung veröffentlicht')
}

async function adminDeleteAnnouncement(id) {
  deleteAnnouncement(id)
  await renderAdmin(document.getElementById('app'))
  toast('Ankündigung gelöscht')
}

// ── Spielgesuche ─────────────────────────────────────────────
function getSpielgesuche() {
  try {
    const today = isoToday()
    return JSON.parse(localStorage.getItem('tc_spielgesuche') || '[]')
      .filter(g => g.date >= today)
      .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.timeStart.localeCompare(b.timeStart))
  } catch { return [] }
}

function saveSpielgesuch({ date, timeStart, timeEnd, type, message }) {
  const all = JSON.parse(localStorage.getItem('tc_spielgesuche') || '[]')
  all.push({
    id: 'sg_' + Date.now(),
    userId: currentUser?.id,
    memberName: currentProfile?.display_name || '',
    lkLabel: currentProfile?.lk || '',
    date, timeStart, timeEnd, type, message: message || '',
    createdAt: new Date().toISOString(),
    interested: []
  })
  localStorage.setItem('tc_spielgesuche', JSON.stringify(all))
}

function deleteSpielgesuch(id) {
  localStorage.setItem('tc_spielgesuche', JSON.stringify(
    JSON.parse(localStorage.getItem('tc_spielgesuche') || '[]').filter(g => g.id !== id)
  ))
}

function toggleInterest(id) {
  const all = JSON.parse(localStorage.getItem('tc_spielgesuche') || '[]')
  const uid = currentUser?.id
  const g = all.find(x => x.id === id)
  if (!g || !uid) return
  const idx = g.interested.indexOf(uid)
  if (idx >= 0) g.interested.splice(idx, 1)
  else g.interested.push(uid)
  localStorage.setItem('tc_spielgesuche', JSON.stringify(all))
  render()
}

function submitSpielgesuch() {
  const date      = document.getElementById('sg-date')?.value
  const timeStart = document.getElementById('sg-start')?.value
  const timeEnd   = document.getElementById('sg-end')?.value
  const type      = document.getElementById('sg-type')?.value || 'singles'
  const message   = document.getElementById('sg-msg')?.value?.trim() || ''
  if (!date || !timeStart || !timeEnd) { toast('Datum und Uhrzeit ausfüllen'); return }
  if (timeEnd <= timeStart) { toast('Endzeit muss nach Startzeit liegen'); return }
  saveSpielgesuch({ date, timeStart, timeEnd, type, message })
  _showSgForm = false
  toast('Gesuch veröffentlicht!')
  render()
}

function deleteMeinGesuch(id) {
  deleteSpielgesuch(id)
  render()
  toast('Gesuch gelöscht')
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

    ${renderBookingRulesEditor()}

    ${renderAnnouncementsEditor()}

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
          ${t.status === 'closed' ? `<a href="tournament.html?id=${t.id}" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-headline font-bold text-xs bg-white/10 text-white/60 hover:bg-white/15 transition-colors no-underline">
            <span class="material-symbols-outlined text-xs">leaderboard</span>Ergebnisse
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
  geloste_paarungen: { label: 'Balanced Draw',            icon: 'shuffle',      desc: 'Mixed-Teams werden jede Runde neu ausgelost – Wiederholungen bei Partner und Gegner werden minimiert.' },
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
    const hasProfile = p.id && p.id.includes('@')
    const nameEl = hasProfile
      ? `<a href="profile.html?email=${encodeURIComponent(p.id)}" class="flex-1 text-sm font-body font-medium text-white/70 hover:text-white transition-colors no-underline">${esc(p.display_name)}</a>`
      : `<span class="flex-1 text-sm font-body font-medium text-white/70">${esc(p.display_name)}</span>`
    return `<div class="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
      <span class="material-symbols-outlined text-base ${ic}">person</span>
      ${nameEl}
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
