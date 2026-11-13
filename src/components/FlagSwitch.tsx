// The flag switch (8.6): a green glass track with a red disc that slides to the chosen side.
// Two kinds of option:
//   - links (href): the language toggle. Real links, so it works without JavaScript.
//   - buttons (onSelect): two-way view choices such as "Chart | Table".
// Keyboard: Tab reaches the control; the arrow keys move between the two options;
// Enter (or Space on buttons) chooses.
import { useRef, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import type { Lang } from '../i18n/index.ts';

export interface SwitchOption {
  label: string;
  /** Language of the label, when it differs from the page (e.g. "বাংলা" on an English page). */
  lang?: Lang;
  href?: string;
  hrefLang?: string;
  onSelect?: () => void;
}

interface Props {
  /** Accessible name of the whole control, in the page language. */
  label: string;
  options: [SwitchOption, SwitchOption];
  selected: 0 | 1;
  className?: string;
}

export function FlagSwitch({ label, options, selected, className }: Props) {
  const refs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    refs[e.key === 'ArrowLeft' ? 0 : 1]!.current?.focus();
  };

  return (
    <div
      className={`flag-switch glass${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={label}
      data-selected={selected}
      onKeyDown={onKeyDown}
    >
      <span className="flag-switch__disc" aria-hidden="true" />
      {options.map((o, i) => {
        const isSelected = i === selected;
        const common = {
          className: `flag-switch__option${isSelected ? ' is-selected' : ''}`,
          lang: o.lang,
        };
        if (o.href !== undefined) {
          return (
            <Link
              key={i}
              {...common}
              ref={refs[i] as React.Ref<HTMLAnchorElement>}
              to={o.href}
              hrefLang={o.hrefLang}
              aria-current={isSelected ? 'true' : undefined}
              onClick={o.onSelect}
            >
              {o.label}
            </Link>
          );
        }
        return (
          <button
            key={i}
            {...common}
            ref={refs[i] as React.Ref<HTMLButtonElement>}
            type="button"
            aria-pressed={isSelected}
            onClick={o.onSelect}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
