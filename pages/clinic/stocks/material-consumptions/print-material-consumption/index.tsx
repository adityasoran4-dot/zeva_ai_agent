import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTokenByPath } from "@/lib/helper";

type NamedRef = { name?: string; _id?: string } | string | null | undefined;

type MaterialConsumptionItem = {
  itemId?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  uom?: string;
};

type MaterialConsumption = {
  _id: string;
  materialConsumptionNo?: string;
  branch?: NamedRef;
  doctor?: NamedRef;
  room?: NamedRef;
  date?: string;
  notes?: string;
  status?: "New" | "Verified" | "Deleted";
  items?: MaterialConsumptionItem[];
  createdBy?: { name?: string };
};

const getString = (value: NamedRef) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.name) return value.name || "";
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const PrintMaterialConsumptionPage = () => {
  const router = useRouter();
  const { mcId: id, mcNo } = router.query as { mcId?: string; mcNo?: string };

  const [record, setRecord] = useState<MaterialConsumption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenByPath();
    const fetchData = async () => {
      try {
        if (!id && !mcNo) return;
        setLoading(true);
        setError(null);
        let url = "";
        if (id) {
          url = `/api/stocks/material-consumptions/${id}`;
        } else if (mcNo) {
          const params = new URLSearchParams();
          params.set("materialConsumptionNo", mcNo);
          params.set("limit", "1");
          params.set("page", "1");
          url = `/api/stocks/material-consumptions?${params.toString()}`;
        }
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch material consumption");
        }
        const json = await res.json();
        if (id) {
          if (json?.success && json?.data) {
            setRecord(json.data as MaterialConsumption);
          } else {
            throw new Error(json?.message || "Invalid response");
          }
        } else {
          const arr = json?.data;
          if (json?.success && Array.isArray(arr) && arr.length > 0) {
            setRecord(arr[0] as MaterialConsumption);
          } else {
            throw new Error("Material consumption not found");
          }
        }
      } catch (e: any) {
        setError(e.message || "Error loading material consumption");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, mcNo]);

  useEffect(() => {
    if (!loading && record && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, record, error]);

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

  if (loading || !record) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading material consumption...
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
          Material Consumption Detail
        </h2>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Consumption Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">MC No</span>
                <span className="separator">:</span>
                <span className="font-bold">
                  {record.materialConsumptionNo || "-"}
                </span>
              </div>
              <div className="info-row">
                <span className="label-text">Date</span>
                <span className="separator">:</span>
                <span>
                  {record.date
                    ? new Date(record.date).toLocaleDateString("en-GB")
                    : "-"}
                </span>
              </div>
              <div className="info-row">
                <span className="label-text">Branch</span>
                <span className="separator">:</span>
                <span>{getString(record.branch) || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Doctor</span>
                <span className="separator">:</span>
                <span>{getString(record.doctor) || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Room</span>
                <span className="separator">:</span>
                <span>{getString(record.room) || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Status</span>
                <span className="separator">:</span>
                <span>{record.status || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="header-box text-[9px] uppercase border-b border-gray-200">
                <th className="p-1 border-r border-gray-200 w-8">SI</th>
                <th className="p-1 border-r border-gray-200">Item Name</th>
                <th className="p-1 border-r border-gray-200">Description</th>
                <th className="p-1 border-r border-gray-200">Code</th>
                <th className="p-1 border-r border-gray-200 text-right">Qty</th>
                <th className="p-1 text-right">UoM</th>
              </tr>
            </thead>
            <tbody>
              {(record.items || []).map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 last:border-0"
                >
                  <td className="p-1 border-r border-gray-200 text-center">
                    {(idx + 1).toString().padStart(2, "0")}
                  </td>
                  <td className="p-1 border-r border-gray-200 font-bold">
                    <span className="text-[11px] uppercase">{item.name}</span>
                  </td>
                  <td className="p-1 border-r border-gray-200 italic">
                    {item.description || "N/A"}
                  </td>
                  <td className="p-1 border-r border-gray-200">
                    {item.code || "-"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.quantity}
                  </td>
                  <td className="p-1 text-right">{item.uom || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-12 px-2 italic">
          <div>
            <p className="font-bold">Prepared by</p>
            <p className="mt-4">{record?.createdBy?.name || "N/A"}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Approved by</p>
          </div>
        </div>
      </div>
    </div>
  );
};

PrintMaterialConsumptionPage.getLayout = function PageLayout(
  page: React.ReactNode,
) {
  return page;
};

export default PrintMaterialConsumptionPage;
