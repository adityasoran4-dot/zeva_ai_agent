import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getTokenByPath } from "@/lib/helper";

type NamedRef = { name?: string; _id?: string } | string | null | undefined;

type AdjustmentItem = {
  itemId?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  uom?: string;
  expiryDate?: string;
  costPrice: number;
  totalPrice: number;
};

type StockQtyAdjustment = {
  _id: string;
  adjustmentNo?: string;
  branch?: NamedRef;
  postAc?: string;
  date?: string;
  notes?: string;
  status?: "New" | "Completed" | "Cancelled" | "Deleted";
  items?: AdjustmentItem[];
  createdBy?: { name?: string };
};

const getString = (value: NamedRef) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.name) return value.name || "";
  if (typeof value === "object" && value._id) return String(value._id);
  return "";
};

const PrintStockQtyAdjustmentPage = () => {
  const router = useRouter();
  const { sqaId: id } = router.query as { sqaId?: string };

  const [record, setRecord] = useState<StockQtyAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenByPath();
    const fetchData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/stocks/stock-qty-adjustment/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch stock quantity adjustment");
        }
        const json = await res.json();
        if (json?.success && json?.data) {
          setRecord(json.data as StockQtyAdjustment);
        } else {
          throw new Error(json?.message || "Invalid response");
        }
      } catch (e: any) {
        setError(e.message || "Error loading stock quantity adjustment");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const totals = useMemo(() => {
    const items = record?.items || [];
    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalCost = items.reduce((sum, it) => sum + (it.costPrice || 0), 0);
    const totalAmount = items.reduce(
      (sum, it) => sum + (it.totalPrice || 0),
      0,
    );
    return {
      itemCount: items.length,
      totalQuantity: totalQty,
      totalCost,
      totalAmount,
    };
  }, [record]);

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
            Loading stock quantity adjustment...
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
          Stock Quantity Adjustment
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Adjustment Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Adjustment No</span>
                <span className="separator">:</span>
                <span className="font-bold">{record.adjustmentNo || "-"}</span>
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
                <span className="label-text">Post A/C</span>
                <span className="separator">:</span>
                <span>{record.postAc || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Status</span>
                <span className="separator">:</span>
                <span>{record.status || "-"}</span>
              </div>
            </div>
          </div>
          <div className="border border-gray-200">
            <div className="header-box">Summary</div>
            <div className="p-2">
              {[
                ["Item Count", String(totals.itemCount)],
                ["Total Quantity", String(totals.totalQuantity)],
                ["Total Cost (AED)", totals.totalCost.toFixed(2)],
                ["Total Amount (AED)", totals.totalAmount.toFixed(2)],
              ].map(([label, val], i) => (
                <div
                  key={i}
                  className="flex justify-between p-1 border-b border-gray-100 last:border-0"
                >
                  <span>{label}</span>
                  <span className="font-bold">{val}</span>
                </div>
              ))}
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
                <th className="p-1 border-r border-gray-200 text-right">UoM</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Cost Price
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Total Price
                </th>
                <th className="p-1 text-right">Expiry Date</th>
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
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.uom || "-"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {typeof item.costPrice === "number"
                      ? item.costPrice.toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {typeof item.totalPrice === "number"
                      ? item.totalPrice.toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-1 text-right">
                    {item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={6}
                  className="p-2 text-right font-semibold border-t border-gray-200"
                >
                  Totals
                </td>
                <td className="p-2 text-right font-bold border-t border-gray-200">
                  {totals.totalCost.toFixed(2)}
                </td>
                <td className="p-2 text-right font-bold border-t border-gray-200">
                  {totals.totalAmount.toFixed(2)}
                </td>
                <td className="p-2 text-right border-t border-gray-200">-</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid grid-cols-12 border-x border-b border-gray-200">
          <div className="col-span-8 p-2 border-r border-gray-200 italic">
            <p className="font-bold">
              Notes:{" "}
              {record.notes && record.notes.trim().length > 0
                ? record.notes
                : "N/A"}
            </p>
          </div>
          <div className="col-span-4">
            {[
              ["Item Count", String(totals.itemCount)],
              ["Total Quantity", String(totals.totalQuantity)],
              ["Total Cost (AED)", totals.totalCost.toFixed(2)],
              ["Total Amount (AED)", totals.totalAmount.toFixed(2)],
            ].map(([label, val], i) => (
              <div
                key={i}
                className="flex justify-between p-1 border-b border-gray-100 last:border-0"
              >
                <span>{label}</span>
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>
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

PrintStockQtyAdjustmentPage.getLayout = function PageLayout(
  page: React.ReactNode,
) {
  return page;
};

export default PrintStockQtyAdjustmentPage;
