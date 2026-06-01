import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTokenByPath } from "@/lib/helper";

const PrintStockTransferRequestPage = () => {
  const router = useRouter();
  const { strId } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock transfer request data
  useEffect(() => {
    if (!strId) return;

    const fetchStockTransferRequest = async () => {
      try {
        setLoading(true);
        const token = getTokenByPath();
        const response = await fetch(
          `/api/stocks/stock-transfer-requests/${strId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch stock transfer request");
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to match the component structure
          const strData: any = result.data;

          // Helper function to extract string from value (handle both objects and strings)
          const getString = (value: any) => {
            if (!value) return "";
            if (typeof value === "string") return value;
            if (typeof value === "object" && value.name) return value.name;
            return String(value);
          };

          setData({
            invoiceDetail: {
              code: getString(strData.stockTransferRequestNo) || "N/A",
              date: strData?.date || "",
              transferType: strData?.transferType || "",
              fromBranch: strData?.fromBranch?.name || "",
              requestedBranch: strData?.requestingBranch?.name || "N/A",
              requestedBy:
                strData?.requestingEmployee?.name ||
                strData?.createdBy?.name ||
                "N/A",
            },

            items: (strData.items || []).map((item: any, index: number) => ({
              si: (index + 1).toString(),
              code: getString(item.code) || "",
              name: getString(item.name) || "",
              description: getString(item.description) || "",
              qty: item.quantity
                ? `${item.quantity} - ${item.uom || "Nos"}`
                : "0 - Nos",
            })),
            notes: getString(strData?.notes) || "",
            preparedBy: strData?.createdBy?.name || "N/A",
          });
        } else {
          throw new Error(result.message || "Invalid response format");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching stock transfer request");
        console.error("Error fetching stock transfer request:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockTransferRequest();
  }, [strId]);

  // Trigger print dialog on component mount after data is loaded
  useEffect(() => {
    if (!loading && data && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, data, error]);

  // Show error message
  if (error) {
    return (
      <div className="bg-red-50 min-h-screen flex items-center justify-center p-8">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show loading message
  if (loading || !data) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading stock transfer request...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-0 sm:p-8 text-gray-600 print:bg-white print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white; }
          .no-print { display: none; }
        }
        .print-container {
          width: 280mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 15mm;
          font-family: 'Arial', sans-serif;
          font-size: 11px;
        }
        .header-box { background-color: #f3f4f6 !important; border: 1px solid #e5e7eb; padding: 4px 8px; font-weight: bold; color: #4b5563; }
        .info-row { display: flex; margin-bottom: 2px; }
        .label-text { width: 120px; flex-shrink: 0; }
        .separator { width: 20px; text-align: center; }
      `,
        }}
      />

      <div className="print-container shadow-lg print:shadow-none">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl" style={{ color: "#c5a059" }}>
              🌿
            </span>
            <h1 className="text-3xl font-bold" style={{ color: "#c5a059" }}>
              Rama Care
            </h1>
          </div>
          <p className="text-gray-500 font-medium tracking-widest uppercase">
            Poly Clinic
          </p>
        </div>

        <h2 className="text-blue-900 text-lg font-bold mb-4">
          Stock Transfer Request Detail
        </h2>

        {/* Top Details Grid */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Invoice Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Code</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.code}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Date</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.date}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Transfer Type</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.transferType}</span>
              </div>
              <div className="info-row">
                <span className="label-text">From Branch</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.fromBranch}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Requested Branch</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.requestedBranch}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Requested By</span>
                <span className="separator">:</span>
                <span>{data?.invoiceDetail?.requestedBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="header-box text-[9px] uppercase border-b border-gray-200">
                <th className="p-1 border-r border-gray-200 w-8">SI</th>
                <th className="p-1 border-r border-gray-200">Code</th>
                <th className="p-1 border-r border-gray-200">Name</th>
                <th className="p-1 border-r border-gray-200">Description</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Qty-UoM
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 last:border-0"
                >
                  <td className="p-1 border-r border-gray-200 text-center">
                    {item.si}
                  </td>
                  <td className="p-1 border-r border-gray-200 font-bold">
                    {item.code}
                  </td>
                  <td className="p-1 border-r border-gray-200 font-bold">
                    <span className="text-[9px] font-normal uppercase">
                      {item.name}
                    </span>
                  </td>
                  <td className="p-1 border-r border-gray-200 italic">
                    {item?.description || "N/A"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-12 px-2 italic">
          <div>
            <p className="font-bold">Prepared by</p>
            <p className="mt-4">{data?.preparedBy}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Approved by</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 👇 Remove layout for this page
PrintStockTransferRequestPage.getLayout = function PageLayout(
  page: React.ReactNode,
) {
  return page;
};

export default PrintStockTransferRequestPage;
