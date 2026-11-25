import { useEffect, useRef, useState } from "react";

export default function Dropdown({ value, onChange, options, label, icon }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    rootRef.current?.querySelector('[aria-checked="true"]')?.focus();
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function handleMenuKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(rootRef.current?.querySelectorAll('[role="menuitemradio"]') || []);
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : currentIndex < 0 ? (event.key === "ArrowDown" ? 0 : items.length - 1) : (currentIndex + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
    items[nextIndex]?.focus();
  }

  return <div className={`custom-dropdown ${open ? "is-open" : ""}`} ref={rootRef}>
    <button ref={triggerRef} type="button" className="dropdown-trigger" aria-label={`${label}: ${selected?.label}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      {icon && <span className="dropdown-leading" aria-hidden="true">{icon}</span>}
      <span className="dropdown-current">{selected?.label}</span>
      <svg className="dropdown-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div className="dropdown-menu" role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
      <p className="dropdown-menu-label">{label}</p>
      {options.map((option) => <button key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} className={`dropdown-option ${option.value === value ? "selected" : ""}`} onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}>
        <span className="dropdown-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        <span className="dropdown-check" aria-hidden="true">{option.value === value ? "✓" : ""}</span>
      </button>)}
    </div>}
  </div>;
}
