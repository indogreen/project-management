<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import Chart from 'chart.js/auto';
  import type { Chart as ChartJS, ChartOptions } from 'chart.js';
  import {
    fetchDashboardData,
    type DashboardProject,
    type DashboardSeries,
    type DashboardTotals
  } from '$lib/services/dashboardService';
  import { extractApiErrors } from '$lib/utils/errors';
  import { formatDate } from '$lib/utils/formatters';

  // ==== STATE ====
  let loading = $state(true);
  let error = $state('');

  // cards
  let totals = $state<DashboardTotals>({
    total_projects: 0,
    ongoing: 0,
    prospect: 0,
    complete: 0,
    cancel: 0,
    cert_projects: 0,
    cert_active: 0,
    cert_expiring_30: 0
  });

  // list
  let latestProjects = $state<DashboardProject[]>([]);

  // Warna sesuai status (pakai palet Tailwind)
  const STATUS_COLOR: Record<string, string> = {
    Ongoing: '#3B82F6',
    Prospect: '#F59E0B',
    Complete: '#10B981',
    Cancel: '#EF4444'
  };

  // charts data
  let trend = $state<DashboardSeries>({ labels: [], counts: [] });
  let statusDist = $state<DashboardSeries>({ labels: [], counts: [] });
  let kategoriDist = $state<DashboardSeries>({ labels: [], counts: [] });
  let topCustomers = $state<DashboardSeries>({ labels: [], counts: [] });

  // canvas refs — plain let, NOT $state (Chart.js needs raw HTMLCanvasElement)
  let cTrend: HTMLCanvasElement;
  let cStatus: HTMLCanvasElement;
  let cKategori: HTMLCanvasElement;
  let cTopCust: HTMLCanvasElement;

  // chart instances — plain let, NOT $state (Chart.js needs raw references)
  let chartTrend: ChartJS | null = null;
  let chartStatus: ChartJS | null = null;
  let chartKategori: ChartJS | null = null;
  let chartTopCust: ChartJS | null = null;

  // ==== HELPERS ====
  function destroyCharts() {
    chartTrend?.destroy();
    chartStatus?.destroy();
    chartKategori?.destroy();
    chartTopCust?.destroy();
    chartTrend = chartStatus = chartKategori = chartTopCust = null;
  }

  function drawCharts() {
    destroyCharts();
    if (!cTrend || !cStatus || !cKategori || !cTopCust) return;

    const ticksInt = { beginAtZero: true, ticks: { precision: 0 as number, stepSize: 1 } };

    // Unwrap reactive proxies to plain arrays for Chart.js
    const trendLabels = [...trend.labels];
    const trendCounts = [...trend.counts];
    const statusLabels = [...statusDist.labels];
    const statusCounts = [...statusDist.counts];
    const katLabels = [...kategoriDist.labels];
    const katCounts = [...kategoriDist.counts];
    const custLabels = [...topCustomers.labels];
    const custCounts = [...topCustomers.counts];

    // Tren 12 bulan (Line)
    chartTrend = new Chart(cTrend, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [
          {
            label: 'Project',
            data: trendCounts,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'line'>
    });

    // Distribusi status (Doughnut)
    chartStatus = new Chart(cStatus, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [
          {
            data: statusCounts,
            backgroundColor: statusLabels.map((l) => STATUS_COLOR[l] ?? '#9CA3AF'),
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: { legend: { position: 'bottom' } }
      }
    });

    // Project per Kategori (Bar)
    chartKategori = new Chart(cKategori, {
      type: 'bar',
      data: {
        labels: katLabels,
        datasets: [{ label: 'Jumlah', data: katCounts }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'bar'>
    });

    // Top Customer by Project (Horizontal Bar)
    chartTopCust = new Chart(cTopCust, {
      type: 'bar',
      data: {
        labels: custLabels,
        datasets: [{ label: 'Project', data: custCounts }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: { x: ticksInt },
        plugins: { legend: { display: false } }
      } as ChartOptions<'bar'>
    });
  }

  async function fetchDashboard() {
    loading = true;
    error = '';
    try {
      const data = await fetchDashboardData();

      latestProjects = data.latest_projects ?? [];

      totals = {
        ...totals,
        ...(data.totals ?? {})
      };

      trend = data.trend_12_months ?? trend;
      statusDist = data.status_distribution ?? statusDist;
      kategoriDist = data.kategori_distribution ?? kategoriDist;
      topCustomers = data.top_customers ?? topCustomers;
    } catch (e) {
      error = extractApiErrors(e);
      console.error(e);
    } finally {
      loading = false;
      // Wait for Svelte to flush the DOM so <canvas> elements exist
      await tick();
      if (!error) {
        drawCharts();
      }
    }
  }

  onMount(() => {
    void fetchDashboard();
  });
  onDestroy(destroyCharts);

  // badge warna status
  function badge(status: string) {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Ongoing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Prospect':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Cancel':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Indogreen</title>
</svelte:head>

{#if loading}
  <p class="text-gray-900 dark:text-white">Memuat data dashboard...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      <a
        href="/projects"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Lihat Semua Project
      </a>
    </div>

    <!-- Metric cards -->
    <!-- Metric cards Project (Rapih) -->
    <!-- <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-gray-400">Total Project</div>
        <div class="mt-2 text-3xl font-bold text-gray-400">{totals.total_projects}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-blue-400">Ongoing</div>
        <div class="mt-2 text-3xl font-bold text-blue-400">{totals.ongoing}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-yellow-400">Prospect</div>
        <div class="mt-2 text-3xl font-bold text-yellow-400">{totals.prospect}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-emerald-400">Complete</div>
        <div class="mt-2 text-3xl font-bold text-emerald-400">{totals.complete}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-red-400">Cancel</div>
        <div class="mt-2 text-3xl font-bold text-red-400">{totals.cancel}</div>
      </div>
    </div> -->
    <!-- Metric cards Project (Custom) -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div class="col-span-2 rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-gray-400">Total Project</div>
        <div class="mt-2 text-3xl font-bold text-gray-400">{totals.total_projects}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-blue-400">Ongoing</div>
        <div class="mt-2 text-3xl font-bold text-blue-400">{totals.ongoing}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-yellow-400">Prospect</div>
        <div class="mt-2 text-3xl font-bold text-yellow-400">{totals.prospect}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-emerald-400">Complete</div>
        <div class="mt-2 text-3xl font-bold text-emerald-400">{totals.complete}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-red-400">Cancel</div>
        <div class="mt-2 text-3xl font-bold text-red-400">{totals.cancel}</div>
      </div>
    </div>

    <!-- Metric cards Cert Project (Rapih) -->
    <!-- <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-purple-400">Cert Project</div>
        <div class="mt-2 text-3xl font-bold text-purple-400">{totals.cert_projects}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-emerald-400">Sertifikat Aktif</div>
        <div class="mt-2 text-3xl font-bold text-emerald-400">{totals.cert_active}</div>
      </div>
      <div class="rounded-xl p-4 bg-white dark:bg-neutral-900 shadow">
        <div class="text-xs text-orange-400">Expired ≤ 30 hari</div>
        <div class="mt-2 text-3xl font-bold text-orange-400">{totals.cert_expiring_30}</div>
      </div>
    </div> -->
    <!-- Metric cards Cert Project (Custom) -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="col-span-2 rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-purple-400">Cert Project</div>
        <div class="mt-2 text-3xl font-bold text-purple-400">{totals.cert_projects}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-emerald-400">Sertifikat Aktif</div>
        <div class="mt-2 text-3xl font-bold text-emerald-400">{totals.cert_active}</div>
      </div>
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="text-xs text-red-400">Expired ≤ 30 hari</div>
        <div class="mt-2 text-3xl font-bold text-red-400">{totals.cert_expiring_30}</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Tren Project 12 Bulan
        </div>
        <div class="h-[280px] w-full">
          <canvas bind:this={cTrend} class="h-full w-full"></canvas>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Distribusi Status
        </div>
        <div class="h-[280px] w-full">
          <canvas bind:this={cStatus} class="h-full w-full"></canvas>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Project per Kategori
        </div>
        <div class="h-[280px] w-full">
          <canvas bind:this={cKategori} class="h-full w-full"></canvas>
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow dark:bg-neutral-900">
        <div class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Top Customer (by Project)
        </div>
        <div class="h-[280px] w-full">
          <canvas bind:this={cTopCust} class="h-full w-full"></canvas>
        </div>
      </div>
    </div>

    <!-- Project Terbaru -->
    <div class="mt-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Project Terbaru</h2>
        <a href="/projects" class="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >Lihat semua</a
        >
      </div>
      <div class="mt-3 overflow-hidden bg-white shadow sm:rounded-md dark:bg-black">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          {#if latestProjects.length === 0}
            <li class="px-4 py-4 sm:px-6">
              <p class="text-sm text-gray-500 dark:text-gray-300">Belum ada project terbaru.</p>
            </li>
          {:else}
            {#each latestProjects as project (project.id)}
              <li>
                <a
                  href={`/projects/${project.id}`}
                  class="block px-4 py-4 hover:bg-gray-50 sm:px-6 dark:hover:bg-neutral-950"
                >
                  <div class="flex items-center justify-between">
                    <p class="truncate text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {project.name}
                    </p>
                    <div class="ml-2 flex flex-shrink-0 gap-2">
                      <span
                        class={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${badge(project.status)}`}
                        >{project.status}</span
                      >
                      {#if project.is_cert_projects}
                        <span
                          class="inline-flex rounded-full bg-purple-100 px-2 text-xs leading-5 font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          >Certificate</span
                        >
                      {/if}
                    </div>
                  </div>
                  <div class="mt-1 sm:flex sm:justify-between">
                    <p class="text-sm text-gray-500 dark:text-gray-300">
                      Customer: {project.mitra?.nama || '-'}
                      | Deskripsi: {(project.description ?? '').substring(0, 60)}{(project
                        .description?.length ?? 0) > 60
                        ? '...'
                        : ''}
                    </p>
                    <p class="mt-1 text-sm text-gray-500 sm:mt-0 dark:text-gray-300">
                      Mulai: {formatDate(project.start_date, 'long')}
                    </p>
                  </div>
                </a>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>
  </div>
{/if}
