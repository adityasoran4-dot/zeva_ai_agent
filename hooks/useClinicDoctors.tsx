import { useState, useEffect } from "react";
import axios, { CancelTokenSource } from "axios";
import { getTokenByPath } from "@/lib/helper";

type Doctor = {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
};

export type UseClinicDoctorsReturn = {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
};

const useClinicDoctors = (branchId?: string): UseClinicDoctorsReturn => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source: CancelTokenSource = axios.CancelToken.source();

    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getTokenByPath();

        let url = "/api/clinic/doctors";
        if (branchId) url += `?branchId=${encodeURIComponent(branchId)}`;

        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cancelToken: source.token,
        });

        if (response?.data?.success) {
          setDoctors(response.data.data || []);
        } else {
          setDoctors(response?.data?.data || []);
          setError(response?.data?.message || null);
        }
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching doctors:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Error fetching doctors",
        );
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();

    return () => {
      source.cancel("useClinicDoctors: cancelled");
    };
  }, [branchId]);

  return { doctors, loading, error };
};

export default useClinicDoctors;
