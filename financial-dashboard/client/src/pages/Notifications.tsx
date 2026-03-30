import { useState, useEffect } from "react";
import { Bell, Check, X, UserPlus, AlertCircle, MessageSquare } from "lucide-react";
import { collaborationApi } from "../lib/api";
import { Notification } from "../lib/types";
import { cn } from "../lib/utils";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await collaborationApi.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        setError(response.error || "Failed to load notifications");
      }
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await collaborationApi.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const acceptInvitation = async (notification: Notification) => {
    try {
      const dashboardId = notification.data?.dashboardId as string;
      if (!dashboardId) return;

      await collaborationApi.acceptInvitation(dashboardId);
      await markAsRead(notification.id);
      // Refresh notifications to show updated status
      await loadNotifications();
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  const declineInvitation = async (notification: Notification) => {
    try {
      const dashboardId = notification.data?.dashboardId as string;
      if (!dashboardId) return;

      await collaborationApi.declineInvitation(dashboardId);
      await markAsRead(notification.id);
      // Refresh notifications to show updated status
      await loadNotifications();
    } catch (err) {
      console.error("Failed to decline invitation:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'dashboard_invitation':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'transaction_alert':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'budget_alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'system':
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your financial activity</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your financial activity</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Notifications</h3>
            <p className="text-slate-500">{error}</p>
            <button
              onClick={loadNotifications}
              className="mt-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your financial activity</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-[#4f46e5] text-white px-3 py-1 rounded-full text-sm font-medium">
            {unreadCount} unread
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">No notifications yet</h3>
            <p className="text-slate-500">You'll see invitations and alerts here when they arrive.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-6 hover:bg-slate-50 transition-colors",
                  !notification.isRead && "bg-blue-50/50"
                )}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.type === 'dashboard_invitation' && !notification.isRead && (
                          <>
                            <button
                              onClick={() => acceptInvitation(notification)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => declineInvitation(notification)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}