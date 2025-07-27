import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null);

  const addNotification = useCallback((message, type = 'error') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setNotification({ message, type });

    timeoutRef.current = setTimeout(() => {
      setNotification(null);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = { addNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification message={notification?.message} type={notification?.type} />
    </NotificationContext.Provider> // <-- THE FIX IS HERE
  );
};

const Notification = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!message && !visible) return null;

  return (
    <div className={`notification-popup ${type} ${visible ? 'visible' : ''}`}>
      {message}
    </div>
  );
};
