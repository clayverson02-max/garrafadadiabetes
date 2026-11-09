const media = "/alphabet/";

/** Device frames are illustrative; the page previews are the actual supplied materials. */
export function AlphabetProductShowcase() {
  return (
    <figure className="ab-product-showcase">
      <div className="ab-product-scene" role="img" aria-label="A tablet and phone displaying alphabet activity previews, surrounded by printable tracing, colouring and puzzle pages">
        <div className="ab-scene-backdrop" aria-hidden="true" />
        <span className="ab-scene-letter ab-scene-letter-a" aria-hidden="true">a</span>
        <span className="ab-scene-letter ab-scene-letter-b" aria-hidden="true">b</span>
        <div className="ab-paper ab-paper-one">
          <img src={media + "sample-dot.webp"} alt="" width="810" height="1080" fetchPriority="high" />
        </div>
        <div className="ab-paper ab-paper-two">
          <img src={media + "sample-colouring.webp"} alt="" width="810" height="1080" />
        </div>
        <div className="ab-tablet">
          <i className="ab-device-camera" aria-hidden="true" />
          <div className="ab-tablet-screen">
            <img src={media + "sample-tracing.webp"} alt="" width="819" height="1075" fetchPriority="high" />
          </div>
        </div>
        <div className="ab-phone">
          <i className="ab-phone-speaker" aria-hidden="true" />
          <div className="ab-phone-screen">
            <img src={media + "cover.webp"} alt="" width="1000" height="1000" />
            <span>Alphabet Activity Bundle</span>
            <small>Digital printables</small>
          </div>
        </div>
        <div className="ab-photo-stack">
          <img src={media + "writing-strips.webp"} alt="" width="1100" height="1100" />
          <span>Read. Trace. Write.</span>
        </div>
        <div className="ab-product-stamp" aria-hidden="true">
          Open.<br />Print.<br /><strong>Teach.</strong>
        </div>
      </div>
      <figcaption>Actual activity previews. Digital files to print. Devices and supplies are not included.</figcaption>
    </figure>
  );
}
