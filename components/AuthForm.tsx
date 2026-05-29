"use client";

import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeLogo } from "./ThemeLogo";

interface AuthFormProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  chatPreviewType?: "login" | "register" | "forgot-password";
}

interface ChatBubble {
  sender: string;
  senderColor: string;
  text: string;
  time: string;
  align: "left" | "right";
  bubbleStyle: string;
}

const PREVIEW_CHATS: Record<"login" | "register" | "forgot-password", ChatBubble[]> = {
  login: [
    {
      sender: "Tsismosa #1",
      senderColor: "text-tsismis-cyan",
      text: "Huy! May bagong chika ako... narinig mo na ba yung balita?",
      time: "05:25 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
    {
      sender: "You",
      senderColor: "text-[#F8961E]",
      text: "Hala ano yun?! Dali, i-bulong mo na sa akin! 🍿",
      time: "05:26 PM",
      align: "right",
      bubbleStyle: "bg-gradient-to-br from-[#F72585]/20 to-[#7209B7]/10 border-[#F72585]/30 text-white",
    },
    {
      sender: "Tsismosa #1",
      senderColor: "text-tsismis-cyan",
      text: "Dito sa TsisMissed, ligtas at real-time ang chika natin! 😉",
      time: "05:27 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
  ],
  register: [
    {
      sender: "Tsismosa #2",
      senderColor: "text-tsismis-cyan",
      text: "Uy, gawa ka na ng account sa TsisMissed bilis!",
      time: "05:30 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
    {
      sender: "You",
      senderColor: "text-[#F8961E]",
      text: "Bakit? Ano bang meron dun? Active ba kayo?",
      time: "05:31 PM",
      align: "right",
      bubbleStyle: "bg-gradient-to-br from-[#F72585]/20 to-[#7209B7]/10 border-[#F72585]/30 text-white",
    },
    {
      sender: "Tsismosa #2",
      senderColor: "text-tsismis-cyan",
      text: "Grabe, andaming chika sa group chat ngayon! Safe pa mag-marites dito! 🤫",
      time: "05:32 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
  ],
  "forgot-password": [
    {
      sender: "Tsismosa #3",
      senderColor: "text-tsismis-cyan",
      text: "Huy nasaan ka na? Start na ng chika session natin!",
      time: "05:40 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
    {
      sender: "You",
      senderColor: "text-[#F8961E]",
      text: "Hala, nakalimutan ko password ko! Di ko mabuksan inbox ko!",
      time: "05:41 PM",
      align: "right",
      bubbleStyle: "bg-gradient-to-br from-[#F72585]/20 to-[#7209B7]/10 border-[#F72585]/30 text-white",
    },
    {
      sender: "Tsismosa #3",
      senderColor: "text-tsismis-cyan",
      text: "I-reset mo na dali! Baka ma-miss mo yung chika ng taon! ⏳",
      time: "05:42 PM",
      align: "left",
      bubbleStyle: "bg-gradient-to-br from-white/12 to-white/5 border-white/10 text-white",
    },
  ],
};

export function AuthForm({
  title,
  children,
  footer,
  chatPreviewType = "login",
}: AuthFormProps) {
  const bubbles = PREVIEW_CHATS[chatPreviewType];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-tsismis-bg transition-all duration-150 relative overflow-x-hidden">
      {/* Left Column - Graphic/Branding Panel (Desktop only) */}
      <aside className="hidden md:flex md:w-[42%] lg:w-[48%] flex-col justify-between p-12 bg-gradient-to-br from-[#120E22] via-[#7209B7]/80 to-[#F72585] text-white border-r border-white/5 relative overflow-hidden shrink-0">
        {/* Glow Spheres */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-tsismis-purple/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-tsismis-pink/20 blur-[100px] pointer-events-none" />

        {/* Top Branding Logo - 30% Upsized (width 234, height 47) */}
        <div className="flex items-center gap-2 select-none relative z-10">
          <Image
            src="/logo_with_text_dark.png"
            alt="TsisMissed"
            width={234}
            height={47}
            className="object-contain"
            priority
          />
        </div>

        {/* Middle Mock Conversation Graphics with Dynamic Bubbles & Polish */}
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto my-auto relative z-10 select-none">
          <div className="text-center mb-1">
            <span className="text-xs uppercase tracking-widest text-[#F0E6FF]/70 font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
              Live Chika Preview 🍿
            </span>
          </div>

          {bubbles.map((bubble, idx) => (
            <div
              key={idx}
              className={`backdrop-blur-md rounded-2xl p-4 border max-w-[85%] shadow-md transition-all duration-300 hover:scale-[1.03] hover:-rotate-1 hover:shadow-lg cursor-default ${
                bubble.align === "left"
                  ? "self-start rounded-bl-sm"
                  : "self-end rounded-br-sm"
              } ${bubble.bubbleStyle}`}
            >
              <p className={`text-xs font-semibold mb-0.5 ${bubble.senderColor}`}>
                {bubble.sender}
              </p>
              <p className="text-sm leading-relaxed">{bubble.text}</p>
              <span className="text-[9px] text-[#9D8EC0] block mt-1.5 text-right opacity-80">
                {bubble.time}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Tagline & Footnote */}
        <div className="flex flex-col gap-1.5 relative z-10">
          <p className="text-sm font-medium text-[#F0E6FF] opacity-95">
            Ang pinakabagong chika, rekta sa inbox mo.
          </p>
          <p className="text-xs text-[#9D8EC0] tracking-wide opacity-80">
            100% Ligtas. 100% Masaya. Walang preno ang chika.
          </p>
        </div>
      </aside>

      {/* Right Column - Authentication Form Area */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 bg-tsismis-bg relative min-h-screen overflow-y-auto">
        {/* Floating Theme Toggle in Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Form Card Container with Glowing Pink Border on Hover */}
        <div className="w-full max-w-md bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-xl p-8 relative transition-all duration-300 hover:border-tsismis-pink/30 hover:shadow-2xl hover:shadow-tsismis-pink/5">
          {/* Logo - Rendered ONLY on mobile/tablet screens - 30% Upsized (height 64) */}
          <div className="flex justify-center mb-6 md:hidden">
            <ThemeLogo variant="full" height={64} />
          </div>

          {/* Form Title */}
          <h1 className="text-2xl font-bold text-tsismis-text mb-6 text-center tracking-tight">
            {title}
          </h1>

          {/* Form Content */}
          {children}

          {/* Optional Footer Link */}
          {footer && (
            <div className="mt-6 text-center text-sm text-tsismis-muted">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
