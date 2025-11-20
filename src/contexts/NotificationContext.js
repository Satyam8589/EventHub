"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getPusherClient, NOTIFICATION_EVENTS } from "@/lib/pusher";
import toast from "react-hot-toast";

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [pusher, setPusher] = useState(null);

  useEffect(() => {
    // Initialize Pusher client
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    setPusher(pusherClient);

    // Subscribe to the events channel
    const channel = pusherClient.subscribe("events");

    // Listen for new event notifications
    channel.bind(NOTIFICATION_EVENTS.NEW_EVENT, (data) => {
      const notification = {
        id: Date.now(),
        type: "new-event",
        title: "🎉 New Event Available!",
        message: `${data.eventTitle} has been posted`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast.success(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 5000,
          icon: "🎉",
        }
      );
    });

    // Listen for low tickets notifications
    channel.bind(NOTIFICATION_EVENTS.LOW_TICKETS, (data) => {
      const notification = {
        id: Date.now(),
        type: "low-tickets",
        title: "⚠️ Limited Tickets!",
        message: `Only ${data.remainingTickets} tickets left for ${data.eventTitle}`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 5000,
          icon: "⚠️",
          style: {
            background: "#ff9800",
            color: "#fff",
          },
        }
      );
    });

    // Listen for event ongoing notifications
    channel.bind(NOTIFICATION_EVENTS.EVENT_ONGOING, (data) => {
      const notification = {
        id: Date.now(),
        type: "event-ongoing",
        title: "🔴 Event Now Live!",
        message: `${data.eventTitle} is now ongoing`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 6000,
          icon: "🔴",
          style: {
            background: "#f44336",
            color: "#fff",
          },
        }
      );
    });

    // Listen for event updated notifications
    channel.bind(NOTIFICATION_EVENTS.EVENT_UPDATED, (data) => {
      const notification = {
        id: Date.now(),
        type: "event-updated",
        title: "📝 Event Updated",
        message: `${data.eventTitle} has been updated`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 4000,
          icon: "📝",
        }
      );
    });

    // Listen for payment success notifications
    channel.bind(NOTIFICATION_EVENTS.PAYMENT_SUCCESS, (data) => {
      const notification = {
        id: Date.now(),
        type: "payment-success",
        title: "✅ Payment Successful!",
        message: `Your payment for ${data.eventTitle} was successful`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.success(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 5000,
          icon: "✅",
        }
      );
    });

    // Listen for payment pending notifications
    channel.bind(NOTIFICATION_EVENTS.PAYMENT_PENDING, (data) => {
      const notification = {
        id: Date.now(),
        type: "payment-pending",
        title: "⏳ Payment Pending",
        message: `Your payment for ${data.eventTitle} is being processed`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      toast(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 4000,
          icon: "⏳",
          style: {
            background: "#2196f3",
            color: "#fff",
          },
        }
      );
    });

    // Listen for payment failed notifications
    channel.bind(NOTIFICATION_EVENTS.PAYMENT_FAILED, (data) => {
      const notification = {
        id: Date.now(),
        type: "payment-failed",
        title: "❌ Payment Failed",
        message: `Your payment for ${data.eventTitle} failed. Please try again`,
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);

      toast.error(
        <div className="flex flex-col">
          <strong>{notification.title}</strong>
          <span className="text-sm">{notification.message}</span>
        </div>,
        {
          duration: 6000,
          icon: "❌",
        }
      );
    });

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        clearNotification,
        clearAllNotifications,
        pusher,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
