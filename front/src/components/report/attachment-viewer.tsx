"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AttachmentDto } from "@/types/report-detail";
import { useScrollLock } from "@/hooks/useScrollLock";
import { getLesanBaseUrl } from "@/services/api";
import { formatFileSize } from "@/utils/formatters";

/**
 * Viewing an uploaded file, and the URL its bytes live at.
 *
 * ## One URL builder, because the last one was duplicated
 *
 * `href` used to be private to `AttachmentGallery`, which is exactly how it came
 * to be built against the frontend origin and 404 every attachment — see
 * `getLesanBaseUrl`. It now lives here, next to both of its consumers, so the
 * gallery and the answer rows cannot disagree about where a file is.
 *
 * ## Three kinds, and the middle one is new
 *
 * The lightbox used to branch on "image or not", sending a video to an `<iframe>`,
 * which downloads the file instead of playing it. `mediaKind` is now the single
 * place that decides, and both the tile and the lightbox branch on it, so an
 * inline video cannot disagree with the expanded one.
 *
 * ## Portal and stacking
 *
 * The lightbox is a full-screen dialog, so it uses the project's `z-[100000]`
 * tier — the `Navbar` is `z-[9999]`, and the `z-[2000]` this carried renders
 * underneath it — and is portalled to `document.body` so an ancestor with a
 * `transform`/`filter` cannot trap it inside a page and cap its stacking
 * context. Same treatment as `ExpandableReportMap`.
 */

export type MediaKind = "image" | "video" | "file";

export function mediaKind(file: AttachmentDto): MediaKind {
  const type = file.type ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return "file";
}

/**
 * The URL of an attachment's bytes.
 *
 * `path` is the directory the writing act recorded, so the URL is read rather
 * than inferred; `accidents/` is the fallback for rows written before the field
 * existed. Segments are encoded individually so a filename containing a space,
 * `#` or a Persian glyph cannot truncate the URL — while a plain ASCII name
 * (`asset-1791356903221-aqqdvv.jpg`) encodes to itself.
 */
export function href(file: AttachmentDto): string {
  const relative = file.path ?? `accidents/${file.name}`;
  const encoded = relative
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${getLesanBaseUrl()}/uploads/${encoded}`;
}

/**
 * Lightbox state, so `AttachmentGallery` and `AnswerFileList` do not each own a
 * copy of it. Returns the element to render rather than the state alone, which
 * is what keeps the Escape-key effect next to the thing it closes.
 */
export function useAttachmentLightbox() {
  const [open, setOpen] = useState<AttachmentDto | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return {
    show: (file: AttachmentDto) => setOpen(file),
    lightbox: open ? <AttachmentLightbox file={open} onClose={() => setOpen(null)} /> : null,
  };
}

/** The full-screen view. Portalled — see the note at the top of this file. */
export function AttachmentLightbox({
  file,
  onClose,
}: {
  file: AttachmentDto;
  onClose: () => void;
}) {
  // Mounted only while open, so the lock is unconditional here. `useScrollLock`
  // pins `body` with `position: fixed` and restores the scroll offset on unmount;
  // that does not re-anchor this overlay, because a `position: fixed` ancestor is
  // not a containing block — only transform/filter/perspective/contain are.
  useScrollLock(true);

  const kind = mediaKind(file);
  const url = href(file);

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/70 p-4 pt-14 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* `pt-14` above reserves the row this sits in, so the button can never
          cover the media on a narrow screen. It closes on its own click; the
          backdrop's handler would agree, so no propagation guard is needed. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="absolute left-4 top-4 z-[100001] flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-200 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20 hover:text-white"
      >
        <CloseGlyph />
      </button>

      <div className="max-h-full w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
        {kind === "image" ? (
          // A plain `<img>` rather than `next/image`: the source is an
          // authenticated, runtime-assigned backend host that is not known at
          // build time, so the optimizer's host allow-list would reject it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} className="mx-auto max-h-[80vh] w-auto rounded-xl" />
        ) : kind === "video" ? (
          <video
            src={url}
            controls
            playsInline
            className="mx-auto max-h-[80vh] w-auto rounded-xl"
          />
        ) : (
          <iframe
            src={url}
            title={file.name}
            className="h-[70vh] w-full rounded-xl bg-white"
          />
        )}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-300">
          <span className="truncate" dir="ltr">
            {file.name}
          </span>
          <span className="shrink-0 text-slate-500">
            {file.category ?? "—"}
            {file.size != null && ` · ${formatFileSize(file.size)}`}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CloseGlyph() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * A file answer's files, rendered under the answer they belong to.
 *
 * The names are already on screen as the answer's own text — `answer_names`
 * carries the snapshot label — so what is added here is the *evidence*, in a
 * shape that matches the kind: a thumbnail, a playable clip, or a tile with a
 * size for anything the browser cannot show inline. Every tile opens the shared
 * lightbox, so a 4 KB PDF and a 4 MB photo are both one click away at full size.
 */
export function AnswerFileList({ files }: { files: AttachmentDto[] }) {
  const { show, lightbox } = useAttachmentLightbox();
  if (!files.length) return null;

  return (
    <>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {files.map((file) => (
          <li key={file._id ?? file.name}>
            <FileTile file={file} onOpen={show} />
          </li>
        ))}
      </ul>
      {lightbox}
    </>
  );
}

function FileTile({
  file,
  onOpen,
}: {
  file: AttachmentDto;
  onOpen: (file: AttachmentDto) => void;
}) {
  const kind = mediaKind(file);
  const url = href(file);

  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      title={file.name}
      className="group block cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[.02] transition hover:border-blue-400/40"
    >
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name ?? ""}
          loading="lazy"
          className="h-20 w-28 object-cover"
        />
      ) : kind === "video" ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="h-20 w-28 bg-black object-cover"
        />
      ) : (
        <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 bg-white/[.04] text-slate-400">
          <FileGlyph />
          <span className="text-[9px]">
            {file.size != null ? formatFileSize(file.size) : "سند"}
          </span>
        </div>
      )}
    </button>
  );
}

export function FileGlyph() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14 3v5h5M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
      />
    </svg>
  );
}