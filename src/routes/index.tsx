import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Printer,
  Scissors,
} from "lucide-react";
import "./alphabet.css";
import { OFFER } from "../lib/offer";
import { trackMarketing } from "../lib/marketing";

const price = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: OFFER.currency,
  currencyDisplay: "code",
}).format(OFFER.price);
const media = "/alphabet/";
const samples = [
  {
    src: "activity-sheets.webp",
    alt: "Alphabet sheets with uppercase and lowercase letters, tracing and pictures",
    label: "Letter activity sheets",
  },
  {
    src: "trace-cards.webp",
    alt: "Colourful letter tracing cards with pictures and formation arrows",
    label: "Tracing cards",
  },
  {
    src: "writing-strips.webp",
    alt: "Read, trace and write practice strips",
    label: "Writing practice",
  },
  {
    src: "letter-puzzles.webp",
    alt: "Colourful letter building lowercase letter puzzles",
    label: "Letter puzzles",
  },
  {
    src: "workbook-pages.webp",
    alt: "Workbook examples with colouring, sentence tracing and a letter puzzle",
    label: "Inside the activities",
  },
  {
    src: "matching-pages.webp",
    alt: "Examples of letter matching, word search and writing activities",
    label: "More ways to practise",
  },
  {
    src: "writing-demo-poster.webp",
    alt: "Watch a writing activity demonstration",
    label: "Watch demonstration",
    video: "writing-demo.mp4",
  },
];
const included = [
  [
    "01",
    "Trace the letters",
    "Clear tracing guides help children practise each letter.",
    "trace-cards.webp",
  ],
  [
    "02",
    "Read, trace & write",
    "Start with a letter, then try a word or a short sentence.",
    "writing-strips.webp",
  ],
  [
    "03",
    "Colour & explore",
    "Add some colouring when your learners need a change.",
    "workbook-pages.webp",
  ],
  [
    "04",
    "Match, find & build",
    "Match letters, find them in a search or put a puzzle together.",
    "letter-puzzles.webp",
  ],
];
const faqs = [
  [
    "Is this a physical product?",
    "No. This is a digital bundle of printable activities. No books, stationery or other physical items are shipped. You print the pages you want to use.",
  ],
  [
    "Who are these activities for?",
    "Teachers, tutors and families supporting children who are practising letter recognition, letter formation and early writing. Choose activities by the learner’s current skills, rather than age alone.",
  ],
  [
    "Is this a complete phonics programme?",
    "No. These are supplementary alphabet and writing activities. They are not a complete systematic phonics programme or an assessment, and should be used alongside appropriate teaching.",
  ],
  [
    "How do I receive the bundle?",
    "After payment is approved, follow the access instructions supplied by Hotmart to open your digital materials. Keep the email address used at checkout available.",
  ],
  [
    "Do I need special equipment?",
    "You will need a device to open the files and access to a printer. Some activities also use pencils or crayons. Cutting puzzles require scissors and appropriate adult supervision.",
  ],
  [
    "Is this a subscription?",
    "No. The listed price is a single payment in Canadian dollars. Any applicable taxes and the final amount are shown by Hotmart before you confirm payment.",
  ],
  [
    "What are the refund terms?",
    "The applicable refund period and the process for requesting a refund will be displayed on the Hotmart payment page and your order. Check those terms before purchasing.",
  ],
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: OFFER.currency,
    currencyDisplay: "code",
  }).format(value);
const OfferContext = createContext({ active: false, activate: () => {}, beginCheckout: () => {} });
const CheckoutContext = createContext<ReactNode>(null);
function CheckoutPanel() {
  return useContext(CheckoutContext);
}
const couponKey = "alphabet-launch-offer-v1";
function OfferFlow({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(OFFER.checkoutUrl);
  const dialog = useRef<HTMLDialogElement>(null);
  const began = useRef(false);
  useEffect(() => {
    const url = new URL(OFFER.checkoutUrl);
    new URLSearchParams(window.location.search).forEach((value, key) => {
      if (
        /^utm_(source|medium|campaign|content|term|id)$/.test(key) ||
        ["src", "sck", "fbclid"].includes(key)
      )
        url.searchParams.set(key, value);
    });
    setCheckoutUrl(url.toString());
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(couponKey);
    } catch {
      /* Shopping works without browser storage. */
    }
    if (saved === "active") {
      setActive(true);
      setCheckout(true);
    }
    if (saved) return;
    const timer = window.setTimeout(() => dialog.current?.showModal(), 2000);
    return () => window.clearTimeout(timer);
  }, []);
  const remember = (value: string) => {
    try {
      sessionStorage.setItem(couponKey, value);
    } catch {
      /* Optional persistence. */
    }
  };
  const activate = () => {
    setActive(true);
    setCheckout(true);
    remember("active");
    dialog.current?.close();
  };
  const beginCheckout = () => {
    activate();
    if (!began.current) {
      trackMarketing("InitiateCheckout");
      began.current = true;
    }
    requestAnimationFrame(() =>
      document.getElementById("checkout")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      }),
    );
  };
  const checkoutPanel = (
    <section className="ab-checkout ab-wrap" id="checkout" aria-labelledby="checkout-title">
      <div>
        <p className="ab-eyebrow">YOUR ORDER</p>
        <h2 id="checkout-title">Make your next lesson easier.</h2>
        <p>Your digital bundle. One payment. Checkout handled by Hotmart.</p>
      </div>
      {checkout ? (
        <>
          <iframe
            title="Secure Hotmart checkout for Alphabet Activity Bundle"
            src={checkoutUrl}
            allow="payment *; clipboard-write"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <p className="ab-fine">
            If checkout does not load,{" "}
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!began.current) {
                  trackMarketing("InitiateCheckout");
                  began.current = true;
                }
              }}
            >
              open the secure Hotmart payment page
            </a>
            . Confirm the final currency, total and terms before paying.
          </p>
        </>
      ) : (
        <button className="ab-buy" onClick={beginCheckout}>
          Activate offer & open checkout <ArrowRight size={20} />
        </button>
      )}
    </section>
  );
  return (
    <OfferContext.Provider value={{ active, activate, beginCheckout }}>
      <CheckoutContext.Provider value={checkoutPanel}>{children}</CheckoutContext.Provider>
      <dialog
        ref={dialog}
        className="ab-coupon"
        aria-labelledby="launch-offer-title"
        onCancel={() => remember("dismissed")}
        onClose={() => {
          if (!active) remember("dismissed");
        }}
      >
        <button
          className="ab-coupon-close"
          aria-label="Close offer"
          onClick={() => {
            remember("dismissed");
            dialog.current?.close();
          }}
        >
          ×
        </button>
        <p className="ab-eyebrow">YOUR LAUNCH OFFER</p>
        <span className="ab-coupon-icon" aria-hidden="true">
          abc
        </span>
        <h2 id="launch-offer-title">
          Less prep.
          <br />A little extra savings.
        </h2>
        <p>Activate the launch price for your Alphabet Activity Bundle.</p>
        <div className="ab-coupon-prices">
          <span>
            Bundle reference value <s>{formatPrice(OFFER.referencePrice)}</s>
          </span>
          <strong>{price}</strong>
          <span>Canadian dollars · One payment</span>
        </div>
        <button className="ab-buy" onClick={activate}>
          Activate my launch offer <Check size={20} />
        </button>
        <p className="ab-fine">
          This activates the offer shown on this page. The price and any taxes at Hotmart are
          confirmed before payment.
        </p>
        <button
          className="ab-coupon-dismiss"
          onClick={() => {
            remember("dismissed");
            dialog.current?.close();
          }}
        >
          Keep exploring the activities
        </button>
      </dialog>
    </OfferContext.Provider>
  );
}
function PriceBlock() {
  const { active, activate } = useContext(OfferContext);
  return (
    <div className="ab-product-price" aria-live="polite">
      {active ? (
        <>
          <span className="ab-reference">
            Bundle reference value <s>{formatPrice(OFFER.referencePrice)}</s>
          </span>
          <strong>{price}</strong>
          <span className="ab-activated">
            <Check size={15} /> Launch offer activated
          </span>
        </>
      ) : (
        <>
          <span>Bundle reference value</span>
          <strong>{formatPrice(OFFER.referencePrice)}</strong>
          <button className="ab-activate" onClick={activate}>
            Activate launch offer
          </button>
        </>
      )}
      <span>Canadian dollars · Pay once · No subscription</span>
    </div>
  );
}
function PurchaseButton() {
  const { beginCheckout } = useContext(OfferContext);
  return (
    <button className="ab-buy" onClick={beginCheckout}>
      Get my activity bundle <ArrowRight size={20} />
    </button>
  );
}
function ActivityReel() {
  return (
    <div className="ab-reel" aria-label="Explore the activities in your bundle">
      <div className="ab-reel-track">
        {[0, 1].map((repeat) => (
          <div className="ab-reel-group" key={repeat} aria-hidden={repeat === 1 ? true : undefined}>
            {samples.slice(0, 6).map((sample) => (
              <figure key={sample.src}>
                <img
                  src={media + sample.src}
                  alt={repeat ? "" : sample.alt}
                  width="180"
                  height="180"
                  loading="lazy"
                />
                <figcaption>{sample.label}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function Gallery() {
  const [selected, setSelected] = useState(0);
  const current = samples[selected];
  const move = (step: number) =>
    setSelected((value) => (value + step + samples.length) % samples.length);
  return (
    <div className="ab-gallery">
      <figure className="ab-gallery-main">
        {"video" in current ? (
          <video
            key={current.video}
            controls
            playsInline
            preload="none"
            poster={media + current.src}
            aria-label={current.alt}
          >
            <source src={media + current.video} type="video/mp4" />
          </video>
        ) : (
          <img
            src={media + current.src}
            alt={current.alt}
            width="1100"
            height="1100"
            fetchPriority="high"
          />
        )}
        <figcaption>{current.label}</figcaption>
        <div className="ab-gallery-controls">
          <button aria-label="Previous sample" onClick={() => move(-1)}>
            <ChevronLeft size={20} />
          </button>
          <span aria-live="polite">
            {selected + 1} / {samples.length}
          </span>
          <button aria-label="Next sample" onClick={() => move(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </figure>
      <div className="ab-thumbnails" aria-label="Product samples">
        {samples.map((sample, index) => (
          <button
            key={sample.src}
            aria-label={`Show ${sample.label}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <img src={media + sample.src} alt="" width="80" height="80" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
function ActivityPreview({ kind }: { kind: "pages" | "formation" }) {
  const pages = kind === "pages";
  const file = pages ? "alphabet-pages-preview" : "letter-formation-preview";
  const title = pages ? "Take a look beyond the cover." : "See the letter practice up close.";
  return (
    <section
      className={`ab-section ab-wrap ab-activity-preview${pages ? "" : " ab-activity-preview-reverse"}`}
      aria-labelledby={`preview-${kind}-title`}
    >
      <div className="ab-activity-preview-copy">
        <p className="ab-eyebrow">{pages ? "A QUICK LOOK INSIDE" : "BEFORE YOU CHOOSE"}</p>
        <h2 id={`preview-${kind}-title`}>{title}</h2>
        <p>
          {pages
            ? "See the pages and hands-on activities in this short preview. Less guessing about what you’re getting. More ideas for your next lesson."
            : "A closer look at letter tracing and formation. Choose a page that fits your learners and make it part of your next lesson."}
        </p>
        <span className="ab-video-note">Short activity preview · No sound</span>
        {!pages && (
          <a className="ab-preview-link" href="#offer">
            Explore the bundle offer <ArrowDown size={16} />
          </a>
        )}
      </div>
      <figure className="ab-activity-preview-player">
        <video
          controls
          playsInline
          muted
          preload="none"
          poster={`${media}${file}.webp`}
          width="480"
          height={pages ? "800" : "816"}
          aria-label={
            pages
              ? "Preview of alphabet workbook pages and a colouring activity"
              : "Preview of letter formation and tracing worksheets"
          }
          onPlay={(event) => {
            const current = event.currentTarget;
            document.querySelectorAll<HTMLVideoElement>(".ab-page video").forEach((video) => {
              if (video !== current) video.pause();
            });
          }}
        >
          <source src={`${media}${file}.mp4`} type="video/mp4" />
          Your browser does not support this video.
        </video>
        <figcaption>
          {pages ? "Alphabet activity pages in use" : "Letter formation and tracing examples"}
        </figcaption>
      </figure>
    </section>
  );
}

export const Route = createFileRoute("/")({ component: AlphabetPage });
function AlphabetPage() {
  return (
    <OfferFlow>
      <main className="ab-page">
        <div className="ab-delivery">
          <Download size={14} /> Digital download · Print at home or school · No physical delivery
        </div>
        <header className="ab-header ab-wrap">
          <a className="ab-wordmark" href="#">
            <span aria-hidden="true">
              a<span>b</span>c
            </span>
            Alphabet Activity Bundle
          </a>
          <a className="ab-header-link" href="#inside">
            See what’s inside <ArrowDown size={15} />
          </a>
        </header>
        <section className="ab-product ab-wrap" aria-labelledby="product-title">
          <Gallery />
          <div className="ab-product-copy">
            <p className="ab-eyebrow">LESS PREP. MORE LETTER PRACTICE.</p>
            <h1 id="product-title">
              Alphabet
              <br />
              <span>Activity Bundle</span>
            </h1>
            <p className="ab-lead">
              Your next letter activity is ready to print. Choose tracing, writing, colouring or a
              puzzle and give yourself one less thing to prepare.
            </p>
            <div className="ab-tags">
              <span>Tracing & writing</span>
              <span>Colouring & puzzles</span>
              <span>Digital files</span>
            </div>
            <ul className="ab-benefits">
              <li>
                <Check />
                Tracing, writing, colouring and puzzles.
              </li>
              <li>
                <Check />
                Real activity samples you can open.
              </li>
              <li>
                <Check />
                Print the pages you need for your lesson.
              </li>
            </ul>
            <PriceBlock />
            <PurchaseButton />
            <a className="ab-preview-link" href="#inside">
              See everything inside <ArrowDown size={16} />
            </a>
            <p className="ab-fine">
              Printable resources, not a physical workbook. Stationery shown in the photos is not
              included.
            </p>
          </div>
        </section>
        <ActivityReel />
        <div className="ab-proof-strip">
          <div className="ab-wrap">
            <span>
              <FileText /> Actual activity previews
            </span>
            <span>
              <Printer /> Choose your pages
            </span>
            <span>
              <Scissors /> Practical letter activities
            </span>
          </div>
        </div>
        <section className="ab-section ab-wrap" id="inside">
          <div className="ab-section-heading">
            <div>
              <p className="ab-eyebrow">OPEN THE BUNDLE</p>
              <h2>What’s in the bundle?</h2>
            </div>
            <p>Here are some of the pages you can use in your next lesson.</p>
          </div>
          <div className="ab-included">
            {included.map(([number, title, text, src]) => (
              <article key={number}>
                <div className="ab-feature-photo">
                  <img
                    src={media + src}
                    alt={title + " activity example"}
                    width="600"
                    height="600"
                    loading="lazy"
                  />
                </div>
                <div className="ab-feature-copy">
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <ActivityPreview kind="pages" />
        <section className="ab-section ab-wrap ab-demo">
          <div>
            <p className="ab-eyebrow">A CLOSER LOOK</p>
            <h2>
              See writing practice
              <br />
              in action.
            </h2>
            <p>
              A short demonstration of a read, trace and write activity. Choose the level and
              support that suit your learners.
            </p>
          </div>
          <video
            controls
            playsInline
            preload="none"
            poster="/alphabet/writing-demo-poster.webp"
            width="464"
            height="816"
            aria-label="Demonstration of a child practising writing"
          >
            <source src="/alphabet/writing-demo.mp4" type="video/mp4" />
            Your browser does not support this video.
          </video>
        </section>
        <section className="ab-how">
          <div className="ab-wrap">
            <p className="ab-eyebrow">KEEP PREPARATION SIMPLE</p>
            <h2>Choose. Print. Practise.</h2>
            <ol>
              <li>
                <span>1</span>
                <h3>Choose a focus</h3>
                <p>Pick the activity that suits your learners’ current skills.</p>
              </li>
              <li>
                <span>2</span>
                <h3>Print your pages</h3>
                <p>Check your print preview and prepare the supplies for that task.</p>
              </li>
              <li>
                <span>3</span>
                <h3>Make it practical</h3>
                <p>Trace, write, colour or build with the support your learners need.</p>
              </li>
            </ol>
          </div>
        </section>
        <section className="ab-section ab-wrap ab-samples" id="samples">
          <div className="ab-section-heading">
            <div>
              <p className="ab-eyebrow">LOOK BEFORE YOU BUY</p>
              <h2>See the actual page style.</h2>
            </div>
            <p>
              Open a sample for a closer look. Explore the layout and activities before you buy.
            </p>
          </div>
          <div className="ab-open-samples">
            {[
              { file: "sample-tracing.webp", name: "Letter formation" },
              { file: "sample-dot.webp", name: "Uppercase & lowercase" },
              { file: "sample-colouring.webp", name: "Colouring & tracing" },
            ].map((s) => (
              <a key={s.file} href={media + s.file} target="_blank" rel="noopener noreferrer">
                <img
                  src={media + s.file}
                  alt={s.name + " sample page"}
                  width="400"
                  height="530"
                  loading="lazy"
                />
                <span>
                  {s.name}
                  <span aria-hidden="true"> ↗</span>
                </span>
              </a>
            ))}
          </div>
        </section>
        <ActivityPreview kind="formation" />
        <section id="offer" className="ab-offer-section">
          <div className="ab-offer ab-wrap">
            <div className="ab-offer-visual">
              <img
                src={media + "cover.webp"}
                alt="Alphabet Activity Bundle with tracing, writing, colouring and puzzle examples"
                width="900"
                height="900"
                loading="lazy"
              />
            </div>
            <div className="ab-offer-copy">
              <p className="ab-eyebrow">YOUR NEXT LESSON STARTS HERE</p>
              <h2>
                Have your next alphabet
                <br />
                activity ready.
              </h2>
              <p>Have your next activity ready without making another worksheet from scratch.</p>
              <ul>
                {[
                  "Letter activity sheets and tracing cards",
                  "Read, trace and write practice",
                  "Colouring and letter puzzles",
                  "Matching and letter-finding activities",
                ].map((t) => (
                  <li key={t}>
                    <Check size={18} />
                    {t}
                  </li>
                ))}
              </ul>
              <PriceBlock />
              <PurchaseButton />
              {!OFFER.checkoutUrl && (
                <p id="checkout-status" className="ab-fine">
                  Purchases open soon. Online checkout is being prepared.
                </p>
              )}
              <p className="ab-fine">
                Digital resources only. Final charges and access terms are shown at checkout.
              </p>
            </div>
          </div>
        </section>
        <CheckoutPanel />
        <section className="ab-section ab-wrap ab-faq">
          <div>
            <p className="ab-eyebrow">A FEW USEFUL ANSWERS</p>
            <h2>Before you print.</h2>
            <p>A few things worth knowing before you order.</p>
          </div>
          <div>
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <footer className="ab-footer">
          <div className="ab-wrap">
            <strong>Alphabet Activity Bundle</strong>
            <p>
              Digital printable resources. No physical products are shipped. Supplementary
              activities, not a complete phonics curriculum. Learning experiences vary with each
              learner and the teaching provided.
            </p>
            <button
              className="ab-preferences"
              onClick={() => window.dispatchEvent(new Event("alphabet-ad-preferences"))}
            >
              Advertising preferences
            </button>
            <small>
              © {new Date().getFullYear()} Alphabet Activity Bundle. Product artwork remains
              credited to its respective creators.
            </small>
          </div>
        </footer>
      </main>
    </OfferFlow>
  );
}
