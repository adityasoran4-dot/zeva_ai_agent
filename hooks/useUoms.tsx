import { useState, useEffect } from "react";

interface UOM {
  _id: string;
  name: string;
  category: "Main" | "Sub";
  status: "Active" | "Inactive" | "Allocated";
  clinicId: string;
  branch: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface UseUomsParams {
  token: string;
  branchId?: string;
  search?: string;
  status?: string;
  limit?: number;
  page?: number;
}

const useUoms = ({
  token,
  branchId,
  search = "",
  status,
  limit = 20,
  page = 1,
}: UseUomsParams) => {
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUoms = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (branchId) params.append("branchId", branchId);
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        params.append("limit", limit.toString());
        params.append("page", page.toString());

        const response = await fetch(`/api/stocks/uom?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch UOMs");
        }

        const data = await response.json();

        if (data.success) {
          setUoms(data.data.uoms || []);
        } else {
          throw new Error(data.message || "Failed to fetch UOMs");
        }
      } catch (err) {
        console.error("Error fetching UOMs:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setUoms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUoms();
  }, [token, branchId, search, status, limit, page]);

  return { uoms, loading, error };
};

export default useUoms;
