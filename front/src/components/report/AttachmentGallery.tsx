"use client";

import { useMemo } from "react";
import type { AttachmentDto } from "@/types/report-detail";
import { SectionTitle } from "@/components/report/kit";
import {
  FileGlyph,
  href,
  mediaKind,
  useAttachmentLightbox,
} from "@/components/report/attachment-viewer";
import { formatFileSize } from "@/utils/formatters";

/**
 * The photos and documents filed with a report.
 *
 * ## The URL is stored, with a legacy fallback
 *
 * A `file` document records the directory its bytes were written to in `path`,
 * relative to the backend's `./uploads` — e.g. `images/<name>` or
 * `accidents/<name>`. Two acts write uploads to two different trees:
 * `file.uploadFile` picks `./uploads/{images,docs,videos,geo,json}` from the
 * declared type, while `file.uploadAccidentImages` always writes
 * `./uploads/accidents`. Both now record where they wrote, so the URL is read
 * from the document instead of guessed from its `type` — by `href` in
 * `attachment-viewer`, which owns it so this gallery and the answer rows cannot
 * resolve a file two different ways.
 *
 * ## Applies to both kinds of report
 *
 * This used to be `accident`-only, because `incident_report` declared no
 * relation to `file` at all: a photo attached to a road-damage report was
 * uploaded, stored and then unreachable, so there was nothing to render. Both
 * models declare `attachments` now, and the caller passes whichever the console
 * merged into the row.
 */
export function AttachmentGallery({
  attachments,
}: {
  attachments?: AttachmentDto[];
}) {
  const { show, lightbox } = useAttachmentLightbox();

  const files = useMemo(
    () => (attachments ?? []).filter((file) => file.name),
    [attachments],
  );
  if (!files.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <SectionTitle count={files.length}>مستندات</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((file) => (
          <AttachmentTile key={file._id ?? file.name} file={file} onOpen={show} />
        ))}
      </div>

      {lightbox}
    </section>
  );
}

function AttachmentTile({
  file,
  onOpen,
}: {
  file: AttachmentDto;
  onOpen: (file: AttachmentDto) => void;
}) {
  const image = mediaKind(file) === "image";

  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[.02] text-right transition hover:border-blue-400/40"
    >
      {image ? (
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