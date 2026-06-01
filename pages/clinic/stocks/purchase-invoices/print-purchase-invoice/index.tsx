import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { capitalize, getTokenByPath } from "@/lib/helper";
import Converter from "number-to-words";

const PrintPurchaseInvoicePage = () => {
  const router = useRouter();
  const { pinvId, id } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const invoiceId = (pinvId || id) as string | undefined;
    if (!invoiceId) return;

    const fetchPurchaseInvoice = async () => {
      try {
        setLoading(true);
        const token = getTokenByPath();
        const response = await fetch(
          `/api/stocks/purchase-invoices/${invoiceId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase invoice");
        }

        const result = await response.json();

        if (result.success && result.data) {
          const inv = result.data;
          const getString = (value: any) => {
            if (!value) return "";
            if (typeof value === "string") return value;
            if (typeof value === "object" && value.name) return value.name;
            return String(value);
          };

          const linkedGrns: any[] = [];
          if (Array.isArray(inv.grns)) linkedGrns.push(...inv.grns);

          let poCode = "";
          let supplierGrnCode = "";
          const ids = linkedGrns
            .map((g) => (typeof g === "object" ? g?._id : g))
            .filter(Boolean);

          if (ids.length > 0) {
            try {
              const token = getTokenByPath();
              const grnResponses = await Promise.all(
                ids.map((gid: string) =>
                  fetch(`/api/stocks/grns/${gid}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  }),
                ),
              );
              const grnDatas = await Promise.all(
                grnResponses.map((r) => r.json()),
              );
              const firstGrn = grnDatas.find(
                (d) => d?.success && d?.data,
              )?.data;
              poCode =
                firstGrn?.purchasedOrder?.orderNo ||
                firstGrn?.purchasedOrder ||
                "";
              supplierGrnCode = firstGrn?.supplierInvoiceNo || "";
            } catch (err) {
              console.error("Error fetching GRN details:", err);
            }
          }

          let totalAmount = 0;
          let totalDiscount = 0;
          let totalNetAmount = 0;
          let totalVatAmount = 0;
          let totalNetVatAmount = 0;
          let totalAmountInWords = capitalize(
            Converter.toWords(totalAmount) || "",
          );

          setData({
            header: {
              code: inv.invoiceNo || "",
              date: inv.date
                ? new Date(inv.date).toLocaleDateString("en-GB")
                : "",
              poCode: poCode || "",
              supplierName: getString(inv.supplier?.name || inv.supplier) || "",
              supplierGrn: supplierGrnCode || "",
            },
            grnRows: inv.grns.map((g: any, i: number) => {
              let grnTotal = 0;
              let grnDiscount = 0;
              let grnNet = 0;
              let grnVat = 0;
              let grnNetVat = 0;
              if (g?.purchasedOrder?.items?.length) {
                g?.purchasedOrder?.items?.forEach((item: any) => {
                  grnTotal += item?.totalPrice || 0;
                  grnDiscount += item?.discountAmount || 0;
                  grnNet += item?.netPrice || 0;
                  grnVat += item?.vatAmount || 0;
                  grnNetVat += item?.netPlusVat || 0;
                });
              }
              totalAmount += grnTotal;
              totalDiscount += grnDiscount;
              totalNetAmount += grnNet;
              totalVatAmount += grnVat;
              totalNetVatAmount += grnNetVat;
              totalAmountInWords = capitalize(
                Converter.toWords(totalAmount) || "",
              );
              return {
                si: String(i + 1).padStart(2, "0"),
                grnCode:
                  typeof g === "object" ? g?.grnNo || g?._id || "" : String(g),
                description: getString(g?.description || g?.notes || "") || "",
                total: String(grnTotal.toFixed(2)),
                discount: String(grnDiscount.toFixed(2)),
                net: String(grnNet.toFixed(2)),
                vat: String(grnVat.toFixed(2)),
                netVat: String(grnNetVat.toFixed(2)),
              };
            }),
            summary: {
              totalAmount: String(totalAmount.toFixed(2)),
              discount: String(totalDiscount.toFixed(2)),
              netAmount: String(totalNetAmount.toFixed(2)),
              vat: String(totalVatAmount.toFixed(2)),
              netVat: String(totalNetVatAmount.toFixed(2)),
            },
            amountInWords: getString(totalAmountInWords) || "",
            notes: getString(inv.notes) || "",
            preparedBy: inv?.createdBy?.name || "N/A",
          });
        } else {
          throw new Error(result.message || "Invalid response format");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching purchase invoice");
        console.error("Error fetching purchase invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseInvoice();
  }, [pinvId, id]);

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
            Loading purchase invoice...
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
        .label-text { width: 90px; flex-shrink: 0; }
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
          Purchase Invoice
        </h2>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Invoice Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Code</span>
                <span className="separator">:</span>
                <span className="font-bold">{data.header.code}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Date</span>
                <span className="separator">:</span>
                <span>{data.header.date}</span>
              </div>
              <div className="info-row">
                <span className="label-text">PO Code</span>
                <span className="separator">:</span>
                <span>{data.header.poCode || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Supplier Name</span>
                <span className="separator">:</span>
                <span>{data.header.supplierName || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Supplier GRN</span>
                <span className="separator">:</span>
                <span>{data.header.supplierGrn || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="header-box text-[9px] uppercase border-b border-gray-200">
                <th className="p-1 border-r border-gray-200 w-8">SI</th>
                <th className="p-1 border-r border-gray-200">GRN Code</th>
                <th className="p-1 border-r border-gray-200">Description</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Total
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Discount
                </th>
                <th className="p-1 border-r border-gray-200 text-right">NET</th>
                <th className="p-1 border-r border-gray-200 text-right">VAT</th>
                <th className="p-1 text-right">Net+VAT</th>
              </tr>
            </thead>
            <tbody>
              {data.grnRows.map((row: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 last:border-0"
                >
                  <td className="p-1 border-r border-gray-200 text-center">
                    {row.si}
                  </td>
                  <td className="p-1 border-r border-gray-200 font-bold">
                    {row.grnCode}
                  </td>
                  <td className="p-1 border-r border-gray-200 italic">
                    {row.description || "N/A"}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {row.total}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {row.discount}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {row.net}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {row.vat}
                  </td>
                  <td className="p-1 text-right font-bold">{row.netVat}</td>
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

PrintPurchaseInvoicePage.getLayout = function PageLayout(
  page: React.ReactNode,
) {
  return page;
};

export default PrintPurchaseInvoicePage;
