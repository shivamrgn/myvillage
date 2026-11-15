import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Settings,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Tag,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { complaintService } from '../../services/complaintService';
import { STATUS_CONFIG, STATUS_TYPES } from '../../constants/statusTypes';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const ComplaintListingPage = () => {
  const { t, language, isHindi } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query parameters (e.g. from Dashboard KPI cards)
  const initialStatus = searchParams.get('status') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 10, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── Filters State ──────────────────────────────────────────────────────────
  const [ticketSearch, setTicketSearch] = useState(initialSearch);
  const [nameSearch, setNameSearch] = useState('');
  const [debouncedTicketSearch, setDebouncedTicketSearch] = useState(initialSearch);
  const [debouncedNameSearch, setDebouncedNameSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedLanguage, setSelectedLanguage] = useState('all'); // 'all' | 'hi' | 'en'
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all' | 'today' | '7days' | '30days' | 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search queries (300ms) to prevent unnecessary duplicate requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTicketSearch(ticketSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [ticketSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameSearch(nameSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameSearch]);

  // Calculate actual Date From and Date To based on dateFilterMode (timezone-aware)
  const { computedDateFrom, computedDateTo } = useMemo(() => {
    const now = new Date();
    if (dateFilterMode === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      return { computedDateFrom: startOfToday, computedDateTo: endOfToday };
    }
    if (dateFilterMode === '7days') {
      const start7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0).toISOString();
      return { computedDateFrom: start7DaysAgo, computedDateTo: '' };
    }
    if (dateFilterMode === '30days') {
      const start30DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0).toISOString();
      return { computedDateFrom: start30DaysAgo, computedDateTo: '' };
    }
    if (dateFilterMode === 'custom') {
      const from = customDateFrom
        ? (customDateFrom.includes('T') ? customDateFrom : new Date(`${customDateFrom}T00:00:00`).toISOString())
        : '';
      const to = customDateTo
        ? (customDateTo.includes('T') ? customDateTo : new Date(`${customDateTo}T23:59:59.999`).toISOString())
        : '';
      return { computedDateFrom: from, computedDateTo: to };
    }
    return { computedDateFrom: '', computedDateTo: '' };
  }, [dateFilterMode, customDateFrom, customDateTo]);

  // Load complaints whenever filters or pagination change
  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await complaintService.getComplaints({
        ticketCode: debouncedTicketSearch.trim(),
        name:       debouncedNameSearch.trim(),
        status:     selectedStatus,
        language:   selectedLanguage,
        dateFrom:   computedDateFrom,
        dateTo:     computedDateTo,
        page:       currentPage,
        pageSize:   pageSize,
      });

      if (Array.isArray(result)) {
        setComplaints(result);
        setPagination({ total: result.length, page: 1, page_size: pageSize, pages: 1 });
      } else {
        setComplaints(result.complaints || []);
        setPagination(result.pagination || { total: 0, page: 1, page_size: pageSize, pages: 1 });
      }
    } catch (err) {
      console.error('Error loading complaints listing:', err);
      setFetchError(err.message || (isHindi ? 'शिकायतें लोड करने में त्रुटि हुई।' : 'Failed to retrieve complaints.'));
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedTicketSearch,
    debouncedNameSearch,
    selectedStatus,
    selectedLanguage,
    computedDateFrom,
    computedDateTo,
    currentPage,
    pageSize,
    isHindi,
  ]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setTicketSearch('');
    setNameSearch('');
    setDebouncedTicketSearch('');
    setDebouncedNameSearch('');
    setSelectedStatus('all');
    setSelectedLanguage('all');
    setDateFilterMode('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    ticketSearch ||
    nameSearch ||
    selectedStatus !== 'all' ||
    selectedLanguage !== 'all' ||
    dateFilterMode !== 'all';

  // Export current list as CSV for Gram Sabha / Administrative records
  const exportToCSV = () => {
    if (!complaints.length) return;

    const headers = [
      'Complaint ID',
      'Villager Name',
      'Contact Number',
      'Village',
      'Language',
      'Complaint Summary',
      'Status',
      'Submission Date',
      'Assigned Staff',
      'Admin Remarks',
    ];

    const rows = complaints.map((c) => [
      c.ticket_code || c.tracking_id,
      `"${c.name || c.citizen_name || ''}"`,
      c.phone || '',
      `"${c.village || c.village_name || c.ward_number || ''}"`,
      c.language || 'hi',
      `"${(c.title || c.description || '').replace(/"/g, '""').slice(0, 120)}"`,
      c.status || '',
      formatDate(c.created_at, 'en'),
      `"${c.assigned_to || ''}"`,
      `"${(c.admin_notes || c.panchayat_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `gram_samadhan_complaints_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── HEADER & EXPORT ACTION ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
            {t('admin.allComplaints')}
          </h1>
          <p className="text-sm text-civic-muted mt-1">
            {isHindi
              ? 'ग्राम पंचायत के अंतर्गत दर्ज सभी जन-शिकायतों की विस्तृत सूची, स्थिति एवं संपर्क'
              : 'Master register of public grievances with citizen contacts and resolution tracking'}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          icon={Download}
          onClick={exportToCSV}
          disabled={complaints.length === 0}
          className="w-full sm:w-auto font-semibold min-h-[44px] justify-center text-xs sm:text-sm"
        >
          {isHindi ? 'CSV रिपोर्ट डाउनलोड करें' : 'Export CSV Report'}
        </Button>
      </div>

      {/* ── ADVANCED FILTERING PANEL ───────────────────────────────────────────── */}
      <Card className="p-4 sm:p-5 bg-white border-civic-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-primary-dark font-bold text-sm">
            <Filter className="w-4 h-4 text-primary" />
            <span>{isHindi ? 'शिकायत खोज एवं फिल्टर' : 'Search & Filter Grievances'}</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'फिल्टर हटाएं' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* First Row of Filters: Complaint ID search, Villager Name search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by Complaint ID */}
          <div className="relative">
            <Search className="w-4 h-4 text-civic-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ticketSearch}
              onChange={(e) => {
                setTicketSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isHindi ? 'शिकायत ID (उदा. GS-2026)' : 'Filter by Complaint ID'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-civic-border text-xs sm:text-sm text-civic-text placeholder-civic-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
            />
          </div>

          {/* Search by Villager Name */}
          <div className="relative">
            <User className="w-4 h-4 text-civic-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => {
                setNameSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isHindi ? 'नागरिक नाम से खोजें' : 'Filter by Villager Name'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-civic-border text-xs sm:text-sm text-civic-text placeholder-civic-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
            />
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-civic-border bg-white text-xs sm:text-sm font-semibold text-civic-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              aria-label={t('admin.filterStatus')}
            >
              <option value="all">{isHindi ? 'सभी स्थितियां (All Status)' : 'All Statuses'}</option>
              <option value={STATUS_TYPES.PENDING}>
                {isHindi ? STATUS_CONFIG[STATUS_TYPES.PENDING].labelHi : STATUS_CONFIG[STATUS_TYPES.PENDING].labelEn}
              </option>
              <option value={STATUS_TYPES.IN_PROGRESS}>
                {isHindi ? STATUS_CONFIG[STATUS_TYPES.IN_PROGRESS].labelHi : STATUS_CONFIG[STATUS_TYPES.IN_PROGRESS].labelEn}
              </option>
              <option value={STATUS_TYPES.RESOLVED}>
                {isHindi ? STATUS_CONFIG[STATUS_TYPES.RESOLVED].labelHi : STATUS_CONFIG[STATUS_TYPES.RESOLVED].labelEn}
              </option>
            </select>
          </div>

          {/* Filter by Language */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-civic-border bg-white text-xs sm:text-sm font-semibold text-civic-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              aria-label="Filter by Language"
            >
              <option value="all">{isHindi ? 'सभी भाषाएं (All Languages)' : 'All Languages'}</option>
              <option value="hi">{isHindi ? 'हिन्दी (Hindi)' : 'Hindi (हिन्दी)'}</option>
              <option value="en">{isHindi ? 'अंग्रेजी (English)' : 'English'}</option>
            </select>
          </div>
        </div>

        {/* Second Row: Date Filtering presets & custom range */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-civic-muted flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isHindi ? 'दर्ज दिनांक:' : 'Date:'}</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', labelHi: 'सभी समय', labelEn: 'All Time' },
              { id: 'today', labelHi: 'आज', labelEn: 'Today' },
              { id: '7days', labelHi: 'पिछले 7 दिन', labelEn: 'Last 7 Days' },
              { id: '30days', labelHi: 'पिछले 30 दिन', labelEn: 'Last 30 Days' },
              { id: 'custom', labelHi: 'कस्टम अवधि', labelEn: 'Custom Range' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDateFilterMode(d.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                  dateFilterMode === d.id
                    ? 'bg-[#1769C2] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {isHindi ? d.labelHi : d.labelEn}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers when custom mode is chosen */}
          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => {
                  setCustomDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Date From"
                className="px-2.5 py-1 rounded-lg border border-civic-border text-xs text-civic-text"
              />
              <span className="text-civic-muted font-bold">—</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => {
                  setCustomDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Date To"
                className="px-2.5 py-1 rounded-lg border border-civic-border text-xs text-civic-text"
              />
            </div>
          )}
        </div>
      </Card>

      {/* ── ERROR STATE ────────────────────────────────────────────────────────── */}
      {fetchError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-status-error text-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadComplaints()}>
            {isHindi ? 'पुनः प्रयास करें' : 'Retry'}
          </Button>
        </div>
      )}

      {/* ── LOADING OR EMPTY STATE ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner text={t('common.loading')} />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="p-12 text-center text-civic-muted space-y-3 bg-white border-civic-border">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-civic-text">
            {isHindi ? 'खोज मानदंडों के अनुरूप कोई शिकायत नहीं मिली।' : 'No complaints matched your search filter.'}
          </p>
          <p className="text-xs text-civic-muted">
            {isHindi ? 'कृपया अपने फिल्टर बदलकर पुनः प्रयास करें।' : 'Try clearing filters or search terms.'}
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="secondary" onClick={handleResetFilters} icon={RotateCcw}>
              {isHindi ? 'सभी फिल्टर हटाएं' : 'Clear All Filters'}
            </Button>
          )}
        </Card>
      ) : (
        /* ── COMPLAINT TABLE (SPECIFIED COLUMNS) ────────────────────────────────── */
        <Card className="p-0 overflow-hidden border-civic-border bg-white shadow-xs">
          {/* Table Header Summary */}
          <div className="p-4 bg-slate-50/70 border-b border-civic-border flex flex-wrap items-center justify-between gap-2 text-xs text-civic-muted">
            <p>
              {isHindi ? 'कुल परिणाम: ' : 'Showing: '}
              <span className="font-bold text-civic-text">{pagination.total}</span>
              {isHindi ? ' शिकायतें' : ' total grievances'}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="pageSizeSelect" className="font-semibold">
                {isHindi ? 'प्रति पृष्ठ:' : 'Per page:'}
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-md border border-civic-border bg-white text-xs font-semibold text-civic-text"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary-light/40 border-b border-civic-border text-xs font-bold text-primary-dark uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('admin.colId')}</th>
                  <th className="py-3.5 px-4">{isHindi ? 'नागरिक नाम' : 'Villager Name'}</th>
                  <th className="py-3.5 px-4">{isHindi ? 'संपर्क नंबर' : 'Contact Number'}</th>
                  <th className="py-3.5 px-4">{t('admin.colVillage')}</th>
                  <th className="py-3.5 px-4">{isHindi ? 'शिकायत सारांश' : 'Complaint Summary'}</th>
                  <th className="py-3.5 px-4">{t('admin.colDate')}</th>
                  <th className="py-3.5 px-4">{t('admin.colStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-civic-border text-sm">
                {complaints.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Complaint ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary whitespace-nowrap">
                        <Link
                          to={`/admin/complaint/${item.id}`}
                          className="hover:underline"
                          title="View complaint details"
                        >
                          {item.ticket_code || item.tracking_id}
                        </Link>
                      </td>

                      {/* 2. Villager Name */}
                      <td className="py-3.5 px-4 font-bold text-civic-text whitespace-nowrap">
                        {item.name || item.citizen_name}
                      </td>

                      {/* 3. Contact Number (Clickable Call Link) */}
                      <td className="py-3.5 px-4 text-xs font-mono whitespace-nowrap">
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone}`}
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                            title={isHindi ? 'कॉल करें' : 'Call Villager'}
                          >
                            <Phone className="w-3 h-3 text-civic-muted" />
                            <span>{item.phone}</span>
                          </a>
                        ) : (
                          <span className="text-civic-muted">—</span>
                        )}
                      </td>

                      {/* 4. Village */}
                      <td className="py-3.5 px-4 text-xs text-civic-muted whitespace-nowrap">
                        {item.village || item.village_name || item.ward_number}
                      </td>

                      {/* 5. Complaint Summary (Title & Description snippet) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-xs text-civic-text truncate">
                          {item.title || item.description?.slice(0, 40)}
                        </p>
                        <p className="text-[11px] text-civic-muted truncate mt-0.5">
                          {item.description}
                        </p>
                      </td>

                      {/* 6. Submission Date */}
                      <td className="py-3.5 px-4 text-xs text-civic-muted whitespace-nowrap">
                        {formatDate(item.created_at, language)}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={statusCfg.badgeVariant} size="sm" dot>
                          {isHindi ? statusCfg.labelHi : statusCfg.labelEn}
                        </Badge>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/complaint/${item.id}`}>
                            <Button size="sm" variant="secondary" icon={Eye} className="h-8 px-2.5 text-xs">
                              {t('admin.viewDetails')}
                            </Button>
                          </Link>
                          <Link to={`/admin/manage/${item.id}`}>
                            <Button size="sm" variant="primary" icon={Settings} className="h-8 px-2.5 text-xs">
                              {t('admin.manageAction')}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Responsive Cards View */}
          <div className="lg:hidden divide-y divide-civic-border">
            {complaints.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

              return (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-lg border border-blue-200 whitespace-nowrap">
                      {item.ticket_code || item.tracking_id}
                    </span>
                    <Badge variant={statusCfg.badgeVariant} size="sm" dot>
                      {isHindi ? statusCfg.labelHi : statusCfg.labelEn}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-civic-text">
                      {item.title || item.description?.slice(0, 50)}
                    </h3>
                    <p className="text-xs text-civic-muted line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-civic-muted border-t border-slate-100">
                    <div className="flex items-center gap-1 font-semibold text-civic-text truncate">
                      <User className="w-3.5 h-3.5 text-civic-muted shrink-0" />
                      <span className="truncate">{item.name || item.citizen_name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-primary font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-civic-muted shrink-0" />
                      <a href={`tel:${item.phone}`} className="hover:underline">
                        {item.phone || '—'}
                      </a>
                    </div>

                    <div className="flex items-center gap-1 truncate col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-civic-muted shrink-0" />
                      <span className="truncate">{item.village || item.village_name || item.ward_number}</span>
                      <span className="text-slate-300">•</span>
                      <span>{formatDate(item.created_at, language)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link to={`/admin/complaint/${item.id}`} className="flex-1">
                      <Button size="sm" variant="secondary" icon={Eye} className="w-full min-h-[40px] text-xs font-bold whitespace-nowrap justify-center">
                        {t('admin.viewDetails')}
                      </Button>
                    </Link>
                    <Link to={`/admin/manage/${item.id}`} className="flex-1">
                      <Button size="sm" variant="primary" icon={Settings} className="w-full min-h-[40px] text-xs font-bold whitespace-nowrap justify-center">
                        {t('admin.manageAction')}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── PAGINATION CONTROLS ──────────────────────────────────────────────── */}
          <div className="p-4 bg-slate-50/70 border-t border-civic-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-civic-muted">
              {isHindi ? 'पृष्ठ ' : 'Page '}
              <strong className="text-civic-text">{pagination.page}</strong>
              {isHindi ? ' / ' : ' of '}
              <strong className="text-civic-text">{Math.max(1, pagination.pages)}</strong>
              {' '}({pagination.total} {isHindi ? 'कुल' : 'total'})
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="font-semibold h-9 px-3"
              >
                {isHindi ? 'पिछला' : 'Previous'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="font-semibold h-9 px-3"
              >
                {isHindi ? 'अगला' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
