"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Offer {
  name: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}

interface OfferModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferModal({ offer, isOpen, onClose }: OfferModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>("button, a[href]");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !offer) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={offer.name}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 p-8 shadow-2xl backdrop-blur-2xl sm:p-12"
        style={{
          background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)'
        }}
      >
        <div className="flex items-start justify-between gap-6 border-b border-ink/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {offer.name}
              </h3>
              {offer.featured && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
                  Most Popular
                </span>
              )}
            </div>
            <p className="mt-3 text-xl font-medium leading-relaxed text-ink">{offer.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-cream transition-colors hover:bg-accent"
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>

        <div className="mt-8">
          <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-accent">What's Included</h4>
          <ul className="mt-6 space-y-4">
            {offer.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-[15px] leading-snug">
                <span aria-hidden className="mt-[5px] size-1.5 shrink-0 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-ink/10 pt-6">
          <p className="text-sm text-muted">
            No prices here on purpose - every engagement is scoped on the call. Everything above is execution, not advice: you'll see all of it happening, daily, in the shared CRM.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="#book"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-accent"
          >
            Book a call <span aria-hidden>&rarr;</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-full border border-ink px-7 py-3.5 font-semibold transition-colors hover:bg-ink hover:text-cream"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
