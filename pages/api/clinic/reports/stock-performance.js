import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockItem from "../../../../models/stocks/StockItem";
import AllocatedStockItem from "../../../../models/stocks/AllocatedStockItem";
import UOM from "../../../../models/stocks/UOM";
import StockLocation from "../../../../models/stocks/StockLocation";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
import GRN from "../../../../models/stocks/GRN";
import PurchaseInvoice from "../../../../models/stocks/PurchaseInvoice";
import MaterialConsumption from "../../../../models/stocks/MaterialConsumption";
import DirectStockTransfer from "../../../../models/stocks/DirectStockTransfer";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) return res.status(400).json({ success: false, message: "Clinic not found" });
      clinicId = clinic._id;
    } else {
      clinicId = me.clinicId;
    }

    if (!clinicId) {
      return res.status(400).json({ success: false, message: "Clinic ID not found" });
    }

    // Fetch all stock items for the clinic
    const stockItems = await StockItem.find({ clinicId }).lean();

    // Aggregate allocated quantities
    const allocatedQuantities = await AllocatedStockItem.aggregate([
      { $match: { clinicId, status: { $nin: ["Cancelled", "Deleted", "Used", "Expired"] } } },
      {
        $group: {
          _id: "$item.itemId",
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const quantityMap = {};
    allocatedQuantities.forEach((item) => {
      if (item._id) {
        quantityMap[item._id.toString()] = item.totalQuantity;
      }
    });

    // Merge quantities into stock items
    const itemsWithQuantity = stockItems.map((item) => ({
      ...item,
      currentQuantity: quantityMap[item._id.toString()] || 0,
    }));

    // Stats for graphs
    const typeDistribution = {};
    const statusDistribution = {};
    
    itemsWithQuantity.forEach(item => {
        typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
        statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
    });

    const typeStats = Object.keys(typeDistribution).map(type => ({
        name: type,
        count: typeDistribution[type]
    }));

    const statusStats = Object.keys(statusDistribution).map(status => ({
        name: status,
        count: statusDistribution[status]
    }));

    // UOM Stats for line graph
    const uoms = await UOM.find({ clinicId }).sort({ createdAt: 1 }).lean();
    
    // Group UOMs by date
    const uomTimelineMap = {};
    let runningTotal = 0;
    let runningMain = 0;
    let runningSub = 0;

    uoms.forEach(uom => {
        const date = uom.createdAt.toISOString().split('T')[0];
        if (!uomTimelineMap[date]) {
            uomTimelineMap[date] = { total: 0, main: 0, sub: 0 };
        }
        uomTimelineMap[date].total++;
        if (uom.category === "Main") uomTimelineMap[date].main++;
        else if (uom.category === "Sub") uomTimelineMap[date].sub++;
    });

    const uomTimeline = Object.keys(uomTimelineMap).sort().map(date => {
        runningTotal += uomTimelineMap[date].total;
        runningMain += uomTimelineMap[date].main;
        runningSub += uomTimelineMap[date].sub;
        return {
            date,
            total: runningTotal,
            main: runningMain,
            sub: runningSub
        };
    });

    // Stock Location Stats
    const stockLocations = await StockLocation.find({ clinicId }).lean();
    const locationStatusDistribution = {};
    stockLocations.forEach(loc => {
        locationStatusDistribution[loc.status] = (locationStatusDistribution[loc.status] || 0) + 1;
    });
    const locationStatusStats = Object.keys(locationStatusDistribution).map(status => ({
        name: status,
        count: locationStatusDistribution[status]
    }));

    // Purchase Record Stats (Distribution by type)
    const purchaseRecords = await PurchaseRecord.find({ clinicId }).select("type").lean();
    const purchaseRecordTypeDistribution = {};
    purchaseRecords.forEach(pr => {
      purchaseRecordTypeDistribution[pr.type] = (purchaseRecordTypeDistribution[pr.type] || 0) + 1;
    });
    const purchaseRecordTypeStats = Object.keys(purchaseRecordTypeDistribution).map(type => ({
      name: type.replace('_', ' '),
      count: purchaseRecordTypeDistribution[type]
    }));

    const totalPurchaseRequests = purchaseRecordTypeDistribution["Purchase_Request"] || 0;

    const detailedPurchaseRequests = await PurchaseRecord.find({ clinicId, type: "Purchase_Request" })
      .populate("createdBy", "name")
      .populate("items.itemId", "name")
      .sort({ date: -1 })
      .lean();

    // GRN Stats
    const grns = await GRN.find({ clinicId }).populate('purchasedOrder', 'type').lean();
    const totalGRNs = grns.length;
    
    const grnSourceStatsMap = { Purchase_Order: 0, Purchase_Request: 0 };
    const grnStatusStatsMap = {};

    grns.forEach(grn => {
      // Source stats (PO vs PR)
      const type = grn.purchasedOrder?.type;
      if (type === "Purchase_Order") grnSourceStatsMap.Purchase_Order++;
      else if (type === "Purchase_Request") grnSourceStatsMap.Purchase_Request++;

      // Status stats
      grnStatusStatsMap[grn.status] = (grnStatusStatsMap[grn.status] || 0) + 1;
    });

    const grnSourceStats = Object.keys(grnSourceStatsMap).map(key => ({
      name: key.replace('_', ' '),
      count: grnSourceStatsMap[key]
    }));

    const grnStatusStats = Object.keys(grnStatusStatsMap).map(status => ({
       name: status.replace('_', ' '),
       count: grnStatusStatsMap[status]
     }));
 
     // Top 5 most recent invoiced GRNs
     const recentInvoicedGRNs = await GRN.find({ clinicId, status: "Invoiced" })
       .sort({ createdAt: -1 })
       .limit(5)
       .populate("purchasedOrder", "orderNo type")
       .lean();
 
     // Purchase Invoice Stats
     const purchaseInvoices = await PurchaseInvoice.find({ clinicId })
       .populate("grn", "grnNo")
       .populate("supplier", "name")
       .lean();
 
     const totalPurchaseInvoices = purchaseInvoices.length;
     const piStatusStatsMap = {};
     purchaseInvoices.forEach(pi => {
       piStatusStatsMap[pi.status] = (piStatusStatsMap[pi.status] || 0) + 1;
     });
 
     const piStatusStats = Object.keys(piStatusStatsMap).map(status => ({
       name: status.replace('_', ' '),
       count: piStatusStatsMap[status]
     }));
 
     const recentPurchaseInvoices = await PurchaseInvoice.find({ clinicId })
       .sort({ createdAt: -1 })
       .limit(5)
       .populate("grn", "grnNo")
       .populate("supplier", "name")
       .lean();
 
     // Top 5 GRNs with highest paid amount (from invoices)
     const topPaidGRNs = await PurchaseInvoice.find({ clinicId })
       .sort({ paidAmount: -1 })
       .limit(5)
       .populate("grn", "grnNo")
       .populate("supplier", "name")
       .lean();
 
     // Material Consumption Stats
     const materialConsumptions = await MaterialConsumption.find({ clinicId })
       .populate("doctor", "name")
       .populate("room", "name")
       .sort({ date: -1 })
       .lean();

     // Aggregate consumed quantities per item
     const itemConsumptionBreakdown = await MaterialConsumption.aggregate([
       { $match: { clinicId } },
       { $unwind: "$items" },
       {
         $group: {
           _id: "$items.itemId",
           name: { $first: "$items.name" },
           code: { $first: "$items.code" },
           totalConsumed: { $sum: "$items.quantity" },
           uom: { $first: "$items.uom" }
         }
       },
       { $sort: { totalConsumed: -1 } },
       { $limit: 10 }
     ]);

     // Aggregate material consumption by doctor
     const doctorConsumptionStats = await MaterialConsumption.aggregate([
       { $match: { clinicId } },
       { $unwind: "$items" },
       {
         $group: {
           _id: "$doctor",
           totalItemsConsumed: { $sum: "$items.quantity" },
           totalRecords: { $addToSet: "$_id" }
         }
       },
       {
         $lookup: {
           from: "users",
           localField: "_id",
           foreignField: "_id",
           as: "doctorDetails"
         }
       },
       { $unwind: "$doctorDetails" },
       {
         $project: {
           _id: 1,
           name: "$doctorDetails.name",
           totalItemsConsumed: 1,
           totalRecords: { $size: "$totalRecords" }
         }
       },
       { $sort: { totalItemsConsumed: -1 } },
       { $limit: 10 }
     ]);

     // Aggregate allocated stock item stats
     const allocationStatusDistribution = {};
     const allocations = await AllocatedStockItem.find({ clinicId }).select("status").lean();
     allocations.forEach(acc => {
       allocationStatusDistribution[acc.status] = (allocationStatusDistribution[acc.status] || 0) + 1;
     });
     const allocationStatusStats = Object.keys(allocationStatusDistribution).map(status => ({
       name: status.replace('_', ' '),
       count: allocationStatusDistribution[status]
     }));

     // Aggregate allocation by user
     const userAllocationStats = await AllocatedStockItem.aggregate([
       { $match: { clinicId } },
       {
         $group: {
           _id: "$user",
           totalAllocated: { $sum: "$quantity" },
           totalUsed: {
             $sum: {
               $cond: [{ $eq: ["$status", "Used"] }, "$quantity", 0]
             }
           }
         }
       },
       {
         $lookup: {
           from: "users",
           localField: "_id",
           foreignField: "_id",
           as: "userDetails"
         }
       },
       { $unwind: "$userDetails" },
       {
         $project: {
           _id: 1,
           name: "$userDetails.name",
           totalAllocated: 1,
           totalUsed: 1
         }
       },
       { $sort: { totalAllocated: -1 } },
       { $limit: 10 }
     ]);
 
     res.status(200).json({
       success: true,
       data: {
         items: itemsWithQuantity,
         typeStats,
         statusStats,
         uomTimeline,
         locationStats: {
             total: stockLocations.length,
             statusStats: locationStatusStats,
             locations: stockLocations
         },
         purchaseRecordTypeStats,
         detailedPurchaseRequests,
         grnStats: {
           total: totalGRNs,
           sourceStats: grnSourceStats,
           statusStats: grnStatusStats,
           recentInvoicedGRNs
         },
         purchaseInvoiceStats: {
           total: totalPurchaseInvoices,
           statusStats: piStatusStats,
           recentInvoices: recentPurchaseInvoices,
           topPaidGRNs
         },
         consumptionStats: {
           records: materialConsumptions,
           itemBreakdown: itemConsumptionBreakdown,
           doctorStats: doctorConsumptionStats
         },
         allocationStats: {
           statusStats: allocationStatusStats,
           userStats: userAllocationStats
         },
         transferStats: {
           records: await DirectStockTransfer.find({ clinicId })
             .populate("fromBranch", "name")
             .populate("toBranch", "name")
             .populate("createdBy", "name")
             .sort({ date: -1 })
             .lean(),
           statusStats: await DirectStockTransfer.aggregate([
             { $match: { clinicId } },
             { $group: { _id: "$status", count: { $sum: 1 } } },
             { $project: { name: "$_id", count: 1, _id: 0 } }
           ])
         },
         summary: {
             totalItems: itemsWithQuantity.length,
             totalQuantity: allocatedQuantities.reduce((acc, curr) => acc + curr.totalQuantity, 0),
             totalUOMs: uoms.length,
             totalLocations: stockLocations.length,
             totalPurchaseRequests,
             totalGRNs,
             totalPurchaseInvoices,
             totalConsumptions: materialConsumptions.length,
             totalTransfers: await DirectStockTransfer.countDocuments({ clinicId })
         }
       },
     });
  } catch (error) {
    console.error("Stock report error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
