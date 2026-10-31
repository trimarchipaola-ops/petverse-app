# Attivare database e Guida con IA

Finché questi passi non sono fatti, l'app funziona in **modalità demo** (non salva nulla).
Tempo richiesto: circa 20 minuti. Tutto gratuito per iniziare.

---

## 1. Crea il progetto Supabase (database + login)

1. Vai su **supabase.com** → *Start your project* → registrati (va bene anche con l'account GitHub).
2. **New project**
   - Name: `petverse`
   - Database password: generane una e **salvala** in un posto sicuro
   - Region: **Central EU (Frankfurt)** — i dati restano in Europa (GDPR)
   - Piano: **Free**
3. Attendi 1–2 minuti che il progetto sia pronto.

## 2. Crea le tabelle

1. Nel menu a sinistra: **SQL Editor** → *New query*.
2. Apri il file `supabase/schema.sql` di questa cartella, copia tutto il testo, incollalo e premi **Run**.
3. Deve comparire *Success. No rows returned*. In **Table Editor** vedrai `pets`, `reminders`, `guide_requests`.

## 3. Configura il login via email

1. **Authentication → URL Configuration**
   - Site URL: `https://trimarchipaola-ops.github.io/petverse-app/`
   - Redirect URLs → *Add URL*: `https://trimarchipaola-ops.github.io/petverse-app/`
2. (Facoltativo) **Authentication → Emails**: puoi tradurre in italiano il testo della mail "Magic Link".

> Il piano gratuito invia poche email all'ora: va bene per le prove. Per il lancio si collega un servizio email (es. Resend).

## 4. Crea la chiave per l'IA (Anthropic)

1. Vai su **console.anthropic.com** → registrati.
2. **Billing**: aggiungi un metodo di pagamento e un piccolo credito (es. 5–10 $).
   Imposta anche un **limite di spesa mensile** (Settings → Limits) per stare tranquilla.
3. **API Keys → Create Key** → nome `petverse-guida` → copia la chiave (inizia con `sk-ant-`).
   ⚠️ Non incollarla in chat, in email o nei file dell'app: va solo nel passo 5.

## 5. Pubblica la funzione "guida"

1. In Supabase: **Edge Functions → Secrets** → *Add new secret*
   - Name: `ANTHROPIC_API_KEY`
   - Value: la chiave del passo 4 → *Save*
2. **Edge Functions → Deploy a new function → Via Editor**
   - Nome funzione: `guida` (esattamente così)
   - Cancella il codice di esempio, incolla tutto il contenuto di `supabase/functions/guida/index.ts`
   - **Deploy function**

## 6. Collega l'app

1. In Supabase: **Project Settings → API** (o il pulsante *Connect* in alto).
2. Copia **Project URL** e **anon public key**.
3. Mandameli in chat (la *anon key* è pubblica per natura: i dati sono protetti dalle regole del database).
   Inserisco io i valori in `config.js` e ripubblico l'app.

## 7. Prova

1. Apri l'app → **Profilo** → inserisci la tua email → *Inviami il link*.
2. Apri il link dalla mail **sullo stesso telefono**: torni nell'app già collegata.
3. *Aggiungi un animale* → crea un promemoria → vai su **Guida**, descrivi un caso → *Scopri a chi rivolgerti*.

---

### Costi

| Servizio | Piano | Costo |
|---|---|---|
| GitHub Pages | Free | 0 € |
| Supabase | Free (500 MB database, 50.000 utenti) | 0 € — il progetto si sospende dopo 7 giorni senza uso; si riattiva dalla dashboard |
| Anthropic (Claude Opus 5.5, sforzo "basso") | A consumo | pochi centesimi per richiesta alla Guida; massimo 20 richieste al giorno per utente |

### Sicurezza e privacy (già impostate)
- Ogni utente vede **solo** i propri animali, promemoria e richieste (Row Level Security).
- La chiave dell'IA sta solo sul server Supabase.
- La Guida è istruita a **non fare diagnosi** e a segnalare subito i casi urgenti.
- Prima di aprire l'app al pubblico serve un'informativa privacy (es. iubenda) che citi Supabase e Anthropic come fornitori.
