import { getTokenByPath } from "@/lib/helper";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

interface Clinic {
  _id: string;
  owner: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

const useClinicBranches = () => {
  const token = getTokenByPath();
  const [clinicBranches, setClinicBranches] = useState<Clinic[]>([]);

  const fetchClinicBranches = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/clinic/branches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data && data?.success) {
        setClinicBranches(data?.data?.branches || []);
      }
    } catch (error) {
      console.log("Error fetching clinic branches: ", error);
    }
  }, [token]);

  useEffect(() => {
    fetchClinicBranches();
  }, [token]);

  return {
    clinicBranches,
    setClinicBranches,
    fetchClinicBranches,
  };
};

export default useClinicBranches;
