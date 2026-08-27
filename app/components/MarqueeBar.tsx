import { GlobeIcon } from "./icons";

function MarqueeSet() {
  return (
    <>
      <span className="marquee-chip">True Ownership</span>
      <span className="marquee-sep" />
      <span className="marquee-text">Built for the Culture</span>
      <span className="marquee-sep" />
      <span className="marquee-text">Own Your Identity</span>
      <span className="marquee-sep" />
      <GlobeIcon size={26} />
      <span className="marquee-squares">
        <i className="b" />
        <i className="l" />
        <i className="w" />
      </span>
      <span className="marquee-sep" />
    </>
  );
}

export function MarqueeBar() {
  return (
    <div className="marquee-bar">
      <div className="marquee-inner">
        <MarqueeSet />
        <MarqueeSet />
        <MarqueeSet />
        <MarqueeSet />
      </div>
    </div>
  );
}
