"use client";

import { useEffect, useState } from "react";

const slides = [
  { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=88", alt: "Sunlit modern home with a warm, open living space", position: "center 54%" },
  { src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2200&q=88", alt: "Contemporary living room opening toward the garden", position: "center 48%" },
  { src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=88", alt: "Modern house exterior surrounded by greenery", position: "center 52%" },
  { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=88", alt: "Premium contemporary interior with a spacious lounge", position: "center 50%" },
];

export default function HomeHeroCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 5600);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="ag-home-hero-image" aria-label={slides[active].alt} role="img">
    {slides.map((slide, index) => <div className={"ag-home-hero-slide" + (index === active ? " is-active" : "")} key={slide.src} aria-hidden="true">
      <img src={slide.src} alt="" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} style={{ objectPosition: slide.position }} />
    </div>)}
    <div className="ag-home-carousel-controls" aria-label="Homepage hero slides">
      {slides.map((slide, index) => <button key={slide.src} type="button" aria-label={"Show image " + (index + 1) + ": " + slide.alt} aria-pressed={index === active} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} />)}
    </div>
  </div>;
}
