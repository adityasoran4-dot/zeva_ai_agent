import React, { useEffect } from "react";
import axios from "axios";
import { getAuthHeaders } from "@/lib/helper";

export interface AllocatedItem {
  _id: string;
  clinicId: string;
  item: {
    itemId: string;
    code?: string;
    name: string;
    description?: string;
    quantity: number;
    uom?: string;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
    discountType?: "Fixed" | "Percentage";
    discountAmount?: number;
    netPrice: number;
    vatAmount?: number;
    vatType?: "Exclusive" | "Inclusive";
    vatPercentage?: number;
    netPlusVat?: number;
    freeQuantity?: number;
  };
  quantity: number;
  user: string;
  location?: string;
  status?:
    | "Allocated"
    | "Issued"
    | "Used"
    | "Partially_Used"
    | "Returned"
    | "Expired"
    | "Cancelled"
    | "Deleted";
  quantitiesByUom: { uom: string; quantity: number }[];
  expiryDate?: Date;
  allocatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AllocatedStockItemDetails {
  allocatedStockItems: string[] | AllocatedItem[];
  purchaseRecord: string;
  allocatedBy: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const useAllocatedItems = ({
  userId,
  search,
}: {
  userId: string;
  search: string;
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [allocatedItems, setAllocatedItems] = React.useState<AllocatedItem[]>(
    [],
  );

  const fetchAllocatedItems = async (search = "") => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers || !headers.Authorization) return;
      const res = await axios.get("/api/stocks/allocated-stock-items/options", {
        headers,
        params: {
          user: userId,
          limit: 50,
          page: 1,
          sort: "-createdAt",
          search,
        },
      });
      const data = res.data?.records as AllocatedItem[] | undefined;
      const items = Array.isArray(data) ? data : [];
      // unique items by itemId
      const uniqueItems = items.filter(
        (item, index, self) =>
          index === self.findIndex((i) => i._id === item._id),
      );
      setAllocatedItems(uniqueItems);
    } catch (error) {
      console.log("Error fetching allocated items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocatedItems(search);
  }, [userId, search]);

  return {
    loading,
    allocatedItems,
    setAllocatedItems,
    fetchAllocatedItems,
  };
};

export default useAllocatedItems;
