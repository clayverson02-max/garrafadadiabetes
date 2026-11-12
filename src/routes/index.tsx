import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  PencilLine,
  Play,
  Printer,
  Puzzle,
  ShieldCheck,
  X,
} from "lucide-react";
import { CustomerReviews } from "../components/CustomerReviews";
import { AdvertisingConsent } from "../components/AdvertisingConsent";
import { AlphabetProductGallery } from "../components/AlphabetProductGallery";
import { AlphabetPreviewVideo } from "../components/AlphabetPreviewVideo";
import { OFFER } from "../lib/offer";
import { checkoutUrlForSearch } from "../lib/checkout-url";
import { trackMarketing } from "../lib/marketing";
import "./alphabet.css";

const money = (amount: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: OFFER.currency,
    currencyDisplay: "code",
  }).format(amount);
const media = "/alphabet/";
const activities = [
  {
    name: "Trace",
    icon: PencilLine,
    title: "Start with the shape of a letter.",
    text: "Letter cards and tracing pages give your learners a clear place to begin.",
    image: "trace-cards.webp",
    sample: "sample-tracing.webp",
    alt: "Colourful letter tracing cards with formation guides",
    tags: ["Letter formation", "Uppercase & lowercase"],
  },
  {
    name: "Write",
    icon: FileText,
    title: "Read it. Trace it. Have a go.",
    text: "Choose writing strips, words or short sentences to suit the practice your learners need.",
    image: "writing-strips.webp",
    sample: "writing-strips.webp",
    alt: "Read, trace and write activity strips with a blue marker",
    tags: ["Writing strips", "Word & sentence practice"],
  },
  {
    name: "Colour",
    icon: PencilLine,
    title: "Bring a little colour to letter time.",
    text: "Add a colouring page when you want a different way to explore the letter you’re working on.",
    image: "workbook-pages.webp",
    sample: "sample-colouring.webp",
    alt: "Examples of colouring, tracing and alphabet workbook pages",
    tags: ["Colouring pages", "Letter activities"],
  },
  {
    name: "Build",
    icon: Puzzle,
    title: "Put the letter together.",
    text: "Try paper puzzles and letter-finding activities for a hands-on change of pace.",
    image: "letter-puzzles.webp",
    sample: "letter-puzzles.webp",
    alt: "Colourful paper letter puzzles on a wooden table",
    tags: ["Letter puzzles", "Hands-on practice"],
  },
];
const videos = [
  {
    id: "writing-demo",
    title: "A page in action",
    label: "Read, trace and write",
    poster: "writing-demo-poster.webp",
    note: "A short look at writing practice.",
  },
  {
    id: "alphabet-pages-preview",
    title: "Beyond the cover",
    label: "Inside the activities",
    poster: "alphabet-pages-preview.webp",
    note: "See pages and a colouring activity.",
  },
  {
    id: "letter-formation-preview",
    title: "A closer look",
    label: "Letter formation",
    poster: "letter-formation-preview.webp",
    note: "Explore tracing and formation examples.",
  },
] as const;
const faqs = [
  [
    "What exactly am I buying?",
    "A visual alphabet kit with pages you can print and turn into tracing cards, writing strips, matching games and paper puzzles. Your order is delivered online. You print and prepare the hands-on activities yourself.",
  ],
  [
    "How do I receive the materials?",
    "After Hotmart approves your payment, follow the access instructions sent to the email address you entered at checkout. You will need a device to open the materials and access to a printer.",
  ],
  [
    "How do I make the cards and activities?",
    "Choose a page and print it on paper. For cards you want to use again, try cardstock if your printer supports it. Cut around the card or puzzle outlines, then sort the pieces by letter. Leave tracing, writing and colouring pages whole.",
  ],
  [
    "Who can use these activities?",
    "Teachers, tutors and families supporting letter recognition, letter formation and early writing. Choose tasks by your learner’s current skills and provide the support they need.",
  ],
  [
    "Is it a complete phonics programme?",
    "These are supplementary alphabet and writing resources. They are not a complete systematic phonics programme, an assessment or a guarantee of reading progress.",
  ],
  [
    "Is this a subscription?",
    "No. The displayed price is a single payment in Canadian dollars. Confirm the final currency, taxes, licence and access terms on Hotmart before paying.",
  ],
  [
    "What about refunds?",
    "The refund period and the process for requesting a refund are shown by Hotmart at checkout and in your order information. Please review those terms before completing your purchase.",
  ],
];

export const Route = createFileRoute("/")({ component: AlphabetPage });
function AlphabetPage() {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState({
    src: "sample-tracing.webp",
    alt: "Letter formation sample",
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useLocation({ select: (location) => location.searchStr });
  const checkoutUrl = checkoutUrlForSearch(search);
  const checkoutTracked = useRef(false);
  const videoMilestones = useRef(new Set<string>());
  const activity = activities[selected];

  const openSample = (src: string, alt: string) => {
    setLightbox({ src, alt });
    dialog.current?.showModal();
  };
  const recordCheckout = () => {
    if (!checkoutTracked.current) {
      trackMarketing("InitiateCheckout");
      checkoutTracked.current = true;
    }
  };
  const trackVideo = (element: HTMLVideoElement, id: (typeof videos)[number]["id"]) => {
    if (!Number.isFinite(element.duration) || element.duration <= 0) return;
    for (const percent of [25, 50, 75, 100] as const) {
      const reached =
        percent === 100 ? element.ended : element.currentTime / element.duration >= percent / 100;
      const key = id + ":" + percent;
      if (reached && !videoMilestones.current.has(key)) {
        videoMilestones.current.add(key);
        trackMarketing("VideoProgress", { video_id: id, percent });
      }
    }
  };

  return (
    <main className="ab-page">
      <div className="ab-announcement">
        <Download size={14} />
        <span>Print it. Make it. Explore letters together.</span>
        <span className="ab-announcement-extra">Print at home or school.</span>
      </div>
      <header className="ab-header ab-wrap">
        <a href="#top" className="ab-brand" aria-label="Alphabet Activity Bundle home">
          <span className="ab-brand-mark" aria-hidden="true">
            ab<span>c</span>
            <i />
          </span>
          <span>
            Alphabet
            <br />
            Activity Bundle
          </span>
        </a>
        <span className="ab-header-note">
          Letter cards, games and activities.
        </span>
      </header>

      <div id="top" className="ab-product-breadcrumb ab-wrap">
        Early learning <span aria-hidden="true">/</span> Alphabet activities
      </div>
      <section id="offer" className="ab-product ab-wrap" aria-labelledby="product-title">
        <div className="ab-sales-intro">
          <p className="ab-eyebrow">LESS SEARCHING. MORE HANDS-ON LETTER TIME.</p>
          <h1 id="product-title">Turn “What can we practise today?” into <span>an activity ready to try.</span></h1>
          <p>Stop piecing together random alphabet printouts. Make your own letter cards, writing strips and paper puzzles from one visual kit — ready for you to print, prepare and explore together.</p>
          <a href="#watch" className="ab-text-link"><Play size={17} /> See the activities in action</a>
        </div>
        <AlphabetProductGallery
          onEnlarge={openSample}
          onVideoProgress={(element) => trackVideo(element, "writing-demo")}
        />
        <div className="ab-product-info">
          <p className="ab-eyebrow">ALPHABET ACTIVITY BUNDLE</p>
          <h2>Your next letter activity starts here.</h2>
          <p className="ab-product-description">Trace a letter. Match a card. Build a puzzle. Choose the activity that fits your learner, instead of starting your search from scratch.</p>
          <a className="ab-product-feedback-link" href="#customer-reviews">
            Read customer feedback <ArrowUpRight size={14} />
          </a>
          <div className="ab-product-badges">
            <span>
              <Download size={14} /> Visual templates
            </span>
            <span>
              <Printer size={14} /> Print at home or school
            </span>
          </div>
          <div className="ab-product-price">
            <strong>{money(OFFER.price)}</strong>
            <span>Canadian dollars · One payment</span>
          </div>
          <a
            className="ab-button ab-checkout-button"
            href={checkoutUrl}
            onClick={recordCheckout}
          >
            Yes, I want my alphabet kit
            <ArrowRight size={18} />
          </a>
          <p className="ab-product-payment">
            <ShieldCheck size={16} /> Payment processed by Hotmart
          </p>
          <ul className="ab-product-includes">
            <li>
              <Check size={17} /> Letter sheets and tracing cards
            </li>
            <li>
              <Check size={17} /> Read, trace and write practice
            </li>
            <li>
              <Check size={17} /> Colouring, matching and paper puzzles
            </li>
          </ul>
          <div className="ab-product-delivery">
            <Download size={20} />
            <p>
              <strong>Make your own alphabet kit.</strong>
              <br />
              Receive access instructions by email after payment. Print your chosen pages and turn them into activities you can hold, arrange and use together.
            </p>
          </div>
          <p className="ab-small-note">
            Final currency, taxes, licence and refund terms are shown at checkout.
          </p>
          <a href="#what-you-get" className="ab-text-link">
            Take a look inside <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <div className="ab-trust-row ab-wrap">
        <span>
          <Download size={18} /> Ready-to-use templates
        </span>
        <span>
          <Printer size={18} /> Print the pages you need
        </span>
        <span>
          <Puzzle size={18} /> Hands-on activities
        </span>
        <span>
          <ShieldCheck size={18} /> Checkout by Hotmart
        </span>
      </div>

      <section className="ab-section ab-wrap ab-sales-story" aria-labelledby="story-title">
        <p className="ab-eyebrow">YOU WANT TO HELP. YOU NEED A PLACE TO START.</p>
        <h2 id="story-title">The activity should be on the table — not buried in another saved link.</h2>
        <p>You have the intention. Then come the tabs, the printouts and the question of what to use next. This bundle gives you a set of visual materials to choose from, so you can spend less time searching and more time preparing an activity together.</p>
        <div className="ab-story-grid">
          <article><h3>Choose one letter.</h3><p>Start with what your learner is working on. You do not need to print the whole kit.</p></article>
          <article><h3>Make something tangible.</h3><p>Turn the templates into cards, writing strips or puzzle pieces with paper and a little preparation.</p></article>
          <article><h3>Change the activity.</h3><p>Move from tracing to colouring or building when you want another way to explore the same letter.</p></article>
        </div>
      </section>
      <section id="watch" className="ab-section ab-wrap" aria-labelledby="watch-title">
        <div className="ab-section-heading">
          <div>
            <p className="ab-eyebrow">SEE MORE THAN A COVER</p>
            <h2 id="watch-title">
              See it before you choose it.
              <br />
              <span>Real activities, up close.</span>
            </h2>
          </div>
          <p>
            Real activity previews, without the guesswork.
            <br />
            Silent previews you can pause and replay.
          </p>
        </div>
        <div className="ab-videos">
          {videos.map((video, index) => (
            <article key={video.id}>
              <div className="ab-video-top">
                <span>0{index + 1}</span>
                <span>{video.label}</span>
                <Play size={14} />
              </div>
              <AlphabetPreviewVideo
                src={media + video.id + ".mp4"}
                poster={media + video.poster}
                title={video.title}
                onProgress={(element) => trackVideo(element, video.id)}
              />
              <div className="ab-video-copy">
                <h3>{video.title}</h3>
                <p>{video.note}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="ab-swipe-note">
          Tap a video to explore the activities <ArrowRight size={15} />
        </p>
      </section>

      <section
        id="what-you-get"
        className="ab-section ab-wrap ab-deliverables"
        aria-labelledby="deliverables-title"
      >
        <div className="ab-section-heading">
          <div>
            <p className="ab-eyebrow">WHAT’S IN THE BUNDLE</p>
            <h2 id="deliverables-title">
              Give letter time more variety.
              <br />
              <span>One kit. Four ways to begin.</span>
            </h2>
          </div>
          <p>
            When you want a change from tracing, try matching, colouring or building a letter. See what you can make from the materials below.
          </p>
        </div>
        <div className="ab-deliverable-grid">
          {[
            {
              image: "trace-cards.webp",
              title: "Letter tracing cards",
              text: "Clear letter shapes to trace and explore.",
            },
            {
              image: "writing-strips.webp",
              title: "Read, trace & write",
              text: "Writing strips, words and short sentences.",
            },
            {
              image: "workbook-pages.webp",
              title: "Colouring & workbook pages",
              text: "A different way to work with the letter.",
            },
            {
              image: "letter-puzzles.webp",
              title: "Paper letter puzzles",
              text: "Hands-on pieces to build and put together.",
            },
          ].map((item, index) => (
            <article key={item.image}>
              <img
                src={media + item.image}
                alt={item.title + " example"}
                width="600"
                height="600"
                loading="lazy"
              />
              <div>
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="ab-deliverable-note">
          <Printer size={15} /> The photos show what you can make from the templates.
        </p>
      </section>
      <section className="ab-prep-section">
        <div className="ab-wrap ab-prep">
          <div>
            <p className="ab-eyebrow">HOW TO PREPARE YOUR KIT</p>
            <h2>
              From printed page
              <br />
              to hands-on activity.
            </h2>
            <p>
              Set out a tracing sheet, make a stack of letter cards or build a matching game from
              the same kit.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Choose your activity.</h3>
                <p>Pick a letter and choose a tracing sheet, a set of cards or a puzzle.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Print the pages you need.</h3>
                <p>Use regular paper for writing and colouring. Use cardstock for sturdier cards if your printer supports it.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Cut and set up the pieces.</h3>
                <p>Cut around the card or puzzle outlines and group the pieces by letter. Leave writing and colouring pages whole.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section id="inside" className="ab-section ab-inside ab-wrap" aria-labelledby="inside-title">
        <div className="ab-section-heading">
          <div>
            <p className="ab-eyebrow">OPEN THE BUNDLE</p>
            <h2 id="inside-title">
              Pick a letter.
              <br />
              <span>Choose how to explore it.</span>
            </h2>
          </div>
          <p>
            Choose an activity below.
            <br />
            Picture it on your kitchen table or in your classroom.
          </p>
        </div>
        <div className="ab-activity-buttons" aria-label="Choose an activity type">
          {activities.map((item, index) => (
            <button
              key={item.name}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <item.icon size={19} />
              {item.name}
              <span>0{index + 1}</span>
            </button>
          ))}
        </div>
        <div className="ab-explorer" data-activity={activity.name}>
          <button
            className="ab-explorer-photo"
            aria-label={"Enlarge " + activity.name.toLowerCase() + " activity preview"}
            onClick={() => openSample(activity.image, activity.alt)}
          >
            <img
              key={activity.image}
              src={media + activity.image}
              alt={activity.alt}
              width="800"
              height="800"
              loading="lazy"
            />
            <span>
              View closer <ArrowUpRight size={16} />
            </span>
          </button>
          <div className="ab-explorer-copy" aria-live="polite">
            <span className="ab-number">0{selected + 1} / EXPLORE</span>
            <h3>{activity.title}</h3>
            <p>{activity.text}</p>
            <div className="ab-tags">
              {activity.tags.map((tag) => (
                <span key={tag}>
                  <Check size={14} />
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="ab-text-link"
              onClick={() => openSample(activity.sample, activity.alt)}
            >
              Open a page preview <ArrowUpRight size={16} />
            </button>
            <p className="ab-print-note">
              <Printer size={16} /> Open a sample to see the page layout before printing.
            </p>
          </div>
        </div>
        <div className="ab-section-action">
          <p>Have an activity in mind? Make it your next letter-time plan.</p>
          <a className="ab-button" href={checkoutUrl} onClick={recordCheckout}>
            Get my kit — {money(OFFER.price)} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="ab-section ab-wrap ab-sample-section" aria-labelledby="sample-title">
        <div>
          <p className="ab-eyebrow">STILL TAKING A LOOK?</p>
          <h2 id="sample-title">See the page style.</h2>
          <p>Open a sample and take a closer look at the layout.</p>
        </div>
        <div className="ab-sample-cards">
          {[
            { src: "sample-tracing.webp", title: "Letter formation" },
            { src: "sample-dot.webp", title: "Uppercase & lowercase" },
            { src: "sample-colouring.webp", title: "Colour & trace" },
          ].map((sample) => (
            <button key={sample.src} onClick={() => openSample(sample.src, sample.title)}>
              <img
                src={media + sample.src}
                alt={sample.title + " sample page"}
                width="300"
                height="400"
                loading="lazy"
              />
              <span>
                {sample.title}
                <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <CustomerReviews />
      <section id="get-kit" className="ab-section ab-final-offer" aria-labelledby="kit-offer-title">
        <div className="ab-wrap ab-offer-inner">
          <p className="ab-eyebrow">MAKE YOUR NEXT LETTER-TIME PLAN</p>
          <h2 id="kit-offer-title">From another saved idea to a kit you can actually use.</h2>
          <p>Get the Alphabet Activity Bundle and choose your first activity: letter tracing cards, writing practice, colouring pages or paper puzzles.</p>
          <ul>
            <li><Check size={18} /> Visual templates to print and prepare</li>
            <li><Check size={18} /> Cards, strips and pages for different kinds of practice</li>
            <li><Check size={18} /> Use at home, in class or during tutoring</li>
          </ul>
          <strong className="ab-offer-amount">{money(OFFER.price)}</strong>
          <p>One payment in Canadian dollars. No subscription.</p>
          <a className="ab-button" href={checkoutUrl} onClick={recordCheckout}>Yes, I want my alphabet kit <ArrowRight size={18} /></a>
          <p className="ab-small-note"><ShieldCheck size={16} /> Continue to secure payment on Hotmart. Access instructions arrive by email after payment approval.</p>
          <p className="ab-small-note">Digital materials to print yourself. Printer, paper and stationery are not included. Review the final total and refund terms at checkout.</p>
        </div>
      </section>

      <section className="ab-wrap ab-faq" aria-labelledby="faq-title">
        <div>
          <p className="ab-eyebrow">BEFORE YOU PRINT</p>
          <h2 id="faq-title">
            A few useful
            <br />
            answers.
          </h2>
          <a className="ab-text-link" href={checkoutUrl} onClick={recordCheckout}>
            Go to checkout <ArrowUpRight size={16} />
          </a>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="ab-footer">
        <div className="ab-wrap">
          <div>
            <a href="#top" className="ab-brand">
              <span className="ab-brand-mark" aria-hidden="true">
                ab<span>c</span>
                <i />
              </span>
              <span>
                Alphabet
                <br />
                Activity Bundle
              </span>
            </a>
            <p>Make letter cards, games and activities for your next lesson.</p>
          </div>
          <div className="ab-footer-note">
            <p>
              Digital files. No shipping. Supplementary activities, not a
              complete phonics curriculum. Learning experiences vary. Artwork remains credited to
              its respective creators.
            </p>
            <AdvertisingConsent />
            <small>© {new Date().getFullYear()} Alphabet Activity Bundle</small>
          </div>
        </div>
      </footer>

      <dialog ref={dialog} className="ab-lightbox" aria-label="Activity page preview">
        <button
          className="ab-dialog-close"
          aria-label="Close page preview"
          onClick={() => dialog.current?.close()}
        >
          <X size={23} />
        </button>
        <img src={media + lightbox.src} alt={lightbox.alt} />
        <p>Activity preview. Physical stationery is not included.</p>
      </dialog>
    </main>
  );
}
