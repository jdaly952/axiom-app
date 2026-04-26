import React, { useState, useRef, useEffect, Component } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, handleFirestoreError, OperationType, testFirebaseConnection, firebaseConfig } from "./firebase";
import { deleteDoc } from "firebase/firestore";
import CoasterCustomizer from "./components/CoasterCustomizer";
import { Tooltip } from "./components/Tooltip";
import { ShareButton } from "./components/ShareButton";

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

import confetti from 'canvas-confetti';

const triggerSuccessConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4A6741', '#FFD700', '#FF8C00'] // Use theme colors
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
  signInWithRedirect,
  getRedirectResult,
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
import { Shield, Save, CheckCircle2, AlertCircle, AlertTriangle, LogIn, ChevronLeft, Trash2, Download, ArrowRight, RotateCcw, Mail, Volume2, VolumeX, Loader2, Sparkles, Rocket, Heart, Smile, Lightbulb, Cloud, Telescope, Ghost, CircleDashed, Search, Globe, RefreshCw } from "lucide-react";
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


const CURIOUS_CONCEPTS = [
  "Imposter Syndrome",
  "How Does the Internet Work?",
  "Opportunity Cost",
  "Why We Self-Sabotage"
];

const MAX_CONCEPT_LENGTH = 108;
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
const VoteUI = ({ content, onRegenerate }: { content: string; onRegenerate?: () => void }) => {
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
      if (!isUp && onRegenerate) {
        onRegenerate();
      }
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

// --- Feedback UI Component ---
const FeedbackUI = ({ content }: { content: string }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const contentHash = hashContent(content);

  const handleSubmit = async () => {
    if (!rating) return;
    try {
      await addDoc(collection(db, "feedback"), {
        uid: auth.currentUser?.uid,
        contentHash,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "feedback");
    }
  };

  if (submitted) return <div className="mt-4 font-mono text-[10px] text-accent">Thanks for your feedback!</div>;

  return (
    <div className="mt-8 p-4 border border-border rounded-lg bg-surface">
      <h3 className="font-mono text-xs uppercase mb-2">How understandable was this?</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(r => (
          <button key={r} onClick={() => setRating(r)} className={`p-2 rounded ${rating === r ? 'bg-accent text-white' : 'bg-surface border'}`}>
            {r}
          </button>
        ))}
      </div>
      <textarea 
        className="w-full mt-2 p-2 bg-bg border rounded"
        placeholder="Any brief comments?"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <Tooltip text="Click to submit your rating">
        <button onClick={handleSubmit} className="mt-2 text-xs font-mono bg-accent text-white p-2 rounded">Submit Feedback</button>
      </Tooltip>
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
      className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-current/20 hover:border-accent/60 hover:bg-accent/5 transition-all group shrink-0 shadow-sm"
      title="Voice Synthesis"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-accent" />
      ) : isPlaying ? (
        <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-accent" />
      ) : (
        <Volume2 className="w-5 h-5 md:w-6 md:h-6 opacity-60 group-hover:opacity-100" />
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
    <div className="mt-4 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-1.5 pr-4 rounded-full border transition-all hover:scale-[1.02] active:scale-[0.98]
          ${isOpen 
            ? 'bg-accent/10 border-accent/30 text-accent' 
            : 'bg-surface border-border text-ink/70 hover:text-ink'}
          shadow-sm
        `}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isOpen ? 'bg-accent/20' : 'bg-black/5'}`}>
           <Heart className="w-3 h-3" />
        </div>
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="font-serif italic text-[11px] md:text-xs font-bold">The Heartland</span>
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">{isOpen ? 'Closing' : 'See Essence'}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden rounded-[1.5rem] border border-accent/20 bg-accent/[0.02]"
          >
            <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 font-bold">Core Truth</span>
                  <UnderstandableVoice text={content} />
                </div>
               <p className="text-lg md:text-2xl font-serif italic font-semibold leading-relaxed text-accent">
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
      {/* Understandable.io Logo: A U inside a 3D isometric cube with intersecting center lines */}
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-accent">
        {/* Isometric Cube edges */}
        <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M50 10 L50 90" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 30 L50 50 L90 30" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 70 L50 50" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M90 70 L50 50" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* U shape in the center */}
        <path d="M40 40 L40 55 Q40 65 50 65 Q60 65 60 55 L60 40" 
              stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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
      await signInWithRedirect(auth, provider);
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
  const [isCommunityShared, setIsCommunityShared] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [communityShares, setCommunityShares] = useState<any[]>([]);
  
  const deleteTopic = async (topicId: string) => {
    try {
      await deleteDoc(doc(db, "saved_topics", topicId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `saved_topics/${topicId}`);
    }
  };

  // --- Coaster State ---
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [learningStyleIndex, setLearningStyleIndex] = useState(0);

  const LEARNING_STYLES = ["analogy", "scientific", "visceral/emotional", "narrative"];
  const currentStyle = LEARNING_STYLES[learningStyleIndex];

  const StyleTag = ({ style }: { style: string }) => (
    <div className="inline-block px-2 py-1 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] uppercase tracking-widest font-bold">
      {style}
    </div>
  );

  // --- Account/Index State ---
  const [showIndex, setShowIndex] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [bannerBgClass, setBannerBgClass] = useState("bg-accent/5");
  const [bannerTextClass, setBannerTextClass] = useState("text-accent");

  useEffect(() => {
    if (!concept) {
        setBannerBgClass("bg-accent/5");
        setBannerTextClass("text-accent");
    }
  }, [concept]);
  const [indexType, setIndexType] = useState<"personal" | "global">("personal");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [savedUnderstandables, setSavedUnderstandables] = useState<any[]>([]);
  const [category, setCategory] = useState<string>("General");
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
    // Use only the static list
    const combined = Array.from(new Set([...concepts]));
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

    getRedirectResult(auth).then((result) => {
      if (result?.user) console.log("Redirect sign-in:", result.user.email);
    }).catch(console.error);

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

      // Setup listener for community shares
      const qCommunity = query(
        collection(db, "community_shares"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const unsubscribeCommunity = onSnapshot(qCommunity, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCommunityShares(docs);
      }, (err) => {
        console.warn("Community shares sync error", err);
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
      await signInWithRedirect(auth, provider);
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

  const nextSlide = () => {
    setCurrentSlide(prev => {
      const next = Math.min(5, prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const prevSlide = () => {
    setCurrentSlide(prev => {
      const next = Math.max(0, prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const saveToLibrary = async () => {
    if (!user) {
      await handleLogin();
      return;
    }
    if (!result || saving) return;

    setSaving(true);
    console.log("Understandable: Locking in insight...");
    try {
      const cleanConcept = concept.replace(/\s*-\s*explain in greater depth and detail\s*$/gi, "");
      const slug = cleanConcept.toLowerCase().trim().replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const globalRef = doc(db, "global_index", slug);
      
      await Promise.all([
        addDoc(collection(db, "saved_topics"), {
          uid: user.uid,
          concept: cleanConcept,
          payload: result,
          isManuallySaved: true,
          category: category,
          userDisplayName: user.displayName,
          createdAt: serverTimestamp(),
          bannerBgClass: bannerBgClass,
          bannerTextClass: bannerTextClass
        }),
        setDoc(globalRef, {
          concept: concept,
          rank: increment(10),
          lastPayload: result,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);
      
      console.log("Understandable: Insight stored successfully.");
      setSaveSuccess(true);
    } catch (err) {
      console.error("Understandable Save Error:", err);
      handleFirestoreError(err, OperationType.CREATE, "saved_topics");
    } finally {
      setSaving(false);
    }
  };

  const shareToCommunity = async () => {
    if (!user || !result || isCommunityShared) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "community_shares"), {
        uid: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        concept: concept,
        payload: result,
        category: category,
        createdAt: serverTimestamp()
      });
      setIsCommunityShared(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "community_shares");
    } finally {
      setSaving(false);
    }
  };

  const understandTopic = async (overrideTopic?: string, targetStyleIndex?: number) => {
    let baseTopic = overrideTopic || concept;
    baseTopic = baseTopic.replace(/\s*-\s*explain in greater depth and detail\s*$/gi, "");
    if (!baseTopic.trim()) return;
    
    // Cycle or select style
    let newIndex = targetStyleIndex !== undefined ? targetStyleIndex : (overrideTopic ? 0 : (learningStyleIndex + 1) % LEARNING_STYLES.length);
    
    setLearningStyleIndex(newIndex);
    setCurrentSlide(0);
    const selectedStyle = LEARNING_STYLES[newIndex];
    
    setIsCommunityShared(false);
    setSaveSuccess(false);
    if (overrideTopic) {
      setConcept(baseTopic);
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
      
      const prompt = `Generate a 3-6-9 Triangulation for the concept: "${baseTopic}". If the concept is complete nonsense, a non-concept, or unrecognizable, return a JSON with a "valid" field set to false and a "mechanism" field explaining that the topic needs to be clearer. If valid, return "valid": true, "hook", "analogy", and "mechanism" fields.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompt}. Use a ${selectedStyle} learning style for the explanation.`,
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
        
        // Detect nonsensical topic placeholder
        if (data.valid === false) {
          setError(data.mechanism || "That concept doesn't seem to be a recognized idea. Could you try phrasing it differently or being more specific?");
          setLoading(false);
          return;
        }

        setResult(data);

        // Auto-scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);

        const slug = baseTopic.toLowerCase().trim().replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const globalRef = doc(db, "global_index", slug);

        // --- AUTOMATIC PERSISTENCE FOR LEARNING & RANKING ---
        Promise.all([
          addDoc(collection(db, "synthesis_logs"), {
            concept: baseTopic,
            payload: data,
            uid: user?.uid || null,
            isManuallySaved: false,
            createdAt: serverTimestamp()
          }),
          setDoc(globalRef, {
            concept: baseTopic,
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

  const LearningStyleSwitcher = ({ currentStyleIndex, onSwitch }: { currentStyleIndex: number; onSwitch: (index: number) => void }) => (
    <div className="flex flex-wrap gap-2 mt-8 p-4 border border-border rounded-xl bg-surface items-center justify-center">
      <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 mr-2">Style:</span>
      {LEARNING_STYLES.map((style, index) => (
        <button
          key={style}
          onClick={() => onSwitch(index)}
          disabled={loading}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-lg border transition-all ${
            currentStyleIndex === index 
              ? 'bg-accent text-white border-accent shadow-sm' 
              : 'bg-bg text-ink/70 border-border hover:border-accent/30'
          }`}
        >
          {style}
        </button>
      ))}
    </div>
  );

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
      <div className="min-h-screen bg-[#FFFBFB] text-ink flex flex-col items-center justify-center p-4 md:p-8 font-serif relative overflow-hidden">
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
                       Hello! pg. {onboardingStep + 1} of 4
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
              <Tooltip text="Start a new search">
                <button 
                  onClick={() => { setConcept(""); setResult(null); setShowIndex(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="md:hidden flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-black text-accent bg-accent/5 px-4 py-2 rounded-full border border-accent/20"
                >
                  <Search size={14} /> New Search
                </button>
              </Tooltip>
            )}
            {authReady && (
              <button 
                onClick={() => alert("Community Board is coming soon!")}
                className="hidden md:flex items-center gap-2 font-display text-sm uppercase tracking-widest font-black text-gray-500 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-200 cursor-not-allowed transition-all"
              >
                Community (Coming Soon) 🌎
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
                   <div className="flex flex-col gap-8">
                          <div className="flex flex-col gap-4 border-b-2 border-border pb-8">
                            <span className="font-mono text-xs uppercase tracking-[0.3em] font-black opacity-60">My Account</span>
                            <div className="flex flex-col gap-1">
                              <span className="text-xl font-display font-bold uppercase">{user.displayName}</span>
                              <span className="text-xs font-mono opacity-60">{user.email}</span>
                            </div>
                            {/* <button className="text-xs font-mono underline opacity-60 hover:text-accent w-fit mt-1">Preferences</button> */}
                          </div>

                          <div className="flex flex-col gap-6">
                            <span className="font-mono text-xs uppercase tracking-[0.3em] font-black opacity-60">Learning History</span>
                            <button 
                              onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('personal'); }}
                              className="w-full text-left font-mono text-sm uppercase tracking-[0.2em] font-bold hover:text-accent transition-all flex items-center justify-between group"
                            >
                              My Vault
                            </button>
                            <button 
                              onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('global'); }}
                              className="w-full text-left font-mono text-sm uppercase tracking-[0.2em] font-bold hover:text-accent transition-all flex items-center justify-between group"
                            >
                              Index Library
                            </button>
                          </div>

                          <div className="flex flex-col gap-6 border-t-2 border-border pt-8">
                            <button 
                              onClick={() => alert("Community Board is coming soon!")}
                              className="font-mono text-sm uppercase tracking-[0.2em] font-black text-gray-400 cursor-not-allowed transition-all text-left"
                            >
                              Community (Coming Soon)
                            </button>
                          </div>

                          <div className="pt-8 border-t-2 border-border flex justify-end items-center">
                            <button 
                              onClick={() => signOut(auth)}
                              className="font-mono text-xs uppercase tracking-[0.3em] font-black opacity-60 hover:opacity-100 hover:text-accent transition-all"
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
                <div className="mt-4">
                  <LearningStyleSwitcher currentStyleIndex={learningStyleIndex} onSwitch={(index) => setLearningStyleIndex(index)} />
                </div>
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
                        onClick={() => {
                            const parts = colorClass.split(' ');
                            setBannerBgClass(parts[0]);
                            setBannerTextClass(parts[1]);                
                            understandTopic(s.concept);
                          }}
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
        <section ref={resultRef} className={`w-full ${!showIndex ? 'md:w-[68%]' : 'md:w-full'} flex flex-col p-4 md:p-8 lg:px-12 transition-all duration-1000 bg-bg`}>
          <div className="flex-1 flex flex-col justify-start py-4">
            <AnimatePresence mode="wait">
            {showCommunity ? (
              <motion.div
                key="community"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="mb-12 md:mb-24 flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 md:border-b-8 border-emerald-500 pb-12 md:pb-20 gap-8">
                  <div className="flex flex-col">
                    <h2 className="font-display text-4xl md:text-7xl font-black uppercase tracking-tight text-emerald-600">Community Board 🌎</h2>
                    <p className="font-mono text-sm uppercase tracking-widest opacity-60">Insights that clicked for everyone</p>
                  </div>
                  <button onClick={() => setShowCommunity(false)} className="w-full md:w-auto font-mono text-xs md:text-lg uppercase tracking-widest font-black border-2 border-ink px-8 py-4 md:px-12 md:py-6 hover:bg-ink hover:text-bg transition-all shadow-[8px_8px_0_0_rgba(16,185,129,0.1)] rounded-xl text-ink">← Back to Synthesis</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-10 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {communityShares.map((share, i) => (
                      <button
                        key={share.id}
                        onClick={() => {
                          setResult(share.payload);
                          setConcept(share.concept);
                          setShowCommunity(false);
                          setShowIndex(false);
                          setCurrentSlide(0);
                        }}
                        className="group flex flex-col items-start p-8 transition-all hover:bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 hover:border-emerald-500 text-left gap-6 shadow-sm hover:shadow-xl hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-4 w-full">
                          {share.userPhoto ? (
                            <img src={share.userPhoto} alt={share.userName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                              {share.userName?.charAt(0) || "?"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] uppercase tracking-widest font-black opacity-40">Shared by</span>
                            <span className="font-sans text-xs font-bold">{share.userName || "Anonymous Explorer"}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full">
                           <h3 className="text-xl font-black uppercase tracking-tight leading-none group-hover:text-emerald-600 transition-colors">{share.concept}</h3>
                           <p className="text-sm opacity-70 font-sans leading-relaxed line-clamp-3">"{(share.payload?.zenith || share.payload?.axis3?.zenith || "A new understanding...")}"</p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-emerald-100 w-full flex items-center justify-between">
                           <span className="font-mono text-[9px] uppercase tracking-widest py-1 px-2 bg-emerald-100 text-emerald-700 rounded-md font-bold">{(share.category || "General").toUpperCase()}</span>
                           <span className="font-mono text-[9px] opacity-40 uppercase">{new Date(share.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                    {communityShares.length === 0 && (
                      <div className="col-span-full py-40 text-center flex flex-col items-center gap-8">
                         <div className="text-8xl opacity-20">🍃</div>
                         <p className="font-sans text-4xl opacity-70 leading-normal max-w-lg">The community board is currently silent. Be the first to share an insight! ✨</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : showIndex ? (
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
                        {type === "personal" ? "My Past Topics" : "Explore"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowIndex(false)} className="w-full md:w-auto font-mono text-xs md:text-lg uppercase tracking-widest font-black border-2 border-ink px-8 py-4 md:px-12 md:py-6 hover:bg-ink hover:text-bg transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] rounded-xl text-ink">← Back to Synthesis</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-10 custom-scrollbar">
                  {loadingIndex ? (
                    <div className="h-full flex items-center justify-center font-mono text-2xl uppercase tracking-[0.4em] animate-pulse font-black italic">Retrieving Encrypted Index...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                      {(indexType === "personal" 
                        ? Array.from(new Map(savedUnderstandables.map(item => [item.concept, item])).values()).sort((a,b) => (a.bannerBgClass || '').localeCompare(b.bannerBgClass || ''))
                        : globalLogs
                      ).map((ax, i) => (
                        <button
                          key={ax.id || i}
                          onClick={() => {
                            setResult(ax.payload || ax);
                            setConcept(ax.concept);
                            setShowIndex(false);
                            setBannerBgClass(ax.bannerBgClass || "bg-accent/5");                
                            setBannerTextClass(ax.bannerTextClass || "text-accent");
                          }}
                          className={`group flex flex-col items-start justify-between p-4 transition-all rounded-lg border-2 text-left gap-2 ${ax.bannerBgClass || 'bg-surface'} ${ax.bannerTextClass || 'text-ink'} hover:opacity-80 h-[220px] overflow-hidden`}
                        >
                          <div className="flex flex-col gap-2 w-full">
                             <div className="flex items-center gap-3">
                               <span className="font-mono text-xs opacity-60 uppercase tracking-widest font-black shrink-0">{(i+1).toString().padStart(2, '0')}</span>
                               <span className={`text-lg font-black uppercase tracking-[0.1em] break-words line-clamp-2`}>{ax.concept}</span>
                               <span className={`ml-auto font-mono text-[10px] px-2 py-1 rounded ${ax.bannerBgClass || 'bg-accent/10'} ${ax.bannerTextClass || 'text-accent'}`}>{(ax.domain || ax.payload?.domain || "General").toUpperCase()}</span>
                               
                               {indexType === "personal" && (
                                 <div 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     deleteTopic(ax.id);
                                   }}
                                   className="ml-2 p-1 hover:bg-ink/10 rounded-full cursor-pointer"
                                   title="Delete topic"
                                   role="button"
                                 >
                                   🗑️
                                 </div>
                               )}
                             </div>
                             <p className="text-sm opacity-80 font-sans leading-relaxed line-clamp-2 pl-9">"{(ax.payload?.zenith || ax.zenith)}"</p>
                          </div>
                      
                        </button>
                      ))}
                      {(indexType === "personal" 
                        ? Array.from(new Map(savedUnderstandables.map(item => [item.concept, item])).values()) 
                        : globalLogs
                      ).length === 0 && (
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-6xl mx-auto flex flex-col"
              >
                <div className={`w-full py-6 px-8 mb-8 rounded-2xl shadow-sm border ${bannerBgClass} ${bannerTextClass.replace('text-accent', 'text-ink/60')}`}>
                   <h1 className="text-xl md:text-3xl font-display font-black uppercase tracking-tight">
                     {concept}
                   </h1>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                  {currentSlide === 0 && (
                      <div className="flex flex-col gap-8">
                        <div className="space-y-6">
                         <div className="flex justify-start">
                            <UnderstandableVoice text={result.hook} />
                         </div>
                         <p className="font-sans font-bold text-2xl md:text-5xl text-accent leading-tight">
                            "{result.hook}"
                         </p>
                        </div>
                      </div>
                  )}

                  {currentSlide === 1 && (
                     <div className="space-y-6">
                        <div className="flex justify-center mb-2">
                           <StyleTag style={currentStyle} />
                        </div>
                        <SectionLabel className="!text-3xl md:!text-5xl text-center flex justify-center !font-display !font-black uppercase tracking-tighter">THE ABUNDANCE FRAME</SectionLabel>
                        <p className="text-xl md:text-5xl font-sans leading-relaxed font-bold text-ink text-center text-pretty pt-4 flex items-center justify-center gap-4">
                          {result.axis1?.stateA || result.stateA}
                          <UnderstandableVoice text={result.axis1?.stateA || result.stateA} />
                        </p>
                        <div className="flex justify-center mt-6">
                          <ELI9Card content={result.axis1?.stateA_eli9} />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => understandTopic()}
                            className="flex items-center gap-2 px-4 py-2 mt-2 text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-accent transition-all border border-ink/10 rounded-full"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Recycle Example
                          </button>
                        </div>
                     </div>
                  )}

                  {currentSlide === 2 && (
                    <div className="space-y-6">
                        <div className="flex justify-center mb-2">
                           <StyleTag style={currentStyle} />
                        </div>
                        <SectionLabel className="!text-3xl md:!text-5xl text-center flex justify-center !font-display !font-black uppercase tracking-tighter">THE SCARCITY FRAME</SectionLabel>
                        <p className="text-xl md:text-5xl font-sans leading-relaxed font-bold text-ink text-center text-pretty pt-4 flex items-center justify-center gap-4">
                           {result.axis1?.stateB || result.stateB}
                           <UnderstandableVoice text={result.axis1?.stateB || result.stateB} />
                        </p>
                        <div className="flex justify-center mt-6">
                          <ELI9Card content={result.axis1?.stateB_eli9} />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => understandTopic()}
                            className="flex items-center gap-2 px-4 py-2 mt-2 text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-accent transition-all border border-ink/10 rounded-full"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Recycle Example
                          </button>
                        </div>
                    </div>
                  )}

                  {currentSlide === 3 && (
                      <div className="space-y-10">
                        <div className="flex justify-center mb-2">
                           <StyleTag style={currentStyle} />
                        </div>
                        <SectionLabel>THE HEARTLAND MECHANISM</SectionLabel>
                        <div className="flex justify-center pt-2">
                          <UnderstandableVoice text={result.axis2.mechanism} />
                        </div>
                        <p className="text-2xl md:text-5xl font-display font-bold leading-tight tracking-tight text-ink">
                           {result.axis2.mechanism}
                        </p>
                        <ELI9Card content={result.axis2.mechanism_eli9} />
                        <div className="flex justify-center">
                          <button
                            onClick={() => understandTopic()}
                            className="flex items-center gap-2 px-4 py-2 mt-2 text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-accent transition-all border border-ink/10 rounded-full"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Recycle Example
                          </button>
                        </div>
                    </div>
                  )}

                  {currentSlide === 4 && (
                      <div className="space-y-10">
                          <div className="flex justify-center mb-2">
                             <StyleTag style={currentStyle} />
                          </div>
                          <SectionLabel>THE BIG REALIZATION</SectionLabel>
                          <div className="flex justify-center pt-2">
                             <UnderstandableVoice text={result.axis3?.zenith || result.zenith} />
                          </div>
                          <p className="text-3xl md:text-7xl lg:text-8xl font-display font-black text-ink tracking-tighter leading-tight">
                            "{result.axis3?.zenith || result.zenith}"
                          </p>
                          <ELI9Card content={result.axis3?.zenith_eli9} />
                          <div className="flex justify-center">
                            <button
                                onClick={() => understandTopic()}
                                className="flex items-center gap-2 px-4 py-2 mt-2 text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-accent transition-all border border-ink/10 rounded-full"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Recycle Example
                            </button>
                          </div>
                      </div>
                  )}

                  {currentSlide === 5 && (
                    <AnimatePresence mode="wait">
                      {showSuccessFeedback ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center min-h-[400px] text-center gap-8 p-8"
                        >
                          <div className="text-8xl">🔐</div>
                          <div className="space-y-4">
                            <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-ink">Concept Locked in Vault!</h2>
                            <p className="font-sans text-xl opacity-70">Thank you for contributing to the council of understanding.</p>
                          </div>
                          <button
                            onClick={() => { 
                              setShowSuccessFeedback(false);
                              setConcept(""); 
                              setResult(null); 
                              setCurrentSlide(0); 
                            }}
                            className="px-10 py-5 bg-accent text-bg rounded-3xl font-display font-black text-xl uppercase tracking-tighter hover:scale-105 transition-transform"
                          >
                            Explore New Concept
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="buttons"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center min-h-[400px] text-center gap-12 p-8"
                        >
                          <div className="space-y-4">
                            <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight text-ink">How did that land?</h2>
                            <p className="font-sans text-xl opacity-60">This lesson was using the {currentStyle} style for learning! Did it help you understand?</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <button 
                              onClick={() => { 
                                triggerSuccessConfetti();
                                setShowSuccessFeedback(true);
                              }}
                              className="p-8 bg-accent text-bg rounded-3xl font-display font-black text-2xl uppercase tracking-tighter hover:scale-105 transition-transform shadow-lg shadow-accent/20"
                            >
                               I understand now!
                            </button>
                            
                            <div className="flex flex-col gap-2 p-6 border border-border rounded-3xl bg-surface/50">
                                <p className="text-xs opacity-60 font-mono uppercase tracking-widest mb-2">Try a different style:</p>
                                <div className="flex flex-col gap-2">
                                    {LEARNING_STYLES.filter(s => s !== currentStyle).map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => {
                                                const styleIndex = LEARNING_STYLES.indexOf(style);
                                                understandTopic(concept, styleIndex);
                                            }}
                                            className="px-4 py-3 text-xs font-mono uppercase tracking-widest rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-ink/70"
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                  </motion.div>
                </AnimatePresence>


                {/* Slider Navigation - Next Button - Bottom Right */}
                {currentSlide < 5 && (
                  <div className="flex items-center justify-end mt-12 gap-4">
                     {currentSlide > 0 && (
                        <button 
                         onClick={prevSlide}
                         className="px-8 py-3 border-2 border-current/20 rounded-2xl hover:bg-current/5 transition-all font-mono uppercase tracking-widest text-sm font-bold text-current"
                       >
                         ← Previous
                       </button>
                     )}
                     <button 
                       onClick={nextSlide}
                       className="px-12 py-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all font-display uppercase tracking-widest text-lg font-bold shadow-lg shadow-emerald-500/20"
                     >
                       Next →
                     </button>
                  </div>
                )}
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
                    <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-12 text-center">
                      <div className="relative mb-8">
                        <div className="text-6xl animate-bounce">👻</div>
                        <div className="absolute -top-4 -right-4 w-6 h-6 bg-accent rounded-full animate-pulse" />
                      </div>
                      
                      <h2 className="font-display text-2xl font-black uppercase tracking-tight text-ink mb-2">Just a sec...</h2>
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/60 mb-8 max-w-[200px]">
                        Orchestrating with the council of understanding
                      </p>

                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`mx-auto transition-all duration-1000 w-24 h-1 bg-current mb-16`} />
                      <p className="font-serif italic text-2xl md:text-3xl lg:text-4xl leading-tight transition-all px-12 text-ink">
                        "A story is the shortest distance between a human being and the truth." — Anthony De Mello
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
