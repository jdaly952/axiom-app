import React, { useState, useRef, useEffect, Component } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, handleFirestoreError, OperationType, testFirebaseConnection, firebaseConfig } from "./firebase";
import CoasterCustomizer from "./components/CoasterCustomizer";

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getOrCreateSessionId = () => {
  if (typeof window !== "undefined") {
    let sid = localStorage.getItem("understandable_session_id");
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem("understandable_session_id", sid);
    }
    return sid;
  }
  return "server-session";
};
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  limit
} from "firebase/firestore";
import { Shield, Save, CheckCircle2, AlertCircle, AlertTriangle, LogIn, ChevronLeft, Trash2, Download, ArrowRight, RotateCcw, Mail, Volume2, VolumeX, Loader2, Sparkles, Rocket, Heart, Smile, Lightbulb, Cloud, Telescope, Ghost, CircleDashed } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompt";

// --- SVG Generation for Glowforge ---
function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function generateEngravingSVG(result: any, concept: string): string {
  const stateA = result.axis1?.stateA || result.stateA || "";
  const stateB = result.axis1?.stateB || result.stateB || "";
  const labelA = result.axis1?.labelA || "✅ SUCCESS";
  const labelB = result.axis1?.labelB || "❌ STRUGGLE";
  const mechanism = result.axis2?.mechanism || result.mechanism || "";
  const zenith = result.axis3?.zenith || result.zenith || "";
  
  const stateALines = wrapText(stateA, 42);
  const stateBLines = wrapText(stateB, 42);
  const mechanismLines = wrapText(`HOW: ${mechanism}`, 55);
  const understandableLines = wrapText(`"${zenith}"`, 55);
  const domain = result?.domain || "General";
  const hook = result?.hook || "";
  const dist = result?.distillation || "";

  // Helper to escape SVG special characters
  const esc = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
      <defs>
        <style>
          .brand { font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; letter-spacing: 4px; fill: #000; }
          .domain { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 2px; fill: #666; }
          .concept { font-family: Helvetica, Arial, sans-serif; font-size: 72px; font-weight: bold; fill: #000; }
          .label { font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 2px; fill: #666; }
          .title { font-family: Helvetica, Arial, sans-serif; font-size: 32px; font-weight: bold; fill: #000; }
          .body { font-family: Helvetica, Arial, sans-serif; font-size: 24px; fill: #222; }
          .understandable { font-family: Georgia, serif; font-size: 48px; font-style: italic; fill: #000; }
          .line { stroke: #000; stroke-width: 2px; }
        </style>
      </defs>
      
      <rect width="1200" height="1600" fill="#ffffff" />
      
      <text x="100" y="120" class="brand">UNIVERSAL CLARITY // UNDERSTANDABLE ENGINE</text>
      <text x="100" y="180" class="domain">DOMAIN: ${esc(domain.toUpperCase())}</text>
      <text x="100" y="280" class="concept">${esc(concept.toUpperCase())}</text>
      
      <line x1="100" y1="360" x2="1100" y2="360" class="line" />
      
      <!-- STATE A -->
      <text x="100" y="440" class="label">${esc(labelA.toUpperCase())}</text>
      <text x="100" y="560" class="body">
        ${stateALines.map((line: string, i: number) => `<tspan x="100" dy="${i === 0 ? 0 : 38}">${esc(line)}</tspan>`).join('')}
      </text>
      
      <!-- DIVIDER -->
      <line x1="600" y1="440" x2="600" y2="900" stroke="#000" stroke-width="1" stroke-dasharray="4 4" />
      
      <!-- STATE B -->
      <text x="660" y="440" class="label">${esc(labelB.toUpperCase())}</text>
      <text x="660" y="560" class="body">
        ${stateBLines.map((line: string, i: number) => `<tspan x="660" dy="${i === 0 ? 0 : 38}">${esc(line)}</tspan>`).join('')}
      </text>
      
      <line x1="100" y1="1000" x2="1100" y2="1000" class="line" style="opacity: 0.3;" />
      
      <!-- MECHANISM -->
      <text x="100" y="1060" class="label">MECHANISM</text>
      <text x="100" y="1120" class="body" style="font-size: 18px; font-style: italic;">
        ${mechanismLines.map((line: string, i: number) => `<tspan x="100" dy="${i === 0 ? 0 : 28}">${esc(line)}</tspan>`).join('')}
      </text>

      <line x1="100" y1="1260" x2="1100" y2="1260" class="line" />
      
      <!-- UNDERSTANDABLE -->
      <text x="100" y="1360" class="understandable">
        ${understandableLines.map((line: string, i: number) => `<tspan x="100" dy="${i === 0 ? 0 : 64}">${esc(line)}</tspan>`).join('')}
      </text>

      <text x="100" y="1520" class="brand" style="fill: #999;">DISTILLATION: ${esc(dist.toUpperCase())}</text>
      <text x="1100" y="1520" class="brand" style="fill: #999; text-anchor: end;">ARCHITECTURE: CUBE v2.0</text>
    </svg>
  `.trim();
}

const themeColors = {
  studio: "border-white/20"
};

import { Tooltip } from "./components/Tooltip";

const CURIOUS_CONCEPTS = [
  "Why do we dream?", "How does the stock market work?", "Why do we get nervous?",
  "How does the internet work?", "Why is the sky blue?", "How does memory work?",
  "Why do habits form?", "What is inflation?", "How does GPS know where I am?",
  "Why do we laugh?", "How do batteries store electricity?", "What is a mortgage?",
  "Why does the moon change shape?", "How do vaccines work?", "Why do we need sleep?",
  "How do airplanes stay in the air?", "Why is salt used on icy roads?", "How does a touch screen work?",
  "What is the blockchain?", "Why do leaves change color?", "How does 5G work?",
  "Why do we have fingerprints?", "How does a microwave cook food?", "What is the greenhouse effect?", "How do mirrors work?", "Why do we yawn?", "How does music affect our brain?"
];

const MAX_CONCEPT_LENGTH = 500;
// Removed dynamic BUTTON_LABELS for static "Understand it!"

const theme = "studio";

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-xl mb-2 uppercase tracking-widest">System Failure</h1>
          <p className="text-xs text-white/40 max-w-md text-center leading-loose">
            An unexpected anomaly has occurred. The triangulation engine has been halted to prevent data corruption.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 border border-white/20 px-6 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Utility for hashing content for voting ---
const hashContent = (str: string) => {
  if (!str) return "empty";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// --- Vote UI Component ---
const VoteUI = ({ content }: { content: string }) => {
  const theme = "studio";
  const [voted, setVoted] = useState(false);
  const [counts, setCounts] = useState<{ ups: number; downs: number } | null>(null);
  const contentId = hashContent(content);

  useEffect(() => {
    const voteRef = doc(db, "community_votes", contentId);
    const unsub = onSnapshot(voteRef, (snap) => {
      if (snap.exists()) {
        setCounts(snap.data() as any);
      }
    });
    return () => unsub();
  }, [contentId]);

  const handleVote = async (isUp: boolean) => {
    if (voted) return;
    try {
      const voteRef = doc(db, "community_votes", contentId);
      await setDoc(voteRef, {
        contentHash: contentId,
        ups: increment(isUp ? 1 : 0),
        downs: increment(isUp ? 0 : 1),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setVoted(true);
    } catch (err) {
      console.error("Voting failed", err);
    }
  };

  if (voted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 font-mono text-[10px] md:text-xs uppercase tracking-widest font-black text-accent flex items-center gap-3"
      >
        <CheckCircle2 className="w-3 h-3" />
        Thanks! This helps Understandable.io learn what works best.
      </motion.div>
    );
  }

  return (
    <div className="mt-8 flex items-center gap-8 group">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => handleVote(true)}
          className={`flex items-center gap-3 p-3 px-5 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32] shadow-[4px_4px_0_0_rgba(165,214,167,0.3)] hover:shadow-[6px_6px_0_0_rgba(165,214,167,0.5)]`}
        >
          <span className="text-lg md:text-xl transform group-hover:scale-125 transition-transform">👍</span>
          {counts && counts.ups > 0 && <span className="font-mono text-[10px] md:text-xs font-black">{counts.ups}</span>}
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest font-black hidden sm:inline">Helpful</span>
        </button>
        <button 
          onClick={() => handleVote(false)}
          className={`flex items-center gap-3 p-3 px-5 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828] shadow-[4px_4px_0_0_rgba(255,205,210,0.3)] hover:shadow-[6px_6px_0_0_rgba(255,205,210,0.5)]`}
        >
          <span className="text-lg md:text-xl transform group-hover:scale-125 transition-transform">👎</span>
          {counts && counts.downs > 0 && <span className="font-mono text-[10px] md:text-xs font-black">{counts.downs}</span>}
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest font-black hidden sm:inline">Not quite</span>
        </button>
      </div>
    </div>
  );
};

// --- Understandable Voice Component ---
const createWavHeader = (pcmLength: number, sampleRate: number = 24000) => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmLength, true);

  return header;
};

const UnderstandableVoice = ({ text }: { text: string }) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const synthesizeSpeech = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Understandable Key Missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // 'Zephyr' fits the oracle/engine vibe
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Gemini TTS returns raw PCM (16-bit, 24kHz, Mono). We must add a WAV header for browser playback.
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const pcmData = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }

        const header = createWavHeader(len, 24000);
        const wavData = new Uint8Array(44 + len);
        wavData.set(new Uint8Array(header), 0);
        wavData.set(pcmData, 44);

        const blob = new Blob([wavData], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        } else {
          const audio = new Audio(audioUrl);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          audio.play().catch(e => console.error("Audio playback failed:", e));
        }
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Understandable Voice synthesis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <button 
      onClick={synthesizeSpeech}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-current/10 hover:border-accent/40 hover:bg-accent/5 transition-all group shrink-0"
      title="Voice Synthesis"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-accent" />
      ) : isPlaying ? (
        <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-40 group-hover:opacity-100" />
      )}
      <span className="font-serif italic text-[11px] md:text-xs font-bold opacity-90 group-hover:opacity-100 hidden sm:block">
        {loading ? "Synthesizing..." : isPlaying ? "Silence" : "Read Aloud"}
      </span>
    </button>
  );
};

// --- ELI9 Component ---
const ELI9Card = ({ content }: { content?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!content) return null;

  return (
    <div className="mt-8 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-4 p-2 pr-6 rounded-full border-2 transition-all hover:-translate-y-0.5 active:translate-y-0
          ${isOpen 
            ? 'bg-accent/5 border-accent/20 text-accent' 
            : 'bg-surface border-border text-ink opacity-60 hover:opacity-100'}
          shadow-[4px_4px_0_0_rgba(0,0,0,0.02)]
        `}
      >
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${isOpen ? 'bg-accent/20' : 'bg-black/5'}`}>
           <Heart className="w-3 h-3 md:w-4 md:h-4" />
        </div>
        <div className="flex flex-col items-start leading-none gap-1">
          <span className="font-serif italic text-xs md:text-sm font-bold">Simple Essence</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-80">{isOpen ? 'Closing' : 'View Distillation'}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 overflow-hidden rounded-[2.5rem] border border-accent/20 bg-accent/[0.02]"
          >
            <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <SectionLabel className="!text-lg">Core Distillation</SectionLabel>
                  <UnderstandableVoice text={content} />
                </div>
               <p className="text-xl md:text-4xl font-serif italic font-semibold leading-relaxed text-pretty text-accent">
                 {content}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UnderstandableLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-2 md:gap-4 ${className}`}>
    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
      {/* Understandable.io Logo: A stylized 'U' and 'i' representing clarity and individual learning */}
      <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-ink">
        <rect x="25" y="20" width="10" height="50" rx="2" />
        <rect x="65" y="20" width="10" height="50" rx="2" />
        <path d="M25 65 Q25 80 45 80 Q65 80 65 65" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <circle cx="50" cy="40" r="6" />
      </svg>
    </div>
    <span className="font-display text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-ink">Understandable.io</span>
  </div>
);

const SectionLabel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`font-serif italic text-lg md:text-3xl font-bold text-accent flex items-center gap-4 ${className}`}>
    <span className="w-8 md:w-16 h-1 bg-current opacity-20 rounded-full" />
    {children}
  </span>
);

const StateStamp = ({ label, type }: { label: string, type: 'success' | 'struggle' }) => {
  // Clean label of common emojis to avoid duplication with Lucide
  const cleanLabel = label.replace(/[✅❌]/g, '').trim();
  
  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2 md:px-6 md:py-3 rounded-[2rem] border-2 transition-all
      ${type === 'success' 
        ? "bg-accent/[0.03] border-accent/20 text-accent shadow-[4px_4px_0_0_rgba(74,103,65,0.05)]" 
        : "bg-soft-red/[0.03] border-soft-red/20 text-soft-red shadow-[4px_4px_0_0_rgba(178,94,77,0.05)]"}
    `}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
      <span className="font-serif italic text-sm md:text-xl font-semibold leading-none">
        {cleanLabel}
      </span>
    </div>
  );
};

// --- Auth Screen Component ---
const AuthScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set session persistence based on user preference
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setShowVerificationNotice(true);
          await signOut(auth);
          return;
        }
        onLoginSuccess();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setShowVerificationNotice(true);
        await signOut(auth);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationNotice) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full p-10 border-2 md:border-4 border-border bg-surface relative overflow-hidden rounded-[2.5rem] shadow-[24px_24px_0_0_rgba(0,0,0,0.02)]">
          <Mail className="w-16 h-16 text-accent mb-6 mx-auto" />
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter mb-4 text-ink">Verification Sent</h2>
          <p className="text-ink-dim font-sans leading-relaxed mb-8">
            A confirmation link has been sent to <span className="text-accent font-bold">{email}</span>. 
            Please verify your email to unlock the engine. Check your spam folder if you don't see it.
          </p>
          <button 
            onClick={() => setShowVerificationNotice(false)}
            className="w-full bg-accent border-4 border-accent text-bg font-mono uppercase tracking-widest py-4 font-black hover:bg-transparent hover:text-accent transition-all rounded-xl"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-12">
          <UnderstandableLogo className="scale-150 mb-8" />
          <h1 className="font-mono text-xs uppercase tracking-[0.5em] opacity-70">System Access Restricted</h1>
        </div>

        <div className="p-8 md:p-10 border-2 border-border bg-surface shadow-[16px_16px_0_0_rgba(0,0,0,0.03)] transition-all rounded-[3rem]">
          <div className="flex gap-4 mb-10">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 font-mono text-sm uppercase tracking-widest py-3 border-b-4 transition-all font-black
                ${isLogin ? "border-accent text-ink" : "border-transparent text-ink/40 hover:text-ink"}
              `}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 font-mono text-sm uppercase tracking-widest py-3 border-b-4 transition-all font-black
                ${!isLogin ? "border-accent text-ink" : "border-transparent text-ink/40 hover:text-ink"}
              `}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest opacity-70 mb-2">Identifier</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@nexus.com"
                className="w-full bg-bg border-2 border-border p-4 font-sans text-lg focus:border-accent outline-none transition-all placeholder:opacity-50 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest opacity-70 mb-2">Access Key</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-bg border-2 border-border p-4 font-sans text-lg focus:border-accent outline-none transition-all placeholder:opacity-50 rounded-xl"
                required
              />
            </div>

            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
              <div className={`w-5 h-5 border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-accent border-accent' : 'border-ink/20 group-hover:border-ink/40'}`}>
                {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">Remember my login</span>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/40 text-red-500 text-xs font-mono uppercase tracking-widest leading-loose">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-mono uppercase tracking-[0.2em] py-5 font-black hover:bg-accent hover:text-white transition-all shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              {loading ? "Syncing..." : isLogin ? "Unlock Engine" : "Create Identity"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] opacity-60 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-black border-4 border-white/20 py-4 font-mono text-sm uppercase tracking-widest font-black hover:border-white transition-all text-white"
          >
            <LogIn className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <UnderstandableEngine />
    </ErrorBoundary>
  );
}

function UnderstandableEngine() {
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const theme = "studio";
  const [concept, setConcept] = useState("");
  const [conceptError, setConceptError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  
  // --- Gatekeeper State ---
  const [isRobotVerified, setIsRobotVerified] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("understandable-verified") === "true";
    }
    return false;
  });
  const [verifying, setVerifying] = useState(false);

  // --- Auth State ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // --- Coaster State ---
  const [isCustomizing, setIsCustomizing] = useState(false);

  // --- Account/Index State ---
  const [showIndex, setShowIndex] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [indexType, setIndexType] = useState<"personal" | "global">("personal");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [savedUnderstandables, setSavedUnderstandables] = useState<any[]>([]);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Re-check onboarding state on mount to prevent "stalling"
  useEffect(() => {
    // Safety forcing authReady if firebase takes too long
    const authTimer = setTimeout(() => {
      if (!authReady) setAuthReady(true);
    }, 4500);

    let timer: any;
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("understandable-onboarded") === "true";
      if (!onboarded) {
        // Delay slightly to ensure layout is ready
        timer = setTimeout(() => setShowOnboarding(true), 1000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(authTimer);
    };
  }, []);

  // --- Suggestion Logic ---
  const refreshSuggestions = () => {
    const concepts = [...CURIOUS_CONCEPTS];
    // Also include some from the database if available, but randomly
    const combined = Array.from(new Set([...concepts, ...globalLogs.map(l => l.concept)]));
    const selected: any[] = [];
    const count = 4;
    
    for (let i = 0; i < count; i++) {
      if (combined.length === 0) break;
      const index = Math.floor(Math.random() * combined.length);
      selected.push({ concept: combined.splice(index, 1)[0] });
    }
    setSuggestions(selected);
    
    // No longer rotating button labels on refresh
  };

  useEffect(() => {
    refreshSuggestions();
  }, [globalLogs]);

  const [loadingIndex, setLoadingIndex] = useState(false);

  // Concept length categorizations for responsive typography scaling
  const isLongConcept = concept.length > 15;
  const isSingleLongWord = concept.length > 8 && !concept.includes(" ");

          // Auto-resize text area for fluid scaling
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight + 4}px`; // ensure no descender clipping
    }
  }, [concept, isLongConcept]);

  useEffect(() => {
    testFirebaseConnection().then(online => {
      setSystemOnline(online);
    });
  }, []);

  useEffect(() => {
    let unsubscribeIndex: (() => void) | undefined;
    let unsubscribeGlobal: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      
      // Cleanup previous listeners if any
      if (unsubscribeIndex) {
        unsubscribeIndex();
        unsubscribeIndex = undefined;
      }
      if (unsubscribeGlobal) {
        unsubscribeGlobal();
        unsubscribeGlobal = undefined;
      }

      // Setup listener for global master logs (Public)
      const qGlobal = query(
        collection(db, "synthesis_logs"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      unsubscribeGlobal = onSnapshot(qGlobal, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalLogs(docs);
      }, (err) => {
        console.warn("Public logs currently awaiting server sync.");
      });

      if (u) {
        // Sync user to Firestore
        const userRef = doc(db, "users", u.uid);
        getDoc(userRef).then((docSnap) => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              createdAt: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`));
          }
        }).catch(err => handleFirestoreError(err, OperationType.GET, `users/${u.uid}`));

        // Setup real-time listener for user's topics (Private)
        setLoadingIndex(true);
        const q = query(
          collection(db, "saved_topics"),
          where("uid", "==", u.uid),
          orderBy("createdAt", "desc")
        );
        unsubscribeIndex = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSavedUnderstandables(docs);
          setLoadingIndex(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, "saved_topics");
          setLoadingIndex(false);
        });
      } else {
        setSavedUnderstandables([]);
      }
    });

    // Setup listener for top suggestions - REMOVED persistent listener to favor randomness
    // Instead we use globalLogs to populate random suggestions in the above hook
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeIndex) unsubscribeIndex();
      if (unsubscribeGlobal) unsubscribeGlobal();
    };
  }, []);

  const verifyHuman = () => {
    setVerifying(true);
    // Simulate a "mysterious" verification
    setTimeout(() => {
      setIsRobotVerified(true);
      setVerifying(false);
      localStorage.setItem("understandable-verified", "true");
    }, 1500);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      let message = "Engine induction failed. Check your connection.";
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        message = `UNDERSTANDABLE.IO: Induction Failed. Your domain (${currentDomain}) is not authorized in Firebase. Please add it to 'Authorized Domains' for project '${firebaseConfig.projectId}' at: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
      }
      setError(message);
    }
  };

  const saveToLibrary = async () => {
    if (!user) {
      await handleLogin();
      return;
    }
    if (!result || saving) return;

    setSaving(true);
    try {
      const slug = concept.toLowerCase().trim().replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const globalRef = doc(db, "global_index", slug);
      
      await Promise.all([
        addDoc(collection(db, "saved_topics"), {
          uid: user.uid,
          concept: concept,
          payload: result,
          isManuallySaved: true,
          createdAt: serverTimestamp()
        }),
        setDoc(globalRef, {
          concept: concept,
          rank: increment(10),
          lastPayload: result,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "saved_topics");
    } finally {
      setSaving(false);
    }
  };

  const understandTopic = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || concept;
    if (!activeTopic.trim()) return;
    
    if (overrideTopic) {
      setConcept(overrideTopic);
    }

    // Auto-verify if they haven't yet, keeping momentum
    if (!isRobotVerified) {
      setIsRobotVerified(true);
      localStorage.setItem("understandable-verified", "true");
    }

    setLoading(true);
    setResult(null);
    setError(null);

    // Immediate scroll to animation zone
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not configured. Please add it to your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 3-6-9 Triangulation for the concept: ${activeTopic}`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: SYSTEM_PROMPT
        }
      });

      if (!response.text) {
        throw new Error("No response returned from the engine.");
      }

      // Robust JSON extraction - find first '{' and last '}'
      let cleanJson = response.text.trim();
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      // Cleanup trailing commas which break JSON.parse
      cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');

      try {
        const data = JSON.parse(cleanJson);
        setResult(data);

        // Auto-scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);

        const slug = activeTopic.toLowerCase().trim().replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const globalRef = doc(db, "global_index", slug);

        // --- AUTOMATIC PERSISTENCE FOR LEARNING & RANKING ---
        Promise.all([
          addDoc(collection(db, "synthesis_logs"), {
            concept: activeTopic,
            payload: data,
            uid: user?.uid || null,
            isManuallySaved: false,
            createdAt: serverTimestamp()
          }),
          setDoc(globalRef, {
            concept: activeTopic,
            rank: increment(1),
            lastPayload: data,
            updatedAt: serverTimestamp()
          }, { merge: true })
        ]).catch(err => {
          console.warn("Log persistence failed:", err);
        });
      } catch (e) {
        console.error("JSON Parse Error. Raw Text:", response.text);
        throw new Error("The engine returned a corrupted insight. Please try refining your topic.");
      }

    } catch (err: any) {
      console.error("Understandable Engine error:", err);
      
      let errorMessage = err.message || "Failed to trigger Understandable engine.";
      
      // If error message is a JSON string, try to extract the specific error message
      if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error?.message) errorMessage = parsed.error.message;
        } catch (e) { /* ignore */ }
      }

      const isQuotaError = 
        err?.status === "RESOURCE_EXHAUSTED" || 
        err?.error?.status === "RESOURCE_EXHAUSTED" ||
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("exhausted") ||
        errorMessage.toLowerCase().includes("credits are depleted");

      if (isQuotaError) {
        setError("Understandable Engine quota exceeded. The platform requires a cooldown period or billing verification.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      understandTopic();
    }
  };

  const handleDownloadSVG = () => {
    if (!result) return;
    const svgString = generateEngravingSVG(result, concept);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `understandable-${concept.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isRobotVerified) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] text-ink flex flex-col items-center justify-center p-4 md:p-8 font-serif relative overflow-hidden">
        {/* Whimsical Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1],
              x: [0, 20, -20, 0],
              y: [0, -20, 20, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-accent/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%]"
          />
          <motion.div 
            animate={{ 
              rotate: [0, -8, 8, 0],
              scale: [1, 1.2, 1],
              x: [0, -30, 30, 0],
              y: [0, 30, -30, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-5%] right-[-10%] w-96 h-96 bg-red-400/5 rounded-[30%_70%_70%_30%/50%_60%_30%_60%]"
          />
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.1, rotate: 360 }}
             transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
             className="absolute top-1/4 right-1/4"
          >
            <Cloud size={120} strokeWidth={1} />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="max-w-2xl w-full border-[6px] border-ink p-10 md:p-16 text-center bg-white relative shadow-[16px_16px_0_0_#A68B6A] rounded-[2rem_5rem_3rem_6rem]"
        >
          {/* Fun Character-like icons */}
          <div className="flex justify-center gap-6 mb-10 overflow-visible h-24 items-end">
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-accent"
            >
              <Telescope size={64} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -25, 0],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
              className="text-red-400"
            >
              <Ghost size={80} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 8, -8, 0]
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              className="text-blue-400"
            >
              <CircleDashed size={56} strokeWidth={1.5} className="animate-spin-slow" />
            </motion.div>
          </div>

          <h2 className="text-4xl md:text-6xl mb-6 tracking-tight font-display font-black text-ink leading-none">
            Wait! Are you <span className="text-accent italic">you</span>?
          </h2>
          <p className="text-lg md:text-xl text-ink font-sans mb-12 font-bold max-w-md mx-auto leading-relaxed">
            Quickly now, with a hop and a giggle, show us you're a human and not a <span className="underline decoration-wavy decoration-red-400 underline-offset-4">wiggle-woggle bot!</span>
          </p>
          
          <button 
            onClick={verifyHuman}
            disabled={verifying}
            className="w-full md:w-auto px-12 border-4 border-ink py-6 text-xl font-mono uppercase tracking-[0.2em] font-black hover:bg-accent hover:text-white transition-all disabled:opacity-50 group relative overflow-hidden rounded-full shadow-[8px_8px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none bg-white text-ink"
          >
            <span className="relative z-10">
              {verifying ? "Searching..." : "I'm a Real Person!"}
            </span>
            {verifying && (
              <motion.div 
                className="absolute inset-0 bg-accent/20"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            )}
          </button>

          <p className="mt-12 text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">
            Engineered for pure delight at Understandable.io
          </p>
        </motion.div>

        {/* Decorative corner shape */}
        <div className="absolute bottom-10 left-10 w-20 h-20 border-4 border-ink rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-20" />
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-700 relative flex flex-col overflow-x-hidden overflow-y-auto bg-grid bg-bg text-ink">
      <div className="w-full min-h-screen flex flex-col relative bg-inherit">
        {/* Onboarding Overlay */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.div 
              key="onboarding-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                key={onboardingStep}
                initial={{ y: 30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0, scale: 1.05 }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 md:p-16 lg:p-24 rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[12px] border-white shadow-2xl bg-[#FFFDF9] text-slate-900"
              >
                <div className="flex flex-col gap-6 md:gap-14">
                  <div className="flex items-center justify-between text-xs md:text-sm font-black uppercase tracking-[0.3em] opacity-40 font-mono">
                    <span className="flex items-center gap-3">
                       <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                       Hello! Idea {onboardingStep + 1} of 4
                    </span>
                    <button 
                      onClick={() => {
                        setShowOnboarding(false);
                        localStorage.setItem("understandable-onboarded", "true");
                      }}
                      className="hover:text-accent transition-colors underline decoration-2 underline-offset-4"
                    >
                      Skip Walkthrough
                    </button>
                  </div>

                  {onboardingStep === 0 && (
                    <div className="flex flex-col gap-6 md:gap-10">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-yellow-100 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center text-yellow-600 shadow-inner">
                        <Lightbulb size={32} className="md:w-[56px] md:h-[56px]" strokeWidth={2.5} />
                      </div>
                      <h2 className="font-display text-4xl md:text-7xl font-black leading-tight">
                        Ask about <span className="text-accent underline decoration-[6px] md:decoration-[12px] underline-offset-[4px] md:underline-offset-[8px] decoration-accent/20">anything!</span>
                      </h2>
                      <p className="font-sans text-lg md:text-3xl font-bold leading-relaxed text-slate-600">
                        Curious about the moon? Or why toast is crunchy? Just type it in and we'll tell you a story that makes it clear as day! 🎈
                      </p>
                    </div>
                  )}

                  {onboardingStep === 1 && (
                    <div className="flex flex-col gap-6 md:gap-10">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-sky-100 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center text-sky-600 shadow-inner">
                        <Smile size={32} className="md:w-[56px] md:h-[56px]" strokeWidth={2.5} />
                      </div>
                      <h2 className="font-display text-4xl md:text-7xl font-black leading-tight">
                        It grows <span className="text-accent underline decoration-[6px] md:decoration-[12px] underline-offset-[4px] md:underline-offset-[8px] decoration-accent/20">with you!</span>
                      </h2>
                      <p className="font-sans text-lg md:text-3xl font-bold leading-relaxed text-slate-600">
                        The more we talk, the better I get at explaining things just the way you like. It's like having a friend who always knows the best way to help! 🌱
                      </p>
                    </div>
                  )}

                  {onboardingStep === 2 && (
                    <div className="flex flex-col gap-6 md:gap-10">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center text-rose-600 shadow-inner">
                        <Heart size={32} className="md:w-[56px] md:h-[56px]" strokeWidth={2.5} />
                      </div>
                      <h2 className="font-display text-4xl md:text-7xl font-black leading-tight">
                         High-fives for <span className="text-accent underline decoration-[6px] md:decoration-[12px] underline-offset-[4px] md:underline-offset-[8px] decoration-accent/20">Aha's!</span>
                      </h2>
                      <p className="font-sans text-lg md:text-3xl font-bold leading-relaxed text-slate-600">
                        When a story clicks for you, give it a thumbs up. It helps everyone else find the best secrets to understanding too! ✨
                      </p>
                    </div>
                  )}

                  {onboardingStep === 3 && (
                    <div className="flex flex-col gap-6 md:gap-10">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-100 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                        <Sparkles size={32} className="md:w-[56px] md:h-[56px]" strokeWidth={2.5} />
                      </div>
                      <h2 className="font-display text-4xl md:text-7xl font-black leading-tight">
                         Building your <span className="text-accent underline decoration-[6px] md:decoration-[12px] underline-offset-[4px] md:underline-offset-[8px] decoration-accent/20">world!</span>
                      </h2>
                      <p className="font-sans text-lg md:text-3xl font-bold leading-relaxed text-slate-600">
                        Learning is like building with blocks. We start at the bottom and work our way up until you have a big, beautiful tower of knowledge! 🧱
                      </p>
                    </div>
                  )}

                  <div className="pt-6 md:pt-12 flex flex-col md:flex-row gap-6 md:gap-8 items-center mt-auto">
                    {onboardingStep < 3 ? (
                      <button
                        onClick={() => setOnboardingStep(onboardingStep + 1)}
                        className="w-full md:flex-1 py-6 md:py-10 rounded-[1.5rem] md:rounded-[2.5rem] font-sans text-xl md:text-2xl font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-accent transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-accent/40 hover:-translate-y-2 ring-8 ring-slate-900/5 hover:ring-accent/10"
                      >
                        Keep going! →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowOnboarding(false);
                          localStorage.setItem("understandable-onboarded", "true");
                        }}
                        className="w-full py-6 md:py-10 rounded-[1.5rem] md:rounded-[2.5rem] font-sans text-xl md:text-2xl font-black uppercase tracking-[0.2em] bg-accent text-white hover:bg-slate-900 transition-all shadow-[0_20px_50px_rgba(166,139,106,0.3)] hover:-translate-y-2 ring-8 ring-accent/10 hover:ring-slate-900/5"
                      >
                        Let's Explore! →
                      </button>
                    )}
                    {onboardingStep > 0 && (
                      <button
                        onClick={() => setOnboardingStep(onboardingStep - 1)}
                        className="font-sans text-base font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity p-6"
                      >
                        ← Wait, go back
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-accent/5 blur-[200px]" />
        </div>

        {/* Header */}
        <header className="px-4 md:px-12 py-3 md:py-6 flex justify-between items-center shrink-0 sticky top-0 z-30 transition-all bg-bg/80 backdrop-blur-2xl border-b border-border">
          <div className="flex items-center gap-4 md:gap-8">
            <Tooltip text="Go Home">
              <div className="flex flex-col group cursor-pointer transition-all hover:opacity-100 uppercase text-ink" 
                onClick={() => { setConcept(""); setResult(null); setShowIndex(false); setShowAccount(false); }}>
                <div className="flex items-center gap-3 md:gap-4">
                  <UnderstandableLogo />
                  <span className="hidden sm:block h-px w-6 md:w-10 bg-current opacity-30" />
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="flex items-center gap-6">
            {result && (
              <button 
                onClick={() => { setConcept(""); setResult(null); setShowIndex(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="md:hidden flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-black text-accent bg-accent/5 px-4 py-2 rounded-full border border-accent/20"
              >
                <Search size={14} /> New Search
              </button>
            )}
            {authReady && (
              user ? (
                <div className="relative">
                  <Tooltip text="My Profile">
                    <button 
                      onClick={() => setShowAccount(!showAccount)}
                      className="flex items-center gap-4 md:gap-6 hover:opacity-80 transition-all text-ink"
                    >
                      <div className="hidden sm:flex flex-col items-end text-right">
                        <span className="font-mono text-sm uppercase tracking-widest font-black leading-none">{user.displayName?.split(' ')[0]}</span>
                        <span className="text-[10px] uppercase tracking-[0.1em] text-accent mt-1 font-black">Connected</span>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center p-0.5">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        )}
                      </div>
                    </button>
                  </Tooltip>

                  {/* Account Dropdown */}
                  <AnimatePresence>
                    {showAccount && (
                      <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowAccount(false)}>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 md:right-0 top-16 md:top-20 w-[calc(100vw-32px)] sm:w-80 md:w-96 z-50 p-6 md:p-8 border-2 border-border shadow-[16px_16px_0_0_rgba(0,0,0,0.03)] bg-surface text-ink rounded-3xl overflow-y-auto max-h-[80vh] custom-scrollbar"
                        >
                   <div className="flex flex-col gap-10">
                          <div className="flex flex-col gap-6 border-b-2 border-border pb-12">
                            <span className="font-mono text-xs uppercase tracking-[0.3em] font-black opacity-80">Your Account</span>
                            <div className="flex flex-col">
                              <span className="text-3xl font-display font-black uppercase tracking-[0.1em]">{user.displayName}</span>
                              <span className="text-sm font-mono opacity-80 break-all mt-2">{user.email}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-10">
                            <button 
                              onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('personal'); }}
                              className="w-full text-left font-mono text-lg uppercase tracking-[0.4em] font-black hover:text-accent transition-all flex items-center justify-between group py-4"
                            >
                              My Learning History
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                            <button 
                              onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('global'); }}
                              className="w-full text-left font-mono text-lg uppercase tracking-[0.4em] font-black hover:text-accent transition-all flex items-center justify-between group py-4"
                            >
                              Browse All Topics
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                            <button 
                              onClick={() => { setShowAccount(false); setShowOnboarding(true); setOnboardingStep(0); }}
                              className="w-full text-left font-mono text-lg uppercase tracking-[0.4em] font-black hover:text-accent transition-all flex items-center justify-between group py-4"
                            >
                              How Understandable Works
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                            <button 
                              onClick={() => { setShowAccount(false); setIsCustomizing(true); }}
                              className="w-full text-left font-mono text-lg uppercase tracking-[0.4em] font-black hover:text-accent transition-all flex items-center justify-between group py-4"
                            >
                              Saved Concepts
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                          </div>

                          <div className="pt-12 border-t-2 border-border flex justify-end items-center">
                            <button 
                              onClick={() => signOut(auth)}
                              className="font-mono text-sm uppercase tracking-[0.4em] font-black opacity-80 hover:opacity-100 hover:text-accent transition-all py-4"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
                <Tooltip text="Sign in to your account">
                  <button 
                    onClick={handleLogin}
                    className="font-mono text-sm md:text-xl tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all font-black border-2 border-ink px-6 py-3 md:px-12 md:py-6 hover:bg-ink hover:text-bg text-ink rounded-xl md:rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] md:shadow-[8px_8px_0_0_rgba(0,0,0,0.05)]"
                  >
                    SIGN IN
                  </button>
                </Tooltip>
              )
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row z-10 transition-all md:divide-x divide-white/5">
          
          {/* INPUT COLUMN */}
          {!showIndex && (
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`w-full md:w-[32%] flex flex-col p-6 md:p-10 lg:px-20 lg:py-32 border-b md:border-b-0 md:sticky md:top-16 md:h-[calc(100vh-80px)] overflow-y-auto no-scrollbar
                ${result ? 'hidden md:flex' : 'flex'}
              `}
            >
            <div className="w-full md:max-w-md md:ml-auto">
              <span className="font-mono text-[10px] md:text-sm tracking-[0.4em] uppercase mb-4 block font-black text-ink">
                Understand Anything. Instantly.
              </span>
              
              <div className="relative p-6 md:p-10 border-2 md:border-4 transition-all duration-500 bg-surface border-border shadow-[12px_12px_0_0_rgba(0,0,0,0.03)] rounded-3xl">
                <textarea
                  ref={inputRef}
                  value={concept}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length <= MAX_CONCEPT_LENGTH) {
                      setConcept(val);
                      setConceptError(null);
                    } else {
                      setConceptError(`Topic must be under ${MAX_CONCEPT_LENGTH} characters.`);
                    }

                    if (e.target.scrollHeight < 400) {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.max(e.target.scrollHeight, 60) + 'px';
                    }
                  }}
                  onKeyDown={handleKey}
                  placeholder="Type any topic you want to understand..."
                  rows={1}
                  className={`w-full bg-transparent border-none outline-none resize-none transition-all duration-700 break-words placeholder:opacity-60 text-xl md:text-3xl lg:text-4xl font-display font-black text-ink tracking-tighter leading-none
                    ${conceptError ? "text-red-500" : ""}
                  `}
                />
              </div>

              {conceptError && (
                <div className="mt-4 p-4 bg-red-500/10 border-2 border-red-500/40 text-red-500 text-[10px] font-mono uppercase tracking-widest leading-loose">
                  {conceptError}
                </div>
              )}

              <div className="mt-2 flex justify-between items-center">
                {!user && (
                  <button 
                    onClick={handleLogin}
                    className="font-mono text-[10px] uppercase tracking-widest text-accent font-black hover:opacity-100 transition-opacity opacity-80"
                  >
                    Sign in to save
                  </button>
                )}
                <span className={`font-mono text-[10px] uppercase tracking-widest transition-opacity ml-auto ${concept.length > MAX_CONCEPT_LENGTH * 0.8 ? "opacity-100" : "opacity-40"}`}>
                  {concept.length} / {MAX_CONCEPT_LENGTH}
                </span>
              </div>

              <div className="mt-8 md:mt-12 mb-8 md:mb-12">
                <button
                  onClick={() => {
                    understandTopic();
                  }}
                  disabled={concept.length === 0 || !!conceptError || loading}
                  className={`w-full group flex items-center justify-center gap-6 px-8 py-5 md:px-12 md:py-8 font-mono text-sm md:text-lg uppercase tracking-[0.2em] font-black transition-all border-4 shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_0_rgba(255,255,255,0.15)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]
                    ${(concept.length === 0 || !!conceptError || loading) ? "opacity-30 cursor-not-allowed" : "opacity-100"}
                    bg-black border-white/20 text-white hover:bg-white hover:text-black
                  `}
                >
                  {loading ? "Synthesizing..." : "Understand it!"}
                </button>
              </div>

              {/* SUGGESTIONS */}
              <div className="mb-24 transition-opacity">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-xs uppercase tracking-[0.3em] font-black opacity-80">Try these topics</span>
                  <Tooltip text="Shuffle Concepts">
                    <button 
                      onClick={refreshSuggestions}
                      className="p-2 transition-opacity"
                      title="Shuffle concepts"
                    >
                      <RotateCcw className="w-5 h-5" strokeWidth={3} />
                    </button>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {suggestions.map((s, i) => {
                    const colors = [
                      "bg-[#FFD1DC] text-black border-[#FFB1C1] hover:bg-[#FFC1CC]", // Pink
                      "bg-[#B3E5FC] text-black border-[#81D4FA] hover:bg-[#A1D5EC]", // Blue
                      "bg-[#FFF9C4] text-black border-[#FFF176] hover:bg-[#FFF5B4]", // Yellow
                      "bg-[#C8E6C9] text-black border-[#A5D6A7] hover:bg-[#B8D6B9]", // Green
                      "bg-[#E1BEE7] text-black border-[#CE93D8] hover:bg-[#D1AEC7]", // Purple
                    ];
                    const rotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-0"];
                    const colorClass = colors[i % colors.length];
                    const rotationClass = rotations[i % rotations.length];

                    return (
                      <button
                        key={s.concept}
                        onClick={() => understandTopic(s.concept)}
                        className={`text-left p-6 border-2 transition-all group/sug min-h-[100px] flex flex-col justify-between shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] hover:shadow-[10px_10px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-2px]
                          ${colorClass} ${rotationClass} font-sans text-[10px] md:text-xs uppercase font-black tracking-widest
                        `}
                      >
                        <div className="w-4 h-1 bg-black/10 mb-2" />
                        <span>{s.concept}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            <div className={`space-y-8 max-w-xs transition-all duration-1000
              ${loading ? "opacity-100" : "opacity-80"}
            `}>
              <div className="h-3 w-40 bg-accent" />
              <p className="text-lg font-mono uppercase tracking-[0.4em] leading-loose text-current font-black">
                {loading ? "Thinking about your topic..." : "Ready to start"}
              </p>
            </div>
          </div>
        </motion.section>
        )}

        {/* RESULT COLUMN */}
        <section ref={resultRef} className={`w-full ${!showIndex ? 'md:w-[68%]' : 'md:w-full'} flex flex-col p-6 md:p-12 lg:px-24 lg:py-24 transition-all duration-1000 bg-bg`}>
          <div className="flex-1 flex flex-col justify-center py-10">
            <AnimatePresence mode="wait">
            {showIndex ? (
              <motion.div
                key="index"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="mb-12 md:mb-24 flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 md:border-b-8 border-current pb-12 md:pb-20 gap-8">
                  <div className="flex flex-wrap gap-8 md:gap-24">
                    {["personal", "global"].map(type => (
                      <button 
                        key={type}
                        onClick={() => setIndexType(type as any)}
                        className={`font-sans text-xl md:text-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all
                          ${indexType === type ? "scale-105 md:scale-110 text-accent underline underline-offset-8 md:underline-offset-[24px] decoration-4 md:decoration-8" : "opacity-30 hover:opacity-100"}
                        `}
                      >
                        {type === "personal" ? "My Past Topics" : "Explore Topics"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowIndex(false)} className="w-full md:w-auto font-mono text-xs md:text-lg uppercase tracking-widest font-black border-2 border-ink px-8 py-4 md:px-12 md:py-6 hover:bg-ink hover:text-bg transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] rounded-xl text-ink">← Back to Synthesis</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-10 custom-scrollbar">
                  {loadingIndex ? (
                    <div className="h-full flex items-center justify-center font-mono text-2xl uppercase tracking-[0.4em] animate-pulse font-black italic">Retrieving Encrypted Index...</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8 pb-20">
                      {(indexType === "personal" ? savedUnderstandables : globalLogs).map((ax, i) => (
                        <button
                          key={ax.id || i}
                          onClick={() => {
                            setResult(ax.payload || ax);
                            setConcept(ax.concept);
                            setShowIndex(false);
                          }}
                          className="group flex flex-col md:flex-row items-start md:items-center justify-between py-12 px-8 md:py-16 md:px-20 transition-all hover:bg-black hover:text-white border-4 border-current/10 hover:border-black text-left gap-8"
                        >
                          <div className="flex flex-col gap-4 md:gap-6 w-full md:w-auto">
                             <div className="flex items-center gap-6 md:gap-10">
                               <span className="font-mono text-sm md:text-lg opacity-60 uppercase tracking-widest font-black shrink-0">{(i+1).toString().padStart(2, '0')}</span>
                               <span className={`text-xl md:text-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] break-words line-clamp-2`}>{ax.concept}</span>
                             </div>
                             <p className="text-sm md:text-xl opacity-80 font-sans leading-relaxed line-clamp-1 pl-12 md:pl-20">"{(ax.payload?.zenith || ax.zenith)}"</p>
                          </div>
                          <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 shrink-0">
                            <span className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] font-black italic opacity-80 group-hover:opacity-100 transition-opacity">{ax.domain || (ax.payload?.domain)}</span>
                          </div>
                        </button>
                      ))}
                      {(indexType === "personal" ? savedUnderstandables : globalLogs).length === 0 && (
                        <div className="py-40 text-center font-sans text-4xl opacity-70 leading-normal">No traces found in current sector.<br/>Awaiting synthesis.</div>
                      )}
                      
                      <div className="mt-12 flex justify-center">
                        <button 
                          onClick={() => setShowIndex(false)}
                          className="font-mono text-sm md:text-xl uppercase tracking-[0.4em] font-black border-b-4 border-current pb-4 hover:text-accent hover:border-accent transition-all"
                        >
                          ← Return to Exploration
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-6xl mx-auto flex flex-col"
              >
                <div className="mb-12 flex justify-start">
                  <button 
                    onClick={() => { setConcept(""); setResult(null); }}
                    className="font-mono text-sm uppercase tracking-widest font-black text-ink hover:text-accent transition-all flex items-center gap-3"
                  >
                    ← Back to Exploration
                  </button>
                </div>

                {/* 1: THE HOOK (The Provocation) */}
                {result.hook && (
                   <div className="mb-12 md:mb-20 pb-12 md:pb-16 border-b-4 border-current/20 flex flex-col gap-6">
                     <div className="flex justify-start">
                        <UnderstandableVoice text={result.hook} />
                     </div>
                     <p className="font-sans font-bold text-2xl md:text-5xl text-accent leading-tight text-pretty">
                        {result.hook}
                     </p>
                   </div>
                )}

                {/* The Core Idea */}
                <div className="mb-16 md:mb-32 flex items-center gap-16">
                  <div className="flex flex-col">
                    <SectionLabel className="mb-6 md:mb-12">The Main Idea</SectionLabel>
                    <h2 className="text-4xl md:text-9xl font-display font-black uppercase tracking-tight leading-none text-ink">{concept}</h2>
                  </div>
                  <div className="flex-1 h-1 md:h-2 bg-current opacity-10 ml-8 md:ml-16 rounded-full" />
                </div>

                {/* What It Feels Like */}
                <div className="flex flex-col mb-32 md:mb-56">
                   <SectionLabel className="mb-12 md:mb-20">The Human Story</SectionLabel>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 lg:gap-40 relative">
                    {/* Vertical Divider line between states */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 md:w-2 bg-current opacity-10 -translate-x-1/2" />

                    <div className="space-y-8 md:space-y-16">
                      <div className="flex items-center justify-between gap-6">
                        <StateStamp 
                          label={result.axis1?.labelA || "Before you look..."} 
                          type="success" 
                        />
                        <div className="flex flex-1 items-center gap-6">
                          <div className="h-1 flex-1 bg-current opacity-10" />
                          <UnderstandableVoice text={result.axis1?.stateA || result.stateA} />
                        </div>
                      </div>
                        <p className="text-xl md:text-4xl font-sans leading-[1.6] text-pretty font-bold transition-all text-ink">
                          {result.axis1?.stateA || result.stateA}
                        </p>
                      <div className="flex flex-col gap-4">
                        <ELI9Card content={result.axis1?.stateA_eli9} />
                        <VoteUI content={result.axis1?.stateA || result.stateA} />
                      </div>
                    </div>

                    <div className="space-y-8 md:space-y-16">
                      <div className="flex items-center justify-between gap-6">
                        <StateStamp 
                          label={result.axis1?.labelB || "Once you look..."} 
                          type="struggle" 
                        />
                        <div className="flex flex-1 items-center gap-6">
                          <div className="h-1 flex-1 bg-current opacity-10" />
                          <UnderstandableVoice text={result.axis1?.stateB || result.stateB} />
                        </div>
                      </div>
                        <p className="text-xl md:text-4xl font-sans leading-[1.6] text-pretty font-bold transition-all text-ink">
                          {result.axis1?.stateB || result.stateB}
                        </p>
          <div className="flex flex-col gap-4">
            <ELI9Card content={result.axis1?.stateB_eli9} />
            <VoteUI content={result.axis1?.stateB || result.stateB} />
          </div>
                    </div>
                  </div>
                </div>

                 {/* The Secret Way It Works */}
                 {result.axis2?.mechanism && (
                    <div className="mb-40 md:mb-64 p-12 md:p-24 border-2 border-accent/20 bg-accent/5 relative overflow-hidden group rounded-[2.5rem] shadow-[20px_20px_0_0_rgba(74,103,65,0.03)]">
                       <div className="flex justify-between items-center mb-16">
                         <SectionLabel>The Hidden Mechanism</SectionLabel>
                         <UnderstandableVoice text={result.axis2.mechanism} />
                       </div>
                       <p className="text-3xl md:text-7xl font-display font-bold leading-[1.1] tracking-tight text-ink">
                          {result.axis2.mechanism}
                       </p>
                      <div className="flex flex-col gap-4">
                        <ELI9Card content={result.axis2.mechanism_eli9} />
                        <VoteUI content={result.axis2.mechanism} />
                      </div>
                   </div>
                )}

                 {/* The Big Picture */}
                 <div className="relative pt-24 md:pt-48 border-t-4 md:border-t-8 border-current/10 pb-24 md:pb-40">
                    <div className="absolute top-8 md:top-16 left-0 right-0 flex justify-between items-center">
                      <SectionLabel>The Big Realization</SectionLabel>
                      <UnderstandableVoice text={result.axis3?.zenith || result.zenith} />
                    </div>

                   <div className="flex flex-col gap-12 md:gap-20 mb-24 md:mb-48">
                      <div className="space-y-8">
                        <p className="leading-[1.2] transition-all break-words whitespace-pre-wrap text-3xl md:text-7xl lg:text-8xl font-display font-black text-ink tracking-tighter">
                          "{result.axis3?.zenith || result.zenith}"
                        </p>
                        <div className="flex flex-col gap-4">
                          <ELI9Card content={result.axis3?.zenith_eli9} />
                          <VoteUI content={result.axis3?.zenith || result.zenith} />
                        </div>
                      </div>
                      
                       {result.identityAnchor && (
                         <div className="space-y-12">
                           <div className="flex items-center gap-10 md:gap-20 mt-12 md:mt-24 pt-8 md:pt-16 border-t-2 border-accent/20">
                               <div className="w-12 md:w-32 h-1 bg-accent" />
                               <div className="flex-1 flex flex-col gap-6">
                                 <div className="flex justify-between items-center">
                                   <span className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] opacity-40">Something to think about:</span>
                                   <UnderstandableVoice text={result.identityAnchor} />
                                 </div>
                                 <p className="text-2xl md:text-5xl font-sans text-accent font-black leading-relaxed">
                                     {result.identityAnchor}
                                 </p>
                               </div>
                           </div>
                          <div className="flex flex-col gap-4">
                            <ELI9Card content={result.identityAnchor_eli9} />
                            <VoteUI content={result.identityAnchor} />
                          </div>
                        </div>
                      )}
                   </div>

                   {result.distillation && (
                      <div className="flex justify-center mb-16 opacity-40">
                         <div className="border-2 border-current px-8 py-4 font-mono text-lg md:text-xl font-black uppercase tracking-[0.3em]">
                            {result.distillation}
                         </div>
                      </div>
                   )}

                   <div className="flex flex-col md:flex-row items-center justify-between gap-16 md:gap-32 bg-current/5 p-8 md:p-16 lg:p-24 border-l-[12px] md:border-l-[20px] border-accent">
                          <Tooltip text="Clear Current Result">
                            <button
                              onClick={() => {
                                setConcept("");
                                setResult(null);
                              }}
                              className="font-mono text-sm md:text-3xl tracking-[0.2em] md:tracking-[0.4em] uppercase font-black border-b-4 md:border-b-8 border-current hover:text-accent hover:border-accent transition-all pb-4 md:pb-8 flex items-center gap-6 md:gap-12"
                            >
                              ← Try a New Topic
                            </button>
                          </Tooltip>

                      <div className="flex flex-col sm:flex-row gap-8 md:gap-20 items-center w-full md:w-auto">
                        <Tooltip text="View Saved Triangulations">
                          <button 
                            onClick={() => setShowIndex(true)}
                            className="font-mono text-lg md:text-3xl tracking-[0.3em] md:tracking-[0.4em] uppercase font-black hover:text-accent transition-colors"
                          >
                            Save to My Topics
                          </button>
                        </Tooltip>
                        
                         <Tooltip text={user ? "Persist to Physical Reality" : "Sign in to Materialize"}>
                          <button 
                            onClick={saveToLibrary}
                            disabled={saving || saveSuccess}
                            className={`w-full md:w-auto font-mono text-lg md:text-3xl uppercase tracking-[0.3em] font-black px-12 md:px-24 py-6 md:py-12 transition-all border-4 md:border-8 shadow-[12px_12px_0_0_current] rounded-2xl
                              ${saveSuccess ? "bg-accent border-accent text-bg" : "bg-ink text-bg border-ink hover:bg-bg hover:text-ink"}
                            `}
                          >
                            {!user ? "SIGN IN" : saveSuccess ? "SYNCHRONIZED" : "Download Summary"}
                          </button>
                        </Tooltip>

                        <Tooltip text="Download Raw Vector">
                          <button 
                            onClick={handleDownloadSVG}
                            className={`p-6 transition-all opacity-60 hover:opacity-100 hover:text-accent`}
                          >
                            <Download className="w-12 h-12 md:w-16 md:h-16" strokeWidth={3} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="mt-32 md:mt-64 mb-48 md:mb-80 flex flex-col items-center text-center">
                        <div className="w-16 h-1 bg-accent mb-12 opacity-30" />
                        <h3 className="font-mono text-lg md:text-xl uppercase tracking-[0.4em] font-black opacity-60 mb-8">End of Synthesis</h3>
                        <p className="text-xl md:text-3xl font-sans font-bold mb-16 max-w-xl mx-auto text-ink/60">
                          You've reached the end of this triangulation. Ready to explore a new concept?
                        </p>
                        <button
                          onClick={() => {
                            setConcept("");
                            setResult(null);
                            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-8 px-12 py-8 font-mono text-lg md:text-xl uppercase tracking-[0.3em] font-black transition-all border-4 shadow-[12px_12px_0_0_current] hover:translate-x-[-6px] hover:translate-y-[-6px] hover:shadow-[16px_16px_0_0_current] active:translate-x-0 active:translate-y-0 active:shadow-[6px_6px_0_0_current] bg-accent border-accent text-bg rounded-2xl"
                        >
                          Want to explore another topic? →
                        </button>
                    </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="flex flex-col items-center">
                  {error ? (
                    <motion.div 
                      key="error-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md p-16 border-2 transition-all relative overflow-hidden bg-red-500/10 border-red-500/40"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                      <AlertTriangle className="w-12 h-12 text-red-500 mb-10 opacity-80" strokeWidth={2.5} />
                      <h3 className="font-mono text-lg uppercase tracking-[0.5em] mb-12 font-black text-red-500">
                        Synchrony Failure // Flux 429
                      </h3>
                      <p className={`font-sans font-bold text-2xl leading-relaxed mb-16
                        ${theme === "studio" ? "text-ink" : "text-bg"}
                      `}>
                        {error}
                      </p>
                      <button 
                        onClick={() => {
                          setError(null);
                          setTimeout(understandTopic, 100);
                        }}
                        className={`w-full font-mono text-lg uppercase tracking-[0.3em] px-10 py-8 transition-all border-4 font-black shadow-[12px_12px_0_0_rgba(239,68,68,0.2)] rounded-xl
                          ${theme === "studio" ? "bg-red-500 border-red-500 text-bg hover:bg-bg hover:text-red-500" : "border-ink text-ink hover:bg-ink hover:text-bg"}
                        `}
                      >
                        Re-initialize Link →
                      </button>
                    </motion.div>
                  ) : loading ? (
                    <>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20">
                        <div className="w-4 h-4 rounded-full border-2 border-accent animate-ping" />
                      </div>
                      <div className="flex gap-4 mb-4 font-mono text-xs uppercase tracking-widest font-black">
                        <span className="animate-pulse text-accent uppercase tracking-[0.2em]">Thinking about your topic</span>
                        <div className="flex gap-1 items-center">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce [animation-delay:0.2s]">.</span>
                          <span className="animate-bounce [animation-delay:0.4s]">.</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-ink font-black uppercase tracking-[0.5em]">Building your explanation</span>
                    </>
                  ) : (
                    <>
                      <div className={`mx-auto transition-all duration-1000 w-24 h-1 bg-current mb-16`} />
                      <p className="font-serif italic text-2xl md:text-3xl lg:text-4xl leading-tight transition-all px-12 text-ink">
                        "Never stop learning"
                      </p>
                    </>
                  )}
                  {user && savedUnderstandables.length > 0 && !loading && (
                    <div className="mt-12 md:mt-24 space-y-6">
                      <p className="font-sans text-xl md:text-2xl font-bold opacity-60">
                        Welcome back! Your topics are waiting for you.
                      </p>
                      <button 
                        onClick={() => setShowIndex(true)}
                        className="font-sans text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.2em] px-12 py-10 transition-all border-4 shadow-[12px_12px_0_0_current] hover:translate-x-[-6px] hover:translate-y-[-6px] hover:shadow-[16px_16px_0_0_current] active:translate-x-0 active:translate-y-0 active:shadow-[6px_6px_0_0_current] bg-accent border-accent text-bg rounded-[2rem]"
                      >
                        Pick up where you left off →
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </section>
      </main>

      {/* FOOTER */}
        <footer className="px-16 py-12 flex justify-between items-center shrink-0 z-20 transition-all font-mono text-sm uppercase tracking-[0.4em] font-black bg-bg border-t border-border text-ink">
          <div className="flex gap-20 font-mono">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={systemOnline === true ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${systemOnline === true ? "bg-accent" : systemOnline === false ? "bg-red-400" : "bg-ink/30"}`}
              />
              <span className={`hidden lg:inline ${systemOnline === false ? "text-red-400" : "text-accent"}`}>
                {systemOnline === false ? "Knowledge Base Syncing..." : "Knowledge Base Online"}
              </span>
            </div>
          </div>
          <div className="font-mono opacity-60">
             © 2026 // Understandable.io
          </div>
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isCustomizing && result && (
          <CoasterCustomizer 
            concept={concept}
            understandableData={result}
            onClose={() => setIsCustomizing(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ECECEB;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8B7355;
        }
      `}</style>
    </div>
  );
}
