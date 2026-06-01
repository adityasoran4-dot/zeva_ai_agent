import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { capitalize, getTokenByPath } from "@/lib/helper";
import { PurchaseRecord } from "@/types/stocks";
import Converter from "number-to-words";

const PrintPurchaseOrderPage = () => {
  const router = useRouter();
  const { poId } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch purchase order data
  useEffect(() => {
    if (!poId) return;

    const fetchPurchaseOrder = async () => {
      try {
        setLoading(true);
        const token = getTokenByPath();
        const response = await fetch(
          `/api/stocks/purchase-records/get-purchase-record/${poId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase order");
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to match the component structure
          const poData: PurchaseRecord = result.data;

          // Helper function to extract string from value (handle both objects and strings)
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
          for (const item of poData.items) {
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
            vendor: {
              name:
                getString(poData.supplier?.name || poData.supplier) || "N/A",
              mobile: poData.supplier?.mobile || "",
              email: poData.supplier?.email || "",
              trn: poData.supplier?.trn || "",
              address: poData.supplier?.address || "",
            },
            purchase: {
              branch: getString(poData.branch) || "N/A",
              poNo: getString(poData.orderNo) || "N/A",
              enquiryNo: getString(poData.enqNo) || "",
              quotationNo: getString(poData?.quotationNo) || "",
              paymentTerms: getString(poData?.paymentTermsDays) || "0 - Days",
              date: poData.date
                ? new Date(poData.date).toLocaleDateString("en-GB")
                : "N/A",
              validity: getString(poData?.validityDays) || "0 - Days",
            },
            shipTo: {
              name: getString(poData.shipTo?.to) || "N/A",
              address: getString(poData.shipTo?.address) || "",
              phone: getString(poData.shipTo?.telephone) || "",
              email: getString(poData.shipTo?.email) || "",
            },
            billTo: {
              name: getString(poData.billTo?.to) || "N/A",
              address: getString(poData.billTo?.address) || "",
              phone: getString(poData.billTo?.telephone) || "",
              email: getString(poData.billTo?.email) || "",
            },
            contactInfoOfBuyer: {
              name: getString(poData.contactInfoOfBuyer?.to) || "N/A",
              address: getString(poData.contactInfoOfBuyer?.address) || "",
              phone: getString(poData.contactInfoOfBuyer?.telephone) || "",
              email: getString(poData.contactInfoOfBuyer?.email) || "",
            },
            items: (poData.items || []).map((item: any, index: number) => ({
              si: (index + 1).toString(),
              code: getString(item.code) || "",
              name: getString(item.name) || "",
              description: getString(item.description) || "",
              qty: item.quantity
                ? `${item.quantity} - ${item.uom || "Nos"}`
                : "0 - Nos",
              freeQty: item.freeQuantity
                ? `${item.freeQuantity} - ${item.uom || "Nos"}`
                : "0",
              price: String(item.unitPrice || "0.00"),
              total: String(item.totalPrice || "0.00"),
              discType: getString(item.discountType) || "0.00 - Fixed",
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
            notes: getString(poData.notes) || "",
            preparedBy: poData?.createdBy?.name || "N/A",
          });
        } else {
          throw new Error(result.message || "Invalid response format");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching purchase order");
        console.error("Error fetching purchase order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [poId]);

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
          <p className="text-gray-600 font-medium">Loading purchase order...</p>
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

        <h2 className="text-blue-900 text-lg font-bold mb-4">Purchase Order</h2>

        {/* Top Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200">
            <div className="header-box">Vendor Detail</div>
            <div className="p-2">
              <div className="info-row">
                <span className="label-text">Name</span>
                <span className="separator">:</span>
                <span className="font-bold">{data.vendor.name}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Mobile</span>
                <span className="separator">:</span>
                <span>{data.vendor.mobile}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Email</span>
                <span className="separator">:</span>
                <span>{data.vendor.email}</span>
              </div>
              <div className="info-row">
                <span className="label-text">TRN</span>
                <span className="separator">:</span>
                <span>{data.vendor.trn}</span>
              </div>
              <div className="info-row">
                <span className="label-text">Address</span>
                <span className="separator">:</span>
                <span>{data.vendor.address}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200">
            <div className="header-box">Purchase Detail</div>
            <div className="p-2">
              <div className="grid grid-cols-2 gap-x-2">
                <div>
                  <div className="info-row">
                    <span className="label-text">Branch</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.branch}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">P.O.No#</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.poNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Enquiry No#</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.enquiryNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Quotation No#</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.quotationNo}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Payment Terms</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.paymentTerms} - Days</span>
                  </div>
                </div>
                <div>
                  <div className="info-row">
                    <span className="label-text">Date</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.date}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Date</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.date}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Date</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.date}</span>
                  </div>
                  <div className="info-row">
                    <span className="label-text">Validity</span>
                    <span className="separator">:</span>
                    <span>{data.purchase.validity} - Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="border border-gray-200 min-h-[80px]">
            <div className="header-box">Ship To</div>
            <div className="p-2">
              <>
                <p className="font-bold uppercase mb-1">{data.shipTo?.name}</p>
                <p className="text-gray-600 leading-tight">
                  {data.shipTo?.address}
                </p>
                <p>{data.shipTo?.phone}</p>
                <p>{data.shipTo?.email}</p>
              </>
            </div>
          </div>
          <div className="border border-gray-200 min-h-[80px]">
            <div className="header-box">Bill To</div>
            <div className="p-2">
              <>
                <p className="font-bold uppercase mb-1">
                  {data.billTo?.name || "N/A"}
                </p>
                <p className="text-gray-600 leading-tight">
                  {data.billTo?.address || "N/A"}
                </p>
                <p>{data.billTo?.phone || "N/A"}</p>
                <p>{data.billTo?.email || "N/A"}</p>
              </>
            </div>
          </div>
          <div className="border border-gray-200 min-h-[80px]">
            <div className="header-box">Contact info. of Buyer</div>
            <div className="p-2">
              <>
                <p className="font-bold uppercase mb-1">
                  {data.contactInfoOfBuyer?.name}
                </p>
                <p className="text-gray-600 leading-tight">
                  {data.contactInfoOfBuyer?.address}
                </p>
                <p>{data.contactInfoOfBuyer?.phone}</p>
                <p>{data.contactInfoOfBuyer?.email}</p>
              </>
            </div>
          </div>
        </div>

        {/* Table */}
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
                  Qty-UoM
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Free Qty
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Unit Price
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Total
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Disc-Type
                </th>
                <th className="p-1 border-r border-gray-200 text-right">
                  Disc.Val
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
                    {item.freeQty}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.price}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.total}
                  </td>
                  <td className="p-1 border-r border-gray-200 text-right">
                    {item.discType}
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

        {/* Summary */}
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
PrintPurchaseOrderPage.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};

export default PrintPurchaseOrderPage;
