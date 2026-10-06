"use client";

import { useEffect, useState } from "react";
import type { AttachmentDto } from "@/types/report-detail";
import { getLesanBaseUrl } from "@/services/api";
import { SectionTitle } from "@/components/report/kit";
import { formatFileSize } from "@/utils/formatters";

/**
 * The photos and documents filed with an accident.
 *
 * ## The URL is derived, not stored
 *
 * A `file` document records `name`, `type`, `size` and `category` — **not** the
 * directory it was written to. Two acts write uploads to two different trees:
 * `file.uploadFile` picks `./uploads/{images,docs,videos,geo,json}` from the
 * declared type, while `file.uploadAccidentImages` always writes
 * `./uploads/accidents`. Only the second populates `accident.attachments`, so
 * everything reached through this relation lives under `/uploads/accidents/` —
 * which is why the path is assembled here rather than read from the document.
 *
 * That is an inference, not a fact carried by the data, so it is stated once here
 * rather than repeated at every call site. If a future act writes attachments
 * elsewhere, this is the one line that has to change.
 *
 * `incident_report` has no `attachments` field at all, so this section is
 * `accident`-only and renders nothing on a non-accident report.
 */
export function AttachmentGallery({
  attachments,
}: {
  attachments?: AttachmentDto[];
}) {
  const [open, setOpen] = useState<AttachmentDto | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const files = (attachments ?? []).filter((file) => file.name);
  if (!files.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <SectionTitle count={files.length}>مستندات</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((file) => (
          <AttachmentTile key={file._id ?? file.name} file={file} onOpen={setOpen} />
        ))}
      </div>

      {open && <Lightbox file={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function isImage(file: AttachmentDto): boolean {
  return (file.type ?? "").startsWith("image/");
}

function href(file: AttachmentDto): string {
  return `${getLesanBaseUrl()}/uploads/accidents/${file.name}`;
}

function AttachmentTile({
  file,
  onOpen,
}: {
  file: AttachmentDto;
  onOpen: (file: AttachmentDto) => void;
}) {
  const image = isImage(file);
  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.02] text-right transition hover:border-blue-400/40"
    >
      {image ? (
        // A plain `<img>` rather than `next/image`: the source is an
        // authenticated, runtime-assigned backend host that is not known at build
        // time, so the optimizer's host allow-list would reject it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href(file)}
          alt={file.name}
          loading="lazy"
          className="h-24 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 items-center justify-center text-slate-500">
          <FileGlyph />
        </div>
      )}
      <div className="px-2 py-1.5">
        <p className="truncate text-[10px] text-slate-300" dir="ltr">
          {file.name}
        </p>
        {file.size != null && (
          <p className="text-[9px] text-slate-500">{formatFileSize(file.size)}</p>
        )}
      </div>
    </button>
  );
}

function Lightbox({
  file,
  onClose,
}: {
  file: AttachmentDto;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {isImage(file) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={href(file)}
            alt={file.name}
            className="mx-auto max-h-[80vh] w-auto rounded-xl"
          />
        ) : (
          <iframe
            src={href(file)}
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
    </div>
  );
}

function FileGlyph() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14 3v5h5M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
      />
    </svg>
  );
}