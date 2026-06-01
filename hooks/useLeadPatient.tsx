import { getTokenByPath } from "@/lib/helper";
import axios from "axios";
import React from "react";

const useLeadPatient = ({ lead }: { lead?: any }) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [patient, setPatient] = React.useState<any | null>(null);

  const token = React.useMemo(() => getTokenByPath(), []);
  const headers = React.useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchPatient = React.useCallback(
    async (id?: string) => {
      const resolvedId = id || lead?.patientId;
      if (!resolvedId) {
        setPatient(null);
        return null;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `/api/staff/get-patient-data/${resolvedId}`,
          { headers }
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
    [lead?.patientId, headers]
  );

  const fetchOrAddPatientByLead = React.useCallback(
    async (lead: any) => {
      if (!lead) return;
      try {
        //
        const firstName = lead?.name?.split(" ")[0] || "";
        const lastName = lead?.name?.split(" ")[1] || "";
        const addPatientForm = {
          emrNumber: "",
          firstName: firstName,
          lastName: lastName,
          gender: lead?.gender || "",
          email: lead?.email || "",
          mobileNumber: lead?.phone || "",
          referredBy: "",
          patientType: "New",
        };
        const res = await axios.post(
          "/api/clinic/add-patient",
          addPatientForm,
          {
            headers: headers,
          }
        );
        if (res.data.success && res.data.patient) {
          setPatient(res.data.patient);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [lead, headers]
  );

  React.useEffect(() => {
    if (lead && lead?.patientId) fetchPatient(lead?.patientId);
    else if (lead && !lead?.patientId) fetchOrAddPatientByLead(lead);
  }, [lead, lead?.patientId, fetchPatient, fetchOrAddPatientByLead]);

  const state = {
    patient,
    loading,
    error,
  };
  return {
    state,
    fetchPatient,
    fetchOrAddPatientByLead,
  };
};

export default useLeadPatient;
