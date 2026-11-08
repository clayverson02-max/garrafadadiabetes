import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, Download, FileText, Printer, Scissors } from "lucide-react";
import "./alphabet.css";
import { OFFER } from "../lib/offer";
import { trackMarketing } from "../lib/marketing";

// Configure the NEW product's Hotmart link before launch. Never reuse the old checkout.
const price = new Intl.NumberFormat("en-CA", { style: "currency", currency: OFFER.currency, currencyDisplay: "code" }).format(OFFER.price);
const media = "/alphabet/";
const samples = [
  { src: "activity-sheets.webp", alt: "Alphabet sheets with uppercase and lowercase letters, tracing and pictures", label: "Letter activity sheets" },
  { src: "trace-cards.webp", alt: "Colourful letter tracing cards with pictures and formation arrows", label: "Tracing cards" },
  { src: "writing-strips.webp", alt: "Read, trace and write practice strips", label: "Writing practice" },
  { src: "letter-puzzles.webp", alt: "Colourful letter building lowercase letter puzzles", label: "Letter puzzles" },
  { src: "workbook-pages.webp", alt: "Workbook examples with colouring, sentence tracing and a letter puzzle", label: "Inside the activities" },
  { src: "matching-pages.webp", alt: "Examples of letter matching, word search and writing activities", label: "More ways to practise" },
  { src: "writing-demo-poster.webp", alt: "Watch a writing activity demonstration", label: "Watch demonstration", video: "writing-demo.mp4" },
];
const included = [
  ["01", "Trace the letters", "Clear tracing guides help children practise each letter.", "trace-cards.webp"],
  ["02", "Read, trace & write", "Start with a letter, then try a word or a short sentence.", "writing-strips.webp"],
  ["03", "Colour & explore", "Add some colouring when your learners need a change.", "workbook-pages.webp"],
  ["04", "Match, find & build", "Match letters, find them in a search or put a puzzle together.", "letter-puzzles.webp"],
];
const faqs = [
  ["Is this a physical product?", "No. This is a digital bundle of printable activities. No books, stationery or other physical items are shipped. You print the pages you want to use."],
  ["Who are these activities for?", "Teachers, tutors and families supporting children who are practising letter recognition, letter formation and early writing. Choose activities by the learner’s current skills, rather than age alone."],
  ["Is this a complete phonics programme?", "No. These are supplementary alphabet and writing activities. They are not a complete systematic phonics programme or an assessment, and should be used alongside appropriate teaching."],
  ["How do I receive the bundle?", "After payment is approved, follow the access instructions supplied by Hotmart to open your digital materials. Keep the email address used at checkout available."],
  ["Do I need special equipment?", "You will need a device to open the files and access to a printer. Some activities also use pencils or crayons. Cutting puzzles require scissors and appropriate adult supervision."],
  ["Is this a subscription?", "No. The listed price is a single payment in Canadian dollars. Any applicable taxes and the final amount are shown by Hotmart before you confirm payment."],
  ["What are the refund terms?", "The applicable refund period and the process for requesting a refund will be displayed on the Hotmart payment page and your order. Check those terms before purchasing."],
];

function PurchaseButton() {
  if (!OFFER.checkoutUrl) return <button className="ab-buy" disabled aria-describedby="checkout-status">Checkout available soon</button>;
  return <a className="ab-buy" href={OFFER.checkoutUrl} onClick={() => trackMarketing("InitiateCheckout")}>Get my activity bundle <ArrowRight size={20} /></a>;
}
function Gallery() {
  const [selected, setSelected] = useState(0);
  const current = samples[selected];
  const move = (step: number) => setSelected(value => (value + step + samples.length) % samples.length);
  return <div className="ab-gallery">
    <figure className="ab-gallery-main">{"video" in current ? <video key={current.video} controls playsInline preload="none" poster={media + current.src} aria-label={current.alt}><source src={media + current.video} type="video/mp4" /></video> : <img src={media + current.src} alt={current.alt} width="1100" height="1100" fetchPriority="high" />}<figcaption>{current.label}</figcaption><div className="ab-gallery-controls"><button aria-label="Previous sample" onClick={() => move(-1)}><ChevronLeft size={20} /></button><span aria-live="polite">{selected + 1} / {samples.length}</span><button aria-label="Next sample" onClick={() => move(1)}><ChevronRight size={20} /></button></div></figure>
    <div className="ab-thumbnails" aria-label="Product samples">{samples.map((sample, index) => <button key={sample.src} aria-label={`Show ${sample.label}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><img src={media + sample.src} alt="" width="80" height="80" loading="lazy" /></button>)}</div>
  </div>;
}
export const Route = createFileRoute("/")({ component: AlphabetPage });
function AlphabetPage() {
  return <main className="ab-page">
    <div className="ab-delivery"><Download size={14} /> Digital download · Print at home or school · No physical delivery</div>
    <header className="ab-header ab-wrap"><a className="ab-wordmark" href="#"><span aria-hidden="true">a<span>b</span>c</span>Alphabet Activity Bundle</a><a className="ab-header-link" href="#inside">See what’s inside <ArrowDown size={15} /></a></header>
    <section className="ab-product ab-wrap" aria-labelledby="product-title"><Gallery /><div className="ab-product-copy"><p className="ab-eyebrow">LESS PREP. MORE LETTER PRACTICE.</p><h1 id="product-title">Alphabet<br /><span>Activity Bundle</span></h1><p className="ab-lead">Your next letter activity is ready to print. Choose tracing, writing, colouring or a puzzle and give yourself one less thing to prepare.</p><div className="ab-tags"><span>Tracing & writing</span><span>Colouring & puzzles</span><span>Digital files</span></div><ul className="ab-benefits"><li><Check />Tracing, writing, colouring and puzzles.</li><li><Check />Real activity samples you can open.</li><li><Check />Print the pages you need for your lesson.</li></ul><div className="ab-product-price"><strong>{price}</strong><span>Pay once · No subscription</span></div><PurchaseButton /><a className="ab-preview-link" href="#inside">See everything inside <ArrowDown size={16} /></a><p className="ab-fine">Printable resources, not a physical workbook. Stationery shown in the photos is not included.</p></div></section>
    <div className="ab-proof-strip"><div className="ab-wrap"><span><FileText /> Actual activity previews</span><span><Printer /> Choose your pages</span><span><Scissors /> Practical letter activities</span></div></div>
    <section className="ab-section ab-wrap" id="inside"><div className="ab-section-heading"><div><p className="ab-eyebrow">OPEN THE BUNDLE</p><h2>What’s in the bundle?</h2></div><p>Here are some of the pages you can use in your next lesson.</p></div><div className="ab-included">{included.map(([number, title, text, src]) => <article key={number}><div className="ab-feature-photo"><img src={media + src} alt={title + " activity example"} width="600" height="600" loading="lazy" /></div><div className="ab-feature-copy"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div></article>)}</div></section>
    <section className="ab-section ab-wrap ab-demo"><div><p className="ab-eyebrow">A CLOSER LOOK</p><h2>See writing practice<br />in action.</h2><p>A short demonstration of a read, trace and write activity. Choose the level and support that suit your learners.</p></div><video controls playsInline preload="none" poster="/alphabet/writing-demo-poster.webp" width="464" height="816" aria-label="Demonstration of a child practising writing"><source src="/alphabet/writing-demo.mp4" type="video/mp4" />Your browser does not support this video.</video></section>
    <section className="ab-how"><div className="ab-wrap"><p className="ab-eyebrow">KEEP PREPARATION SIMPLE</p><h2>Choose. Print. Practise.</h2><ol><li><span>1</span><h3>Choose a focus</h3><p>Pick the activity that suits your learners’ current skills.</p></li><li><span>2</span><h3>Print your pages</h3><p>Check your print preview and prepare the supplies for that task.</p></li><li><span>3</span><h3>Make it practical</h3><p>Trace, write, colour or build with the support your learners need.</p></li></ol></div></section>
    <section className="ab-section ab-wrap ab-samples" id="samples"><div className="ab-section-heading"><div><p className="ab-eyebrow">LOOK BEFORE YOU BUY</p><h2>See the actual page style.</h2></div><p>Open a sample for a closer look. Explore the layout and activities before you buy.</p></div><div className="ab-open-samples">{[{file:"sample-tracing.webp",name:"Letter formation"},{file:"sample-dot.webp",name:"Uppercase & lowercase"},{file:"sample-colouring.webp",name:"Colouring & tracing"}].map(s=><a key={s.file} href={media+s.file} target="_blank" rel="noopener noreferrer"><img src={media+s.file} alt={s.name+" sample page"} width="400" height="530" loading="lazy"/><span>{s.name}<span aria-hidden="true"> ↗</span></span></a>)}</div></section>
    <section id="offer" className="ab-offer-section"><div className="ab-offer ab-wrap"><div className="ab-offer-visual"><img src={media+"cover.webp"} alt="Alphabet Activity Bundle with tracing, writing, colouring and puzzle examples" width="900" height="900" loading="lazy" /></div><div className="ab-offer-copy"><p className="ab-eyebrow">YOUR NEXT LESSON STARTS HERE</p><h2>Have your next alphabet<br />activity ready.</h2><p>Have your next activity ready without making another worksheet from scratch.</p><ul>{["Letter activity sheets and tracing cards","Read, trace and write practice","Colouring and letter puzzles","Matching and letter-finding activities"].map(t=><li key={t}><Check size={18}/>{t}</li>)}</ul><div className="ab-product-price"><strong>{price}</strong><span>Canadian dollars · Pay once</span></div><PurchaseButton />{!OFFER.checkoutUrl && <p id="checkout-status" className="ab-fine">Purchases open soon. Online checkout is being prepared.</p>}<p className="ab-fine">Digital resources only. Final charges and access terms are shown at checkout.</p></div></div></section>
    <section className="ab-section ab-wrap ab-faq"><div><p className="ab-eyebrow">A FEW USEFUL ANSWERS</p><h2>Before you print.</h2><p>A few things worth knowing before you order.</p></div><div>{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
    <footer className="ab-footer"><div className="ab-wrap"><strong>Alphabet Activity Bundle</strong><p>Digital printable resources. No physical products are shipped. Supplementary activities, not a complete phonics curriculum. Learning experiences vary with each learner and the teaching provided.</p><button className="ab-preferences" onClick={() => window.dispatchEvent(new Event("alphabet-ad-preferences"))}>Advertising preferences</button><small>© {new Date().getFullYear()} Alphabet Activity Bundle. Product artwork remains credited to its respective creators.</small></div></footer>
  </main>;
}
