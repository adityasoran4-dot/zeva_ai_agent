// components/DoctorDesktimeTracker.jsx
'use client';
import { useEffect } from 'react';
import axios from 'axios';

const DoctorDesktimeTracker = () => {
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    if (!token) return;

    let lastActivity = Date.now();
    let idleTimer = null;
    let visibilityInterval = null;

    const IDLE_THRESHOLD = 3 * 60 * 1000; // 3 minutes

    const report = async (type, durationSec) => {
      if (durationSec < 1) return;
      try {
        await axios.post(`/api/doctor/work-session/${type}`, { duration: durationSec }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(`Failed to report doctor ${type}:`, err.response?.data || err.message);
      }
    };

    const resetActivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivity;

      // Report productive time for the active period
      if (elapsed >= 1 && document.visibilityState === 'visible') {
        const activeSec = Math.floor(elapsed / 1000);
        report('mouse-activity', activeSec);
      }

      // If long enough also report idle before activity resumed
      if (elapsed >= IDLE_THRESHOLD) {
        const idleSec = Math.floor((elapsed - IDLE_THRESHOLD) / 1000);
        if (idleSec > 0 && document.visibilityState === 'visible') {
          report('idle', idleSec);
        }
      }

      lastActivity = now;
      clearTimeout(idleTimer);
      idleTimer = null;
    };

    const startIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const now = Date.now();
        const idleSec = Math.floor((now - lastActivity) / 1000);
        if (idleSec > 0 && document.visibilityState === 'visible') {
          report('idle', idleSec);
        }
      }, IDLE_THRESHOLD + 1000);
    };

    const handleVisibility = () => {
      const now = Date.now();

      if (document.visibilityState === 'visible') {
        const awaySec = Math.floor((now - lastActivity) / 1000);
        if (awaySec >= 30) {
          report('desktime', awaySec);
        }
        lastActivity = now;
        startIdleTimer();
      } else {
        const activeSec = Math.floor((now - lastActivity) / 1000);
        if (activeSec > 0) {
          report('desktime', activeSec);
          report('mouse-activity', activeSec);
        }
        lastActivity = now;
        clearTimeout(idleTimer);
      }
    };

    const handleInput = () => {
      if (document.visibilityState === 'visible') {
        resetActivity();
        startIdleTimer();
      }
    };

    // Safety net (every 30s)
    visibilityInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const elapsed = now - lastActivity;

        if (elapsed >= IDLE_THRESHOLD) {
          const idleSec = Math.floor((elapsed - IDLE_THRESHOLD) / 1000);
          if (idleSec > 0) {
            report('idle', idleSec);
            lastActivity = now - (idleSec * 1000);
          }
        } else if (elapsed >= 5) {
          report('mouse-activity', Math.floor(elapsed / 1000));
          lastActivity = now;
        }
      }
    }, 30000);

    // Mark arrival on initial load
    const markArrival = async () => {
      try {
        await axios.post(
          '/api/doctor/work-session/arrival',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error('Arrival time error');
      }
    };

    markArrival();

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibility);
    ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, handleInput, { passive: true });
    });

    // Initial start
    lastActivity = Date.now();
    startIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart'].forEach(evt => {
        window.removeEventListener(evt, handleInput);
      });
      clearInterval(visibilityInterval);
      clearTimeout(idleTimer);
    };
  }, []);

  return null;
};

export default DoctorDesktimeTracker;