import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
export default function Modal({ isOpen, onClose, title, children, width = "max-w-5xl", busy = false }) {
 const dialog = useRef(null), titleId = useId();
 useEffect(() => {
  if (!isOpen) return;
  const target = dialog.current, previous = document.activeElement;
  target.showModal();
  const overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { if (target.open) target.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
 }, [isOpen]);
 if (!isOpen) return null;
 return <dialog ref={dialog} aria-labelledby={titleId} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className={"m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] " + width + " overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-black/40"}>
  <div className="flex items-center justify-between gap-4 border-b p-5"><h2 id={titleId} className="text-xl font-semibold text-slate-900">{title}</h2><button type="button" aria-label={"Close " + title} disabled={busy} onClick={onClose} className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button></div>
  <div className="p-4 sm:p-6">{children}</div>
 </dialog>;
}
