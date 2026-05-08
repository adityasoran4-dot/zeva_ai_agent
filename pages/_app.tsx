import type { AppProps } from "next/app";
import { useEffect, useState, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { DefaultSeo } from "next-seo";
import { Toaster } from "react-hot-toast";
import Layout from "../components/Layout";
import AgentLayout from "../components/AgentLayout";
import SEO from "../next-seo.config";
import "../styles/globals.css";
import { SearchProvider } from "../context/SearchContext";
import { AuthProvider } from "../context/AuthContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { LoadScript } from "@react-google-maps/api";
import Loader from "../components/Loader";
import html2canvas from "html2canvas";
import axios from "axios";
import AgentDesktimeTracker from "../components/AgentDesktimeTracker";
import DoctorDesktimeTracker from "../components/DoctorDesktimeTracker";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type NextPageWithLayout = AppProps["Component"] & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Helper function to decode JWT and get user role
const getUserRoleFromToken = (token: string | null): string | null => {
  if (!token) return null;

  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split(".")[1];
    if (!payload) return null;

    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload.role || null;
  } catch (error) {
    console.warn("[Role Check] Failed to decode token:", error);
    return null;
  }
};

// Helper function to check if user is an agent
const isAgentUser = (token: string | null): boolean => {
  const role = getUserRoleFromToken(token);
  return role === "agent"; // Only 'agent' role should have screenshots
};

// Helper function to check if user is a doctor staff
const isDoctorUser = (token: string | null): boolean => {
  const role = getUserRoleFromToken(token);
  return role === "doctorStaff"; // 'doctorStaff' role for doctors
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotIntervalRefDoctor = useRef<NodeJS.Timeout | null>(null);
  const screenshotTimerRefDoctor = useRef<NodeJS.Timeout | null>(null);

  // ✅ Exclude loader for admin, clinic, doctor, and agent layouts
  const isExcludedRoute =
    router.pathname.startsWith("/admin") ||
    router.pathname.startsWith("/clinic") ||
    router.pathname.startsWith("/doctor") ||
    router.pathname.startsWith("/agent");

  // For agent routes, ALWAYS use AgentLayout to ensure consistent sidebar
  // This overrides any getLayout defined on the component (like AdminLayout)
  let getLayout =
    Component.getLayout || ((page: ReactNode) => <Layout>{page}</Layout>);

  // Check if current route should have no layout
  const noLayoutRoutes = ["/consent-success", "/clinic-management-software-india", "/clinic/billing-history", "/demo-thank-you"];
  if (noLayoutRoutes.includes(router.pathname)) {
    getLayout = (page: ReactNode) => <>{page}</>;
  }

  // Force AgentLayout for all /agent/* routes to ensure sidebar consistency
  if (router.pathname.startsWith("/agent/")) {
    getLayout = (page: ReactNode) => <AgentLayout>{page}</AgentLayout>;
  }

  // AGENT SCREENSHOT CAPTURE LOGIC - WITH ROLE CHECK
  const captureScreenshot = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("agentToken")
          : null;

      // CHECK Token exists
      if (!token) {
        console.log("[capture] No token found, skipping screenshot");
        return;
      }

      // CHECK User has 'agent' role
      if (!isAgentUser(token)) {
        console.log("[capture] User is not an agent, skipping screenshot");
        return;
      }

      if (typeof window === "undefined" || !document?.documentElement) {
        console.warn("[capture] Not in browser");
        return;
      }

      console.log("[capture] Starting full-page screenshot for agent...");

      const originalScrollX = window.scrollX;
      const originalScrollY = window.scrollY;

      window.scrollTo(0, 0);

      const { scrollWidth, scrollHeight, clientWidth, clientHeight } =
        document.documentElement;

      const fullWidth = Math.max(scrollWidth, clientWidth);
      const fullHeight = Math.max(scrollHeight, clientHeight);

      console.log(
        `[capture] Full content size: ${fullWidth} × ${fullHeight}px`,
      );

      const canvas = await html2canvas(document.documentElement, {
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 12000,
        removeContainer: true,
        foreignObjectRendering: true,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: fullWidth,
        height: fullHeight,
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll(".no-capture, [data-no-capture], .Toastify")
            .forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });
        },
      });

      window.scrollTo(originalScrollX, originalScrollY);

      canvas.toDataURL("image/jpeg", 0.68); //0.68

      console.log(`[capture] Canvas ready — ${canvas.width}×${canvas.height}`);

      // const response = await axios.post(
      //   '/api/agent/screenshot',
      //   {
      //     imageData: base64,
      //     timestamp: new Date().toISOString(),
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       'Content-Type': 'application/json',
      //     },
      //     timeout: 60000,
      //   }
      // );

      // if (response.data.success) {
      //   console.log('[capture] Upload success');
      // } else {
      //   console.warn('[capture] Server error:', response.data.message);
      // }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[capture] Failed:", errorMessage);
    }
  };

  // DOCTOR SCREENSHOT CAPTURE LOGIC - WITH ROLE CHECK
  const captureScreenshotDoctor = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("userToken")
          : null;

      //CHECK Token exists
      if (!token) {
        console.log("[capture-doctor] No token found, skipping screenshot");
        return;
      }

      // CHECK User has 'doctorStaff' role
      if (!isDoctorUser(token)) {
        console.log(
          "[capture-doctor] User is not a doctor staff, skipping screenshot",
        );
        return;
      }

      if (typeof window === "undefined" || !document?.documentElement) {
        console.warn("[capture-doctor] Not in browser");
        return;
      }

      console.log(
        "[capture-doctor] Starting full-page screenshot for doctor...",
      );

      const originalScrollX = window.scrollX;
      const originalScrollY = window.scrollY;

      window.scrollTo(0, 0);

      const { scrollWidth, scrollHeight, clientWidth, clientHeight } =
        document.documentElement;

      const fullWidth = Math.max(scrollWidth, clientWidth);
      const fullHeight = Math.max(scrollHeight, clientHeight);

      console.log(
        `[capture-doctor] Full content size: ${fullWidth} × ${fullHeight}px`,
      );

      const canvas = await html2canvas(document.documentElement, {
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 12000,
        removeContainer: true,
        foreignObjectRendering: true,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: fullWidth,
        height: fullHeight,
        onclone: (clonedDoc) => {
          clonedDoc
            .querySelectorAll(".no-capture, [data-no-capture], .Toastify")
            .forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });
        },
      });

      window.scrollTo(originalScrollX, originalScrollY);

      const base64 = canvas.toDataURL("image/jpeg", 0.68); //0.68

      console.log(
        `[capture-doctor] Canvas ready — ${canvas.width}×${canvas.height}`,
      );

      const response = await axios.post(
        "/api/doctor/screenshot",
        {
          imageData: base64,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        },
      );

      if (response.data.success) {
        console.log("[capture-doctor] Upload success");
      } else {
        console.warn("[capture-doctor] Server error:", response.data.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[capture-doctor] Failed:", errorMessage);
    }
  };

  // Global Screenshot Service with ROLE VERIFICATION (for Agents)
  useEffect(() => {
    const checkAuthAndStartService = () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("agentToken")
          : null;

      // CHECK Token exists
      if (!token) {
        // Clean up if no token
        if (screenshotTimerRef.current) {
          clearTimeout(screenshotTimerRef.current);
          screenshotTimerRef.current = null;
        }
        if (screenshotIntervalRef.current) {
          clearInterval(screenshotIntervalRef.current);
          screenshotIntervalRef.current = null;
        }
        return;
      }

      // CHECK User has 'agent' role
      if (!isAgentUser(token)) {
        console.log(
          "[Global Screenshot] User is not an agent, stopping service",
        );
        // Clean up timers
        if (screenshotTimerRef.current) {
          clearTimeout(screenshotTimerRef.current);
          screenshotTimerRef.current = null;
        }
        if (screenshotIntervalRef.current) {
          clearInterval(screenshotIntervalRef.current);
          screenshotIntervalRef.current = null;
        }
        return;
      }

      console.log(
        "[Global Screenshot] Starting service for authenticated agent",
      );

      // Clear any existing timers
      if (screenshotTimerRef.current) {
        clearTimeout(screenshotTimerRef.current);
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }

      // Start capturing after 1800ms
      const startCapturing = () => {
        captureScreenshot();

        screenshotIntervalRef.current = setInterval(
          () => {
            console.log(
              `[${new Date().toLocaleTimeString()}] Taking scheduled screenshot (every 5 min)`,
            );
            captureScreenshot();
          },
          5 * 60 * 1000,
        );
      };

      screenshotTimerRef.current = setTimeout(startCapturing, 1800);
    };

    // Check auth on mount
    checkAuthAndStartService();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "agentToken") {
        checkAuthAndStartService();
      }
    };

    // Listen for route changes to restart service
    const handleRouteChange = () => {
      checkAuthAndStartService();
    };

    // Set up event listeners
    window.addEventListener("storage", handleStorageChange);
    router.events.on("routeChangeComplete", handleRouteChange);

    // Cleanup
    return () => {
      // Clean up timers
      if (screenshotTimerRef.current) {
        clearTimeout(screenshotTimerRef.current);
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }

      // Remove event listeners
      window.removeEventListener("storage", handleStorageChange);
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  // Global Screenshot Service with ROLE VERIFICATION (for Doctors) - Mirroring Agent Logic
  useEffect(() => {
    const checkAuthAndStartServiceDoctor = () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("userToken")
          : null;

      // CHECK Token exists
      if (!token) {
        // Clean up if no token
        if (screenshotTimerRefDoctor.current) {
          clearTimeout(screenshotTimerRefDoctor.current);
          screenshotTimerRefDoctor.current = null;
        }
        if (screenshotIntervalRefDoctor.current) {
          clearInterval(screenshotIntervalRefDoctor.current);
          screenshotIntervalRefDoctor.current = null;
        }
        return;
      }

      // CHECK User has 'doctorStaff' role
      if (!isDoctorUser(token)) {
        console.log(
          "[Global Screenshot Doctor] User is not a doctor staff, stopping service",
        );
        // Clean up timers
        if (screenshotTimerRefDoctor.current) {
          clearTimeout(screenshotTimerRefDoctor.current);
          screenshotTimerRefDoctor.current = null;
        }
        if (screenshotIntervalRefDoctor.current) {
          clearInterval(screenshotIntervalRefDoctor.current);
          screenshotIntervalRefDoctor.current = null;
        }
        return;
      }

      console.log(
        "[Global Screenshot Doctor] Starting service for authenticated doctor staff",
      );

      // Clear any existing timers
      if (screenshotTimerRefDoctor.current) {
        clearTimeout(screenshotTimerRefDoctor.current);
      }
      if (screenshotIntervalRefDoctor.current) {
        clearInterval(screenshotIntervalRefDoctor.current);
      }

      // Start capturing after 1800ms
      const startCapturing = () => {
        captureScreenshotDoctor();

        screenshotIntervalRefDoctor.current = setInterval(
          () => {
            console.log(
              `[${new Date().toLocaleTimeString()}] Taking scheduled screenshot for doctor (every 5 min)`,
            );
            captureScreenshotDoctor();
          },
          5 * 60 * 1000,
        );
      };

      screenshotTimerRefDoctor.current = setTimeout(startCapturing, 1800);
    };

    // Check auth on mount
    checkAuthAndStartServiceDoctor();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userToken") {
        checkAuthAndStartServiceDoctor();
      }
    };

    // Listen for route changes to restart service
    const handleRouteChange = () => {
      checkAuthAndStartServiceDoctor();
    };

    // Set up event listeners
    window.addEventListener("storage", handleStorageChange);
    router.events.on("routeChangeComplete", handleRouteChange);

    // Cleanup
    return () => {
      // Clean up timers
      if (screenshotTimerRefDoctor.current) {
        clearTimeout(screenshotTimerRefDoctor.current);
      }
      if (screenshotIntervalRefDoctor.current) {
        clearInterval(screenshotIntervalRefDoctor.current);
      }

      // Remove event listeners
      window.removeEventListener("storage", handleStorageChange);
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    const btn = document.querySelector("[data-nextjs-feedback-button]");
    if (btn) btn.remove();

    let fallbackTimeout: NodeJS.Timeout | null = null;

    if (!isExcludedRoute) {
      const handleStart = () => {
        console.log("[Loader] routeChangeStart - showing loader");
        setLoading(true);
        // Fallback: hide loader after 5 seconds if not already hidden
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        fallbackTimeout = setTimeout(() => {
          console.log("[Loader] Fallback timeout reached - hiding loader");
          setLoading(false);
        }, 5000);
      };
      const handleComplete = () => {
        console.log("[Loader] routeChangeComplete/Error - hiding loader");
        setLoading(false);
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
      };

      router.events.on("routeChangeStart", handleStart);
      router.events.on("routeChangeComplete", handleComplete);
      router.events.on("routeChangeError", handleComplete);

      return () => {
        router.events.off("routeChangeStart", handleStart);
        router.events.off("routeChangeComplete", handleComplete);
        router.events.off("routeChangeError", handleComplete);
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
      };
    }
  }, [router, isExcludedRoute]);

  // NEW: Always reset loader on any route change complete or error (fixes stuck loader)
  useEffect(() => {
    const alwaysResetLoader = () => {
      setLoading(false);
    };
    router.events.on("routeChangeComplete", alwaysResetLoader);
    router.events.on("routeChangeError", alwaysResetLoader);
    return () => {
      router.events.off("routeChangeComplete", alwaysResetLoader);
      router.events.off("routeChangeError", alwaysResetLoader);
    };
  }, [router]);

  return (
    <>
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 8,
          right: 8,
          zIndex: 10000,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* ✅ Show loader only for public (non-excluded) routes */}
      {!isExcludedRoute && loading && <Loader />}

      {/* Add Global DeskTime Trackers - runs in background for all authenticated users   */}
      <AgentDesktimeTracker />
      <DoctorDesktimeTracker />

      <AuthProvider>
        <SearchProvider>
          <CurrencyProvider>
          <Head>
            <meta
              name="viewport"
              content="initial-scale=1.0, width=device-width"
            />
            <link rel="icon" href="/favicon1.png" />
          </Head>
          <DefaultSeo {...SEO} />
          <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY || ""}
            loadingElement={<Loader />}
          >
            {getLayout(<Component {...pageProps} />)}
          </LoadScript>
          </CurrencyProvider>
        </SearchProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
