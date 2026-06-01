import React from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";

type UsePatientArgs = {
  patientId?: string;
  auto?: boolean;
};

const usePatient = ({ patientId, auto = true }: UsePatientArgs = {}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [patient, setPatient] = React.useState<any | null>(null);
  const [list, setList] = React.useState<any[]>([]);

  const token = React.useMemo(() => getTokenByPath(), []);
  const headers = React.useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const fetchPatient = React.useCallback(
    async (id?: string) => {
      const resolvedId = id || patientId;
      if (!resolvedId) {
        setPatient(null);
        return null;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `/api/staff/get-patient-data/${resolvedId}`,
          { headers },
        );
        const data = res.data || null;
        setPatient(data);
        return data;
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to load patient";
        setError(msg);
        setPatient(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [patientId, headers],
  );

  const fetchPatients = React.useCallback(
    async (params?: {
      emrNumber?: string;
      invoiceNumber?: string;
      name?: string;
      phone?: string;
      claimStatus?: string;
      applicationStatus?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams();
        if (params?.emrNumber) qs.append("emrNumber", params.emrNumber);
        if (params?.invoiceNumber)
          qs.append("invoiceNumber", params.invoiceNumber);
        if (params?.name) qs.append("name", params.name);
        if (params?.phone) qs.append("phone", params.phone);
        if (params?.claimStatus) qs.append("claimStatus", params.claimStatus);
        if (params?.applicationStatus)
          qs.append("applicationStatus", params.applicationStatus);
        const res = await axios.get(
          `/api/clinic/patient-information${qs.toString() ? `?${qs.toString()}` : ""}`,
          { headers },
        );
        const data = res.data?.data || [];
        setList(data);
        return data;
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to load patients";
        setError(msg);
        setList([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [headers],
  );

  const updatePatientDetails = React.useCallback(
    async (payload: Record<string, any>, id?: string) => {
      const resolvedId = id || patientId;
      if (!resolvedId) return null;
      try {
        setLoading(true);
        setError(null);
        const res = await axios.put(
          `/api/staff/get-patient-data/${resolvedId}`,
          { updateType: "details", ...payload },
          { headers },
        );
        const updated = res.data?.updatedInvoice || null;
        if (updated) setPatient(updated);
        return updated;
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to update patient";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [patientId, headers],
  );

  const updatePatientStatus = React.useCallback(
    async (status: string, id?: string) => {
      const resolvedId = id || patientId;
      if (!resolvedId) return null;
      try {
        setLoading(true);
        setError(null);
        const res = await axios.put(
          `/api/clinic/patient-information`,
          { id: resolvedId, status },
          { headers },
        );
        const updated = res.data?.data || null;
        if (updated) setPatient(updated);
        return updated;
      } catch (e: any) {
        const msg = e?.response?.data?.message || "Failed to update status";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [patientId, headers],
  );

  React.useEffect(() => {
    if (auto && patientId) fetchPatient();
  }, [auto, patientId, fetchPatient]);

  const state = { patient, list, loading, error };

  return {
    state,
    setPatient,
    fetchPatient,
    fetchPatients,
    updatePatientDetails,
    updatePatientStatus,
    setLoading,
    setError,
  };
};

export default usePatient;
