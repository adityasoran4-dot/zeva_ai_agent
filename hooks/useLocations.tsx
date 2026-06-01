import { useState, useEffect, useCallback } from "react";

interface Location {
  _id: string;
  location: string;
  status: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseLocationsProps {
  token: string;
  clinicId: string;
  search?: string;
}

const useLocations = ({ token, clinicId, search = "" }: UseLocationsProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!token || !clinicId) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        clinicId,
      });

      if (search) {
        queryParams.append("search", search);
      }

      const response = await fetch(`/api/stocks/locations?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      const data = await response.json();
      setLocations(data?.locations || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch locations",
      );
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [token, clinicId, search]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, error };
};

export default useLocations;
