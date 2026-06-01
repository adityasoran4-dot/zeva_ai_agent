import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { capitalize, getTokenByPath } from "@/lib/helper";
import Converter from "number-to-words";

type PurchaseReturnRecord = {
  _id: string;
  purchaseReturnNo?: string;
  date?: string;
  branch?: { name?: string } | string;
  purchasedOrder?: {
    orderNo?: string;
    supplier?: { name?: string } | string;
    items?: Array<any>;
    date?: string;
    notes?: string;
  };
  supplier?: { name?: string } | string;
  notes?: string;
  createdBy?: { name?: string };
};

const PrintPurchaseReturnPage = () => {
  const router = useRouter();
  const { prNo, id, prId } = router.query as {
    prNo?: string;
    id?: string;
    prId?: string;
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const purchaseReturnNo = prNo as string | undefined;
    const returnId = (prId || id) as string | undefined;
    if (!purchaseReturnNo && !returnId) return;

    const fetchPurchaseReturn = async () => {
      try {
        setLoading(true);
        const token = getTokenByPath();

        let endpoint = "";
        if (purchaseReturnNo) {
          const params = new URLSearchParams();
          params.set("purchaseReturnNo", purchaseReturnNo);
          params.set("limit", "1");
          params.set("page", "1");
          endpoint = `/api/stocks/purchase-returns?${params.toString()}`;
        } else if (returnId) {
          const params = new URLSearchParams();
          params.set("search", ""); // search only matches number/notes; fetch broader set
          params.set("limit", "100");
          params.set("page", "1");
          endpoint = `/api/stocks/purchase-returns?${params.toString()}`;
        }

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch purchase return");
        }
        const result = await response.json();
        if (!(result?.success && result?.data?.records)) {
          throw new Error(result?.message || "Invalid response format");
        }

        let pr: PurchaseReturnRecord | undefined = result.data.records[0];
        if (!pr && returnId) {
          pr = (result.data.records as PurchaseReturnRecord[]).find(
            (r) => r?._id === returnId,
          );
        }
        if (!pr) {
          throw new Error("Purchase return not found");
        }

        const getString = (value: any) => {
          if (!value) return "";
          if (typeof value === "string") return value;
          if (typeof value === "object" && value.name) return value.name;
          return String(value);
        };

        let totalAmount = 0;
        let totalDiscount = 0;
        let totalNetAmount = 0;
        let totalVatAmount = 0;
        let totalNetVatAmount = 0;

        const items = Array.isArray(pr.purchasedOrder?.items)
          ? pr.purchasedOrder!.items
          : [];
        items.forEach((item: any) => {
          totalAmount += item.totalPrice || 0;
          totalDiscount += item.discountAmount || 0;
          totalNetAmount += item.netPrice || 0;
          totalVatAmount += item.vatAmount || 0;
          totalNetVatAmount += item.netPlusVat || 0;
        });

        const amountInWords = capitalize(Converter.toWords(totalAmount) || "");

        setData({
          header: {
            code: pr.purchaseReturnNo || "",
            date: pr.date ? new Date(pr.date).toLocaleDateString("en-GB") : "",
            branch: getString(pr.branch) || "",
            poCode:
              pr.purchasedOrder?.orderNo ||
              (pr.purchasedOrder as any)?._id ||
              "",
            supplierName:
              getString(
                // @ts-ignore
                pr.purchasedOrder?.supplier?.name ||
                  pr.purchasedOrder?.supplier,
              ) ||
              getString(pr.supplier) ||
              "",
          },
          items: items.map((item: any, index: number) => ({
            si: (index + 1).toString().padStart(2, "0"),
            name: getString(item.name) || "",
            description: getString(item.description) || "",
            qty: String(item.quantity || 0),
            uom: getString(item.uom) || "Nos",
            unitPrice: String(
              (item.unitPrice || 0).toFixed?.(2) ?? item.unitPrice ?? "0.00",
            ),
            total: String(
              (item.totalPrice || 0).toFixed?.(2) ?? item.totalPrice ?? "0.00",
            ),
            discount: String(
              (item.discountAmount || 0).toFixed?.(2) ??
                item.discountAmount ??
                "0.00",
            ),
            net: String(
              (item.netPrice || item.totalPrice || 0).toFixed?.(2) ??
                item.netPrice ??
                "0.00",
            ),
            vatPct: String(item.vatPercentage || 0),
            vat: String(
              (item.vatAmount || 0).toFixed?.(2) ?? item.vatAmount ?? "0.00",
            ),
            netVat: String(
              (
                item.netPlusVat ||
                (item.netPrice || item.totalPrice || 0) + (item.vatAmount || 0)
              ).toFixed?.(2) ??
                item.netPlusVat ??
                "0.00",
            ),
            freeQty: String(item.freeQuantity || 0),
          })),
          summary: {
            totalAmount: String(totalAmount.toFixed(2)),
            discount: String(totalDiscount.toFixed(2)),
            netAmount: String(totalNetAmount.toFixed(2)),
            vat: String(totalVatAmount.toFixed(2)),
            netVat: String(totalNetVatAmount.toFixed(2)),
          },
          amountInWords: amountInWords || "",
          notes:
            getString(pr.purchasedOrder?.notes) || getString(pr.notes) || "",
          preparedBy: pr?.createdBy?.name || "N/A",
        });
      } catch (err: any) {
        setError(err.message || "Error fetching purchase return");
        console.error("Error fetching purchase return:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseReturn();
  }, [prNo, id, prId]);

  useEffect(() => {
    if (!loading && data && !error) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, data, error]);

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

  if (loading || !data) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading purchase return...
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
        .label-text { width: 110px; flex-shrink: 0; }
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
          Purchase Return
        </h2>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Return Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Return No</span>
                <span className="separator">:</span>
                <span className="font-bold">{data.header.code || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Date</span>
                <span className="separator">:</span>
                <span>{data.header.date || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Branch</span>
                <span className="separator">:</span>
                <span>{data.header.branch || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">PO Code</span>
                <span className="separator">:</span>
                <span>{data.header.poCode || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Supplier</span>
                <span className="separator">:</span>
                <span>{data.header.supplierName || "-"}</span>
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
                <th className="p-1 border-r border-gray-200 text-right">Qty</th>
                <th className="p-1 border-r border-gray-200 text-right">UoM</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Unit Price
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Total
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Discount
                </th>
                <th className="p-1 border-r border-gray-200 text-right">NET</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  VAT %
                </th>
                <th className="p-1 border-r border-gray-200 text-right">VAT</th>
                <th className="p-1 text-right">Net+VAT</th>
                <th className="p-1 border-l border-gray-200 text-right">
                  Free Qty
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
                    <span className="text-[11px] uppercase">{item.name}</span>
                  </td>
                  <td className="p-1 border-r border-gray-200 italic">
                    {item.description || "N/A"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.qty}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.uom}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.unitPrice}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.total}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.discount}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.net}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.vatPct}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.vat}
                  </td>
                  <td className="p-1 text-right font-bold">{item.netVat}</td>
                  <td className="p-1 border-l border-gray-200 text-right">
                    {item.freeQty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-12 border-x border-b border-gray-200">
          <div className="col-span-8 p-2 border-r border-gray-200 italic">
            <p className="font-bold">
              Amount In Words : {`${data.amountInWords} Only` || "N/A"}. /-
            </p>
            <p className="mt-4 text-gray-500 font-semibold">
              {data.notes || "This is description"}
            </p>
          </div>
          <div className="col-span-4">
            {[
              ["Total (in AED)", data.summary.totalAmount],
              ["Discount (in AED)", data.summary.discount],
              ["Net Amount (in AED)", data.summary.netAmount],
              ["VAT (in AED)", data.summary.vat],
              ["Net + VAT", data.summary.netVat, true],
            ].map(([label, val, bold], i) => (
              <div
                key={i}
                className={`flex justify-between p-1 border-b border-gray-100 last:border-0 ${bold ? "font-bold" : ""}`}
              >
                <span>{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </div>

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

PrintPurchaseReturnPage.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default PrintPurchaseReturnPage;
