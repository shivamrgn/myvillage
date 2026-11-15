import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Eye,
  Settings,
  User,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { complaintService } from '../../services/complaintService';
import { STATUS_CONFIG, STATUS_TYPES } from '../../constants/statusTypes';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';

export const AdminDashboardPage = () => {
  const { t, language, isHindi } = useLanguage();

  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [statsData, complaintsResult] = await Promise.all([
        complaintService.getStats(),
        complaintService.getComplaints({ pageSize: 5 }),
      ]);
      const list = Array.isArray(complaintsResult)
        ? complaintsResult
        : (complaintsResult?.complaints || []);
      setStats(statsData);
      setRecentComplaints(list.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
            {t('admin.dashboardTitle')}
          </h1>
          <p className="text-sm text-civic-muted mt-1">
            {t('admin.dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={() => loadDashboardData(true)}
            isLoading={isRefreshing}
            className="font-semibold min-h-[46px]"
            title={isHindi ? 'डेटा रीफ्रेश करें' : 'Refresh Data'}
          >
            {isHindi ? 'ताज़ा करें' : 'Refresh'}
          </Button>

          <Link to="/admin/complaints">
            <Button icon={FileText} className="font-semibold min-h-[46px]">
              {t('admin.allComplaints')}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview Cards (Interactive: click to filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <Link to="/admin/complaints?status=all" className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="p-5 border-civic-border bg-white flex items-center justify-between transition-all group-hover:border-primary group-hover:shadow-md">
            <div className="space-y-1">
              <p className="text-xs font-bold text-civic-muted uppercase tracking-wider group-hover:text-primary transition-colors">
                {t('admin.totalCount')}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
                {stats.total}
              </p>
              <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-0.5">
                <span>{isHindi ? 'सभी देखें' : 'View all'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] text-[#1769C2] flex items-center justify-center shrink-0 border border-blue-200">
              <FileText className="w-6 h-6" />
            </div>
          </Card>
        </Link>

        {/* Pending Review */}
        <Link to="/admin/complaints?status=pending" className="group block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-2xl">
          <Card className="p-5 border-amber-200 bg-amber-50/40 flex items-center justify-between transition-all group-hover:border-amber-400 group-hover:shadow-md">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#B87D1B] uppercase tracking-wider">
                {t('admin.pendingCount')}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#B87D1B]">
                {stats.pending}
              </p>
              <span className="text-[11px] font-semibold text-[#B87D1B] inline-flex items-center gap-0.5">
                <span>{isHindi ? 'लंबित देखें' : 'View pending'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#B87D1B] flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
          </Card>
        </Link>

        {/* Under Action / In Progress */}
        <Link to="/admin/complaints?status=in_progress" className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="p-5 border-blue-200 bg-primary-light/50 flex items-center justify-between transition-all group-hover:border-primary group-hover:shadow-md">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">
                {t('admin.inProgressCount')}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                {stats.inProgress}
              </p>
              <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-0.5">
                <span>{isHindi ? 'प्रगतिशील देखें' : 'View active'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1769C2] flex items-center justify-center shrink-0 border border-blue-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </Card>
        </Link>

        {/* Resolved */}
        <Link to="/admin/complaints?status=resolved" className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl">
          <Card className="p-5 border-emerald-200 bg-emerald-50/40 flex items-center justify-between transition-all group-hover:border-emerald-400 group-hover:shadow-md">
            <div className="space-y-1">
              <p className="text-xs font-bold text-status-success uppercase tracking-wider">
                {t('admin.resolvedCount')}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-status-success">
                {stats.resolved}
              </p>
              <span className="text-[11px] font-semibold text-status-success inline-flex items-center gap-0.5">
                <span>{isHindi ? 'समाधान देखें' : 'View resolved'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-status-success flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Complaints Section */}
      <Card className="p-0 overflow-hidden border-civic-border bg-white shadow-xs">
        <div className="p-5 sm:p-6 border-b border-civic-border flex items-center justify-between bg-slate-50/40">
          <div>
            <h2 className="text-lg font-bold text-primary-dark">
              {isHindi ? 'हाल ही में दर्ज शिकायतें' : 'Recent Complaints'}
            </h2>
            <p className="text-xs text-civic-muted">
              {isHindi ? 'समीक्षा एवं त्वरित कार्रवाई हेतु' : 'Pending review and assignment'}
            </p>
          </div>

          <Link
            to="/admin/complaints"
            className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>{isHindi ? 'सभी देखें' : 'View All'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="p-12 text-center text-civic-muted text-sm space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>{isHindi ? 'कोई शिकायत उपलब्ध नहीं है।' : 'No complaints recorded yet.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-civic-border">
            {recentComplaints.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {item.ticket_code || item.tracking_id}
                      </span>
                      <Badge variant={statusCfg.badgeVariant} size="sm" dot>
                        {isHindi ? statusCfg.labelHi : statusCfg.labelEn}
                      </Badge>
                      {item.language && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.language}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-civic-text truncate">
                      {item.title || item.description?.slice(0, 50)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-civic-muted">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-civic-muted" />
                        {item.name || item.citizen_name}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-civic-muted" />
                        {item.village || item.village_name || item.ward_number}
                      </span>
                      <span>{formatDate(item.created_at, language)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/admin/complaint/${item.id}`}>
                      <Button size="sm" variant="secondary" icon={Eye}>
                        {t('admin.viewDetails')}
                      </Button>
                    </Link>
                    <Link to={`/admin/manage/${item.id}`}>
                      <Button size="sm" variant="primary" icon={Settings}>
                        {t('admin.manageAction')}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
