<script lang="ts">
  import { getCertificateStatusBadgeClasses } from '$lib/utils/badges';
  import { formatDate, formatFileSize } from '$lib/utils/formatters';
  import { safeAttachmentUrl } from '$lib/utils/url';
  import type { Attachment } from '$lib/types';

  type LegacyAttachment = Omit<Attachment, 'path' | 'url'> & {
    path?: string;
    url?: string | null;
    file?: string | null;
    file_path?: string | null;
    label?: string | null;
    nama?: string | null;
    title?: string | null;
    deskripsi?: string | null;
    keterangan?: string | null;
    caption?: string | null;
  };

  type AttachmentInput = LegacyAttachment | string | null | undefined;
  type CertificateDetailPayload = {
    id?: number;
    name?: string;
    no_certificate?: string;
    project_id?: number | string | null;
    barang_certificate_id?: number | string | null;
    status?: string;
    date_of_issue?: string | null;
    date_of_expired?: string | null;
    project?: { id: number; name?: string } | null;
    barang_certificate?: { id: number; name?: string } | null;
    attachments?: AttachmentInput[];
    attachment?: AttachmentInput | AttachmentInput[];
  };

  type NormalizedAttachment = {
    url: string;
    filename: string;
    displayName: string;
    desc?: string;
    sizeLabel?: string;
  };

  /**
   * Readonly certificate detail payload with legacy attachment fallbacks.
   */
  let { certificates = null }: { certificates?: CertificateDetailPayload | null } = $props();

  function filenameFromPath(path: string): string {
    try {
      const clean = decodeURIComponent(path);
      return (clean.split('/').pop() ?? clean) || clean;
    } catch {
      return (path.split('/').pop() ?? path) || path;
    }
  }

  function normalizeOneAttachment(attachment: AttachmentInput): NormalizedAttachment | null {
    if (!attachment) return null;

    if (typeof attachment === 'string') {
      const filename = filenameFromPath(attachment);
      const url = safeAttachmentUrl(attachment);
      return url ? { url, filename, displayName: filename } : null;
    }

    const rawPath = attachment.path ?? attachment.file ?? attachment.file_path ?? '';
    const url = safeAttachmentUrl(attachment.url ?? rawPath);
    if (!url) return null;

    const filename = filenameFromPath(rawPath || attachment.url || '');
    const displayName =
      attachment.label ?? attachment.nama ?? attachment.title ?? attachment.name ?? filename;
    const desc =
      attachment.description ??
      attachment.deskripsi ??
      attachment.keterangan ??
      attachment.caption ??
      undefined;
    const sizeLabel =
      attachment.sizeLabel ??
      (typeof attachment.size === 'number' ? formatFileSize(attachment.size) : undefined);

    return { url, filename, displayName, desc, sizeLabel };
  }

  function normalizeAttachments(
    attachmentInput: AttachmentInput | AttachmentInput[]
  ): NormalizedAttachment[] {
    if (!attachmentInput) return [];

    return (Array.isArray(attachmentInput) ? attachmentInput : [attachmentInput]).flatMap(
      (item) => {
        const normalized = normalizeOneAttachment(item);
        return normalized ? [normalized] : [];
      }
    );
  }

  let attachments = $derived(
    normalizeAttachments(certificates?.attachments ?? certificates?.attachment)
  );
</script>

{#if certificates}
  <div
    class="overflow-hidden border border-gray-200 bg-white shadow sm:rounded-md dark:border-neutral-800 dark:bg-black"
  >
    <dl class="divide-y divide-gray-100 dark:divide-gray-800">
      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Nama</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {certificates.name}
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">No. Sertifikat</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {certificates.no_certificate}
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Barang</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {#if certificates.barang_certificate}
            <a
              href={`/barang-certificates/${certificates.barang_certificate.id}`}
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {certificates.barang_certificate.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Project</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {#if certificates.project}
            <a
              href={`/projects/${certificates.project.id}`}
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {certificates.project.name}
            </a>
          {:else}
            -
          {/if}
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Status</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          <span
            class={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${getCertificateStatusBadgeClasses(certificates.status ?? '')}`}
          >
            {certificates.status}
          </span>
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Terbit</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {#if certificates.date_of_issue}
            {formatDate(certificates.date_of_issue)}
          {:else}
            <span class="text-gray-500 dark:text-gray-400">-</span>
          {/if}
        </dd>
      </div>

      <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-300">Tanggal Expired</dt>
        <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-gray-100">
          {#if certificates.date_of_expired}
            {formatDate(certificates.date_of_expired)}
          {:else}
            <span class="text-gray-500 dark:text-gray-400">-</span>
          {/if}
        </dd>
      </div>

      <!-- ====== Lampiran (nama tampil + deskripsi) ====== -->
      <div class="bg-white px-4 py-2 sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-black">
        <dt class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-300">Lampiran</dt>
        <dd class="mt-1 grid grid-cols-1 text-sm sm:col-span-2">
          {#if attachments.length}
            <ul
              role="list"
              class="divide-y divide-gray-100 rounded-md border border-gray-200/80 dark:divide-white/5 dark:border-white/20"
            >
              {#each attachments as file (file.url)}
                <li class="py-4 pr-5 pl-4">
                  <div class="flex items-start gap-3">
                    <!-- Icon -->
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      class="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
                      />
                    </svg>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 dark:text-white"
                          >{file.displayName}</span
                        >
                        {#if file.sizeLabel}
                          <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400"
                            >{file.sizeLabel}</span
                          >
                        {/if}
                      </div>
                      {#if file.desc}
                        <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">{file.desc}</p>
                      {/if}
                    </div>

                    <div class="shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener"
                        download
                        class="inline-flex items-center justify-center rounded-md p-1 text-indigo-600 hover:bg-gray-100
                               hover:text-indigo-700 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                               dark:text-indigo-400 dark:hover:bg-white/10 dark:hover:text-indigo-300"
                        aria-label={`Download ${file.displayName}`}
                        title={`Download ${file.displayName}`}
                      >
                        <svg
                          class="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 3v12m0 0 4-4m-4 4-4-4"></path>
                          <path d="M5 21h14"></path>
                        </svg>
                        <span class="sr-only">Download</span>
                      </a>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <span class="text-gray-500 dark:text-gray-400">Tidak ada file</span>
          {/if}
        </dd>
      </div>
    </dl>
  </div>
{/if}
