<script lang="ts">
  import FileAttachment from '$lib/components/FileAttachment.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { formatFileSize } from '$lib/utils/formatters';
  import { safeAttachmentUrl } from '$lib/utils/url';
  import type { ExistingAttachment, Option } from '$lib/types';

  type ModalExistingAttachment = Omit<ExistingAttachment, 'path' | 'url'> & {
    path?: string;
    url?: string | null;
  };

  type CertificateModalForm = {
    name: string;
    no_certificate: string;
    project_id: number | string | '' | null;
    barang_certificate_id: number | string | '' | null;
    status: string;
    date_of_issue?: string | null;
    date_of_expired?: string | null;
    attachments: File[];
    attachment_names: string[];
    attachment_descriptions: string[];
    existing_attachments?: ModalExistingAttachment[];
    removed_existing_ids?: number[];
  };

  type ProjectOption = { id: number; name?: string; title?: string };

  function makeDefaultForm(): CertificateModalForm {
    return {
      name: '',
      no_certificate: '',
      project_id: '',
      barang_certificate_id: '',
      status: '',
      date_of_issue: '',
      date_of_expired: '',
      attachments: [],
      attachment_names: [],
      attachment_descriptions: []
    };
  }

  /**
   * Certificate form modal props. `show` and `form` are bindable for create/edit flows.
   */
  let {
    show = $bindable(false),
    title = 'Form Sertifikat',
    submitLabel = 'Simpan',
    idPrefix = 'certificate',
    allowRemoveAttachment = true,
    showProjectSelect = true,
    onClose,
    form = $bindable(makeDefaultForm()),
    projects = [],
    barangOptions = [],
    statuses = [],
    handleProjectChange,
    onSubmit
  }: {
    show?: boolean;
    title?: string;
    submitLabel?: string;
    idPrefix?: string;
    allowRemoveAttachment?: boolean;
    showProjectSelect?: boolean;
    onClose?: () => void;
    form?: CertificateModalForm;
    projects?: ProjectOption[];
    barangOptions?: Option[];
    statuses?: string[];
    handleProjectChange?: (projectId: number | '' | null) => void;
    onSubmit?: () => void | Promise<void>;
  } = $props();

  let isSubmitting = $state(false);

  async function handleSubmit(): Promise<void> {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      await onSubmit?.();
    } finally {
      isSubmitting = false;
    }
  }

  function handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void handleSubmit();
  }

  function handleProjectSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    handleProjectChange?.(value ? Number(value) : '');
  }

  function removeExistingAttachment(id: number): void {
    form.removed_existing_ids = [...(form.removed_existing_ids ?? []), id];
    form.existing_attachments = (form.existing_attachments ?? []).filter((item) => item.id !== id);
  }
</script>

<Modal bind:show {title} maxWidth="max-w-xl" {onClose}>
  <form onsubmit={handleFormSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label
          for={`${idPrefix}_name`}
          class="block text-sm font-medium text-gray-900 dark:text-white">Nama</label
        >
        <input
          id={`${idPrefix}_name`}
          type="text"
          bind:value={form.name}
          required
          placeholder="Masukkan nama sertifikat"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label
          for={`${idPrefix}_no_certificate`}
          class="block text-sm font-medium text-gray-900 dark:text-white">No Sertifikat</label
        >
        <input
          id={`${idPrefix}_no_certificate`}
          type="text"
          bind:value={form.no_certificate}
          required
          placeholder="Masukkan nomor sertifikat"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
        />
      </div>

      {#if showProjectSelect}
        <div>
          <label
            for={`${idPrefix}_project`}
            class="block text-sm font-medium text-gray-900 dark:text-white">Project</label
          >
          <select
            id={`${idPrefix}_project`}
            bind:value={form.project_id}
            required
            onchange={handleProjectSelectChange}
            class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
          >
            <option value="">Pilih Project</option>
            {#each projects as project (project.id)}<option value={project.id}
                >{project.name ?? project.title}</option
              >{/each}
          </select>
        </div>
      {/if}

      <div>
        <label
          for={`${idPrefix}_barang_certificate`}
          class="block text-sm font-medium text-gray-900 dark:text-white">Barang Certificate</label
        >
        <select
          id={`${idPrefix}_barang_certificate`}
          bind:value={form.barang_certificate_id}
          required
          disabled={barangOptions.length === 0}
          class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
        >
          <option value=""
            >{barangOptions.length === 0
              ? 'Pilih Project terlebih dahulu'
              : 'Pilih Barang Certificate'}</option
          >
          {#each barangOptions as barang (barang.id)}
            <option value={barang.id}
              >{barang.name ?? barang.title}
              {#if barang.no_seri}- {barang.no_seri}{/if}</option
            >
          {/each}
        </select>
        {#if (showProjectSelect ? form.project_id : true) && barangOptions.length === 0}
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tidak ada Barang Certificate untuk Project ini
          </p>
        {/if}
      </div>

      <div>
        <label
          for={`${idPrefix}_status`}
          class="block text-sm font-medium text-gray-900 dark:text-white">Status</label
        >
        <select
          id={`${idPrefix}_status`}
          bind:value={form.status}
          required
          class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
        >
          <option value="">Pilih Status</option>
          {#each statuses as status (status)}<option value={status}>{status}</option>{/each}
        </select>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            for={`${idPrefix}_date_of_issue`}
            class="block text-sm font-medium text-gray-900 dark:text-white">Tanggal Terbit</label
          >
          <input
            id={`${idPrefix}_date_of_issue`}
            type="date"
            bind:value={form.date_of_issue}
            class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label
            for={`${idPrefix}_date_of_expired`}
            class="block text-sm font-medium text-gray-900 dark:text-white">Tanggal Expired</label
          >
          <input
            id={`${idPrefix}_date_of_expired`}
            type="date"
            bind:value={form.date_of_expired}
            class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100"
          />
        </div>
      </div>

      <FileAttachment
        id={`${idPrefix}_attachments`}
        label="Lampiran"
        bind:files={form.attachments}
        bind:fileNames={form.attachment_names}
        bind:fileDescriptions={form.attachment_descriptions}
        maxFiles={10}
        showRemoveButton={allowRemoveAttachment}
      />

      {#if form.existing_attachments && form.existing_attachments.length > 0}
        <div class="mt-3 space-y-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Lampiran Lama</p>
          {#each form.existing_attachments as attachment (attachment.id)}
            <div class="space-y-2 rounded border px-3 py-2 text-sm dark:border-gray-700">
              <a
                class="truncate text-indigo-600 hover:underline dark:text-indigo-400"
                href={safeAttachmentUrl(attachment.url ?? attachment.path)}
                target="_blank"
                rel="noreferrer">{attachment.original_name ?? attachment.name}</a
              >
              <input
                type="text"
                bind:value={attachment.name}
                required
                placeholder="Nama lampiran"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                bind:value={attachment.description}
                placeholder="Deskripsi lampiran"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div class="flex items-center justify-end gap-3">
                {#if attachment.size}<span class="text-gray-500 dark:text-gray-400"
                    >{formatFileSize(attachment.size)}</span
                  >{/if}
                <button
                  type="button"
                  class="text-red-600 hover:text-red-700"
                  onclick={() => removeExistingAttachment(attachment.id)}>Hapus</button
                >
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </fieldset>

    <div class="mt-6">
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        class="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {#if isSubmitting}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            ><circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-opacity="0.25"
              stroke-width="4"
            ></circle><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"
            ></path></svg
          >
          <span>Menyimpan...</span>
        {:else}
          {submitLabel}
        {/if}
      </button>
    </div>
  </form>
</Modal>
