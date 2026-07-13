"use client";

import { useState, useRef, useEffect } from "react";

const NIVEAUX = [
  "CM2",
  "6e",
  "5e",
  "4e",
  "3e",
  "2nde",
  "1ère",
  "Terminale",
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
];

const MATIERES = [
  "Mathématiques",
  "Français",
  "Sciences",
  "Histoire-Géo",
  "Anglais",
  "Économie",
  "Philosophie",
  "Physique-Chimie",
  "SVT (Sciences de la Vie et de la Terre)",
  "Espagnol",
  "Allemand",
  "Numérique / Informatique",
  "Python 3",
  "JavaScript",
  "Construction / Bâtiment",
  "Dessin technique",
  "Résistance des matériaux (RDM)",
  "Topographie",
  "Géotechnique (Étude des sols, Laboratoire)",
  "Comptabilité générale",
  "Comptabilité analytique",
  "Droit des affaires / Droit du travail",
  "Gestion commerciale",
  "Agriculture",
  "Pisciculture",
  "Élevage",
  "Santé",
];

const EQUIPE = [
  {
    nom: "Ido Sylvain",
    role: "Directeur Fondateur du projet et Développeur programmeur en IA",
  },
  { nom: "Yaméogo Aristide", role: "Gestionnaire manager de l'équipe" },
  { nom: "Kouanda Ismaël", role: "Manager Adjoint" },
  { nom: "Guira Sara", role: "Coordinatrice et conseillère de l'équipe" },
  {
    nom: "Gansaonré Ouango Clément",
    role: "Responsable à la communication et au marketing digital",
  },
  {
    nom: "Kaboré Abdoul Bassirou",
    role: "Responsable du déploiement territorial",
  },
  { nom: "Doumbia Mamadou", role: "Coordinateur des formations pratiques" },
];

async function callClaude(prompt, imageBase64) {
  const body = imageBase64 ? { prompt, image: imageBase64 } : { prompt };
  const response = await fetch(
    "https://citable-platypus-spongy.ngrok-free.dev/webhook/tuteur-ia",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("\n") || "";
  return text;
}

function LogoBadge({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <path id="badgeCircle" d="M 100,20 A 80,80 0 1,1 99.9,20" />
        <clipPath id="badgeClip">
          <circle cx="100" cy="100" r="78" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="96" fill="#D4A017" />
      <circle cx="100" cy="100" r="88" fill="#0E1B3D" />

      <g clipPath="url(#badgeClip)">
        <rect x="10" y="10" width="180" height="90" fill="#EF2B2D" />
        <rect x="10" y="100" width="180" height="90" fill="#009E49" />
        <polygon
          points="100,78 108,98 130,98 112,111 119,132 100,119 81,132 88,111 70,98 92,98"
          fill="#FCD116"
          stroke="#0E1B3D"
          strokeWidth="1.5"
        />
      </g>

      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="#D4A017"
        strokeWidth="2.5"
      />

      <text fill="#FFFFFF" fontSize="12.5" fontWeight="700" letterSpacing="1.5">
        <textPath href="#badgeCircle" startOffset="50%" textAnchor="middle">
          INSTITUTIONAL MASTER ACADEMY
        </textPath>
      </text>
    </svg>
  );
}

export default function TuteurIA() {
  const [niveau, setNiveau] = useState("Terminale");
  const [matiere, setMatiere] = useState("Mathématiques");
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState("setup"); // setup | loading | lesson | correcting | result
  const [history, setHistory] = useState([]); // pile des étapes précédentes pour le bouton Retour
  const [lesson, setLesson] = useState(null);
  const [reponse, setReponse] = useState("");
  const [correction, setCorrection] = useState(null);
  const [error, setError] = useState(null);

  // Photo
  const [image, setImage] = useState(null); // base64
  const fileInputRef = useRef(null);

  // Audio (dictée)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [micSupported, setMicSupported] = useState(true);

  // Audio (lecture à voix haute)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const inputRef = useRef(null);

  useEffect(() => {
    if (step === "setup" && inputRef.current) inputRef.current.focus();
  }, [step]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    if (typeof window !== "undefined" && !window.speechSynthesis) {
      setSpeechSupported(false);
    }
  }, []);

  function toggleListening() {
    if (!micSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  }

  function speak(text) {
    if (!speechSupported || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function pushHistory(currentStep) {
    setHistory((prev) => [...prev, currentStep]);
  }

  function goBack() {
    stopSpeaking();
    setError(null);
    setHistory((prev) => {
      if (prev.length === 0) {
        setStep("setup");
        return prev;
      }
      const newHistory = [...prev];
      const previousStep = newHistory.pop();
      setStep(previousStep);
      return newHistory;
    });
  }

  async function demarrer() {
    if (!question.trim() && !image) return;
    pushHistory("setup");
    setStep("loading");
    setError(null);
    try {
      const consigneImage = image
        ? "\nL'élève a aussi joint une photo en lien avec sa question (un exercice, un document, un schéma...). Base-toi dessus si c'est pertinent."
        : "";
      const prompt = `Tu es un tuteur pédagogique pour un élève de niveau "${niveau}" en "${matiere}", dans le cadre du programme scolaire francophone (Burkina Faso).
L'élève pose cette question ou ce sujet : "${
        question || "(voir la photo jointe)"
      }"${consigneImage}

Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans balises markdown, avec cette structure exacte :
{
  "explication": "une explication claire et adaptée au niveau ${niveau}, en 4 à 8 phrases maximum",
  "exercice": "un exercice court et concret sur ce sujet, adapté au niveau ${niveau}, avec un énoncé clair"
}`;
      const raw = await callClaude(prompt, image);
      const clean = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(clean);
      setLesson(parsed);
      setStep("lesson");
    } catch (e) {
      setError("Une erreur est survenue. Réessaie.");
      setHistory((prev) => prev.slice(0, -1));
      setStep("setup");
    }
  }

  async function soumettreReponse() {
    if (!reponse.trim()) return;
    pushHistory("lesson");
    setStep("correcting");
    setError(null);
    try {
      const prompt = `Tu es un tuteur pédagogique bienveillant pour un élève de niveau "${niveau}" en "${matiere}".
Voici l'exercice donné : "${lesson.exercice}"
Voici la réponse de l'élève : "${reponse}"

Corrige cette réponse. Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, avec cette structure exacte :
{
  "correct": true ou false,
  "feedback": "un retour clair, encourageant et pédagogique en 3 à 6 phrases, qui explique ce qui est juste ou faux et pourquoi"
}`;
      const raw = await callClaude(prompt);
      const clean = raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(clean);
      setCorrection(parsed);
      setStep("result");
    } catch (e) {
      setError("Une erreur est survenue lors de la correction. Réessaie.");
      setHistory((prev) => prev.slice(0, -1));
      setStep("lesson");
    }
  }

  function recommencer() {
    stopSpeaking();
    setStep("setup");
    setHistory([]);
    setQuestion("");
    setLesson(null);
    setReponse("");
    setCorrection(null);
    setError(null);
    removeImage();
  }

  const niveauIndex = NIVEAUX.indexOf(niveau);
  const progressionPct = (niveauIndex / (NIVEAUX.length - 1)) * 100;
  const peutRetourner =
    step !== "setup" && step !== "loading" && step !== "correcting";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brandRow}>
            <LogoBadge size={56} />
            <span style={styles.brandLabel}>Institutional Master Academy</span>
          </div>
          <h1 style={styles.title}>Tuteur IA — du CM2 au Master 2</h1>
          <p style={styles.subtitle}>
            Une explication, un exercice, une correction — adaptés à ton niveau.
          </p>
        </header>

        {peutRetourner && (
          <button style={styles.backBtn} onClick={goBack}>
            ← Retour
          </button>
        )}

        <div style={styles.roadWrap}>
          <div style={styles.roadTrack}>
            <div style={{ ...styles.roadFill, width: `${progressionPct}%` }} />
          </div>
          <div style={styles.roadLabels}>
            <span style={styles.roadLabelSmall}>CM2</span>
            <span style={styles.roadLabelSmall}>Master 2</span>
          </div>
        </div>

        {step === "setup" && (
          <div style={styles.card}>
            <div style={styles.fieldRow}>
              <div style={styles.field}>
                <label style={styles.label}>Niveau</label>
                <select
                  style={styles.select}
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                >
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Matière</label>
                <select
                  style={styles.select}
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                >
                  {MATIERES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label style={styles.label}>Ta question ou ton sujet</label>
            <textarea
              ref={inputRef}
              style={styles.textarea}
              placeholder="Ex : Les fractions, la Révolution française, les boucles en programmation..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />

            <div style={styles.toolsRow}>
              {micSupported && (
                <button
                  type="button"
                  style={{
                    ...styles.toolBtn,
                    ...(isListening ? styles.toolBtnActive : {}),
                  }}
                  onClick={toggleListening}
                >
                  {isListening ? "🔴 Écoute…" : "🎤 Dicter"}
                </button>
              )}
              <button
                type="button"
                style={styles.toolBtn}
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
              >
                📷 Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </div>

            {image && (
              <div style={styles.imagePreviewWrap}>
                <img src={image} alt="Aperçu" style={styles.imagePreview} />
                <button
                  type="button"
                  style={styles.removeImageBtn}
                  onClick={removeImage}
                >
                  ✕ Retirer la photo
                </button>
              </div>
            )}

            {error && <p style={styles.errorText}>{error}</p>}

            <button
              style={styles.primaryBtn}
              onClick={demarrer}
              disabled={!question.trim() && !image}
            >
              📘 Générer la leçon
            </button>
          </div>
        )}

        {step === "loading" && (
          <div style={styles.card}>
            <div style={styles.loadingBox}>
              ⏳<p style={styles.loadingText}>Préparation de ta leçon…</p>
            </div>
          </div>
        )}

        {(step === "lesson" || step === "correcting") && lesson && (
          <div style={styles.card}>
            <div style={styles.tag}>
              {niveau} · {matiere}
            </div>

            <div style={styles.sectionHeaderRow}>
              <h2 style={styles.sectionTitle}>Explication</h2>
              {speechSupported && (
                <button
                  type="button"
                  style={styles.speakBtn}
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : speak(lesson.explication)
                  }
                >
                  {isSpeaking ? "⏹ Stop" : "🔊 Écouter"}
                </button>
              )}
            </div>
            <p style={styles.bodyText}>{lesson.explication}</p>

            <h2 style={styles.sectionTitle}>Exercice</h2>
            <p style={styles.bodyText}>{lesson.exercice}</p>

            <label style={styles.label}>Ta réponse</label>
            <textarea
              style={styles.textarea}
              placeholder="Écris ta réponse ici..."
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              rows={3}
              disabled={step === "correcting"}
            />

            <div style={styles.toolsRow}>
              {micSupported && (
                <button
                  type="button"
                  style={{
                    ...styles.toolBtn,
                    ...(isListening ? styles.toolBtnActive : {}),
                  }}
                  onClick={toggleListening}
                  disabled={step === "correcting"}
                >
                  {isListening ? "🔴 Écoute…" : "🎤 Dicter ma réponse"}
                </button>
              )}
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button
              style={styles.primaryBtn}
              onClick={soumettreReponse}
              disabled={!reponse.trim() || step === "correcting"}
            >
              {step === "correcting" ? (
                <>⏳ Correction…</>
              ) : (
                <>📩 Soumettre ma réponse</>
              )}
            </button>
          </div>
        )}

        {step === "result" && correction && (
          <div style={styles.card}>
            <div
              style={{
                ...styles.resultBadge,
                background: correction.correct ? "#EAF6EE" : "#FBEEEE",
                color: correction.correct ? "#1E7A3D" : "#B4453A",
              }}
            >
              ✅{correction.correct ? "Bonne réponse" : "À revoir"}
            </div>

            <div style={styles.sectionHeaderRow}>
              <span />
              {speechSupported && (
                <button
                  type="button"
                  style={styles.speakBtn}
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : speak(correction.feedback)
                  }
                >
                  {isSpeaking ? "⏹ Stop" : "🔊 Écouter"}
                </button>
              )}
            </div>
            <p style={styles.bodyText}>{correction.feedback}</p>

            <button style={styles.secondaryBtn} onClick={recommencer}>
              Nouvelle question ➜
            </button>
          </div>
        )}

        <div style={styles.teamCard}>
          <div style={styles.teamTitle}>
            Institutional Master Academy — L'équipe
          </div>
          <div style={styles.teamList}>
            {EQUIPE.map((m) => (
              <div key={m.nom} style={styles.teamRow}>
                <span style={styles.teamNom}>{m.nom}</span>
                <span style={styles.teamRole}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>
          Institutional Master Academy · Prototype — Ministère de la Transition
          Digitale · Horizon 2030
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0E1B3D 0%, #16234A 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "32px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: { width: "100%", maxWidth: 560 },
  header: { marginBottom: 20, textAlign: "center" },
  brandRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  brandLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 0.4,
    textAlign: "left",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: 800,
    margin: "0 0 6px 0",
    lineHeight: 1.2,
  },
  subtitle: { color: "#AEB9D6", fontSize: 14, margin: 0 },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 14,
  },
  roadWrap: { marginBottom: 20 },
  roadTrack: {
    height: 8,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    overflow: "hidden",
  },
  roadFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2FB8C6, #D4A017)",
    borderRadius: 999,
    transition: "width 0.3s ease",
  },
  roadLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
  },
  roadLabelSmall: { color: "#7C89AD", fontSize: 11 },
  card: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
  },
  fieldRow: { display: "flex", gap: 12, marginBottom: 4 },
  field: { flex: 1 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#3D4A6B",
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #DDE2EE",
    fontSize: 14,
    color: "#16234A",
    background: "#F7F8FC",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    border: "1px solid #DDE2EE",
    fontSize: 14,
    color: "#16234A",
    background: "#F7F8FC",
    resize: "vertical",
    fontFamily: "inherit",
  },
  toolsRow: {
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  toolBtn: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #DDE2EE",
    background: "#F7F8FC",
    color: "#16234A",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  toolBtnActive: {
    background: "#FBEEEE",
    borderColor: "#E7B3AE",
    color: "#B4453A",
  },
  imagePreviewWrap: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: 200,
    borderRadius: 10,
    border: "1px solid #DDE2EE",
  },
  removeImageBtn: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid #DDE2EE",
    background: "#FFFFFF",
    color: "#B4453A",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryBtn: {
    marginTop: 18,
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "none",
    background: "#16234A",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  secondaryBtn: {
    marginTop: 18,
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid #DDE2EE",
    background: "#FFFFFF",
    color: "#16234A",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 0",
    gap: 12,
  },
  loadingText: { color: "#5B6786", fontSize: 14 },
  tag: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    color: "#2FB8C6",
    background: "#EAFAFB",
    padding: "4px 10px",
    borderRadius: 999,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#16234A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: "0 0 6px 0",
  },
  speakBtn: {
    padding: "5px 12px",
    borderRadius: 999,
    border: "1px solid #DDE2EE",
    background: "#F7F8FC",
    color: "#16234A",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  bodyText: { fontSize: 15, color: "#3D4A6B", lineHeight: 1.6, margin: 0 },
  errorText: { color: "#B4453A", fontSize: 13, marginTop: 10 },
  resultBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 14,
  },
  footer: {
    textAlign: "center",
    color: "#5B6786",
    fontSize: 11,
    marginTop: 20,
  },
  teamCard: {
    marginTop: 20,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "16px 18px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  teamTitle: {
    color: "#D4A017",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  teamList: { display: "flex", flexDirection: "column", gap: 6 },
  teamRow: { display: "flex", flexDirection: "column" },
  teamNom: { color: "#FFFFFF", fontSize: 13, fontWeight: 700 },
  teamRole: { color: "#AEB9D6", fontSize: 12 },
};
