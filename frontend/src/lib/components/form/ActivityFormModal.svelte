<script lang="ts">
  import FileAttachment from '$lib/components/FileAttachment.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { FINANCE_CATEGORIES } from '$lib/constants';
  import { extractActivityFromDocument } from '$lib/services/activityService';
  import { extractApiErrors } from '$lib/utils/errors';
  import { formatFileSize } from '$lib/utils/formatters';
  import { safeAttachmentUrl } from '$lib/utils/url';
  import ActivityFormFields from './ActivityFormFields.svelte';
  import {
    makeDefaultActivityForm,
    type ActivityModalEditForm,
    type ActivityModalForm,
    type ProjectOption,
    type VendorOption
  } from './activity-form';

  /**
   * Activity form modal props. `show` and `form` are bindable for create/edit state.
   */
  let {
    show = $bindable(false),
    title = 'Form Aktivitas',
    submitLabel = 'Simpan',
    idPrefix = 'activity',
    allowRemoveAttachment = true,
    showProjectSelect = true,
    form = $bindable(makeDefaultActivityForm()),
    projects = [],
    vendors = [],
    activityKategoriList = [],
    activityJenisList = [],
    onSubmit
  }: {
    show?: boolean;
    title?: string;
    submitLabel?: string;
    idPrefix?: string;
    allowRemoveAttachment?: boolean;
    showProjectSelect?: boolean;
    form?: ActivityModalForm | ActivityModalEditForm;
    projects?: ProjectOption[];
    vendors?: VendorOption[];
    activityKategoriList?: string[];
    activityJenisList?: string[];
    onSubmit?: () => Promise<void> | void;
  } = $props();

  const MAX_SHORT_DESC = 80;
  const financeCategories: readonly string[] = FINANCE_CATEGORIES;
  let isSubmitting = $state(false);
  let isExtracting = $state(false);
  let aiFileInput: HTMLInputElement | undefined = $state();
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error'>('success');
  let toastVisible = $state(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let selectedProject = $derived(
    projects.find((project) => project.id === Number(form.project_id))
  );
  let showValueInput = $derived(
    Boolean(form.kategori && financeCategories.includes(form.kategori))
  );
  let shortDescLen = $derived(form.short_desc?.length ?? 0);
  let formattedValuePreview = $derived(
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2
    }).format(Number(form.value || 0))
  );

  function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage = message;
    toastType = type;
    toastVisible = true;
    toastTimer = setTimeout(() => {
      toastVisible = false;
    }, 5000);
  }

  function triggerAIFileInput(): void {
    aiFileInput?.click();
  }

  async function handleAIAutoFill(file: File): Promise<void> {
    isExtracting = true;
    try {
      const extracted = await extractActivityFromDocument(file, form.project_id || undefined);
      if (!extracted) throw new Error('Respons AI tidak valid.');

      if (extracted.name) form.name = extracted.name;
      if (extracted.short_desc) form.short_desc = extracted.short_desc.slice(0, MAX_SHORT_DESC);
      if (extracted.description) form.description = extracted.description;
      if (extracted.kategori) form.kategori = extracted.kategori;
      if (extracted.jenis) form.jenis = extracted.jenis;
      if (extracted.value !== undefined && extracted.value !== null)
        form.value = Number(extracted.value);
      if (extracted.activity_date) form.activity_date = extracted.activity_date;
      if (extracted.from !== undefined && extracted.from !== null) form.from = extracted.from;
      if (extracted.to !== undefined && extracted.to !== null) form.to = extracted.to;
      if (extracted.mitra_id !== undefined && extracted.mitra_id !== null)
        form.mitra_id = extracted.mitra_id;

      showToast('Ekstraksi berhasil, silakan periksa kembali data sebelum menyimpan.', 'success');
    } catch (err: unknown) {
      showToast(extractApiErrors(err), 'error');
    } finally {
      isExtracting = false;
      if (aiFileInput) aiFileInput.value = '';
    }
  }

  function onAIFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void handleAIAutoFill(file);
  }

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

  function trimShortDescription(): void {
    form.short_desc = (form.short_desc ?? '').slice(0, MAX_SHORT_DESC);
  }

  function removeExistingAttachment(id: number): void {
    form.removed_existing_ids = [...(form.removed_existing_ids ?? []), id];
    form.existing_attachments = (form.existing_attachments ?? []).filter((item) => item.id !== id);
  }

  $effect(() => {
    if (!showValueInput) form.value = 0;
  });
</script>

<input
  bind:this={aiFileInput}
  type="file"
  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
  class="hidden"
  onchange={onAIFileChange}
  aria-hidden="true"
  tabindex="-1"
  id={`${idPrefix}_ai_file_input`}
/>

{#if toastVisible}
  <div
    role="alert"
    aria-live="polite"
    class="fixed right-5 bottom-5 z-[9999] max-w-sm rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition-all duration-300 {toastType ===
    'success'
      ? 'bg-emerald-600'
      : 'bg-red-600'}"
  >
    {toastMessage}
    <button
      type="button"
      class="ml-3 font-bold opacity-70 hover:opacity-100"
      onclick={() => {
        toastVisible = false;
      }}
      aria-label="Tutup notifikasi"
    >
      &times;
    </button>
  </div>
{/if}

<Modal bind:show {title} maxWidth="max-w-xl">
  {#if form.project_id}
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 dark:text-white">
      Project : {selectedProject?.name}
    </h1>
    <h1 class="mb-4 text-center text-base font-bold tracking-tight text-gray-900 dark:text-white">
      Customer : {selectedProject?.mitra?.nama}
    </h1>
  {/if}

  <div class="mb-5 flex items-center justify-center">
    <button
      type="button"
      id={`${idPrefix}_ai_autofill_btn`}
      onclick={triggerAIFileInput}
      disabled={isExtracting || isSubmitting}
      aria-busy={isExtracting}
      class="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {#if isExtracting}
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-opacity="0.25"
            stroke-width="4"
          ></circle>
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"></path>
        </svg>
        <span>Mengekstrak dokumen...</span>
      {:else}
        <span>Auto-Fill with AI</span>
      {/if}
    </button>
  </div>

  {#if isExtracting}
    <div
      class="mb-4 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
    >
      <span>AI sedang menganalisis dokumen Anda. Ini mungkin memerlukan beberapa detik...</span>
    </div>
  {/if}

  <form onsubmit={handleFormSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting || isExtracting} class="space-y-4">
      <ActivityFormFields
        bind:form
        {idPrefix}
        {showProjectSelect}
        {projects}
        {vendors}
        {activityKategoriList}
        {activityJenisList}
        maxShortDescription={MAX_SHORT_DESC}
        shortDescriptionLength={shortDescLen}
        {showValueInput}
        {formattedValuePreview}
        onTrimShortDescription={trimShortDescription}
      />

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
        class="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || isExtracting}
        aria-busy={isSubmitting}
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

<style>
  :global(.break-all) {
    word-break: break-all;
    overflow-wrap: anywhere;
  }
</style>
