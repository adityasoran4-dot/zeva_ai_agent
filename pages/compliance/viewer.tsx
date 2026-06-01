import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";

export default function ComplianceViewer() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");
    if (!file) {
      setError("No file specified");
      return;
    }

    // Disable right-click context menu to discourage downloads
    const preventContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);

    const load = async () => {
      try {
        // Load PDF.js from CDN
        // @ts-ignore
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          setError("Viewer library not loaded");
          return;
        }
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const loadingTask = pdfjsLib.getDocument({ url: file });
        const pdf = await loadingTask.promise;

        const container = canvasContainerRef.current!;
        container.innerHTML = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement("canvas");
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 16px auto";
          const context = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          container.appendChild(canvas);
          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext).promise;
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load document");
      }
    };

    load();
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  return (
    <>
      <Head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" />
        <meta httpEquiv="Referrer-Policy" content="no-referrer" />
      </Head>
      <div className="min-h-[70vh] bg-white">
        {error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : (
          <div ref={canvasContainerRef} className="p-4 overflow-y-auto max-h-[70vh]" />
        )}
      </div>
    </>
  );
}
