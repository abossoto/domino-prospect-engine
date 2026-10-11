// api/_research.js
// Fase 1: dossier di intelligence sul prospect via web search server-side.
// Non usa il brain: il contesto e' solo il system prompt di ricerca, quindi
// questa fase costa pochi token di input.

import { callClaude, extractText, webSearchTool, tempoResiduo } from './_shared.js';

const RESEARCH_SYSTEM = `Sei un analista di intelligence commerciale senior per Domino, agenzia CX italiana.
Produci una parte di un dossier su un'azienda prospect usando ESCLUSIVAMENTE dati reali trovati sul web.

REGOLA FONDAMENTALE: MAI INVENTARE.
Se una fonte non da risultati, scrivi "Non trovato" per quella sezione.
Un dato mancante segnalato e' piu' utile di un dato inventato.

REGOLE PER I DATI FINANZIARI (quando sono nel tuo perimetro):
Cerca portali che pubblicano i bilanci depositati in chiaro, su pagina aperta:
fatturatoitalia.it, reportaziende.it, company-information.it e simili.
NON usare "site:cerved.com": cerved.com e' il sito commerciale di Cerved e non
pubblica i bilanci delle singole aziende, sono dietro login a pagamento. Lo stesso
vale per ufficiocamerale.it e per i rivenditori di visure. Una ricerca li' e' sprecata.
Il dato di origine e' comunque lo stesso in tutti i casi - il bilancio depositato al
Registro Imprese - quindi un portale gratuito che lo espone vale quanto uno a pagamento.
Riporta SEMPRE l'anno del bilancio: "fatturato 92,8 mln (bilancio 2024)".
GRUPPO O SOCIETA' ITALIANA: se l'azienda ha controllate estere i due numeri divergono,
anche molto. Riporta il fatturato della SOCIETA' ITALIANA come dato principale, perche'
e' l'entita' che ha il budget e che firma il contratto, e aggiungi quello di gruppo a
parte se lo trovi: "fatturato 92,8 mln (bilancio 2024, societa' italiana) - gruppo ~143 mln".

Lavori in parallelo con altri analisti che coprono le altre sezioni del dossier:
cerca SOLO quello che e' nel tuo perimetro e scrivi SOLO le sezioni richieste, con
esattamente i titoli indicati. Leggi le pagine intere, non solo snippet.

REGOLA SPECIALE - SEGNALI RECENTI - VERIFICABILITA' OBBLIGATORIA:
Per ogni segnale recente DEVI raccogliere e includere nel report l'URL della fonte
(comunicato stampa, articolo testata giornalistica, post LinkedIn ufficiale, ecc.).
Formato: "Evento (data) - URL: https://..." oppure su due righe.
Esempio:
- Acquisizione di X SpA (marzo 2025) - URL: https://www.ilsole24ore.com/art/...
- Lancio prodotto Y (gennaio 2026) - URL: https://comunicati.azienda.it/...
Se per un evento NON riesci a trovare la URL fonte verificabile, OMETTILO completamente
dalla sezione SEGNALI RECENTI. Meglio segnalare 2 eventi verificabili che 5 eventi senza prova.`;

// Il dossier e' diviso in quattro parti cercate in parallelo. Prima era
// un'unica chiamata con 8-10 ricerche: il tempo dipende soprattutto da quanti
// giri di ricerca-lettura fa il modello, quindi quattro perimetri stretti
// finiscono molto prima di uno largo. Misurato (insieme al cambio di versione
// del tool di ricerca, vedi webSearchTool): ricerca da 122-133s a 29-38s su
// Rollon, Masi Agricola, Bitron, Alpitour.
// Le sezioni hanno gli stessi titoli di prima, raggruppate per parte: la
// generazione le legge per titolo, l'ordine non conta.
const PARTI = [
  {
    nome: 'profilo',
    ricerche: '2-3',
    compito: `Cerca: sito web aziendale (homepage, chi siamo, prodotti/servizi, case study), qualita' del sito, social, blog, newsletter, maturita' digitale. NON cercare bilanci, persone, job posting o news: li coprono altri.`,
    sezioni: ['PROFILO AZIENDA', "PRESENZA E MATURITA' DIGITALE", 'SFIDE PROBABILI', "OPPORTUNITA' PER DOMINO", 'DATI NON TROVATI'],
  },
  {
    nome: 'finanza',
    ricerche: '2-3',
    compito: `Cerca: bilancio depositato con anno, fatturato, dipendenti, forma giuridica. Solo dati finanziari.`,
    sezioni: ['DATI FINANZIARI'],
  },
  {
    nome: 'persone',
    ricerche: '2-3',
    compito: `Cerca: profilo LinkedIn aziendale e persone chiave con nomi reali (CEO, CMO, CDO, Dir. Marketing/Digital/CX), job posting attivi da interpretare come priorita' strategiche.`,
    sezioni: ['PERSONE CHIAVE', "JOB POSTING E PRIORITA' STRATEGICHE"],
  },
  {
    nome: 'segnali',
    ricerche: '2-3',
    compito: `Cerca: news e comunicati degli ultimi 12 mesi - acquisizioni, lanci, finanziamenti, cambi management. Per ogni segnale raccogli SEMPRE l'URL della fonte. Senza URL non includerlo.`,
    sezioni: ['SEGNALI RECENTI (ultimi 12 mesi)'],
  },
];

// Il loop server-side di web_search si ferma a 10 iterazioni e restituisce
// stop_reason "pause_turn" con un report ancora incompleto. Si riprende
// rimandando la stessa conversazione con la risposta parziale in coda: il
// server riconosce il server_tool_use finale e riparte da solo. Non va
// aggiunto nessun messaggio utente di continuazione.
const MAX_RESUMES = 3;
// Tetto per singola parte: 4 x 6 = 24, in linea con i 20 della chiamata unica
// di prima. Nelle misure ogni parte ne ha usate 2-4.
const MAX_RICERCHE = 6;
// Sotto questa soglia non si avvia un'altra ripresa: meglio un report un po'
// piu' corto che un 504.
const RISERVA_MS = 70000;

async function cercaParte(parte, prospect, note, scadenza) {
  const userContent = `Parte "${parte.nome}" del dossier su: "${prospect}"${note ? `\nNote: ${note}` : ''}
${parte.compito}
Fai ${parte.ricerche} ricerche. Scrivi SOLO queste sezioni, con questi titoli esatti:
${parte.sezioni.map(t => `## ${t}`).join('\n')}`;
  const messages = [{ role: 'user', content: userContent }];
  const tool = webSearchTool(MAX_RICERCHE);
  let data = await callClaude({
    system: RESEARCH_SYSTEM, messages, tools: [tool],
    max_tokens: 8000, timeoutMs: 480000, scadenza,
  });

  let resumes = 0;
  while (data.stop_reason === 'pause_turn' && resumes < MAX_RESUMES
         && tempoResiduo(scadenza) > RISERVA_MS) {
    resumes++;
    messages.push({ role: 'assistant', content: data.content });
    data = await callClaude({
      system: RESEARCH_SYSTEM, messages, tools: [tool],
      max_tokens: 8000, timeoutMs: 480000, scadenza,
    });
  }
  return {
    testo: extractText(data).trim(),
    incompleto: data.stop_reason === 'pause_turn' || data.stop_reason === 'max_tokens',
  };
}

export async function runResearch(prospect, note, scadenza) {
  const esiti = await Promise.allSettled(PARTI.map(p => cercaParte(p, prospect, note, scadenza)));

  // Una parte fallita non butta via le altre: le sue sezioni restano nel
  // report come "Non trovato" e il report viene marcato incompleto.
  const pezzi = [];
  let incompleto = false;
  esiti.forEach((e, i) => {
    if (e.status === 'fulfilled' && e.value.testo) {
      pezzi.push(e.value.testo);
      incompleto ||= e.value.incompleto;
    } else {
      if (e.status === 'rejected') console.error(`Ricerca parte ${PARTI[i].nome}:`, e.reason);
      pezzi.push(PARTI[i].sezioni.map(t => `## ${t}\nNon trovato (ricerca non riuscita).`).join('\n\n'));
      incompleto = true;
    }
  });

  if (esiti.every(e => e.status === 'rejected')) {
    // Il messaggio della prima parte, che di solito e' l'OVERLOADED di callClaude.
    throw esiti[0].reason;
  }
  if (esiti.every(e => e.status !== 'fulfilled' || !e.value.testo)) {
    throw new Error('La ricerca non ha prodotto nessun report. Riprova.');
  }
  return { report: pezzi.join('\n\n'), incompleto };
}
