// PetVerse — logica dell'app.
// Senza configurazione Supabase (config.js vuoto) funziona in modalità demo.
(() => {
  const root = document.getElementById('petverseConcept');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = '1';
  const $ = sel => root.querySelector(sel);
  const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const CFG = window.PETVERSE_CONFIG || {};
  const sb = (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase)
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
    : null;

  const SPECIES = {
    cane: { label: 'Cane', img: 'asset/cane_felice.webp' },
    gatto: { label: 'Gatto', img: 'asset/gatto_felice.webp' },
    coniglio: { label: 'Coniglio', img: 'asset/coniglio_felice.webp' },
    criceto: { label: 'Criceto', img: 'asset/criceto_felice.webp' },
    uccellino: { label: 'Uccellino', img: 'asset/uccellino_felice.webp' },
    rettile: { label: 'Rettile', img: 'asset/geco_felice.webp' },
    altro: { label: 'Altro', img: 'asset/cane_volo.webp' }
  };
  const DEMO_PETS = [
    { id: 'demo-milo', name: 'Milo', species: 'cane', age_years: 4 },
    { id: 'demo-luna', name: 'Luna', species: 'gatto', age_years: 8 }
  ];

  let user = null;
  let pets = DEMO_PETS;
  let current = DEMO_PETS[0];
  let reminders = [];
  const live = () => !!(sb && user);

  // ---------- Toast ----------
  const toast = $('#petverseToast'); let tt;
  function notify(msg) { clearTimeout(tt); toast.textContent = msg; toast.classList.add('on'); tt = setTimeout(() => toast.classList.remove('on'), 3300); }
  root.querySelectorAll('[data-toast]').forEach(b => b.addEventListener('click', () => notify(b.dataset.toast)));

  // ---------- Navigazione ----------
  function show(id, focusId) {
    const target = document.getElementById(id); if (!target) return;
    const body = target.querySelector('.screen-body');
    root.querySelectorAll('.screen-group').forEach(s => s.classList.toggle('current', s === target));
    body.scrollTop = 0;
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    if (focusId) { const f = target.querySelector('#' + focusId); if (f) body.scrollTo({ top: Math.max(0, f.offsetTop - 145), behavior: smooth() }); }
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-goto]'); if (!b || !root.contains(b)) return;
    show(b.dataset.goto, b.dataset.focus);
  });
  const start = location.hash.slice(1);
  if (start && document.getElementById(start)) show(start);

  // ---------- Animali ----------
  const ageText = p => p.age_years == null ? '' : ` · ${p.age_years} ${p.age_years === 1 ? 'anno' : 'anni'}`;
  const sp = p => SPECIES[p.species] || SPECIES.altro;

  function chip(p) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pet-chip'; b.setAttribute('aria-pressed', String(current && p.id === current.id));
    const img = document.createElement('img'); img.src = sp(p).img; img.alt = '';
    const span = document.createElement('span');
    const s = document.createElement('strong'); s.textContent = p.name;
    const sm = document.createElement('small'); sm.textContent = sp(p).label + ageText(p);
    span.append(s, sm); b.append(img, span);
    b.addEventListener('click', () => { selectPet(p); notify(live() ? `Profilo selezionato: ${p.name}` : `Profilo selezionato: ${p.name}. I dati sono dimostrativi.`); });
    return b;
  }

  function renderPets() {
    const strip = $('#petStrip'); strip.replaceChildren();
    if (pets.length) pets.slice(0, 4).forEach(p => strip.append(chip(p)));
    else {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pet-chip';
      b.dataset.goto = 'screen-profilo';
      const span = document.createElement('span');
      const s = document.createElement('strong'); s.textContent = '＋ Aggiungi il tuo animale';
      const sm = document.createElement('small'); sm.textContent = 'Crea il suo profilo';
      span.append(s, sm); b.append(span); strip.append(b);
    }
    const p = current;
    $('#profileTitle').textContent = p ? p.name : 'PetVerse';
    $('#profileImg').src = p ? sp(p).img : 'asset/cane_volo.webp';
    $('#profileName').textContent = p ? p.name + ' 🐾' : 'Nessun animale';
    $('#profileMeta').innerHTML = '';
    $('#profileMeta').append(p ? sp(p).label + ageText(p) : 'Aggiungi il primo profilo', document.createElement('br'), live() ? 'Salvato nel tuo account' : 'Profilo dimostrativo');
    $('#profileTag').textContent = live() ? '✦ ' + pets.length + (pets.length === 1 ? ' animale' : ' animali') : '✦ Personalizza il profilo';
    $('#foodFor').textContent = p ? 'per ' + p.name : '';
    $('#delPetBtn').hidden = !(live() && p);
    $('#petActions').hidden = !live();
  }

  async function selectPet(p) { current = p; renderPets(); await loadReminders(); }

  async function loadPets() {
    if (!live()) {
      pets = DEMO_PETS; current = DEMO_PETS[0]; reminders = [];
      $('#reminderState').textContent = 'Nessuna scadenza inserita';
      $('#petForm').hidden = true; $('#remForm').hidden = true;
      renderPets(); renderReminders(); return;
    }
    const { data, error } = await sb.from('pets').select('id,name,species,age_years').order('created_at');
    if (error) { notify('Non riesco a leggere i tuoi animali.'); return; }
    pets = data;
    current = pets.find(p => current && p.id === current.id) || pets[0] || null;
    renderPets(); await loadReminders();
  }

  $('#addPetBtn').addEventListener('click', () => { const f = $('#petForm'); f.hidden = !f.hidden; if (!f.hidden) $('#petName').focus(); });
  $('#petForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#petName').value.trim(); if (!name) return;
    const age = $('#petAge').value === '' ? null : Math.max(0, Math.min(40, parseInt($('#petAge').value, 10)));
    const { data, error } = await sb.from('pets').insert({ name, species: $('#petSpecies').value, age_years: age }).select('id,name,species,age_years').single();
    if (error) { notify('Salvataggio non riuscito, riprova.'); return; }
    $('#petForm').reset(); $('#petForm').hidden = true;
    pets.push(data); current = data; renderPets(); await loadReminders();
    notify(`Benvenuto, ${data.name}! 🐾`);
  });
  $('#delPetBtn').addEventListener('click', async () => {
    if (!current || !confirm(`Eliminare il profilo di ${current.name} e i suoi promemoria?`)) return;
    const { error } = await sb.from('pets').delete().eq('id', current.id);
    if (error) { notify('Eliminazione non riuscita.'); return; }
    pets = pets.filter(p => p.id !== current.id); current = pets[0] || null; renderPets(); await loadReminders();
  });

  // ---------- Promemoria ----------
  const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

  async function loadReminders() {
    if (!live() || !current) { reminders = []; renderReminders(); return; }
    const { data, error } = await sb.from('reminders').select('id,title,due_date,done').eq('pet_id', current.id).order('due_date');
    reminders = error ? [] : data; renderReminders();
  }

  function renderReminders() {
    const list = $('#remList'); list.replaceChildren();
    const open = reminders.filter(r => !r.done);
    $('#reminderState').textContent = live()
      ? (open.length ? `Prossimo: ${open[0].title} · ${fmtDate(open[0].due_date)}` : 'Nessuna scadenza inserita')
      : $('#reminderState').textContent;
    reminders.forEach(r => {
      const row = document.createElement('div'); row.className = 'listrow remrow' + (r.done ? ' done' : '');
      const chk = document.createElement('button'); chk.type = 'button'; chk.className = 'check'; chk.textContent = r.done ? '✓' : '';
      chk.setAttribute('aria-label', r.done ? 'Segna come da fare' : 'Segna come fatto');
      chk.addEventListener('click', async () => {
        const { error } = await sb.from('reminders').update({ done: !r.done }).eq('id', r.id);
        if (!error) { r.done = !r.done; renderReminders(); }
      });
      const txt = document.createElement('div');
      const h = document.createElement('h5'); h.textContent = r.title;
      const p = document.createElement('p'); p.textContent = fmtDate(r.due_date);
      txt.append(h, p);
      const del = document.createElement('button'); del.type = 'button'; del.textContent = '✕'; del.setAttribute('aria-label', 'Elimina promemoria'); del.style.fontSize = '14px';
      del.addEventListener('click', async () => {
        const { error } = await sb.from('reminders').delete().eq('id', r.id);
        if (!error) { reminders = reminders.filter(x => x.id !== r.id); renderReminders(); }
      });
      row.append(chk, txt, del); list.append(row);
    });
  }

  $('#addReminder').addEventListener('click', () => {
    if (!live()) {
      $('#reminderState').textContent = 'Promemoria di esempio aggiunto ✓';
      notify(sb ? 'Accedi per salvare i promemoria.' : 'Promemoria aggiunto nella demo (nessun dato salvato).');
      return;
    }
    if (!current) { notify('Aggiungi prima un animale.'); return; }
    const f = $('#remForm'); f.hidden = !f.hidden; if (!f.hidden) $('#remTitle').focus();
  });
  $('#remForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { data, error } = await sb.from('reminders')
      .insert({ pet_id: current.id, title: $('#remTitle').value.trim(), due_date: $('#remDate').value })
      .select('id,title,due_date,done').single();
    if (error) { notify('Promemoria non salvato, riprova.'); return; }
    reminders.push(data); reminders.sort((a, b) => a.due_date.localeCompare(b.due_date));
    $('#remForm').reset(); $('#remForm').hidden = true; renderReminders(); notify('Promemoria salvato ✓');
  });

  // ---------- Account ----------
  function renderAccount() {
    $('#accountCard').hidden = !sb;
    $('#accOut').hidden = !!user; $('#accIn').hidden = !user;
    if (user) $('#accEmail').textContent = user.email || 'Account';
  }
  if (sb) {
    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#loginEmail').value.trim(); if (!email) return;
      const btn = $('#loginForm .cta'); btn.disabled = true;
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
      btn.disabled = false;
      notify(error ? 'Invio non riuscito: controlla l\'email e riprova.' : 'Ti abbiamo mandato un link: aprilo da questo dispositivo.');
    });
    $('#logoutBtn').addEventListener('click', () => sb.auth.signOut());
    sb.auth.onAuthStateChange((_event, session) => {
      const was = user && user.id; user = session ? session.user : null;
      renderAccount();
      if ((user && user.id) !== was) loadPets();
    });
  }
  renderAccount(); renderPets();

  // ---------- Guida ----------
  let need = 'Salute';
  root.querySelectorAll('[data-need]').forEach(b => b.addEventListener('click', () => {
    need = b.dataset.need;
    root.querySelectorAll('[data-need]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#guideResult').classList.remove('show');
  }));

  const LOCAL = {
    Salute: ['Veterinario', 'Per sintomi o cambiamenti nella salute, il veterinario è il riferimento appropriato. Prepara osservazioni e tempi di comparsa.'],
    Alimentazione: ['Veterinario o nutrizionista veterinario', 'Per un’alimentazione legata a età ed esigenze, confrontati con il professionista più adatto prima di modificare la dieta.'],
    Comportamento: ['Veterinario ed educatore qualificato', 'Per cambiamenti di comportamento è utile escludere problemi di salute e poi valutare un supporto educativo.'],
    'Altri servizi': ['Professionista del servizio richiesto', 'PetVerse ti guiderà verso la categoria corretta e ti aiuterà a preparare le informazioni per il contatto.']
  };
  const URG = { emergenza: '⚠︎ EMERGENZA: CONTATTA SUBITO IL VETERINARIO', entro_24_ore: 'DA SENTIRE ENTRO 24 ORE', entro_pochi_giorni: 'ENTRO POCHI GIORNI', non_urgente: 'NON URGENTE' };

  function renderGuide(title, text, extra = {}) {
    const box = $('#guideResult');
    $('#guideResultTitle').textContent = title;
    $('#guideResultText').textContent = text;
    const urg = $('#guideUrg');
    urg.hidden = !extra.urgenza; urg.className = 'urg ' + (extra.urgenza || ''); urg.textContent = URG[extra.urgenza] || '';
    const ul = $('#guidePrep'); ul.replaceChildren();
    (extra.prep || []).forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
    ul.hidden = !(extra.prep && extra.prep.length);
    $('#guideNote').hidden = !extra.note; $('#guideNote').textContent = extra.note || '';
    box.classList.toggle('emergency', extra.urgenza === 'emergenza');
    box.classList.add('show');
    box.scrollIntoView({ behavior: smooth(), block: 'nearest' });
  }

  const goBtn = $('#guideGo'); const goLabel = goBtn.innerHTML;
  goBtn.addEventListener('click', async () => {
    const description = $('#problemText').value.trim();
    if (!description) { notify('Raccontaci prima che cosa hai notato, anche in poche parole.'); $('#problemText').focus(); return; }
    const local = LOCAL[need];
    if (!live()) {
      renderGuide(local[0], local[1], { note: sb ? 'Accedi dal Profilo per una risposta personalizzata dalla Guida con IA.' : 'Risposta dimostrativa: la Guida con IA si attiva collegando l’app.' });
      return;
    }
    goBtn.disabled = true; goBtn.innerHTML = '<span class="spinner"></span> Sto valutando…';
    try {
      const pet = current ? { id: current.id, name: current.name, species: current.species, age_years: current.age_years } : undefined;
      const { data, error } = await sb.functions.invoke('guida', { body: { need, description, pet } });
      if (error || !data || data.error) throw new Error((data && data.error) || 'errore');
      renderGuide(data.professionista, data.spiegazione, { urgenza: data.urgenza, prep: data.cosa_preparare, note: 'Orientamento, non diagnosi. Se peggiora o hai dubbi, contatta il veterinario.' });
    } catch (err) {
      renderGuide(local[0], local[1], { note: 'La Guida con IA non è disponibile in questo momento: ecco un’indicazione generale.' });
    } finally {
      goBtn.disabled = false; goBtn.innerHTML = goLabel;
    }
  });

  // ---------- Esperti ----------
  const experts = {
    Salute: [['Veterinario generalista', 'Per primi controlli, sintomi, salute quotidiana e indicazioni sul percorso di cura.'], ['Veterinario specialista', 'Per approfondire una situazione quando il veterinario consiglia un consulto specialistico.']],
    Alimentazione: [['Nutrizionista veterinario', 'Per diete specifiche, sensibilità alimentari ed esigenze legate all’età.'], ['Veterinario di riferimento', 'Per valutare il rapporto tra alimentazione e salute del tuo animale.']],
    Comportamento: [['Veterinario comportamentalista', 'Per difficoltà comportamentali da inquadrare insieme alla salute e al contesto.'], ['Educatore qualificato', 'Per percorsi educativi personalizzati e attività quotidiane con il tuo animale.']]
  };
  root.querySelectorAll('[data-expert]').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-expert]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const [a, c] = experts[b.dataset.expert];
    $('#expertName1').textContent = a[0]; $('#expertDesc1').textContent = a[1];
    $('#expertName2').textContent = c[0]; $('#expertDesc2').textContent = c[1];
  }));

  // ---------- Installazione sulla Home ----------
  const tip = $('#installTip');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let dismissed = false; try { dismissed = localStorage.getItem('pv-install-tip') === 'off'; } catch (e) {}
  if (standalone || dismissed) tip.classList.add('hidden');
  $('#installClose').addEventListener('click', () => { tip.classList.add('hidden'); try { localStorage.setItem('pv-install-tip', 'off'); } catch (e) {} });
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    const t = $('#installText'); t.replaceChildren();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cta'; b.style.marginTop = '6px'; b.textContent = 'Installa PetVerse';
    b.addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; tip.classList.add('hidden'); });
    t.append(b);
  });
  window.addEventListener('appinstalled', () => tip.classList.add('hidden'));

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
