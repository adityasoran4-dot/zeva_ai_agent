import { getTokenByPath } from "@/lib/helper";
import { Supplier } from "@/types/stocks";
import axios from "axios";
import debounce from "lodash.debounce";
import React, { useEffect } from "react";

const useSuppliers = ({
  search = "",
  branchId = "",
}: {
  search?: string;
  branchId?: string;
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);

  // Fetch suppliers with proper error handling
  const fetchSuppliers = React.useCallback(
    debounce(async () => {
      try {
        setLoading(true);
        if (!branchId) return;

        const token = getTokenByPath();
        const response = await axios.get(
          `/api/stocks/suppliers?page=1&limit=20&branch=${branchId}${
            search ? `&search=${encodeURIComponent(search)}` : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          setSuppliers(response.data?.data?.suppliers || []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        // Show empty state on error
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [search, branchId]
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    loading,
    suppliers,
    setSuppliers,
  };
};

export default useSuppliers;
