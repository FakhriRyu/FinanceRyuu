<script lang="ts">
  import { transactions } from '$lib/stores';
  import { formatCurrency } from '$lib/utils';
  import { X, Download, Heart, Sparkles, Calendar } from 'lucide-svelte';

  let { show = $bindable(false) } = $props();

  // Get unique months and years from transactions
  const availablePeriods = $derived.by(() => {
    const periods = new Set<string>();
    $transactions.forEach(tx => {
      const d = new Date(tx.date);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      periods.add(monthYear);
    });
    return Array.from(periods).sort().reverse();
  });

  let selectedPeriod = $state('');
  let generating = $state(false);

  // Default to current month if available
  $effect(() => {
    if (show && !selectedPeriod && availablePeriods.length > 0) {
      selectedPeriod = availablePeriods[0];
    }
  });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  function getMonthName(period: string) {
    const [year, month] = period.split('-');
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  async function handleDownload() {
    if (!selectedPeriod) return;
    generating = true;

    try {
      const [year, month] = selectedPeriod.split('-');
      const targetMonth = parseInt(month) - 1;
      const targetYear = parseInt(year);

      const periodTxs = $transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalIncome = periodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = periodTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // --- CUTE & FUN DESIGN ELEMENTS ---
      
      // 1. Playful Background Blobs
      doc.setFillColor(255, 245, 247); // Light pink
      doc.rect(0, 0, pageWidth, 64, 'F');
      
      // Fun Decorative Blobs
      doc.setFillColor(252, 231, 243); // Brighter pink
      doc.circle(15, 15, 12, 'F');
      doc.setFillColor(224, 242, 254); // Light blue
      doc.circle(pageWidth - 25, 45, 18, 'F');
      doc.setFillColor(254, 249, 195); // Light yellow
      doc.circle(pageWidth - 65, 15, 8, 'F');
      doc.setFillColor(240, 253, 244); // Light green
      doc.circle(85, 12, 10, 'F');

      // Simple Bear Logo (3 circles)
      doc.setFillColor(248, 113, 113); // Rose 400
      doc.circle(pageWidth - 50, 28, 6, 'F'); // Head
      doc.circle(pageWidth - 54, 24, 2.5, 'F'); // Left Ear
      doc.circle(pageWidth - 46, 24, 2.5, 'F'); // Right Ear

      // 3. Title & Branding
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("Laporan Keuangan", 25, 34);
      
      doc.setFont("times", "italic"); // More editorial/fun
      doc.setFontSize(14);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(getMonthName(selectedPeriod), 25, 44);

      doc.setFont("courier", "bold"); // Techy-fun font
      doc.setTextColor(14, 165, 233); // Soft Blue 500
      doc.setFontSize(14);
      doc.text("FINANCERYUU", pageWidth - 65, 40);

      // 4. Summary Cards (Rounded Rects)
      const cardY = 75;
      const cardWidth = (pageWidth - 40) / 3;
      const cardPadding = 10;

      const drawCard = (x: number, y: number, title: string, amount: number, accentColor: [number, number, number]) => {
        // Shadow/Glow
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        doc.roundedRect(x - 1, y - 1, cardWidth + 2, 28, 5, 5, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        
        // Background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, 26, 5, 5, 'F');
        
        // Accents
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.circle(x + 5, y + 8, 1.5, 'F');
        
        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(title.toUpperCase(), x + 9, y + 9);
        
        // Amount
        doc.setFont("courier", "bold"); // Fun mono font for numbers
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); 
        doc.text(formatCurrency(amount), x + 5, y + 18);
      };

      drawCard(20, cardY, "Pemasukan", totalIncome, [16, 185, 129]); // Emerald
      drawCard(20 + cardWidth + cardPadding, cardY, "Pengeluaran", totalExpense, [244, 63, 94]); // Rose
      drawCard(20 + (cardWidth + cardPadding) * 2, cardY, "Selisih", balance, [99, 102, 241]); // Indigo

      // 5. Transaction Table
      autoTable(doc, {
        startY: cardY + 38,
        head: [['Tanggal', 'Kategori', 'Deskripsi', 'Tipe', 'Jumlah']],
        body: periodTxs.map(tx => [
          new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(tx.date)),
          tx.category,
          tx.description,
          tx.type === 'income' ? 'Masuk' : 'Keluar',
          (tx.type === 'income' ? '+ ' : '- ') + formatCurrency(tx.amount)
        ]),
        margin: { left: 20, right: 20 },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 5,
          textColor: [71, 85, 105], // Slate 600
        },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [148, 163, 184],
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { font: 'courier', fontStyle: 'bold' }, // Fun Mono for Category
          4: { halign: 'right', font: 'courier', fontStyle: 'bold' } // Mono for Amount
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            const val = data.cell.raw as string;
            if (val.startsWith('+')) {
              data.cell.styles.textColor = [16, 185, 129];
            } else if (val.startsWith('-')) {
              data.cell.styles.textColor = [244, 63, 94];
            }
          }
          if (data.section === 'body' && data.column.index === 3) {
             const val = data.cell.raw as string;
             if (val === 'Masuk') data.cell.styles.textColor = [16, 185, 129];
             else data.cell.styles.textColor = [244, 63, 94];
          }
        },
        didDrawPage: (data) => {
           // Footer signature on every page
           doc.setFont("times", "italic");
           doc.setFontSize(8);
           doc.setTextColor(203, 213, 225);
           doc.text("Laporan Keuangan FinanceRyuu", pageWidth/2, doc.internal.pageSize.height - 10, { align: "center" });
        }
      });

      doc.save(`Report_FinanceRyuu_${selectedPeriod}.pdf`);
      show = false;

    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      generating = false;
    }
  }

  function close() {
    if (!generating) show = false;
  }
  $effect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

{#if show}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center animate-fade-in"
    onclick={close}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
    tabindex="0"
    role="button"
    aria-label="Close modal"
  >
    <!-- Modal -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-white w-full sm:max-w-sm rounded-t-[2.5rem] rounded-b-none sm:rounded-[2.5rem] p-8 animate-modal-slide-up shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Drag Handle for Mobile -->
      <div class="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>

      <div class="overflow-y-auto overscroll-contain">
    <!-- Cute Background Elements -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-soft-pink-50 rounded-full opacity-50 blur-2xl"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-soft-blue-50 rounded-full opacity-50 blur-2xl"></div>

    <!-- Header -->
    <div class="flex flex-col items-center text-center space-y-4 mb-8">
      <div class="w-16 h-16 rounded-3xl bg-soft-pink-50 flex items-center justify-center text-soft-pink-500 relative">
        <Download size={32} />
        <div class="absolute -top-1 -right-1">
          <Heart size={16} fill="currentColor" class="text-soft-pink-400" />
        </div>
      </div>
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Unduh Laporan</h2>
        <p class="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Pilih Bulan & Tahun</p>
      </div>
    </div>

    <div class="space-y-6">
      <div class="space-y-2">
        <label for="period" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Periode Laporan</label>
        <div class="relative">
          <Calendar size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <select
            id="period"
            bind:value={selectedPeriod}
            class="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-soft-blue-500/10 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            {#if availablePeriods.length === 0}
              <option value="">Belum ada data</option>
            {/if}
            {#each availablePeriods as period}
              <option value={period}>{getMonthName(period)}</option>
            {/each}
          </select>
        </div>
      </div>

      <button
        onclick={handleDownload}
        disabled={!selectedPeriod || generating}
        class="w-full btn-ocean py-4 rounded-3xl text-sm font-black uppercase tracking-widest justify-center shadow-soft-lg active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
      >
        {#if generating}
          <Sparkles size={18} class="animate-pulse mr-2" />
          Generating...
        {:else}
          Download PDF
        {/if}
      </button>

      <button
        onclick={close}
        disabled={generating}
        class="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors"
      >
        Batalkan
      </button>
      </div>
    </div>
  </div>
</div>
{/if}
