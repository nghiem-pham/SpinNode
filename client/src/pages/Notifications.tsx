import { useState } from 'react';
import { Header } from '../components/Header';
import { Heart, MessageCircle, UserPlus, Share2 } from 'lucide-react';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/app';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { LoadingState } from '../components/ui/loading-state';
import { getErrorMessage } from '../utils/error';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share';
  user: {
    name: string;
    avatar: string;
  };
  content?: string;
  postContent?: string;
  timestamp: string;
  read: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((data) => setNotifications(data.map((item) => ({ ...item, id: String(item.id) }))))
      .catch((error) => toast.error(getErrorMessage(error, 'Failed to load notifications')))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(Number(notificationId));
    setNotifications(notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsRead();
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <div className="max-w-2xl mx-auto px-4">
          <LoadingState />
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="size-5 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="size-5 text-[#009999]" />;
      case 'follow':
        return <UserPlus className="size-5 text-blue-500" />;
      case 'share':
        return <Share2 className="size-5 text-green-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">{notification.user.name}</span> liked your post
            {notification.postContent && (
              <span className="text-gray-600">: "{notification.postContent.slice(0, 50)}..."</span>
            )}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-semibold">{notification.user.name}</span> commented on your post
            {notification.content && (
              <p className="text-gray-600 mt-1">"{notification.content}"</p>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-semibold">{notification.user.name}</span> started following you
          </>
        );
      case 'share':
        return (
          <>
            <span className="font-semibold">{notification.user.name}</span> shared your post
            {notification.postContent && (
              <span className="text-gray-600">: "{notification.postContent.slice(0, 50)}..."</span>
            )}
          </>
        );
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="glass-panel rounded-[28px]">
          {/* Header */}
          <div className="border-b border-white/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-[#009999] hover:text-[#007777] transition"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`pb-2 px-1 border-b-2 transition ${
                  filter === 'all'
                    ? 'border-[#009999] text-[#009999] font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`pb-2 px-1 border-b-2 transition flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'border-[#009999] text-[#009999] font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-white/40">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No {filter === 'unread' ? 'unread' : ''} notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    !notification.read ? 'bg-white/45' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={notification.user.avatar}
                      alt={notification.user.name}
                      className="size-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-start gap-2">
                          {getNotificationIcon(notification.type)}
                          <div className="text-sm text-gray-900">
                            {getNotificationText(notification)}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="size-2 bg-[#009999] rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 ml-7">{notification.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
