import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import heroAsset from "@/assets/senhora-garrafada.jpeg.asset.json";
import feedbackRapazAsset from "@/assets/feedback-rapaz.jpg.asset.json";
import feedbackMulherAsset from "@/assets/feedback-mulher.jpg.asset.json";
import receitaAsset from "@/assets/receita-natural.png.asset.json";
import { sendMetaEvent } from "@/lib/meta-capi.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

/* -------------------------------------------------------------------------- */
/*  Tracking helpers                                                          */
/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>,
      ) => unknown;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now();
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function trackEvent(
  event_name: string,
  custom_data: Record<string, unknown> = {},
) {
  const event_id = uuid();
  // Pixel (browser)
  if (typeof window !== "undefined" && window.fbq) {
    const standard = new Set([
      "PageView",
      "ViewContent",
      "Lead",
      "InitiateCheckout",
      "AddToCart",
      "Purchase",
      "CompleteRegistration",
      "Contact",
    ]);
    const method = standard.has(event_name) ? "track" : "trackCustom";
    window.fbq(method, event_name, custom_data, { eventID: event_id });
  }
  // Conversions API (server) with same event_id for deduplication
  try {
    void sendMetaEvent({
      data: {
        event_name,
        event_id,
        event_source_url:
          typeof window !== "undefined" ? window.location.href : undefined,
        custom_data,
        user_data: {
          client_user_agent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        },
      },
    });
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  YouTube VSL with 25/50/75/100 progress tracking                           */
/* -------------------------------------------------------------------------- */

function VSL({
  videoId,
  label,
  onTime,
}: {
  videoId: string;
  label: string;
  onTime?: (seconds: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<unknown>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    function init() {
      if (cancelled || !containerRef.current || !window.YT) return;
      // eslint-disable-next-line new-cap
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          cc_load_policy: 0,
          showinfo: 0,
          controls: 1,
        },
        events: {
          onStateChange: (e: { data: number; target: unknown }) => {
            const state = e.data;
            if (state === window.YT!.PlayerState.PLAYING && !startedRef.current) {
              startedRef.current = true;
              trackEvent("VideoStart", { video_id: videoId, label });
              interval = setInterval(() => {
                const p = e.target as {
                  getCurrentTime: () => number;
                  getDuration: () => number;
                };
                const dur = p.getDuration?.() ?? 0;
                const cur = p.getCurrentTime?.() ?? 0;
                if (onTime) onTime(cur);
                if (!dur) return;
                const pct = (cur / dur) * 100;
                for (const milestone of [25, 50, 75]) {
                  if (pct >= milestone && !firedRef.current.has(milestone)) {
                    firedRef.current.add(milestone);
                    trackEvent(`VideoProgress${milestone}`, {
                      video_id: videoId,
                      label,
                      percent: milestone,
                    });
                  }
                }
              }, 1000);
            }
            if (state === window.YT!.PlayerState.ENDED) {
              if (!firedRef.current.has(100)) {
                firedRef.current.add(100);
                trackEvent("VideoProgress100", {
                  video_id: videoId,
                  label,
                  percent: 100,
                });
              }
              if (interval) clearInterval(interval);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [videoId, label]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg mx-auto"
      style={{ aspectRatio: "9/16", maxWidth: 340 }}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {/* Overlays para esconder logotipo/título do YouTube */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-24 bg-black/80" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quiz data                                                                 */
/* -------------------------------------------------------------------------- */

const QUIZ_1 = [
  {
    q: "Você se preocupa muito com sua taxa de glicose?",
    options: ["Sim, todos os dias", "Às vezes", "Raramente"],
  },
  {
    q: "Você já sentiu medo de ter um pico de glicose?",
    options: ["Sim, muito medo", "Um pouco", "Não"],
  },
  {
    q: "Sente cansaço frequente ou falta de energia?",
    options: ["Sim, quase sempre", "De vez em quando", "Raramente"],
  },
  {
    q: "Sente muita sede ou vontade de urinar durante o dia?",
    options: ["Sim, com frequência", "Às vezes", "Não"],
  },
  {
    q: "Você se sente frustrado(a) com a diabetes?",
    options: ["Sim, muito", "Um pouco", "Não"],
  },
  {
    q: "Tem medo de complicações (visão, rins, coração)?",
    options: ["Sim, muito medo", "Um pouco", "Não penso nisso"],
  },
  {
    q: "Você gostaria de viver com mais tranquilidade e liberdade?",
    options: ["Sim, com certeza!", "Sim, seria bom", "Talvez"],
  },
] as const;

const QUIZ_2 = [
  {
    q: "Qual sua faixa etária?",
    options: ["18 a 30 anos", "30 a 45 anos", "45 a 61 anos", "61 anos ou mais"],
  },
  {
    q: "Você gostaria de reduzir o cansaço e ter mais energia todos os dias?",
    options: ["Sim, muito!", "Com certeza", "Seria maravilhoso"],
  },
  {
    q: "Prefere uma solução 100% natural, sem efeitos colaterais?",
    options: ["Sim, com certeza", "Sim, prefiro natural", "Sim, natural é melhor"],
  },
  {
    q: "Você gostaria de ajudar seu pâncreas a produzir insulina de forma natural?",
    options: ["Sim, quero muito", "Sim, é o que preciso", "Com certeza"],
  },
  {
    q: "Se pudesse controlar sua glicose sem sofrimento, você começaria hoje?",
    options: ["Sim, começaria agora", "Sim, quero mudar", "Quero acreditar"],
  },
  {
    q: "Você está disposto(a) a experimentar por 30 dias com garantia?",
    options: ["Sim, com certeza", "Sim, quero testar"],
  },
] as const;

const CHECKOUT_URL = "https://checkout.wiven.com.br/checkout/cmrk289w90i5f01pvn2yblhh9?offer=MJT8T3B";

/* -------------------------------------------------------------------------- */
/*  Section components                                                        */
/* -------------------------------------------------------------------------- */

function Quiz({
  id,
  title,
  subtitle,
  questions,
  onDone,
  ctaColor = "green",
}: {
  id: string;
  title: string;
  subtitle?: string;
  questions: readonly { q: string; options: readonly string[] }[];
  onDone: (answers: string[]) => void;
  ctaColor?: "green" | "red";
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const total = questions.length;
  const current = questions[step];
  const progress = Math.round(((step) / total) * 100);

  useEffect(() => {
    trackEvent("QuizStart", { quiz_id: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(opt: string) {
    const next = [...answers, opt];
    trackEvent("QuizAnswer", {
      quiz_id: id,
      step: step + 1,
      total,
      question: current.q,
      answer: opt,
    });
    if (step + 1 >= total) {
      trackEvent("QuizComplete", { quiz_id: id, answers: next });
      onDone(next);
      return;
    }
    setAnswers(next);
    setStep(step + 1);
  }

  const btnClass =
    ctaColor === "red"
      ? "bg-[oklch(0.58_0.22_27)] hover:bg-[oklch(0.52_0.22_27)] text-white"
      : "bg-primary hover:bg-[oklch(0.44_0.14_150)] text-primary-foreground";

  return (
    <section className="w-full bg-white py-12 px-5">
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-center text-2xl md:text-4xl font-bold text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-center text-lg md:text-xl text-muted-foreground">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center justify-between text-base md:text-lg font-semibold text-muted-foreground">
              <span>
                Pergunta {step + 1} de {total}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[oklch(0.94_0.02_150)]">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
            {current.q}
          </h3>

          <div className="mt-6 flex flex-col gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className={`w-full rounded-xl px-6 py-5 text-lg md:text-xl font-semibold transition active:scale-[0.98] shadow-md ${btnClass}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type Stage =
  | "hero"
  | "quiz1"
  | "feedbacks"
  | "quiz2"
  | "loading"
  | "result"
  | "vsl2"
  | "checkout";

const VIDEO_ID_2 = "kDT8CZakXVc";

/* -------------------------------------------------------------------------- */
/*  Feedbacks (prova social — substitui o primeiro vídeo)                     */
/* -------------------------------------------------------------------------- */

const FEEDBACKS = [
  {
    img: feedbackMulherAsset.url,
    name: "Ana Paula, 42 anos",
    location: "Belo Horizonte — MG",
    stars: 5,
    text:
      "Eu vivia cansada, com sede o tempo todo e sem energia pro meu filho. Depois de 3 semanas usando a Garrafada minha glicose baixou e voltei a brincar com ele sem medo. Parece milagre 🙏",
  },
  {
    img: feedbackRapazAsset.url,
    name: "Lucas M., 29 anos",
    location: "Curitiba — PR",
    stars: 5,
    text:
      "Descobri diabetes cedo e fiquei desesperado. Não queria depender de remédio pra vida toda. A Garrafada Natural me ajudou a estabilizar a glicose e hoje me sinto no controle da minha saúde.",
  },
  {
    // 3º feedback só em texto, reforço social
    name: "Maria de Fátima, 68 anos",
    location: "Recife — PE",
    stars: 5,
    text:
      "Minha filha comprou pra mim e eu não acreditava. Tomo todos os dias, parei de acordar de madrugada pra ir no banheiro e o médico ficou impressionado com o exame. Recomendo a todos!",
  },
] as const;

function Feedbacks({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    trackEvent("ViewFeedbacks", { section: "social_proof" });
  }, []);
  return (
    <section className="min-h-[100svh] w-full bg-[oklch(0.98_0.02_150)] px-5 py-8 flex items-center">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-3 py-1 text-xs md:text-sm font-semibold text-[oklch(0.30_0.10_150)]">
            ⭐ Mais de 12.000 pessoas já usaram
          </span>
          <h2 className="mt-3 text-xl md:text-3xl font-extrabold text-foreground leading-tight">
            Veja quem já está{" "}
            <span className="text-primary">recuperando a saúde</span> com a
            Garrafada Natural
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Relatos reais de pessoas como você
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {FEEDBACKS.map((f) => (
            <div
              key={f.name}
              className="rounded-2xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-5 shadow-sm"
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
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-foreground">{f.name}</p>
                    <span className="text-xs rounded-full bg-[oklch(0.93_0.06_150)] px-2 py-0.5 font-semibold text-[oklch(0.30_0.10_150)]">
                      ✔ Compra verificada
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.location}</p>
                  <p className="mt-1 text-yellow-500 text-sm">
                    {"★".repeat(f.stars)}
                  </p>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground">
                    "{f.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <div className="mb-3 inline-block rounded-full bg-[oklch(0.30_0.10_150)] px-4 py-1.5 text-sm md:text-base font-bold text-white shadow-md animate-pulse">
            ✅ Próximo passo liberado!
          </div>
          <button
            onClick={() => {
              trackEvent("CTAClick", { cta: "feedbacks_continue" });
              onContinue();
            }}
            className="w-full max-w-xl rounded-2xl bg-primary px-6 py-4 text-base md:text-lg font-extrabold uppercase text-primary-foreground shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.44_0.14_150)] active:scale-[0.98]"
          >
            Continuar para minha análise personalizada →
          </button>
        </div>
      </div>
    </section>
  );
}

function Index() {
  const [stage, setStage] = useState<Stage>("hero");
  const [answers2, setAnswers2] = useState<string[]>([]);
  const [vsl2Seconds, setVsl2Seconds] = useState(0);
  const VSL2_UNLOCK = 60;
  const vsl2Unlocked = vsl2Seconds >= VSL2_UNLOCK;
  const vsl2BtnRef = useRef<HTMLDivElement | null>(null);

  // When a VSL unlock happens, gently scroll the CTA into view so the lead
  // never has to hunt for the next step.
  useEffect(() => {
    if (vsl2Unlocked && vsl2BtnRef.current) {
      vsl2BtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [vsl2Unlocked]);

  useEffect(() => {
    trackEvent("ViewContent", {
      content_name: "Garrafada Natural para Diabetes",
      content_category: "Sales Page",
      currency: "BRL",
      value: 14.99,
    });
  }, []);

  // Single-view flow: sempre iniciar cada etapa no topo da tela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [stage]);

  // Reset video unlock counter when leaving VSL2
  useEffect(() => {
    if (stage !== "vsl2") setVsl2Seconds(0);
  }, [stage]);

  // Loading -> result
  useEffect(() => {
    if (stage !== "loading") return;
    const t = setTimeout(() => {
      trackEvent("Lead", {
        content_name: "Garrafada Natural para Diabetes",
        quiz_answers: answers2,
      });
      setStage("result");
    }, 3500);
    return () => clearTimeout(t);
  }, [stage, answers2]);

  const perfil = useMemo(() => {
    const idade = answers2[0] ?? "";
    const tempo = answers2[1] ?? "";
    const fe = answers2[4] ?? "";
    let chance = 87;
    if (fe.includes("dúvidas")) chance = 78;
    if (fe.includes("acreditar")) chance = 84;
    if (fe.includes("fé")) chance = 92;
    return {
      label: `Adulto ${idade || "diabético"} — ${tempo || "há algum tempo"}`,
      chance,
    };
  }, [answers2]);

  return (
    <main className="min-h-[100svh] w-full bg-white text-foreground">
      {/* HERO */}
      {stage === "hero" && (
      <section className="min-h-[100svh] w-full bg-gradient-to-b from-[oklch(0.98_0.02_150)] to-white px-5 py-6 flex items-center">
        <div className="mx-auto w-full max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-3 py-1 text-xs md:text-sm font-semibold text-[oklch(0.30_0.10_150)]">
            🌿 100% Natural • Feito no Brasil
          </span>
          <h1 className="mt-3 text-2xl md:text-4xl font-extrabold leading-tight text-foreground">
            Você está cansado(a) de viver{" "}
            <span className="text-[oklch(0.58_0.22_27)]">
              refém da diabetes?
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Faça o teste gratuito agora e descubra como a{" "}
            <strong className="text-foreground">Garrafada Natural</strong> pode
            te ajudar a recuperar o controle da sua saúde e ter mais qualidade
            de vida.
          </p>

          <div className="mt-4 flex justify-center">
            <img
              src={heroAsset.url}
              alt="Senhora satisfeita segurando a Garrafada Natural"
              className="w-full max-w-[240px] md:max-w-xs rounded-3xl shadow-xl object-cover"
            />
          </div>

          <button
            onClick={() => {
              trackEvent("CTAClick", { cta: "hero_start_quiz" });
              setStage("quiz1");
            }}
            className="mt-5 w-full max-w-xl rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-4 md:py-5 text-lg md:text-xl font-extrabold uppercase text-white shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
          >
            ✅ Fazer o teste grátis agora
          </button>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground">
            Leva menos de 1 minuto • Totalmente gratuito
          </p>
        </div>
      </section>
      )}

      {/* QUIZ 1 */}
      {stage === "quiz1" && (
        <Quiz
          id="quiz_dores"
          title="Como a diabetes está afetando sua vida?"
          subtitle="Responda com carinho, é rapidinho."
          questions={QUIZ_1}
          onDone={() => setStage("feedbacks")}
        />
      )}

      {/* FEEDBACKS */}
      {stage === "feedbacks" && <Feedbacks onContinue={() => setStage("quiz2")} />}

      {/* QUIZ 2 */}
      {stage === "quiz2" && (
        <Quiz
          id="quiz_perfil"
          title="Vamos descobrir como a Garrafada pode te ajudar"
          subtitle="Responda para liberar seu resultado personalizado"
          questions={QUIZ_2}
          onDone={(a) => {
            setAnswers2(a);
            setStage("loading");
          }}
        />
      )}

      {/* LOADING */}
      {stage === "loading" && (
        <section className="w-full bg-white px-5 py-20">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[oklch(0.93_0.06_150)] border-t-primary" />
            <h2 className="mt-6 text-2xl md:text-3xl font-bold text-foreground">
              Analisando seu perfil...
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Aguarde só um instante enquanto preparamos seu resultado
              personalizado.
            </p>
          </div>
        </section>
      )}

      {/* RESULT */}
      {stage === "result" && (
        <section className="w-full bg-white px-5 py-14">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border-2 border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-7 md:p-10 shadow-md text-center">
              <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-4 py-1.5 text-sm md:text-base font-bold text-[oklch(0.30_0.10_150)]">
                ✔ Resultado personalizado
              </span>
              <h2 className="mt-4 text-2xl md:text-4xl font-extrabold text-foreground">
                Seu Perfil:{" "}
                <span className="text-primary">{perfil.label}</span>
              </h2>
              <p className="mt-6 text-xl md:text-2xl font-semibold text-foreground">
                Sua chance estimada de obter os mesmos resultados:
              </p>
              <p className="mt-2 text-5xl md:text-6xl font-extrabold text-[oklch(0.52_0.14_150)]">
                {perfil.chance}%
              </p>

              <p className="mt-6 text-lg md:text-xl leading-relaxed text-muted-foreground">
                Pessoas com o seu perfil estão tendo{" "}
                <strong className="text-foreground">
                  excelentes resultados
                </strong>{" "}
                com a Garrafada Natural. Você também pode voltar a ter{" "}
                <strong className="text-foreground">mais energia</strong>,{" "}
                <strong className="text-foreground">menos preocupação</strong>{" "}
                e{" "}
                <strong className="text-foreground">
                  mais qualidade de vida
                </strong>
                .
              </p>

              <button
                onClick={() => {
                  trackEvent("CTAClick", { cta: "result_to_vsl2" });
                  setStage("vsl2");
                }}
                className="mt-8 w-full rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-6 text-lg md:text-2xl font-extrabold uppercase text-white shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
              >
                🌿 Quero minha Garrafada Natural agora
              </button>
            </div>
          </div>
        </section>
      )}

      {/* VSL 2 + Preço */}
      {stage === "vsl2" && (
        <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl md:text-3xl font-bold text-foreground">
              A criadora da Garrafada explica tudo sobre o produto
            </h2>
            <div className="mt-4">
              <VSL
                videoId={VIDEO_ID_2}
                label="vsl_criadora"
                onTime={(s) => setVsl2Seconds((prev) => (s > prev ? s : prev))}
              />
            </div>

            {/* Persuasive copy — always visible, deepens desire while user watches */}
            <div className="mx-auto mt-10 max-w-xl space-y-5 text-left">
              <div className="rounded-2xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-extrabold text-foreground">
                  🌿 Por que essa receita funciona?
                </h3>
                <p className="mt-3 text-base md:text-lg leading-relaxed text-foreground">
                  A fórmula age diretamente no{" "}
                  <strong>pâncreas — o órgão responsável por produzir insulina</strong>.
                  Quando ele volta a funcionar bem, o corpo passa a controlar a
                  glicose de forma natural, você sente{" "}
                  <strong>mais energia</strong>,{" "}
                  <strong>menos cansaço</strong> e a{" "}
                  <strong>sede constante desaparece</strong>.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[oklch(0.88_0.10_27)] bg-[oklch(0.98_0.03_27)] p-6 shadow-sm">
                <h3 className="text-xl md:text-2xl font-extrabold text-[oklch(0.45_0.20_27)]">
                  ⚠️ Não deixe chegar ao pior
                </h3>
                <p className="mt-3 text-base md:text-lg leading-relaxed text-foreground">
                  Durante anos trabalhando dentro de hospitais e postos de saúde,
                  a criadora viu de perto o que a diabetes descontrolada faz:{" "}
                  <strong>pessoas perdendo a visão</strong>,{" "}
                  <strong>amputando pés e pernas</strong>, familiares chorando
                  na porta do centro cirúrgico. Isso pode ser evitado — e começa
                  cuidando do pâncreas <em>hoje</em>.
                </p>
              </div>

              <div className="rounded-2xl bg-[oklch(0.30_0.10_150)] p-6 text-center shadow-md">
                <p className="text-base md:text-lg font-semibold text-white/90">
                  Tudo isso por menos que uma pizza:
                </p>
                <div className="mt-2 flex items-baseline justify-center gap-3">
                  <span className="text-xl text-white/60 line-through">R$ 49,90</span>
                  <span className="text-4xl md:text-5xl font-extrabold text-white">
                    R$ 14,99
                  </span>
                </div>
                <p className="mt-2 text-sm md:text-base text-white/80">
                  Pagamento único • Garantia de 7 dias
                </p>
              </div>
            </div>

            {vsl2Unlocked ? (
              <div ref={vsl2BtnRef} className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-3 inline-block rounded-full bg-[oklch(0.58_0.22_27)] px-4 py-1.5 text-sm md:text-base font-bold text-white shadow-md animate-pulse">
                  ✅ Sua oferta foi liberada — clique abaixo
                </div>
                <button
                  onClick={() => {
                    trackEvent("CTAClick", { cta: "vsl2_to_checkout", watched_seconds: Math.round(vsl2Seconds) });
                    setStage("checkout");
                  }}
                  className="w-full rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-6 text-lg md:text-2xl font-extrabold uppercase text-white shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
                >
                  Quero garantir a minha agora →
                </button>
              </div>
            ) : (
              <p className="mt-6 text-base md:text-lg text-muted-foreground">
                🎥 Continue assistindo — sua oferta será liberada em instantes.
              </p>
            )}
          </div>
        </section>
      )}

      {/* CHECKOUT */}
      {stage === "checkout" && (
        <section className="w-full bg-white px-5 py-14">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border-2 border-[oklch(0.90_0.03_150)] bg-white p-6 md:p-10 shadow-lg">
              <div className="flex flex-col items-center gap-5 text-center">
                <img
                  src={receitaAsset.url}
                  alt="Receita natural para auxílio ao controle da glicemia"
                  width={1080}
                  height={1080}
                  loading="lazy"
                  className="w-full max-w-md rounded-2xl object-cover shadow-md"
                />
                <h2 className="text-2xl md:text-4xl font-extrabold text-foreground">
                  Garrafada Natural para Diabetes
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Fórmula 100% natural para te ajudar a recuperar o controle,
                  mais energia e mais qualidade de vida.
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl text-muted-foreground line-through">
                    R$ 49,90
                  </span>
                  <span className="text-5xl md:text-6xl font-extrabold text-[oklch(0.58_0.22_27)]">
                    R$ 14,99
                  </span>
                </div>

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
                      source: "checkout_section",
                    })
                  }
                  className="w-full rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-6 text-center text-xl md:text-2xl font-extrabold uppercase text-white shadow-xl ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
                >
                  Comprar agora por apenas R$ 14,99
                </a>

                <div className="grid w-full grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-4 text-center">
                    <p className="text-2xl">🔒</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      Compra segura
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ambiente 100% protegido
                    </p>
                  </div>
                  <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-4 text-center">
                    <p className="text-2xl">💚</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      Garantia de 7 dias
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Satisfação ou reembolso
                    </p>
                  </div>
                  <div className="rounded-xl border border-[oklch(0.90_0.03_150)] bg-[oklch(0.99_0.01_150)] p-4 text-center">
                    <p className="text-2xl">🚚</p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      Entrega rápida
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Para todo o Brasil
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-[oklch(0.90_0.03_150)] bg-white px-5 py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Garrafada Natural — Este produto não
          substitui o acompanhamento médico.
        </p>
      </footer>
    </main>
  );
}
