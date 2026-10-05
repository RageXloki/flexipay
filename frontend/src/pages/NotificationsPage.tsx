import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Shield,
  Check
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/');
      if (res.data?.results) {
        setNotifications(res.data.results);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-read/');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await api.post(`/notifications/mark-read/${id}/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_RECEIVED':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
      case 'PAYMENT_SENT':
        return <ArrowUpRight className="w-5 h-5 text-slate-500" />;
      case 'REFUND':
        return <RotateCcw className="w-5 h-5 text-amber-500" />;
      case 'SECURITY_ALERT':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time alerts regarding payment transfers, refunds, requests, and security alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.notification_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkOne(n.id)}
                  className="text-[10px] text-indigo-600 font-semibold hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
