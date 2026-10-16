import type { UploadEvent } from '@/domain/upload-events';

/**
 * What an upload pass is allowed to be told by its caller.
 *
 * The pass itself is unchanged in shape — read the records, send what is missing, write
 * the server ids back — but it now answers two questions it used to leave open: what to
 * show the officer while it runs, and which files to leave alone because the officer
 * already decided those are not coming.
 */
export type UploadOptions = {
  /**
   * Called as each file starts, completes or fails. Fed straight into
   * `applyUploadEvent`, which is what the modal renders.
   */
  onProgress?: (event: UploadEvent) => void;
  /**
   * Media ids to skip — the files behind «ادامه بدون این فایل».
   *
   * A skipped file is neither uploaded nor written back, and is deliberately absent from
   * the result: the report is being filed without it, and that has to be visible rather
   * than quietly dropped.
   */
  skip?: ReadonlySet<string>;
};