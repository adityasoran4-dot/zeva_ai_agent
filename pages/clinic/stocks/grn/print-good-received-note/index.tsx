import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { capitalize, getTokenByPath } from "@/lib/helper";
import Converter from "number-to-words";

const PrintGoodReceivedNotePage = () => {
  const router = useRouter();
  const { grnId } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grnId) return;
    const fetchGRN = async () => {
      try {
        setLoading(true);
        const token = getTokenByPath();
        const response = await fetch(`/api/stocks/grns/${grnId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch GRN");
        }
        const result = await response.json();
        if (result.success && result.data) {
          const grn = result.data;
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
          for (const item of grn.items || []) {
            totalAmount += item.totalPrice || 0;
            totalDiscount += item.discountAmount || 0;
            totalNetAmount += item.netPrice || 0;
            totalVatAmount += item.vatAmount || 0;
            totalNetVatAmount += item.netPlusVat || 0;
          }
          let totalAmountInWords = capitalize(
            Converter.toWords(totalAmount) || "",
          );

          setData({
            grnDetail: {
              code: grn.grnNo || "N/A",
              date: grn.grnDate
                ? new Date(grn.grnDate).toLocaleDateString("en-GB")
                : "N/A",
              poCode:
                grn.purchasedOrder?.orderNo ||
                getString(grn.purchasedOrder) ||
                "N/A",
              supplierName:
                grn.purchasedOrder?.supplier?.name ||
                getString(grn.purchasedOrder?.supplier) ||
                "N/A",
              supplierGrn: grn.supplierInvoiceNo || "N/A",
            },
            items: (grn.items || []).map((item: any, index: number) => ({
              si: (index + 1).toString(),
              code: getString(item.code) || "",
              name: getString(item.name) || "",
              description: getString(item.description) || "",
              qty: item.quantity
                ? `${item.quantity} - ${item.uom || "Nos"}`
                : "0 - Nos",
              price: String(item.unitPrice || "0.00"),
              total: String(item.totalPrice || "0.00"),
              discType: getString(item.discountType) || "Fixed",
              discVal: String(item.discountAmount || "0.00"),
              net: String(item.netPrice || "0.00"),
              vat: String(item.vatAmount || "0.00"),
              netVat: String(item.netPlusVat || "0.00"),
            })),
            summary: {
              totalAmount: String(totalAmount || "0.00"),
              discount: String(totalDiscount || "0.00"),
              netAmount: String(totalNetAmount || "0.00"),
              vat: String(totalVatAmount || "0.00"),
              netVat: String(totalNetVatAmount || "0.00"),
            },
            amountInWords: getString(totalAmountInWords) || "",
            notes: getString(grn.notes) || "",
            preparedBy: grn?.createdBy?.name || "N/A",
          });
        } else {
          throw new Error(result.message || "Invalid response format");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching GRN");
        console.error("Error fetching GRN:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGRN();
  }, [grnId]);

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
          <p className="text-gray-600 font-medium">Loading GRN...</p>
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
          Goods Receive Note (GRN)
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">GRN Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Code</span>
                <span className="separator">:</span>
                <span className="font-bold">{data.grnDetail.code}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Date</span>
                <span className="separator">:</span>
                <span>{data.grnDetail.date}</span>
              </div>
              <div className="info-row">
                <span className="label-text">PO Code</span>
                <span className="separator">:</span>
                <span>{data.grnDetail.poCode}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Supplier Name</span>
                <span className="separator">:</span>
                <span>{data.grnDetail.supplierName}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Supplier GRN</span>
                <span className="separator">:</span>
                <span>{data.grnDetail.supplierGrn}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="header-box text-[9px] uppercase border-b border-gray-200">
                <th className="p-1 border-r border-gray-200 w-8">SI</th>
                <th className="p-1 border-r border-gray-200">
                  Item Code / Name
                </th>
                <th className="p-1 border-r border-gray-200">Description</th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Received Qty-UoM
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Unit Price
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Total
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Disc Values
                </th>
                <th className="p-1 border-r border-gray-200 text-right">NET</th>
                <th className="p-1 border-r border-gray-200 text-right">VAT</th>
                <th className="p-1 text-right">Net+VAT</th>
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
                    <br />
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
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.price}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.total}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.discVal}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.net}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.vat}
                  </td>
                  <td className="p-1 text-right font-bold">{item.netVat}</td>
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
              {data.notes || "N/A"}
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
                <span>{label as string}</span>
                <span>{val as string}</span>
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

// 👇 Remove layout for this page
PrintGoodReceivedNotePage.getLayout = function PageLayout(
  page: React.ReactNode,
) {
  return page;
};

export default PrintGoodReceivedNotePage;
