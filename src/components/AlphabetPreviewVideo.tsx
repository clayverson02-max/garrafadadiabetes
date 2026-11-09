import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster: string;
  title: string;
  onProgress: (video: HTMLVideoElement) => void;
};

/** Only the first preview auto-plays, in view, silently. All previews retain native controls. */
export function AlphabetPreviewVideo({ src, poster, title, onProgress }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || !src.endsWith("writing-demo.mp4") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => { /* Native play remains available if autoplay is blocked. */ });
      } else {
        video.pause();
      }
    }, { threshold: 0.55 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return <video
    ref={ref}
    controls
    playsInline
    muted
    preload="none"
    poster={poster}
    width="480"
    height="816"
    aria-label={title + " video preview"}
    onPlay={(event) => {
      const playing = event.currentTarget;
      document.querySelectorAll<HTMLVideoElement>(".ab-page video").forEach((video) => {
        if (video !== playing) video.pause();
      });
    }}
    onTimeUpdate={(event) => onProgress(event.currentTarget)}
    onEnded={(event) => onProgress(event.currentTarget)}
  ><source src={src} type="video/mp4" />Your browser does not support this video.</video>;
}
