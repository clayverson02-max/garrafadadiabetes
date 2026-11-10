import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";

const media = "/alphabet/";
const gallery = [
  {
    image: "activity-sheets.webp",
    label: "Activity sheets",
    alt: "Printable alphabet activity sheets with tracing, colouring and letter finding",
  },
  {
    image: "trace-cards.webp",
    label: "Tracing cards",
    alt: "Colourful letter formation cards on a classroom table",
  },
  {
    image: "writing-strips.webp",
    label: "Writing practice",
    alt: "Read, trace and write strips with letter and word practice",
  },
  {
    image: "letter-puzzles.webp",
    label: "Paper puzzles",
    alt: "Colourful paper letter puzzles to cut out and assemble",
  },
  {
    image: "writing-demo-poster.webp",
    label: "Watch a preview",
    alt: "Writing practice video preview",
    video: "writing-demo.mp4",
  },
];

type Props = {
  onEnlarge: (src: string, alt: string) => void;
  onVideoProgress: (video: HTMLVideoElement) => void;
};

export function AlphabetProductGallery({ onEnlarge, onVideoProgress }: Props) {
  const [selected, setSelected] = useState(0);
  const item = gallery[selected];
  return (
    <div className="ab-gallery" aria-label="Product photos and video">
      <div className="ab-gallery-stage" id="product-preview">
        {item.video ? (
          <video
            key={item.video}
            controls
            playsInline
            muted
            preload="none"
            poster={media + item.image}
            width="600"
            height="600"
            aria-label="Alphabet writing practice demonstration"
            onPlay={(event) => {
              const playing = event.currentTarget;
              document.querySelectorAll<HTMLVideoElement>(".ab-page video").forEach((video) => {
                if (video !== playing) video.pause();
              });
            }}
            onTimeUpdate={(event) => onVideoProgress(event.currentTarget)}
            onEnded={(event) => onVideoProgress(event.currentTarget)}
          >
            <source src={media + item.video} type="video/mp4" />
            Your browser does not support this video.
          </video>
        ) : (
          <button
            type="button"
            className="ab-gallery-enlarge"
            onClick={() => onEnlarge(item.image, item.alt)}
            aria-label={"Enlarge " + item.label.toLowerCase()}
          >
            <img
              src={media + item.image}
              alt={item.alt}
              width="600"
              height="600"
              fetchPriority={selected === 0 ? "high" : "auto"}
            />
            <span>
              <ArrowUpRight size={16} /> View closer
            </span>
          </button>
        )}
      </div>
      <div className="ab-gallery-thumbs" aria-label="Choose a product preview">
        {gallery.map((preview, index) => (
          <button
            key={preview.image}
            type="button"
            aria-pressed={selected === index}
            aria-label={preview.label}
            aria-controls="product-preview"
            onClick={() => setSelected(index)}
          >
            <img src={media + preview.image} alt="" width="80" height="80" loading="lazy" />
            {preview.video && (
              <span className="ab-gallery-play">
                <Play size={18} fill="currentColor" />
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="ab-gallery-caption" aria-live="polite">
        {item.label} · Actual activity preview
      </p>
    </div>
  );
}
