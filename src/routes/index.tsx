import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import heroAsset from "@/assets/senhora-garrafada.jpeg.asset.json";
import feedbackRapazAsset from "@/assets/feedback-rapaz.jpg.asset.json";
import feedbackMulherAsset from "@/assets/feedback-mulher.jpg.asset.json";
import receitaAsset from "@/assets/receita-natural.png.asset.json";
import { sendMetaEvent } from "@/lib/meta-capi.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

/* -------------------- Tracking -------------------- */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => unknown;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now();
}
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}
function trackEvent(event_name: string, custom_data: Record<string, unknown> = {}) {
  const event_id = uuid();
  if (typeof window !== "undefined" && window.fbq) {
    const standard = new Set([
      "PageView", "ViewContent", "Lead", "InitiateCheckout",
      "AddToCart", "Purchase", "CompleteRegistration", "Contact",
    ]);
    const method = standard.has(event_name) ? "track" : "trackCustom";
    window.fbq(method, event_name, custom_data, { eventID: event_id });
  }
  try {
    void sendMetaEvent({
      data: {
        event_name, event_id,
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        custom_data,
        user_data: {
          client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          fbp: getCookie("_fbp"), fbc: getCookie("_fbc"),
        },
      },
    });
  } catch { /* noop */ }
}

/* -------------------- YouTube feedback video -------------------- */
function VSL({ videoId, label }: { videoId: string; label: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<unknown>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    function init() {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3,
          fs: 0, disablekb: 1, cc_load_policy: 0, showinfo: 0, controls: 1,
        },
        events: {
          onStateChange: (e: { data: number; target: unknown }) => {
            const state = e.data;
            if (state === window.YT!.PlayerState.PLAYING && !startedRef.current) {
              startedRef.current = true;
              trackEvent("VideoStart", { video_id: videoId, label });
              interval = setInterval(() => {
                const p = e.target as { getCurrentTime: () => number; getDuration: () => number };
                const dur = p.getDuration?.() ?? 0;
                const cur = p.getCurrentTime?.() ?? 0;
                if (!dur) return;
                const pct = (cur / dur) * 100;
                for (const m of [25, 50, 75]) {
                  if (pct >= m && !firedRef.current.has(m)) {
                    firedRef.current.add(m);
                    trackEvent(`VideoProgress${m}`, { video_id: videoId, label, percent: m });
                  }
                }
              }, 1000);
            }
            if (state === window.YT!.PlayerState.ENDED) {
              if (!firedRef.current.has(100)) {
                firedRef.current.add(100);
                trackEvent("VideoProgress100", { video_id: videoId, label, percent: 100 });
              }
              if (interval) clearInterval(interval);
            }
          },
        },
      });
    }
    if (window.YT && window.YT.Player) init();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
    }
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, [videoId, label]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg mx-auto" style={{ aspectRatio: "9/16", maxWidth: 340 }}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-24 bg-black/80" />
    </div>
  );
}

/* -------------------- Data -------------------- */
const CHECKOUT_URL = "https://checkout.wiven.com.br/checkout/cmrk289w90i5f01pvn2yblhh9?offer=MJT8T3B";
const FEEDBACK_VIDEO_ID = "kDT8CZakXVc";

const FEEDBACKS = [
  {
    img: feedbackMulherAsset.url,
    name: "Ana Paula, 42 anos",
    location: "Belo Horizonte — MG",
    text: "Eu vivia cansada, com sede o tempo todo e sem energia. Depois de 3 semanas usando a Garrafada minha glicose baixou e voltei a viver com disposição. Parece milagre 🙏",
  },
  {
    img: feedbackRapazAsset.url,
    name: "Lucas M., 29 anos",
    location: "Curitiba — PR",
    text: "Descobri diabetes cedo e fiquei desesperado. A Garrafada Natural me ajudou a estabilizar a glicose. Hoje me sinto no controle da minha saúde.",
  },
  {
    img: null as string | null,
    name: "Maria de Fátima, 68 anos",
    location: "Recife — PE",
    text: "Minha filha comprou pra mim. Tomo todos os dias, parei de acordar de madrugada pro banheiro e o médico ficou impressionado com meu exame!",
  },
  {
    img: null as string | null,
    name: "José Antônio, 57 anos",
    location: "Salvador — BA",
    text: "Já tinha tentado de tudo. Em 30 dias meus resultados mudaram. Recomendo pra qualquer um que sofre com diabetes como eu sofria.",
  },
];

const BENEFITS = [
  { icon: "🩸", title: "Ajuda a controlar a glicose", desc: "Fórmula que atua no equilíbrio natural dos níveis de açúcar no sangue." },
  { icon: "⚡", title: "Mais energia e disposição", desc: "Diga adeus ao cansaço constante e volte a fazer o que ama." },
  { icon: "💚", title: "100% natural, sem efeitos colaterais", desc: "Feito com plantas medicinais reconhecidas há gerações." },
  { icon: "🌿", title: "Apoia a saúde do pâncreas", desc: "Contribui para o funcionamento do órgão responsável pela insulina." },
  { icon: "💧", title: "Reduz sede e idas ao banheiro", desc: "Volte a dormir a noite inteira sem interrupções." },
  { icon: "🛡️", title: "Previne complicações graves", desc: "Cuide-se agora para evitar visão comprometida, feridas e amputações." },
];

const FAQ = [
  {
    q: "A Garrafada Natural realmente funciona?",
    a: "Sim. Milhares de pessoas já relataram melhora significativa nos níveis de glicose, disposição e qualidade de sono. É uma fórmula natural, sem promessas mágicas — só resultado com uso contínuo.",
  },
  {
    q: "Preciso parar meus remédios?",
    a: "Não. A Garrafada é um complemento natural e não substitui a orientação médica. Continue seu tratamento normalmente.",
  },
  {
    q: "Quanto tempo para ver resultados?",
    a: "A maioria das pessoas relata melhoras já nas primeiras 2 a 3 semanas de uso contínuo.",
  },
  {
    q: "Tem efeito colateral?",
    a: "Não. É 100% natural, feita com ingredientes usados há décadas na medicina popular brasileira.",
  },
  {
    q: "E se eu não gostar?",
    a: "Você tem 7 dias de garantia. Se não gostar, devolvemos 100% do seu dinheiro. Sem burocracia.",
  },
];

/* -------------------- Scarcity bar -------------------- */
function ScarcityBar() {
  const [seconds, setSeconds] = useState(15 * 60);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = Math.max(0, (seconds / (15 * 60)) * 100);
  return (
    <div className="sticky top-0 z-50 w-full bg-[oklch(0.58_0.22_27)] text-white shadow-md">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-1 px-4 py-2 text-center">
        <p className="text-xs sm:text-sm font-bold">
          ⚠️ OFERTA VÁLIDA SOMENTE HOJE — expira em{" "}
          <span className="tabular-nums font-extrabold">{mm}:{ss}</span>
        </p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full bg-white transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------- Rotating feedbacks -------------------- */
function FeedbacksCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % FEEDBACKS.length), 4500);
    return () => clearInterval(t);
  }, []);
  const f = FEEDBACKS[i];
  return (
    <div className="relative mx-auto mt-6 min-h-[220px] w-full max-w-xl">
      <div
        key={i}
        className="animate-in fade-in slide-in-from-right-8 duration-500 rounded-2xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-5 shadow-md"
      >
        <div className="flex items-start gap-4">
          {f.img ? (
            <img
              src={f.img}
              alt={f.name}
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-[oklch(0.93_0.06_150)]"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[oklch(0.93_0.06_150)] text-2xl font-bold text-[oklch(0.30_0.10_150)] ring-2 ring-[oklch(0.90_0.03_150)]">
              {f.name[0]}
            </div>
          )}
          <div className="flex-1 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-foreground">{f.name}</p>
              <span className="rounded-full bg-[oklch(0.93_0.06_150)] px-2 py-0.5 text-xs font-semibold text-[oklch(0.30_0.10_150)]">
                ✔ Compra verificada
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{f.location}</p>
            <p className="mt-1 text-sm text-yellow-500">★★★★★</p>
            <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground">"{f.text}"</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {FEEDBACKS.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Feedback ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-[oklch(0.90_0.03_150)]"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------- FAQ -------------------- */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-base md:text-lg font-semibold text-foreground">{q}</span>
        <span className={`text-primary text-xl transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm md:text-base leading-relaxed text-muted-foreground">
          {a}
        </div>
      )}
    </div>
  );
}

/* -------------------- Buy button -------------------- */
function BuyButton({ source }: { source: string }) {
  return (
    <a
      href={CHECKOUT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent("InitiateCheckout", {
          currency: "BRL",
          value: 14.99,
          content_name: "Garrafada Natural para Diabetes",
          content_ids: ["garrafada-diabetes-14-99"],
          num_items: 1,
          source,
        })
      }
      className="inline-block w-full max-w-xl rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-5 text-center text-lg md:text-xl font-extrabold uppercase text-white shadow-xl ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
    >
      🌿 Quero minha Garrafada por R$ 14,99
    </a>
  );
}

/* -------------------- Page -------------------- */
function Index() {
  useEffect(() => {
    trackEvent("ViewContent", {
      content_name: "Garrafada Natural para Diabetes",
      content_category: "Sales Page",
      currency: "BRL",
      value: 14.99,
    });
  }, []);

  return (
    <main className="min-h-[100svh] w-full bg-white text-foreground">
      <ScarcityBar />

      {/* HERO */}
      <section className="w-full bg-gradient-to-b from-[oklch(0.98_0.02_150)] to-white px-5 pt-8 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-3 py-1 text-xs md:text-sm font-semibold text-[oklch(0.30_0.10_150)]">
            🌿 100% Natural • Feito no Brasil
          </span>
          <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
            Garrafada Natural para <span className="text-primary">Diabetes</span>
          </h1>
          <p className="mt-2 text-lg md:text-2xl font-semibold text-foreground">
            A receita caseira que está ajudando milhares de brasileiros a{" "}
            <span className="text-[oklch(0.58_0.22_27)]">controlar a glicose sem sofrimento</span>.
          </p>

          <div className="mt-5 flex justify-center">
            <img
              src={receitaAsset.url}
              alt="Garrafada Natural para Diabetes — receita natural"
              className="w-full max-w-sm rounded-3xl shadow-xl object-cover"
            />
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
            Se você vive <strong className="text-foreground">com medo de picos de glicose</strong>,
            cansado, com sede constante e preocupado com complicações como
            perda de visão ou amputações — <strong className="text-foreground">essa Garrafada foi feita para você</strong>.
            Uma fórmula natural, barata e simples que age direto no{" "}
            <strong className="text-foreground">pâncreas</strong>, ajudando seu corpo a
            reequilibrar a produção de insulina de forma segura.
          </p>

          <div className="mt-6 flex flex-col items-center gap-2">
            <BuyButton source="hero" />
            <p className="text-xs md:text-sm text-muted-foreground">
              💚 Garantia de 7 dias • Pagamento único de R$ 14,99
            </p>
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="w-full bg-[oklch(0.98_0.02_27)] px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl md:text-4xl font-extrabold text-foreground">
            Você se identifica com algum desses sinais?
          </h2>
          <p className="mt-2 text-center text-base md:text-lg text-muted-foreground">
            A diabetes descontrolada rouba sua paz, sua energia e seu futuro.
          </p>
          <ul className="mt-6 space-y-3 text-base md:text-lg">
            {[
              "Cansaço extremo mesmo depois de dormir",
              "Sede constante e vontade de urinar toda hora",
              "Medo de ter um pico de glicose a qualquer momento",
              "Formigamentos nos pés, feridas que não cicatrizam",
              "Preocupação com a visão, os rins e o coração",
              "Frustração por depender só de remédios que dão efeito colateral",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-[oklch(0.88_0.10_27)] bg-white p-4 shadow-sm">
                <span className="text-[oklch(0.58_0.22_27)] font-bold">✗</span>
                <span className="text-foreground">{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-base md:text-lg font-semibold text-foreground">
            👉 Existe uma saída natural, comprovada e ao seu alcance.
          </p>
        </div>
      </section>

      {/* SOBRE REMÉDIOS NATURAIS */}
      <section className="w-full bg-white px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground text-center">
            O poder dos remédios caseiros redescobertos
          </h2>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground text-center">
            Nos últimos anos, pesquisadores e médicos vêm redescobrindo o que
            nossas avós já sabiam: <strong className="text-foreground">plantas medicinais brasileiras</strong>{" "}
            têm ação real sobre o metabolismo, ajudando o corpo a regular a
            glicose de forma natural. Aliados ao seu tratamento, esses
            preparados caseiros estão mudando a vida de milhares de pessoas —
            <strong className="text-foreground"> dentro de casa, sem sair da rotina</strong>.
          </p>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground text-center">
            A Garrafada Natural para Diabetes reúne essa sabedoria em uma
            fórmula pronta, prática e barata — <strong className="text-foreground">para você começar hoje mesmo</strong>.
          </p>
          <div className="mt-6 flex justify-center">
            <img
              src={heroAsset.url}
              alt="Senhora satisfeita segurando a Garrafada Natural"
              className="w-full max-w-xs rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl md:text-4xl font-extrabold text-foreground">
            O que a Garrafada Natural faz por você
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-5 shadow-sm">
                <p className="text-3xl">{b.icon}</p>
                <h3 className="mt-2 text-lg md:text-xl font-bold text-foreground">{b.title}</h3>
                <p className="mt-1 text-sm md:text-base text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <BuyButton source="beneficios" />
          </div>
        </div>
      </section>

      {/* OFERTA / PREÇO */}
      <section className="w-full bg-white px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border-2 border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-6 md:p-10 shadow-lg text-center">
            <span className="inline-block rounded-full bg-[oklch(0.58_0.22_27)] px-4 py-1.5 text-sm font-bold text-white">
              OFERTA RELÂMPAGO — SÓ HOJE
            </span>
            <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-foreground">
              Garrafada Natural para Diabetes
            </h2>
            <img
              src={receitaAsset.url}
              alt="Receita natural para auxílio ao controle da glicemia"
              className="mx-auto mt-4 w-full max-w-sm rounded-2xl object-cover shadow-md"
            />
            <div className="mt-6 flex items-baseline justify-center gap-3">
              <span className="text-2xl text-muted-foreground line-through">R$ 49,90</span>
              <span className="text-5xl md:text-6xl font-extrabold text-[oklch(0.58_0.22_27)]">R$ 14,99</span>
            </div>
            <p className="mt-1 text-sm md:text-base text-muted-foreground">Pagamento único • Sem mensalidades</p>
            <div className="mt-6">
              <BuyButton source="oferta_preco" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-white p-3 text-center">
                <p className="text-2xl">🔒</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Compra segura</p>
              </div>
              <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-white p-3 text-center">
                <p className="text-2xl">💚</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Garantia de 7 dias</p>
              </div>
              <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-white p-3 text-center">
                <p className="text-2xl">🚚</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Para todo o Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERGUNTAS */}
      <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl md:text-4xl font-extrabold text-foreground">
            Perguntas frequentes
          </h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="w-full bg-white px-5 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border-2 border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-6 md:p-10 text-center shadow-md">
          <p className="text-5xl">💚</p>
          <h2 className="mt-3 text-2xl md:text-4xl font-extrabold text-foreground">
            Garantia incondicional de 7 dias
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
            Experimente a Garrafada Natural sem risco nenhum. Se em 7 dias você
            não estiver satisfeito(a), devolvemos <strong className="text-foreground">100% do seu dinheiro</strong>.
            Sem burocracia, sem perguntas.
          </p>
        </div>
      </section>

      {/* FEEDBACKS + VÍDEO */}
      <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-3 py-1 text-xs md:text-sm font-semibold text-[oklch(0.30_0.10_150)]">
            ⭐ Mais de 12.000 pessoas já usaram
          </span>
          <h2 className="mt-3 text-2xl md:text-4xl font-extrabold text-foreground">
            Quem já usa, recomenda
          </h2>
          <FeedbacksCarousel />

          <div className="mt-10">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              Veja um depoimento em vídeo
            </h3>
            <div className="mt-4">
              <VSL videoId={FEEDBACK_VIDEO_ID} label="feedback_video" />
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <BuyButton source="feedbacks" />
          </div>
        </div>
      </section>

      <footer className="border-t border-[oklch(0.90_0.03_150)] bg-white px-5 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Garrafada Natural — Este produto não substitui o acompanhamento médico.</p>
      </footer>
    </main>
  );
}
