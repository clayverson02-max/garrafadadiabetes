import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import heroImg from "@/assets/hero-idosa.jpg";
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg" style={{ aspectRatio: "9/16", maxWidth: 380, margin: "0 auto" }}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
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
    q: "Há quanto tempo você tem diabetes?",
    options: ["Menos de 1 ano", "1 a 5 anos", "Mais de 5 anos"],
  },
  {
    q: "Você toma remédios ou insulina diariamente?",
    options: ["Sim", "Às vezes", "Não"],
  },
  {
    q: "Qual seu maior incômodo atualmente?",
    options: [
      "Cansaço",
      "Medo de complicações",
      "Glicose descontrolada",
      "Dificuldade na alimentação",
    ],
  },
  {
    q: "Você acredita que uma solução natural pode te ajudar?",
    options: ["Sim, tenho fé", "Quero acreditar", "Ainda tenho dúvidas"],
  },
  {
    q: "Você está disposto(a) a experimentar por 30 dias?",
    options: ["Sim, com certeza", "Provavelmente sim"],
  },
] as const;

const CHECKOUT_URL = "https://pay.kiwify.com.br/J5FFtog";

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

function FloatingCTA() {
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
          source: "floating_cta",
        })
      }
      className="fixed inset-x-3 bottom-3 z-50 mx-auto block max-w-xl rounded-2xl bg-[oklch(0.58_0.22_27)] px-5 py-4 text-center text-lg md:text-xl font-extrabold uppercase tracking-wide text-white shadow-2xl ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.99]"
    >
      🛒 Comprar agora por apenas R$ 14,99
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type Stage =
  | "hero"
  | "quiz1"
  | "vsl1"
  | "quiz2"
  | "loading"
  | "result"
  | "vsl2"
  | "checkout";

const VIDEO_ID = "0w0Ispl9q3Q";
const VIDEO_ID_2 = "kDT8CZakXVc";

function Index() {
  const [stage, setStage] = useState<Stage>("hero");
  const [answers2, setAnswers2] = useState<string[]>([]);
  const [vsl1Seconds, setVsl1Seconds] = useState(0);
  const [vsl2Seconds, setVsl2Seconds] = useState(0);
  const VSL1_UNLOCK = 40;
  const VSL2_UNLOCK = 60;
  const vsl1Unlocked = vsl1Seconds >= VSL1_UNLOCK;
  const vsl2Unlocked = vsl2Seconds >= VSL2_UNLOCK;

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

  // Reset video unlock counters when leaving a VSL stage
  useEffect(() => {
    if (stage !== "vsl1") setVsl1Seconds(0);
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
    <main className="min-h-screen w-full bg-white text-foreground pb-28">
      {/* HERO */}
      {stage === "hero" && (
      <section className="w-full bg-gradient-to-b from-[oklch(0.98_0.02_150)] to-white px-5 pt-10 pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[oklch(0.93_0.06_150)] px-4 py-1.5 text-sm md:text-base font-semibold text-[oklch(0.30_0.10_150)]">
            🌿 100% Natural • Feito no Brasil
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
            Você está cansado(a) de viver{" "}
            <span className="text-[oklch(0.58_0.22_27)]">
              refém da diabetes?
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg md:text-2xl text-muted-foreground leading-relaxed">
            Faça o teste gratuito agora e descubra como a{" "}
            <strong className="text-foreground">Garrafada Natural</strong> pode
            te ajudar a recuperar o controle da sua saúde e ter mais qualidade
            de vida.
          </p>

          <div className="mt-8 flex justify-center">
            <img
              src={heroImg}
              alt="Senhora sorrindo, feliz e saudável, com um copo de chá natural"
              width={1024}
              height={1024}
              className="w-full max-w-md rounded-3xl shadow-xl object-cover"
            />
          </div>

          <button
            onClick={() => {
              trackEvent("CTAClick", { cta: "hero_start_quiz" });
              setStage("quiz1");
            }}
            className="mt-8 w-full max-w-xl rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-6 text-xl md:text-2xl font-extrabold uppercase text-white shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
          >
            ✅ Fazer o teste grátis agora
          </button>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
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
          onDone={() => setStage("vsl1")}
        />
      )}

      {/* VSL 1 */}
      {stage === "vsl1" && (
        <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Veja o que está acontecendo com quem já está usando a Garrafada
              Natural...
            </h2>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              Milhares de pessoas estão reconquistando a saúde e a
              tranquilidade. Assista ao depoimento:
            </p>
            <div className="mt-8">
              <VSL videoId={VIDEO_ID} label="vsl_depoimento" />
            </div>
            <button
                onClick={() => {
                  trackEvent("CTAClick", { cta: "vsl1_continue" });
                  setStage("quiz2");
                }}
                className="mt-8 w-full max-w-xl rounded-2xl bg-primary px-6 py-5 text-lg md:text-xl font-extrabold uppercase text-primary-foreground shadow-lg transition hover:bg-[oklch(0.44_0.14_150)] active:scale-[0.98]"
              >
                Continuar para análise do meu perfil →
              </button>
          </div>
        </section>
      )}

      {/* QUIZ 2 */}
      {stage === "quiz2" && (
        <Quiz
          id="quiz_perfil"
          title="Vamos analisar seu perfil"
          subtitle="Responda essas perguntas para vermos suas chances reais de melhorar"
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
        <section className="w-full bg-[oklch(0.98_0.02_150)] px-5 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              A criadora da Garrafada explica tudo sobre o produto
            </h2>
            <div className="mt-8">
              <VSL videoId={VIDEO_ID_2} label="vsl_criadora" />
            </div>
            <p className="mx-auto mt-8 max-w-xl text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
              Por apenas{" "}
              <span className="text-[oklch(0.58_0.22_27)] font-extrabold">
                R$ 14,99
              </span>{" "}
              você leva a fórmula natural poderosa que já está mudando a vida de
              muitas pessoas.
            </p>

            <button
              onClick={() => {
                trackEvent("CTAClick", { cta: "vsl2_to_checkout" });
                setStage("checkout");
              }}
              className="mt-8 w-full rounded-2xl bg-[oklch(0.58_0.22_27)] px-6 py-6 text-lg md:text-2xl font-extrabold uppercase text-white shadow-lg ring-2 ring-white transition hover:bg-[oklch(0.52_0.22_27)] active:scale-[0.98]"
            >
              Ver oferta e garantir a minha →
            </button>
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

      {stage === "quiz2" && <FloatingCTA />}
    </main>
  );
}
