import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Circle, Square, RectangleHorizontal, PenTool, X, ArrowRight } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface CoasterCustomizerProps {
  concept: string;
  understandableData: any;
  onClose: () => void;
}

export default function CoasterCustomizer({ concept, understandableData, onClose }: CoasterCustomizerProps) {
  const [tier, setTier] = useState<'standard' | 'custom'>('standard');
  const [shape, setShape] = useState('circle');
  const [material, setMaterial] = useState('brushed_steel');

  const price = tier === 'standard' ? 59.99 : 89.99;
  const leadTime = tier === 'standard' ? '1 WEEK' : '2 WEEKS';

  const handleCheckout = async () => {
    try {
      const apiBase = (process.env.API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert("Checkout initialization failed. Please ensure Stripe is configured.");
    }
  };

  const getMaterialPreviewStyle = () => {
    switch (material) {
      case 'brushed_steel': return 'bg-gradient-to-br from-[#c0c0c0]/20 to-[#808080]/20 border-[#666] text-[#e0e0e0]';
      case 'mirror_polish': return 'bg-gradient-to-br from-[#e8e8e8]/30 to-[#b0b0b0]/20 border-[#888] text-[#fff] shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]';
      case 'matte_black': return 'bg-[#1a1a1a] border-[#333] text-[#aaa]';
      case 'copper': return 'bg-gradient-to-br from-[#d4742f]/20 to-[#8b4513]/20 border-[#8b4513] text-[#eebda0]';
      default: return 'bg-white/5 border-[#333]';
    }
  };

  const getShapePreviewStyle = () => {
    switch (shape) {
      case 'circle': return 'rounded-full aspect-square';
      case 'square': return 'rounded-none aspect-square';
      case 'rectangle': return 'rounded-sm aspect-[1.3]';
      case 'custom': return 'rounded-[30%_70%_70%_30%/30%_30%_70%_70%] aspect-square'; 
      default: return 'rounded-full aspect-square';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto text-white font-sans backdrop-blur-sm"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:px-12 md:py-20">
        
        {/* Header */}
        <header className="mb-16 relative">
          <Tooltip text="Close">
            <button 
              onClick={onClose}
              className="absolute -top-2 md:-top-4 right-0 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          </Tooltip>
          
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-6xl font-serif uppercase tracking-tight mb-2 md:mb-4"
          >
            Understandable Anchors
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-sm tracking-widest text-[#999] uppercase"
          >
            Bringing clarity to the physical world.
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
          
          {/* LEFT PANEL: CONTROLS */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-12"
          >
            {/* Tier Definition */}
            <section>
              <label className="block font-mono text-sm tracking-[0.2em] uppercase text-[#999] mb-4 font-black">
                Personalization
              </label>
              <div className="flex gap-4">
                <Tooltip text="Standard Shape">
                  <button 
                    onClick={() => { setTier('standard'); if (shape === 'custom') setShape('circle'); }}
                    className={`flex-1 py-6 px-4 border-2 font-mono text-sm tracking-widest uppercase transition-all
                      ${tier === 'standard' ? 'bg-white text-black border-white font-black' : 'bg-transparent text-white border-white/20 hover:border-white'}
                    `}
                  >
                    Standard
                  </button>
                </Tooltip>
                <Tooltip text="Your own design">
                  <button 
                    onClick={() => { setTier('custom'); setShape('custom'); }}
                    className={`flex-1 py-6 px-4 border-2 font-mono text-sm tracking-widest uppercase transition-all
                      ${tier === 'custom' ? 'bg-white text-black border-white font-black' : 'bg-transparent text-white border-white/20 hover:border-white'}
                    `}
                  >
                    Custom
                  </button>
                </Tooltip>
              </div>
            </section>

            {/* Shape Selection */}
            <section>
              <label className="block font-mono text-sm tracking-[0.2em] uppercase text-[#999] mb-4 font-black">
                Shape {tier === 'custom' && "(Custom Design)"}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'circle', label: 'Circle', icon: <Circle className="w-10 h-10" strokeWidth={2} /> },
                  { id: 'square', label: 'Square', icon: <Square className="w-10 h-10" strokeWidth={2} /> },
                  { id: 'rectangle', label: 'Rectangle', icon: <RectangleHorizontal className="w-10 h-10" strokeWidth={2} /> },
                  { id: 'custom', label: 'Custom Path', icon: <PenTool className="w-10 h-10" strokeWidth={2} />, disabled: tier === 'standard' }
                ].map(s => (
                  <Tooltip text={s.label} key={s.id}>
                    <button
                      onClick={() => !s.disabled && setShape(s.id)}
                      disabled={s.disabled}
                      className={`aspect-square w-full flex items-center justify-center border-2 transition-all
                        ${shape === s.id ? 'border-white bg-white/20 text-white' : 'border-white/10 text-white/50 hover:border-white/60 hover:text-white'}
                        ${s.disabled ? 'opacity-20 cursor-not-allowed bg-black/50' : 'cursor-pointer'}
                      `}
                    >
                      {s.icon}
                    </button>
                  </Tooltip>
                ))}
              </div>
              {tier === 'custom' && (
                <p className="mt-4 font-mono text-sm tracking-widest uppercase text-accent font-black">
                  * Custom vector upload prompted after checkout
                </p>
              )}
            </section>

            {/* Material Selection */}
            <section>
              <label className="block font-mono text-sm tracking-[0.2em] uppercase text-[#999] mb-4 font-black">
                Material
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'brushed_steel', label: 'Brushed Steel', desc: 'Intentional', gradient: 'from-[#c0c0c0] to-[#808080]' },
                  { id: 'mirror_polish', label: 'Mirror Polish', desc: 'Vulnerable', gradient: 'from-[#e8e8e8] to-[#b0b0b0]' },
                  { id: 'matte_black', label: 'Matte Black', desc: 'Decisive', gradient: 'from-[#222] to-[#111]' },
                  { id: 'copper', label: 'Raw Copper', desc: 'Warm / Aged', gradient: 'from-[#d4742f] to-[#8b4513]' }
                ].map(m => (
                  <Tooltip text={`Select ${m.label}`} key={m.id}>
                    <button
                      onClick={() => setMaterial(m.id)}
                      className={`w-full flex flex-col text-left p-6 border-2 transition-all relative overflow-hidden
                        ${material === m.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'}
                      `}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-4 h-4 rounded-sm border-2 border-black/50 bg-gradient-to-br ${m.gradient}`} />
                        <span className={`font-mono text-sm tracking-widest uppercase ${material === m.id ? 'text-white font-black' : 'text-white/80'}`}>
                          {m.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs uppercase tracking-wider text-[#999] pl-8 font-black">
                        {m.desc}
                      </span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </section>

            {/* Price Display */}
            <section className="pt-8 border-t-2 border-white/10 flex justify-between items-end">
              <div>
                <label className="block font-mono text-sm tracking-[0.2em] uppercase text-[#999] mb-4 font-black">
                  Total Price
                </label>
                <div className="font-mono text-xs uppercase text-accent tracking-widest font-black">
                  Ships in: {leadTime}
                </div>
              </div>
              <div className="font-serif text-4xl md:text-6xl tracking-tighter font-black">
                ${price}
              </div>
            </section>

          </motion.div>

          {/* RIGHT PANEL: PREVIEW */}
            <motion.div 
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col"
            >
              <label className="block font-mono text-sm tracking-[0.2em] uppercase text-[#999] mb-8 md:mb-12 font-black">
                Physical Matrix Rendering
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 mb-20">
                
                {/* Coaster 1: State A */}
                <div className={`border-2 overflow-hidden p-6 md:p-12 flex items-center justify-center relative transition-all duration-700 shadow-2xl
                  ${getShapePreviewStyle()} ${getMaterialPreviewStyle()}
                `}>
                  <span className="absolute top-3 md:top-6 right-3 md:right-6 font-mono text-xs md:text-sm opacity-60 font-black">01</span>
                  <div className="text-center px-2 md:px-4">
                    <div className="font-mono text-[9px] md:text-sm uppercase tracking-[0.2em] mb-4 md:mb-6 font-black underline underline-offset-4 md:underline-offset-8 decoration-accent">
                      {understandableData.axis1?.labelA || "Axis 1 // Success"}
                    </div>
                    <div className="font-serif text-xs md:text-xl leading-relaxed italic opacity-100 line-clamp-6 font-medium">
                      "{understandableData.axis1?.stateA || understandableData.stateA}"
                    </div>
                  </div>
                </div>

                {/* Coaster 2: State B */}
                <div className={`border-2 overflow-hidden p-6 md:p-12 flex items-center justify-center relative transition-all duration-700 shadow-2xl
                  ${getShapePreviewStyle()} ${getMaterialPreviewStyle()}
                `}>
                  <span className="absolute top-3 md:top-6 right-3 md:right-6 font-mono text-xs md:text-sm opacity-60 font-black">02</span>
                  <div className="text-center px-2 md:px-4">
                    <div className="font-mono text-[9px] md:text-sm uppercase tracking-[0.2em] mb-4 md:mb-6 font-black underline underline-offset-4 md:underline-offset-8 decoration-accent">
                      {understandableData.axis1?.labelB || "Axis 1 // Struggle"}
                    </div>
                    <div className="font-serif text-xs md:text-xl leading-relaxed italic opacity-100 line-clamp-6 font-medium">
                      "{understandableData.axis1?.stateB || understandableData.stateB}"
                    </div>
                  </div>
                </div>

                {/* Coaster 3: Zenith */}
                <div className={`border-4 overflow-hidden p-6 md:p-12 flex items-center justify-center relative transition-all duration-700 shadow-[0_40px_80px_rgba(255,255,255,0.1)]
                  ${getShapePreviewStyle()} ${getMaterialPreviewStyle()}
                `}>
                  <span className="absolute top-3 md:top-6 right-3 md:right-6 font-mono text-xs md:text-sm opacity-80 font-black">03</span>
                  <div className="text-center px-2 md:px-4">
                    <div className="font-mono text-[9px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 font-black underline underline-offset-4 md:underline-offset-8 decoration-accent">
                      Axis 3 // Zenith
                    </div>
                    <div className="font-serif text-base md:text-3xl leading-relaxed font-black">
                      {understandableData.axis3?.zenith || understandableData.zenith}
                    </div>
                  </div>
                </div>

                {/* Coaster 4: Concept */}
                <div className={`border-2 overflow-hidden p-6 md:p-12 flex items-center justify-center relative transition-all duration-700 shadow-2xl
                  ${getShapePreviewStyle()} ${getMaterialPreviewStyle()}
                `}>
                  <span className="absolute top-3 md:top-6 right-3 md:right-6 font-mono text-xs md:text-sm opacity-60 font-black">04</span>
                  <div className="text-center w-full px-2 md:px-4">
                    <div className="font-mono text-[9px] md:text-xs uppercase tracking-[0.2em] mb-4 md:mb-6 font-black">
                      Anchor Point
                    </div>
                    <div className="font-serif text-xl md:text-5xl uppercase tracking-tighter break-words font-black">
                      {concept}
                    </div>
                    <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t-2 border-current/20 font-mono text-[10px] md:text-sm uppercase tracking-widest font-black text-accent">
                      {understandableData.domainEmoji} {understandableData.domain}
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTION FOOTER */}
              <div className="flex flex-col sm:flex-row gap-8 mt-auto border-t-2 border-white/10 pt-16">
                <Tooltip text="Discard Component">
                  <button 
                    onClick={onClose}
                    className="w-full py-8 px-8 border-2 border-white/20 font-mono text-sm uppercase tracking-widest text-[#999] hover:text-white hover:border-white transition-all text-center font-black"
                  >
                    Return to Engine
                  </button>
                </Tooltip>
                <Tooltip text="Initiate Physical Acquisition">
                  <button 
                    onClick={handleCheckout}
                    className="flex-[2] flex items-center justify-center gap-6 py-8 px-8 border-4 border-white bg-white text-black font-mono text-sm uppercase tracking-[0.2em] font-black hover:bg-transparent hover:text-white transition-all text-center shadow-[12px_12px_0_0_rgba(255,255,255,0.2)]"
                  >
                    Finalize Anchor — ${price} <ArrowRight className="w-8 h-8" strokeWidth={3} />
                  </button>
                </Tooltip>
              </div>

          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
