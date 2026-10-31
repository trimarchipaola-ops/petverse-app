# PetVerse — Concept App (Proprietari)

Prototipo web installabile come app sulla schermata Home (PWA).
Sul computer mostra le 4 schermate affiancate; sul telefono si apre a tutto schermo, una schermata alla volta.

## Pubblicare su GitHub Pages

1. Su github.com: **New repository** → nome per es. `petverse-app` → **Public** → *Create repository*.
2. Nella pagina del repository: **Add file → Upload files**. Trascina **il contenuto** di questa cartella
   (`index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, le cartelle `asset` e `icons`), non la cartella stessa.
   `index.html` deve trovarsi nella radice del repository. → *Commit changes*.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main**, cartella **/(root)** → *Save*.
4. Dopo 1–2 minuti l'indirizzo è: `https://<tuo-utente>.github.io/petverse-app/`

## Aggiungere alla Home

- **iPhone (Safari):** apri il link → tasto **Condividi** ⬆︎ → **Aggiungi alla schermata Home**.
- **Android (Chrome):** apri il link → menu **⋮** → **Installa app** (oppure il pulsante "Installa PetVerse" che compare nella Home dell'app).

L'app si apre a tutto schermo con l'icona del cucciolo viola e funziona anche offline dopo la prima apertura.

## Aggiornare l'app

Carica i file modificati su GitHub. In `sw.js` cambia `petverse-v1` in `petverse-v2` (e così via),
altrimenti i telefoni che hanno già installato l'app continuano a vedere la versione salvata.

*Schermate concettuali: non contengono dati reali di animali o servizi.*
