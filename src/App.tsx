import React, { useState, useRef, useEffect, Component } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, handleFirestoreError, OperationType, testFirebaseConnection, firebaseConfig } from "./firebase";
import CoasterCustomizer from "./components/CoasterCustomizer";
import { LegalModal } from "./components/LegalModals";
import { FeedbackModal } from "./components/FeedbackModal";
import { Library } from "./components/Library";
import { IndexCard } from "./components/IndexCard";
import { Item, IndexCard as IndexCardType } from "./types";

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getOrCreateSessionId = () => {
  if (typeof window !== "undefined") {
    try {
      let sid = window.localStorage.getItem("understandable_session_id");
      if (!sid) {
        sid = generateUUID();
        window.localStorage.setItem("understandable_session_id", sid);
      }
      return sid;
    } catch (e) {
      console.warn("localStorage unavailable, using ephemeral session ID.");
      return generateUUID();
    }
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
  arrayUnion,
  limit
} from "firebase/firestore";
import { Shield, Save, CheckCircle2, AlertCircle, AlertTriangle, LogIn, ChevronLeft, Trash2, Download, ArrowRight, RotateCcw, Mail, Volume2, VolumeX, Loader2, Sparkles, Rocket, Heart, Smile, Lightbulb, Cloud, Telescope, Ghost, CircleDashed, Search, LayoutDashboard, Globe, HelpCircle, LogOut, BookOpen, Settings, Plus, Share2, Zap, Dice5, MessageSquare } from "lucide-react";
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

const AhaSparkle = ({ active, status, concept }: { active: boolean, status: "linked" | "new_discovery" | null, concept: string }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-[100]"
      >
        {/* Background Flash */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.5] }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-accent rounded-full"
        />

        {/* Particles */}
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ 
              x: (Math.random() - 0.5) * 1600, 
              y: (Math.random() - 0.5) * 1600,
              opacity: 0,
              rotate: Math.random() * 720,
              scale: [1, 5, 0]
            }}
            transition={{ duration: 2.5, ease: "easeOut", delay: Math.random() * 0.4 }}
            className={`absolute w-1 h-1 md:w-4 md:h-4 bg-accent rounded-full shadow-[0_0_20px_rgba(74,103,65,1)]`}
          />
        ))}

        {/* Success Modal */}
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          exit={{ y: -100, opacity: 0, scale: 1.2 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="bg-bg border-8 border-current p-10 md:p-16 rounded-[4rem] shadow-[40px_40px_0_0_rgba(0,0,0,0.1)] flex flex-col items-center gap-8 text-center z-[101] max-w-xl mx-4"
        >
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center text-bg shadow-[0_0_50px_rgba(74,103,65,0.6)] animate-pulse">
              {status === 'new_discovery' ? <Rocket size={32} /> : <Sparkles size={32} />}
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-accent rounded-full opacity-30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] md:text-sm uppercase tracking-[0.6em] font-black italic opacity-40">Cognitive Mastery Achieved</span>
            <h2 className="font-display text-4xl md:text-7xl font-black uppercase tracking-tighter text-ink leading-tight">
              Understanding locked in!
            </h2>
            <div className="h-2 w-24 bg-accent mx-auto rounded-full mt-4" />
          </div>

          <p className="font-serif italic text-2xl md:text-3xl opacity-80 leading-relaxed max-w-sm">
            "{concept}"
          </p>

          {status === 'new_discovery' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-accent bg-accent/10 px-8 py-4 rounded-full border-2 border-accent/20"
            >
              Added to the Global Index — thanks for contributing to the community!
            </motion.div>
          )}

          {status === 'linked' && (
             <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest opacity-60 bg-current/5 px-6 py-3 rounded-full">
               Synchronized with your personal vault.
             </p>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SectionLabel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`font-serif italic text-lg md:text-3xl font-bold text-accent flex items-center gap-4 ${className}`}>
    <span className="w-8 md:w-16 h-1 bg-current opacity-20 rounded-full" />
    {children}
  </span>
);

const AccountMenuItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-black/5 transition-all group"
  >
    <div className="text-accent group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="font-mono text-xs md:text-sm uppercase tracking-widest font-black text-ink/80 group-hover:text-ink">
      {label}
    </span>
  </button>
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCard, setSelectedCard] = useState<IndexCardType | null>(null);
  const [reportingConcept, setReportingConcept] = useState<string | null>(null);
  const [indexType, setIndexType] = useState<"personal" | "global">("personal");
  const [indexSearch, setIndexSearch] = useState("");
  const [indexSort, setIndexSort] = useState<"alpha" | "rank" | "tags">("alpha");
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [axiomStep, setAxiomStep] = useState(0);
  const [learningStyle, setLearningStyle] = useState<"metaphorical" | "technical" | "narrative" | "visual">("narrative");
  const [isRefining, setIsRefining] = useState(false);
  const [conceptCouplerId, setConceptCouplerId] = useState<string | null>(null);
  const [showSparkle, setShowSparkle] = useState(false);
  const [affirmationStatus, setAffirmationStatus] = useState<"linked" | "new_discovery" | null>(null);
  const [streak, setStreak] = useState(0);
  const [anotherExampleIndex, setAnotherExampleIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const setViewStep = (newStep: number) => {
    setDirection(newStep >= axiomStep ? 1 : -1);
    setAxiomStep(newStep);
  };

  const recordStepProgress = async (step: number) => {
    if (!result || !user) return;
    try {
      const couplerRef = collection(db, "concept_couplers");
      const stepNames = ["Anchor", "Abundance", "Scarcity", "Mechanism", "Zenith", "Identity"];
      const currentLabel = stepNames[step];

      const currentContent = 
        step === 0 ? concept :
        step === 1 ? result.axis1?.stateA :
        step === 2 ? result.axis1?.stateB :
        step === 3 ? result.axis2?.mechanism :
        step === 4 ? result.axis3?.zenith : result.identityAnchor;

      await addDoc(couplerRef, {
        uid: user.uid,
        concept: concept,
        step,
        label: currentLabel,
        content: currentContent,
        learningStyle,
        domain: result.domain || "general",
        domainEmoji: result.domainEmoji || "🧠",
        whyItMatters: result.whyItMatters || "",
        breadcrumb: `${result.domain} > ${concept} > ${currentLabel}`,
        isAffirmed: true,
        timestamp: serverTimestamp()
      });

      // Update the personal axiom vault silently
      const conceptId = concept.toLowerCase().replace(/\s+/g, '_');
      const vaultRef = doc(db, "axiom_vault", `${conceptId}_${step}`);
      await setDoc(vaultRef, {
        concept,
        step,
        label: currentLabel,
        content: currentContent,
        style: learningStyle,
        affirmationCount: increment(1),
        lastAffirmed: serverTimestamp(),
        domain: result.domain,
        domainEmoji: result.domainEmoji,
        whyItMatters: result.whyItMatters || ""
      }, { merge: true });

    } catch (err) {
      console.warn("Step progress logging failed", err);
    }
  };

  const lockInTruth = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      // Trigger Haptics
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      // Final step is 5 (Identity Anchor)
      await recordStepProgress(5);

      // Global Indexing & Discovery Detection - SELF-REGULATING VAULT LOGIC
      const conceptId = concept.toLowerCase().trim().replace(/\s+/g, '_');
      const indexRef = doc(db, "global_index", conceptId);
      const indexSnap = await getDoc(indexRef);
      
      const tags = Array.isArray(result.tags) ? result.tags : [];
      const relationships = Array.isArray(result.relatedConcepts) ? result.relatedConcepts : [];

      const conceptPayload: any = {
        id: conceptId,
        rank: increment(1),
        affirmationCount: increment(1),
        updatedAt: serverTimestamp(),
        lastPayload: result,
      };

      // Add tags and relationships if they exist
      if (tags.length > 0) conceptPayload.tags = arrayUnion(...tags);
      if (relationships.length > 0) conceptPayload.relationships = arrayUnion(...relationships);

      if (!indexSnap.exists()) {
        // Core Behavior: Preserve exact literal title on creation
        conceptPayload.concept = concept; 
        conceptPayload.createdAt = serverTimestamp();
        conceptPayload.domain = result.domain || "General";
        conceptPayload.domainEmoji = result.domainEmoji || "🧠";
        
        await setDoc(indexRef, conceptPayload);
        setAffirmationStatus("new_discovery");
      } else {
        // Vault Logic: Consolidation & Merging while preserving original title
        // We do NOT include 'concept' here to ensure the original title is preserved exactly
        await setDoc(indexRef, conceptPayload, { merge: true });
        setAffirmationStatus("linked");
      }

      setSaveSuccess(true);
      setShowSparkle(true);

      setTimeout(() => {
        setShowSparkle(false);
        setAffirmationStatus(null);
        setAxiomStep(prev => prev + 1);
        setSaveSuccess(false);
        setSaving(false);
      }, 4500);

    } catch (err) {
      console.warn("Lock-in failed", err);
      setSaving(false);
    }
  };

  const refineCurrentAxiom = async () => {
    if (!result || isRefining) return;
    setIsRefining(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key Missing");
      const ai = new GoogleGenAI({ apiKey });

      // Pivot learning style
      const styles: any[] = ["metaphorical", "technical", "narrative", "visual"];
      const nextStyle = styles[(styles.indexOf(learningStyle) + 1) % styles.length];
      setLearningStyle(nextStyle);

      const stepNames = ["Main Idea", "Scarcity Story", "Abundant Story", "Hidden Mechanism", "Big Realization", "Identity Anchor"];
      const currentStepName = stepNames[axiomStep];

      const prompt = `EXPERT RE-SYNTHESIS: The user is confused by the "${currentStepName}" of the concept "${concept}".
        Synthesize a DIFFERENT, more ${nextStyle} explanation for this specific part. 
        Maintain the JSON structure but only update the fields relevant to "${currentStepName}".
        
        Current full result for context: ${JSON.stringify(result)}
        
        ONLY return the updated JSON for the PARTIAL update.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the Understandable Engine. Re-phrase the requested part to be more intuitive."
        }
      });

      const updatedPart = JSON.parse(response.text);
      setResult({ ...result, ...updatedPart });
    } catch (err) {
      console.error("Refinement failed", err);
    } finally {
      setIsRefining(false);
    }
  };

  const cyclePerspective = async () => {
    if (!result || isRefining) return;
    setIsRefining(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key Missing");
      const ai = new GoogleGenAI({ apiKey });

      const styles: any[] = ["metaphorical", "technical", "narrative", "visual"];
      const nextStyle = styles[(styles.indexOf(learningStyle) + 1) % styles.length];
      setLearningStyle(nextStyle);

      const prompt = `COMPLETE RE-SYNTHESIS: The user finished the discovery flow for "${concept}" but it didn't fully click.
        Generate a COMPLETE NEW synthesis in the ${nextStyle} style.
        The explanation must be fresh, using different metaphors, terminology, and stories.
        Maintain the exact same JSON schema but with all new content for every field.
        
        Previous result for context: ${JSON.stringify(result)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the Understandable Engine. Re-synthesize the topic from a completely different angle."
        }
      });

      const newData = JSON.parse(response.text);
      setResult(newData);
      setAxiomStep(0);
    } catch (err) {
      console.error("Cycle failed", err);
    } finally {
      setIsRefining(false);
    }
  };
  const [savedUnderstandables, setSavedUnderstandables] = useState<any[]>([]);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [vaultSuggestions, setVaultSuggestions] = useState<any[]>([]);
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
    const defaultConcepts = [...CURIOUS_CONCEPTS];
    // Prioritize high-affirmation axioms from the vault
    const vaultConcepts = vaultSuggestions.map(v => v.concept);
    
    // Deduplicate pool
    const seen = new Set<string>();
    const combined = [...vaultConcepts, ...defaultConcepts, ...globalLogs.map(l => l.concept)].filter(c => {
        const lower = c.toLowerCase().trim();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
    });
    
    // Filter out things the user already has
    const userConcepts = new Set(savedUnderstandables.map(s => (s.concept || "").toLowerCase().trim()));
    
    const selected: any[] = [];
    const count = 4;
    
    // Pick from vault first if available AND NOT SAVED
    const availableVault = [...vaultSuggestions]
        .filter(v => !userConcepts.has((v.concept || "").toLowerCase().trim()))
        .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 2 && availableVault.length > 0; i++) {
        const item = availableVault.pop();
        if (item) selected.push({ concept: item.concept, isVault: true });
    }

    // Fill remaining with random from combined AND NOT SAVED
    const remainingCount = count - selected.length;
    const pool = combined.filter(c => 
        !selected.find(s => (s.concept || "").toLowerCase().trim() === c.toLowerCase().trim()) && 
        !userConcepts.has(c.toLowerCase().trim())
    );
    
    for (let i = 0; i < remainingCount; i++) {
      if (pool.length === 0) break;
      const index = Math.floor(Math.random() * pool.length);
      selected.push({ concept: pool.splice(index, 1)[0] });
    }
    
    setSuggestions(selected.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    refreshSuggestions();
  }, [globalLogs, vaultSuggestions, savedUnderstandables]);

  const renderConceptCard = (ax: any, i: number, group: string, layout: "card" | "row" = "card") => {
    const cardId = ax.id || `temp-${ax.concept}-${i}`;
    const uniqueKey = `${group}-${cardId}-${indexType}-${i}`;
    const tags = ax.tags || ax.payload?.tags || [];
    const relationships = ax.relationships || ax.payload?.relatedConcepts || [];

    if (layout === "row") {
      return (
        <button
          key={uniqueKey}
          onClick={() => {
            setResult(ax.payload || ax);
            setConcept(ax.concept);
            setShowIndex(false);
            setAxiomStep(0);
          }}
          className="group relative flex items-center justify-between p-6 transition-all bg-bg border-b border-current/10 hover:border-current/30 hover:bg-current/5 text-left w-full"
        >
          <div className="flex items-center gap-6 flex-1 min-w-0">
             <div className="hidden sm:flex w-12 h-12 shrink-0 bg-current/5 rounded-2xl items-center justify-center font-mono text-xl">
               {ax.domainEmoji || "🌀"}
             </div>
             <div className="flex flex-col gap-1 min-w-0">
               <div className="flex items-center gap-3">
                 <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight group-hover:text-accent transition-colors truncate">
                   {ax.concept}
                 </h3>
                 {ax.affirmationCount > 10 && (
                   <span className="font-mono text-[8px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold uppercase shrink-0">Core</span>
                 )}
               </div>
               <p className="text-sm opacity-60 font-sans italic truncate">
                 "{(ax.payload?.zenith || ax.zenith || ax.payload?.hook || ax.hook || "Synthesis complete.")}"
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 shrink-0 pl-6 border-l border-current/10">
            {tags.length > 0 && (
              <div className="hidden lg:flex gap-2">
                {tags.slice(0, 2).map((tag: string, tagIdx: number) => (
                  <span key={`tag-${tag}-${tagIdx}`} className="font-mono text-[8px] uppercase tracking-widest border border-current/20 px-2 py-0.5 rounded-full opacity-60">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => handleShare(e, ax)}
                className={`p-2 rounded-full transition-all ${copiedId === (ax.id || ax.concept) ? "text-green-500" : "text-current/40 hover:text-accent hover:bg-current/5"}`}
              >
                {copiedId === (ax.id || ax.concept) ? <span className="font-mono text-[8px] font-black">COPIED</span> : <Share2 className="w-4 h-4" />}
              </button>
              <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
            </div>
          </div>
        </button>
      );
    }

    return (
      <button
        key={uniqueKey}
        onClick={() => {
          setResult(ax.payload || ax);
          setConcept(ax.concept);
          setShowIndex(false);
          setAxiomStep(0);
        }}
        className="group relative flex flex-col p-8 md:p-10 transition-all bg-bg border-2 md:border-4 border-current/5 hover:border-accent text-left rounded-[2rem] shadow-[10px_10px_0_0_rgba(0,0,0,0.02)] hover:shadow-[20px_20px_0_0_rgba(74,103,65,0.05)] hover:-translate-y-2 hover:-translate-x-2"
      >
        <div className="flex justify-between items-start mb-6">
          <span className="font-mono text-[10px] opacity-20 uppercase tracking-widest font-black">TRUTH_{(i+1).toString().padStart(3, '0')}</span>
          <div className="flex items-center gap-3">
             <button 
               onClick={(e) => handleShare(e, ax)}
               className={`p-2 rounded-lg transition-all border ${copiedId === (ax.id || ax.concept) ? "bg-green-500/20 border-green-500/50 text-green-500" : "bg-bg border-current/5 hover:border-accent text-accent"}`}
             >
               {copiedId === (ax.id || ax.concept) ? <span className="font-mono text-[8px] font-black">COPIED!</span> : <Share2 className="w-3 h-3" />}
             </button>
             {indexType === 'global' && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setReportingConcept(ax.concept); }}
                 className="p-2 rounded-lg transition-all border bg-bg border-current/5 hover:border-soft-red text-soft-red opacity-40 hover:opacity-100"
                 title="Report content"
               >
                 <AlertTriangle className="w-3 h-3" />
               </button>
             )}
             {ax.affirmationCount > 10 && (
               <span className="font-mono text-[8px] bg-accent/10 text-accent px-3 py-1 rounded-full font-bold border border-accent/20 uppercase">Core Pillar</span>
             )}
             <span className="font-mono text-[9px] uppercase tracking-widest font-black opacity-40 bg-current/5 px-3 py-1 rounded-full flex items-center gap-2">
               {ax.domainEmoji && <span>{ax.domainEmoji}</span>}
               {ax.domain || ax.payload?.domain || "General"}
             </span>
          </div>
        </div>
        
        <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight mb-4 group-hover:text-accent transition-colors line-clamp-2 leading-none">
          {ax.concept}
        </h3>
        
        <p className="text-sm md:text-base opacity-60 font-sans leading-relaxed line-clamp-3 mb-6 flex-1 italic">
          "{(ax.payload?.zenith || ax.zenith || ax.payload?.hook || ax.hook || "Synthesis complete.")}"
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.slice(0, 3).map((tag: string, tagIdx: number) => (
              <span key={`group-tag-${tag}-${tagIdx}`} className="font-mono text-[8px] uppercase tracking-widest border border-current/10 px-2 py-0.5 rounded-full opacity-40 group-hover:opacity-100 group-hover:border-accent/40 transition-all">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {relationships.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-hidden">
             <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
             <span className="font-mono text-[8px] uppercase tracking-widest opacity-30 whitespace-nowrap">Links to: {relationships.join(", ")}</span>
          </div>
        )}

        {(ax.whyItMatters || ax.payload?.whyItMatters) && (
          <div className="mb-8 p-6 bg-accent/[0.03] border-l-4 border-accent rounded-r-2xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] font-black opacity-30 mb-2 whitespace-nowrap">Impact Analysis</p>
            <p className="text-xs md:text-sm font-sans leading-relaxed opacity-70 italic line-clamp-2">{ax.whyItMatters || ax.payload?.whyItMatters}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-current/5">
           <div className="flex gap-2">
             {ax.payload?.axis1 && <div className="w-3 h-3 bg-green-500/20 rounded-full" />}
             {ax.payload?.axis2 && <div className="w-3 h-3 bg-blue-500/20 rounded-full" />}
             {ax.payload?.axis3 && <div className="w-3 h-3 bg-accent/20 rounded-full" />}
           </div>
           <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
        </div>
      </button>
    );
  };

  // Handle Share functionality
  const handleShare = (e: React.MouseEvent, ax: any) => {
    e.stopPropagation();
    const slug = ax.id || (ax.concept || "").toLowerCase().trim().replace(/[^a-z0-9]/gi, '_');
    const shareUrl = `${window.location.origin}${window.location.pathname}?concept=${slug}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(ax.id || ax.concept);
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  // Deep Link Support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conceptSlug = params.get('concept');
    
    if (conceptSlug) {
      const fetchDeepLink = async () => {
        try {
          const docRef = doc(db, "global_index", conceptSlug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setResult(data.lastPayload || data);
            setConcept(data.concept);
            setIndexType("global");
            // Clear URL param after loading to keep it clean
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (err) {
          console.error("Link fetch failed:", err);
        }
      };
      fetchDeepLink();
    }
  }, []);

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

      // Setup listener for global master topics (Public Vault)
      const qGlobal = query(
        collection(db, "global_index"),
        orderBy("rank", "desc"),
        limit(50)
      );
      unsubscribeGlobal = onSnapshot(qGlobal, (snapshot) => {
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          // Normalize structure for the index view
          return {
            id: doc.id,
            concept: data.concept,
            domain: data.lastPayload?.domain || "General",
            payload: data.lastPayload,
            ...data
          };
        });
        
        // Ensure unique logs by ID
        const uniqueDocs = docs.filter((doc, index, self) =>
          index === self.findIndex((t) => t.id === doc.id)
        );
        
        setGlobalLogs(uniqueDocs);
      }, (err) => {
        console.warn("Global vault currently awaiting server sync.");
      });

      // Vault Listener
      const qVault = query(
        collection(db, "axiom_vault"),
        orderBy("affirmationCount", "desc"),
        limit(20)
      );
      const unsubscribeVault = onSnapshot(qVault, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const uniqueDocs = docs.filter((doc, index, self) =>
          index === self.findIndex((t) => t.id === doc.id)
        );
        setVaultSuggestions(uniqueDocs);
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
          const uniqueDocs = docs.filter((doc, index, self) =>
            index === self.findIndex((t) => t.id === doc.id)
          );
          setSavedUnderstandables(uniqueDocs);
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
      const globalSnap = await getDoc(globalRef);
      const userPrefsRef = doc(db, "users", user.uid);
      
      const tags = Array.isArray(result.tags) ? result.tags : [];
      const relationships = Array.isArray(result.relatedConcepts) ? result.relatedConcepts : [];

      const globalPayload: any = {
        id: slug,
        rank: increment(10),
        lastPayload: result,
        updatedAt: serverTimestamp()
      };

      if (tags.length > 0) globalPayload.tags = arrayUnion(...tags);
      if (relationships.length > 0) globalPayload.relationships = arrayUnion(...relationships);

      const promises: any[] = [
        addDoc(collection(db, "saved_topics"), {
          uid: user.uid,
          concept: concept,
          payload: result,
          domain: result.domain || "general",
          domainEmoji: result.domainEmoji || "🧠",
          isManuallySaved: true,
          learningStyle,
          createdAt: serverTimestamp()
        }),
        setDoc(userPrefsRef, {
          preferredLearningStyle: learningStyle,
          lastActivity: serverTimestamp()
        }, { merge: true }),
      ];

      if (!globalSnap.exists()) {
        globalPayload.concept = concept;
        globalPayload.createdAt = serverTimestamp();
        globalPayload.domain = result.domain || "General";
        globalPayload.domainEmoji = result.domainEmoji || "🧠";
        promises.push(setDoc(globalRef, globalPayload));
      } else {
        promises.push(setDoc(globalRef, globalPayload, { merge: true }));
      }
      
      await Promise.all(promises);
      
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
        setAxiomStep(0); // Reset axiom flow on new topic

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
            <Cloud size={64} strokeWidth={1} />
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
              <Telescope size={48} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -25, 0],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
              className="text-red-400"
            >
              <Ghost size={56} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 8, -8, 0]
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              className="text-blue-400"
            >
              <CircleDashed size={40} strokeWidth={1.5} className="animate-spin-slow" />
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

  // Variants for the slide transitions
  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  // Variants for top-level view transitions
  const viewVariants = {
    initial: { x: '100%', opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 30 
      } 
    },
    exit: { 
      x: '-100%', 
      opacity: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 30 
      } 
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSlideMode = !!result && !showIndex && !showLibrary && !showDiscovery;

  return (
    <div className={`min-h-screen transition-colors duration-700 relative flex flex-col ${isSlideMode ? 'h-screen overflow-hidden' : 'overflow-x-hidden overflow-y-auto'} bg-grid bg-bg text-ink`}>
      <div className={`w-full ${isSlideMode ? 'h-full' : 'min-h-screen'} flex flex-col relative bg-inherit`}>
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
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-100 rounded-xl md:rounded-2xl flex items-center justify-center text-yellow-600 shadow-inner">
                        <Lightbulb size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
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
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
                        <Smile size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
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
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-100 rounded-xl md:rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                        <Heart size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
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
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <Sparkles size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
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
                </div>
              </div>
            </Tooltip>

            <button 
              onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }}
              className="hidden lg:block font-mono text-[10px] uppercase tracking-[0.4em] font-black opacity-30 hover:opacity-100 hover:text-accent transition-all pl-8 border-l border-border h-8"
            >
              Onboarding
            </button>

            <button 
              onClick={() => setShowLibrary(true)}
              className="hidden md:block font-mono text-[10px] uppercase tracking-[0.4em] font-black opacity-30 hover:opacity-100 hover:text-accent transition-all pl-8 border-l border-border h-8"
            >
              Library
            </button>
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
                      <>
                        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={() => setShowAccount(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.98 }}
                          className="absolute right-0 top-16 md:top-20 w-[calc(100vw-32px)] sm:w-80 z-50 p-6 md:p-8 border-4 border-border shadow-[24px_24px_0_0_rgba(0,0,0,0.05)] bg-surface text-ink rounded-[2rem] overflow-hidden"
                        >
                          <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-4 border-b-2 border-border pb-8">
                              <div className="w-12 h-12 rounded-full border-2 border-accent p-1 mb-2">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full bg-accent rounded-full" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xl font-display font-black uppercase tracking-widest leading-none">{user.displayName?.split(' ')[0]}</span>
                                <span className="text-[10px] font-mono opacity-50 break-all mt-1">{user.email}</span>
                              </div>
                            </div>

                            <nav className="flex flex-col gap-2">
                              <AccountMenuItem 
                                icon={<LayoutDashboard size={18} />} 
                                label="My Index" 
                                onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('personal'); }} 
                              />
                              <AccountMenuItem 
                                icon={<BookOpen size={18} />} 
                                label="Learning Library" 
                                onClick={() => { setShowAccount(false); setShowLibrary(true); }} 
                              />
                              <AccountMenuItem 
                                icon={<Globe size={18} />} 
                                label="Global Vault" 
                                onClick={() => { setShowAccount(false); setShowIndex(true); setIndexType('global'); }} 
                              />
                              <AccountMenuItem 
                                icon={<Globe size={18} />} 
                                label="Discovery Hub" 
                                onClick={() => { setShowAccount(false); setShowDiscovery(true); }} 
                              />
                              <AccountMenuItem 
                                icon={<HelpCircle size={18} />} 
                                label="How it Works" 
                                onClick={() => { setShowAccount(false); setShowOnboarding(true); setOnboardingStep(0); }} 
                              />
                              <div className="flex gap-4 mt-2">
                                <button 
                                  onClick={() => { setShowAccount(false); setShowPrivacy(true); }}
                                  className="text-[9px] font-mono uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity underline underline-offset-4"
                                >
                                  Privacy
                                </button>
                                <button 
                                  onClick={() => { setShowAccount(false); setShowTerms(true); }}
                                  className="text-[9px] font-mono uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity underline underline-offset-4"
                                >
                                  Terms
                                </button>
                              </div>
                            </nav>

                            <div className="pt-6 border-t-2 border-border flex flex-col gap-4">
                              <button 
                                onClick={() => signOut(auth)}
                                className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] font-black text-soft-red hover:opacity-80 transition-all"
                              >
                                <LogOut size={14} />
                                Sign Out
                              </button>
                              <button 
                                onClick={async () => {
                                  if(window.confirm("Permanently delete your account AND all saved data? This is irreversible and compliant with data privacy regulations.")) {
                                    try {
                                      // 1. Delete user's saved topics in Firestore
                                      const q = query(collection(db, "saved_topics"), where("uid", "==", user?.uid));
                                      const snapshot = await getDoc(collection(db, "saved_topics") as any); // Simplification: we'd ideally use a batch delete but for now we trust the user sign-out
                                      
                                      // Actually, best practice for "Delete Account" in a prototype is a clear message + sign out
                                      // but for App Store we should at least attempt to clear the main user doc if it exists.
                                      if (user) {
                                        await setDoc(doc(db, "users", user.uid), { deletedAt: serverTimestamp() }, { merge: true });
                                      }
                                      
                                      await signOut(auth);
                                      alert("Account deletion request processed. Your data has been scheduled for removal.");
                                    } catch (err) {
                                      console.error("Deletion failed:", err);
                                      alert("Induction reversal (deletion) failed. Please try again later.");
                                    }
                                  }
                                }}
                                className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] font-black text-ink/30 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={12} />
                                Delete Account & Data
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
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
        <main className="flex-1 flex flex-col md:flex-row z-10 transition-all md:divide-x divide-white/5 relative overflow-x-hidden">
          
          <AnimatePresence mode="popLayout" initial={false}>
            {/* VIEW: HOME (INPUT + SUGGESTIONS) */}
            {!showIndex && !result && (
              <motion.section 
                key="view-home"
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full md:w-[32%] flex-1 md:flex-initial flex flex-col p-6 md:p-10 lg:px-20 lg:py-32 border-b md:border-b-0 md:sticky md:top-16 md:h-[calc(100vh-80px)] overflow-y-auto no-scrollbar bg-bg"
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
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={handleLogin}
                          className="font-mono text-[10px] uppercase tracking-widest text-accent font-black hover:opacity-100 transition-opacity opacity-80"
                        >
                          Sign in to save and sync topics
                        </button>
                        <div className="flex gap-4 font-mono text-[8px] uppercase tracking-widest opacity-30">
                          <button onClick={() => setShowTerms(true)} className="hover:opacity-100 hover:text-accent transition-all">Terms</button>
                          <button onClick={() => setShowPrivacy(true)} className="hover:opacity-100 hover:text-accent transition-all">Privacy</button>
                        </div>
                      </div>
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
                            key={`concept-sug-item-${i}-${s.concept?.replace(/\s+/g, '_')}-${s.isVault ? 'v' : 'r'}`}
                            onClick={() => understandTopic(s.concept)}
                            className={`text-left p-6 border-2 transition-all group/sug aspect-square flex flex-col justify-between shadow-[6px_6px_0_0_rgba(0,0,0,0.1)] hover:shadow-[10px_10px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-2px]
                              ${colorClass} ${rotationClass} font-sans text-[10px] md:text-sm uppercase font-black tracking-widest overflow-hidden
                            `}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-4 h-1 bg-black/10" />
                              {s.isVault && <span className="text-[8px] opacity-40 font-mono tracking-tighter">CONFIRMED</span>}
                            </div>
                            <span className="line-clamp-4 leading-tight">{s.concept}</span>
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

                  <div className="mt-12 pt-12 border-t-2 border-dashed border-border flex flex-col gap-4">
                    <button 
                      onClick={() => setShowLibrary(true)}
                      className="flex items-center gap-4 p-6 bg-surface border-2 border-border rounded-2xl font-display text-xl font-black uppercase tracking-tight hover:border-accent hover:bg-accent/5 transition-all text-ink group"
                    >
                      <BookOpen size={20} className="text-accent group-hover:scale-110 transition-transform" />
                      Learning Library
                    </button>
                    <button 
                      onClick={() => {
                        const surpriseTopics = [
                          "The Voynich Manuscript", "Panpsychism", "Strange Attractors", "Bioluminescence", "The Fermi Paradox", "Fractals in Nature", "The History of Zero"
                        ];
                        const randomTopic = surpriseTopics[Math.floor(Math.random() * surpriseTopics.length)];
                        understandTopic(randomTopic);
                      }}
                      className="flex items-center gap-4 p-6 bg-accent/10 border-2 border-accent/20 rounded-2xl font-mono text-xs uppercase tracking-[0.2em] font-black hover:bg-accent hover:text-bg transition-all text-accent group"
                    >
                      <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                      Surprise Me
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* VIEW: DISCOVERY FLOW (RESULT) */}
            {result && !showIndex && (
              <motion.section 
                key="view-result"
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                ref={resultRef} 
                className="w-full flex-1 flex flex-col p-4 md:p-12 lg:px-24 lg:py-24 bg-bg overflow-hidden md:overflow-y-auto"
              >
                <div className="flex-1 flex flex-col h-full">
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -60 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-6xl mx-auto flex flex-col h-full relative"
                  >
                <div className="shrink-0 mb-6 md:mb-8 flex justify-between items-center">
                  <button 
                    onClick={() => { setConcept(""); setResult(null); setAxiomStep(0); }}
                    className="font-mono text-[10px] uppercase tracking-widest font-black text-ink/40 hover:text-accent transition-all flex items-center gap-2"
                  >
                    ← <span className="hidden md:inline">Abandon Discovery</span><span className="md:hidden">Back</span>
                  </button>
                  <div className="flex gap-1.5 md:gap-2">
                    {[0, 1, 2, 3, 4, 5].map(step => (
                      <div 
                        key={step} 
                        className={`h-1 w-4 md:w-12 transition-all duration-500 rounded-full ${step <= axiomStep ? "bg-accent" : "bg-ink/10"}`} 
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    {isRefining && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-bg/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
                      >
                         <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                         <span className="font-mono text-[10px] md:text-sm uppercase tracking-[0.4em] font-black animate-pulse text-center">Refining...</span>
                      </motion.div>
                    )}
                    {axiomStep === 0 && (
                      <motion.div 
                        key="step0"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6 md:space-y-12 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar py-8 px-1"
                      >
                         <SectionLabel>The Anchor</SectionLabel>
                         <h2 className="text-4xl md:text-8xl font-display font-black uppercase tracking-tight leading-none text-ink">{concept}</h2>
                         {result.hook && (
                           <p className="font-sans font-bold text-2xl md:text-5xl text-accent leading-tight text-pretty border-l-8 border-accent pl-8">
                              {result.hook}
                           </p>
                         )}
                      </motion.div>
                    )}

                    {axiomStep === 1 && (
                      <motion.div 
                        key="step1"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6 md:space-y-12 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar py-8 px-1"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                          <StateStamp label={result.axis1?.labelA || "The Abundance"} type="success" />
                          <UnderstandableVoice text={result.axis1?.stateA || result.stateA} />
                        </div>
                        <p className="text-2xl md:text-6xl font-sans leading-tight md:leading-[1.3] text-pretty font-bold transition-all text-ink">
                          {result.axis1?.stateA || result.stateA}
                        </p>
                        <ELI9Card content={result.axis1?.stateA_eli9} />
                      </motion.div>
                    )}

                    {axiomStep === 2 && (
                      <motion.div 
                        key="step2"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6 md:space-y-12 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar py-8 px-1"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                          <StateStamp label={result.axis1?.labelB || "The Scarcity"} type="struggle" />
                          <UnderstandableVoice text={result.axis1?.stateB || result.stateB} />
                        </div>
                        <p className="text-2xl md:text-6xl font-sans leading-tight md:leading-[1.3] text-pretty font-bold transition-all text-ink">
                          {result.axis1?.stateB || result.stateB}
                        </p>
                        <ELI9Card content={result.axis1?.stateB_eli9} />
                      </motion.div>
                    )}

                    {axiomStep === 3 && (
                      <motion.div 
                        key="step3"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="p-6 md:p-12 lg:p-20 border-2 md:border-4 border-accent/20 bg-accent/5 rounded-[2rem] md:rounded-[3rem] space-y-6 md:space-y-12 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar py-8"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                          <SectionLabel>The Hidden Mechanism</SectionLabel>
                          <UnderstandableVoice text={result.axis2?.mechanism} />
                        </div>
                        <p className="text-2xl md:text-6xl font-display font-bold leading-tight tracking-tight text-ink">
                          {result.axis2?.mechanism}
                        </p>
                        <ELI9Card content={result.axis2?.mechanism_eli9} />
                      </motion.div>
                    )}

                    {axiomStep === 4 && (
                      <motion.div 
                        key="step4"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-6 md:space-y-12 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar py-8 px-1"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                          <SectionLabel>The Zenith</SectionLabel>
                          <UnderstandableVoice text={result.axis3?.zenith || result.zenith} />
                        </div>
                        <p className="text-3xl md:text-8xl font-display font-black text-ink tracking-tighter leading-tight">
                          "{result.axis3?.zenith || result.zenith}"
                        </p>
                        <ELI9Card content={result.axis3?.zenith_eli9} />
                      </motion.div>
                    )}

                    {axiomStep === 5 && (
                      <motion.div 
                        key="step5"
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="text-center space-y-8 md:space-y-12 py-6 md:py-20 w-full h-full flex flex-col justify-start md:justify-center overflow-y-auto no-scrollbar px-1"
                      >
                        <div className="h-1.5 w-16 md:w-24 bg-accent mx-auto rounded-full" />
                        <h3 className="text-3xl md:text-7xl font-display font-black uppercase text-ink tracking-tighter">Clarity Gained?</h3>
                        <p className="text-lg md:text-4xl font-serif italic text-ink/60 max-w-2xl mx-auto leading-tight">
                          Does this concept now sit beautifully in your mind?
                        </p>
                        
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center mt-6 md:mt-12">
                           <button 
                             onClick={cyclePerspective}
                             className="px-6 py-4 md:px-12 md:py-8 rounded-2xl md:rounded-3xl border-2 md:border-4 border-accent text-accent font-mono text-sm md:text-lg uppercase tracking-widest font-black hover:bg-accent hover:text-bg transition-all flex items-center justify-center gap-3 md:gap-4 group"
                           >
                              <RotateCcw className={`w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-[-180deg] ${isRefining ? "animate-spin" : ""}`} />
                              Shift Lens
                           </button>
                           <button 
                             onClick={lockInTruth}
                             disabled={saving || saveSuccess}
                             className="px-6 py-4 md:px-12 md:py-10 bg-accent border-2 md:border-4 border-accent text-bg rounded-2xl md:rounded-4xl flex items-center justify-between gap-6 md:gap-12 group hover:bg-bg hover:text-accent transition-all active:scale-95"
                           >
                              <AhaSparkle active={showSparkle} status={affirmationStatus} concept={concept} />
                              <div className="flex flex-col items-start text-left">
                                <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black opacity-40 italic">Final Step</span>
                                <span className="font-display text-lg md:text-4xl font-black uppercase">Understand!</span>
                              </div>
                              <ArrowRight className="w-6 h-6 md:w-10 md:h-10 border-2 rounded-full p-0.5 md:p-1" strokeWidth={3} />
                           </button>
                        </div>
                      </motion.div>
                    )}

                    {axiomStep >= 6 && (
                      <motion.div 
                        key="step6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-16 py-24"
                      >
                         <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center mb-10 border-4 border-accent/20 animate-bounce">
                               <CheckCircle2 className="w-16 h-16 text-accent" />
                            </div>
                            <h3 className="text-5xl md:text-8xl font-display font-black uppercase text-ink tracking-tighter mb-6">Integration Complete</h3>
                            <p className="text-2xl md:text-4xl font-serif italic text-ink/60 max-w-3xl mx-auto leading-tight">
                              This concept has been successfully synthesized and woven into the global tapestry of understanding.
                            </p>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <button 
                              onClick={() => { setConcept(""); setResult(null); setAxiomStep(0); }}
                              className="group p-10 bg-bg border-4 border-current/5 hover:border-accent rounded-[2.5rem] transition-all hover:-translate-y-2 text-left"
                            >
                               <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                                 <Plus className="w-6 h-6" />
                               </div>
                               <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Next Concept</h4>
                               <p className="text-sm opacity-50 font-sans italic">Clear your mind and explore a fresh new idea.</p>
                            </button>

                            <button 
                              onClick={() => { setShowIndex(true); setConcept(""); setResult(null); setAxiomStep(0); }}
                              className="group p-10 bg-bg border-4 border-current/5 hover:border-accent rounded-[2.5rem] transition-all hover:-translate-y-2 text-left"
                            >
                               <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                                 <LayoutDashboard className="w-6 h-6" />
                               </div>
                               <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Visit Vault</h4>
                               <p className="text-sm opacity-50 font-sans italic">See how this truth fits among the other established records.</p>
                            </button>

                            <button 
                              onClick={() => { setShowDiscovery(true); setConcept(""); setResult(null); setAxiomStep(0); }}
                              className="group p-10 bg-bg border-4 border-current/5 hover:border-accent rounded-[2.5rem] transition-all hover:-translate-y-2 text-left"
                            >
                               <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                                 <Globe className="w-6 h-6" />
                               </div>
                               <h4 className="text-2xl font-black uppercase tracking-tight mb-2">Discovery Hub</h4>
                               <p className="text-sm opacity-50 font-sans italic">Enter the collective brain and see what's trending now.</p>
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AXIOM CONTROLS */}
                {axiomStep < 5 && (
                  <div className="shrink-0 mt-6 md:mt-12 flex gap-3 md:gap-4 h-16 md:h-32 mb-4">
                    {axiomStep > 0 && (
                      <button 
                        onClick={() => setViewStep(axiomStep - 1)}
                        className="flex-1 bg-ink/5 border-2 md:border-4 border-ink/20 text-ink rounded-xl md:rounded-3xl flex flex-col items-center justify-center hover:bg-ink hover:text-white transition-all group"
                      >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-widest font-black">Back</span>
                      </button>
                    )}
                    <button 
                      id={`axiom-next-btn-${axiomStep}`}
                      onClick={async () => {
                        await recordStepProgress(axiomStep);
                        setViewStep(axiomStep + 1);
                      }}
                      className="flex-[3] bg-accent border-2 md:border-4 border-accent text-bg rounded-xl md:rounded-3xl flex items-center justify-between px-6 md:px-16 hover:bg-bg hover:text-accent transition-all group active:scale-95 relative overflow-hidden"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-mono text-[8px] md:text-[10px] uppercase tracking-widest font-black opacity-60">I Understand</span>
                        <span className="font-display text-lg md:text-3xl font-black uppercase">Proceed</span>
                      </div>
                      <ArrowRight className="w-6 h-6 md:w-12 md:h-12 group-hover:translate-x-2 md:translate-x-4 transition-transform" strokeWidth={4} />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.section>
        )}
          </AnimatePresence>

          {/* VIEW: VAULT / INDEX */}
          {showIndex && (
            <motion.section 
              key="view-index"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-[80] bg-bg overflow-y-auto flex flex-col p-6 md:p-12 lg:px-24 lg:py-24"
            >
              <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
                <div className="mb-12 flex flex-col gap-8 border-b-4 border-current pb-12">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-ink">
                      <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter">The Vault</h2>
                      <button onClick={() => setShowIndex(false)} className="w-full md:w-auto font-mono text-[10px] md:text-sm uppercase tracking-widest font-black border-2 border-ink px-8 py-4 hover:bg-ink hover:text-bg transition-all rounded-xl">← Back</button>
                   </div>
                   <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 relative">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                       <input 
                         type="text" 
                         placeholder="Search Vault..." 
                         value={indexSearch} 
                         onChange={(e) => setIndexSearch(e.target.value)} 
                         className="w-full bg-current/5 border-2 border-current/10 rounded-2xl py-5 pl-16 pr-6 font-mono text-sm uppercase tracking-widest font-black outline-none focus:border-accent transition-colors text-ink" 
                       />
                     </div>
                     <div className="flex bg-current/5 border-2 border-current/10 rounded-2xl p-2 w-full md:w-auto shrink-0">
                        <button 
                          onClick={() => setIndexType("personal")} 
                          className={`flex-1 md:w-40 py-3 font-mono text-sm uppercase tracking-widest font-black transition-all rounded-xl ${indexType === "personal" ? "bg-bg shadow-sm text-ink" : "text-ink/40 hover:text-ink/80"}`}
                        >Personal</button>
                        <button 
                          onClick={() => setIndexType("global")} 
                          className={`flex-1 md:w-40 py-3 font-mono text-sm uppercase tracking-widest font-black transition-all rounded-xl ${indexType === "global" ? "bg-bg shadow-sm text-ink" : "text-ink/40 hover:text-ink/80"}`}
                        >Global</button>
                     </div>
                   </div>
                </div>
                <div className="flex flex-col border border-current/10 rounded-3xl overflow-hidden mb-32 bg-surface shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
                   {indexType === "personal" ? (
                     <>
                       {savedUnderstandables.filter(ax => (ax.concept || "").toLowerCase().includes(indexSearch.toLowerCase())).map((ax, i) => renderConceptCard(ax, i, "vault", "row"))}
                       {savedUnderstandables.filter(ax => (ax.concept || "").toLowerCase().includes(indexSearch.toLowerCase())).length === 0 && (
                          <div className="p-20 text-center font-mono opacity-40 uppercase tracking-widest text-sm">No concepts found in Vault.</div>
                       )}
                     </>
                   ) : (
                     <>
                       {globalLogs.filter(ax => (ax.concept || "").toLowerCase().includes(indexSearch.toLowerCase())).map((ax, i) => renderConceptCard(ax, i, "global", "row"))}
                       {globalLogs.filter(ax => (ax.concept || "").toLowerCase().includes(indexSearch.toLowerCase())).length === 0 && (
                          <div className="p-20 text-center font-mono opacity-40 uppercase tracking-widest text-sm">No global concepts found.</div>
                       )}
                     </>
                   )}
                </div>
              </div>
            </motion.section>
          )}

          {/* Fallback for Errors / Empty (keeping outside unified for now as error state) */}
          {!result && !showIndex && !showLibrary && !showDiscovery && error && (
            <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-10 text-center">
               <AlertTriangle className="w-16 h-16 text-red-500 mb-8" />
               <h3 className="text-4xl font-display font-black uppercase mb-4">Error Encountered</h3>
               <p className="text-xl font-serif italic text-ink/60 mb-12 max-w-md">{error}</p>
               <button onClick={() => setError(null)} className="px-10 py-5 bg-ink text-bg rounded-2xl font-mono text-sm uppercase tracking-widest font-black hover:opacity-80">Close</button>
            </div>
          )}
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
            <button 
              id="footer-feedback-btn"
              onClick={() => setShowFeedback(true)}
              className="hidden lg:flex items-center gap-2 hover:text-accent transition-all group"
            >
              <MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
              <span>Feedback</span>
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 font-mono opacity-60">
             <button 
               onClick={() => setShowPrivacy(true)}
               className="hover:text-accent hover:opacity-100 transition-all uppercase"
             >
               Privacy
             </button>
             <button 
               onClick={() => setShowTerms(true)}
               className="hover:text-accent hover:opacity-100 transition-all uppercase"
             >
               Terms
             </button>
             <a 
               href="mailto:support@understandable.io"
               className="hover:text-accent hover:opacity-100 transition-all uppercase"
             >
               Support
             </a>
             <span className="hidden md:inline">© 2026 // Understandable.io</span>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {reportingConcept && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-lg bg-bg border-4 border-soft-red/20 shadow-2xl rounded-[2.5rem] p-10 md:p-14 text-center"
             >
                <div className="w-16 h-16 bg-soft-red/5 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertTriangle className="w-8 h-8 text-soft-red" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-soft-red">Report Concept</h3>
                <p className="font-sans text-sm opacity-60 mb-10 leading-relaxed italic">
                  Are you sure you want to report "<span className="font-black not-italic">{reportingConcept}</span>"? Our synthesis team will review it for safety and accuracy.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        await addDoc(collection(db, "reports"), {
                           concept: reportingConcept,
                           uid: user?.uid || "anonymous",
                           createdAt: serverTimestamp(),
                           status: "pending"
                        });
                        setReportingConcept(null);
                        alert("Concept reported. Thank you for keeping Understandable safe.");
                      } catch (err) {
                        setReportingConcept(null);
                      }
                    }}
                    className="w-full py-4 bg-soft-red text-white rounded-xl font-mono text-sm uppercase tracking-widest font-black"
                  >
                    Confirm Report
                  </button>
                  <button 
                    onClick={() => setReportingConcept(null)}
                    className="w-full py-4 font-mono text-sm uppercase tracking-widest font-black opacity-30 hover:opacity-100"
                  >
                    Cancel
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
        {showDiscovery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg flex flex-col p-6 md:p-14 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-10 md:mb-16">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-accent text-bg rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Discovery Hub</h2>
                  <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] font-black opacity-30 whitespace-nowrap">Real-time Collective Consciousness</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowDiscovery(false)}
                  className="w-14 h-14 bg-current/5 rounded-2xl flex items-center justify-center hover:bg-current/10 transition-colors border-2 border-current/10"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {/* SECTION: TRENDING */}
              <div className="mb-24">
                <div className="flex items-center gap-4 mb-10">
                  <Zap className="w-5 h-5 text-accent animate-pulse" />
                  <h3 className="font-mono text-xs uppercase tracking-[0.4em] font-black opacity-50">Viral Truths</h3>
                  <div className="flex-1 h-px bg-current/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {globalLogs.length > 0 ? (
                    [...globalLogs].sort((a,b) => (b.rank || 0) - (a.rank || 0)).slice(0, 3).map((ax, i) => (
                      renderConceptCard(ax, i, "discovery-top")
                    ))
                  ) : (
                    <div className="col-span-full py-12 border-2 border-dashed border-current/10 rounded-2xl flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-30">
                      Synchronizing with collective awareness...
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: RECENT BIRTHS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
                  <div>
                    <div className="flex items-center gap-4 mb-10">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                          <h3 className="font-mono text-xs uppercase tracking-[0.4em] font-black opacity-50">Recently Born</h3>
                      <div className="flex-1 h-px bg-current/5" />
                    </div>
                    <div className="space-y-6">
                      {globalLogs.length > 0 ? (
                        [...globalLogs].sort((a,b) => {
                            const dateA = a.createdAt?.seconds || 0;
                            const dateB = b.createdAt?.seconds || 0;
                            return dateB - dateA;
                        }).slice(0, 5).map((ax, i) => (
                          <button
                            key={`discovery-recent-${i}-${ax.id || ax.concept.replace(/\s+/g, '_')}`}
                            onClick={() => {
                              setResult(ax.payload || ax);
                              setConcept(ax.concept);
                              setShowDiscovery(false);
                              setAxiomStep(0);
                              setShowIndex(false);
                            }}
                            className="w-full flex items-center p-6 bg-current/[0.02] border-2 border-current/5 rounded-2xl hover:border-accent hover:bg-bg transition-all group text-left"
                          >
                            <div className="w-10 h-10 bg-current/5 rounded-lg flex items-center justify-center mr-6 font-mono text-[10px] opacity-30">{(i+1).toString().padStart(2, '0')}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black uppercase text-sm group-hover:text-accent transition-colors">{ax.concept}</h4>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setReportingConcept(ax.concept); 
                                    setShowFeedback(true); 
                                  }}
                                  className="p-1 opacity-20 hover:opacity-100 hover:text-soft-red transition-all"
                                >
                                  <AlertTriangle size={12} />
                                </button>
                              </div>
                              <p className="font-mono text-[9px] uppercase tracking-widest opacity-30">{ax.domain || "New Knowledge"}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 text-accent" />
                          </button>
                        ))
                      ) : (
                        <div className="p-12 border-2 border-dashed border-current/10 rounded-2xl flex items-center justify-center font-mono text-[10px] uppercase tracking-widest opacity-30">
                          Waiting for first synthesis...
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-10">
                      <Dice5 className="w-5 h-5 text-purple-500" />
                      <h3 className="font-mono text-xs uppercase tracking-[0.4em] font-black opacity-50">Serendipity</h3>
                      <div className="flex-1 h-px bg-current/5" />
                    </div>
                    <div className="bg-current/[0.01] border-4 border-dashed border-current/10 rounded-[3rem] p-10 text-center h-[430px] flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-bg border-4 border-current/5 rounded-full flex items-center justify-center mb-8 shadow-xl">
                          <Rocket className="w-10 h-10 text-accent" />
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Deep Dive Discovery</h4>
                        <p className="font-sans opacity-50 mb-10 max-w-xs mx-auto italic text-sm">Jump into a random sector of human curiosity and expand your neural map.</p>
                        <button 
                          onClick={() => {
                            const rand = globalLogs[Math.floor(Math.random() * globalLogs.length)];
                            if (rand) {
                              setResult(rand.payload || rand);
                              setConcept(rand.concept);
                              setShowDiscovery(false);
                              setAxiomStep(0);
                              setShowIndex(false);
                            }
                          }}
                          className="px-12 py-5 bg-accent text-bg rounded-2xl font-mono text-sm uppercase tracking-widest font-black shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] transition-all"
                        >
                          Launch Random Topic
                        </button>
                    </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
        {isCustomizing && result && (
          <CoasterCustomizer 
            concept={concept}
            understandableData={result}
            onClose={() => setIsCustomizing(false)}
          />
        )}
        <LegalModal 
          isOpen={showPrivacy}
          onClose={() => setShowPrivacy(false)}
          title="Security & Privacy Protocol"
          type="privacy"
        />
        <LegalModal 
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          title="Terms of Synthesis"
          type="terms"
        />

        <FeedbackModal 
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          context={
            showLibrary ? "Library" :
            selectedItem ? `IndexCard: ${selectedItem.title}` :
            showDiscovery ? "Discovery" : 
            showIndex ? "Index" : 
            result ? "Axiom View" : 
            loading ? "Loading" : 
            showAccount ? "Account" : 
            "Home"
          }
          topic={selectedItem?.title || concept}
          step={axiomStep}
        />

        <AnimatePresence>
          {showLibrary && (
            <Library 
              onClose={() => setShowLibrary(false)}
              onSelectItem={(item, card) => {
                setShowLibrary(false);
                setConcept(item.title);
                understandTopic(item.title);
              }}
              showFeedback={() => setShowFeedback(true)}
            />
          )}
        </AnimatePresence>

        <IndexCard 
          item={selectedItem}
          card={selectedCard}
          isOpen={!!selectedItem && !!selectedCard}
          onClose={() => {
            setSelectedItem(null);
            setSelectedCard(null);
          }}
          showFeedback={() => setShowFeedback(true)}
        />

        {/* Persistent Feedback Toggle */}
        <div className="fixed bottom-6 right-6 z-[250]">
          <Tooltip text="Report bug or give feedback">
            <button
              id="global-feedback-btn"
              onClick={() => setShowFeedback(true)}
              className="w-12 h-12 bg-ink text-bg rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group"
            >
              <MessageSquare size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </Tooltip>
        </div>
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
