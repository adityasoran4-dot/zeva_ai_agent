import { getTokenByPath } from "@/lib/helper";
import axios from "axios";
import React, { useCallback } from "react";

interface StockItem {
  _id: string;
  clinicId: string;
  name: string;
  description: string;
  code: string;
  type: "Stock" | "Service" | "Fixed_Asset";
  location: string; // ObjectId as string
  brand: string;
  dosage: string;
  strength: string;
  status: "Active" | "Inactive";
  vatPercentage: number;
  minQuantity: number;
  maxQuantity: number;

  // Level 0 Details (Base/Primary level)
  level0: {
    costPrice: number;
    uom: string;
    salePrice: number;
  };

  // Multi-level packaging structure
  packagingStructure: {
    level1: {
      multiplier: number;
      costPrice: number;
      uom: string;
      salePrice: number;
    };
    level2: {
      multiplier: number;
      costPrice: number;
      uom: string;
      salePrice: number;
    };
  };

  imageUrl: string;
  createdBy: string; // ObjectId as string
  createdAt: string;
  updatedAt: string;
}

const useStockItems = () => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);

  const fetchStockItems = useCallback(async () => {
    try {
      setLoading(true);
      const token = getTokenByPath();
      const { data } = await axios.get(`/api/stocks/stock-items?limit=${500}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (data && data?.success) {
        setStockItems(data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching stock items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStockItems();
  }, [fetchStockItems]);

  return {
    loading,
    stockItems,
    setStockItems,
    fetchStockItems,
  };
};

export default useStockItems;
