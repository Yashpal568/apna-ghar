"use client";
import React from "react";

export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand brand-compact" : "brand"} aria-label="Apna Ghar">
      <svg className="brand-symbol" viewBox="0 0 420 250" role="img" aria-label="Apna Ghar blue and green roof logo">
        <defs>
          <linearGradient id="agh-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1768df" />
            <stop offset="1" stopColor="#0644a8" />
          </linearGradient>
          <linearGradient id="agh-green" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#39c94b" />
            <stop offset="1" stopColor="#078e54" />
          </linearGradient>
        </defs>
        <path d="M35 118 210 4l91 70V35h38v69l28 25h-51L210 55 82 138H35Z" fill="url(#agh-blue)" />
        <path d="M180 104h19v19h-19zM205 104h19v19h-19zM180 129h19v19h-19zM205 129h19v19h-19z" fill="#0644a8" />
        <path d="M22 164c49-39 90-48 135-27 31 14 58 34 89 35 31 1 57-12 82-29-21 32-53 53-87 54-44 2-77-22-110-32-38-12-73-8-109-1Z" fill="url(#agh-green)" />
        <path d="M77 186c42-15 74-5 111 16 22 12 41 21 65 20-36 17-71 12-105-5-26-13-47-27-71-31Z" fill="url(#agh-blue)" />
      </svg>
      <span className="brand-wordmark"><span>Apna</span> <b>Ghar</b></span>
    </span>
  );
}
