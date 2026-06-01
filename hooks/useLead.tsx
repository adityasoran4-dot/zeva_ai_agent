import React from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";

type UseLeadArgs = {
  leadId?: string;
  auto?: boolean;
};

const useLead = ({ leadId, auto = true }: UseLeadArgs) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lead, setLead] = React.useState<any | null>(null);

  const token = React.useMemo(() => getTokenByPath(), []);
  const headers = React.useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const fetchLead = React.useCallback(
    async (id?: string) => {
      const resolvedId = id || leadId;
      if (!resolvedId) {
        setLead(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/lead-ms/get-lead?id=${resolvedId}`, {
          headers,
        });
        const data = res.data?.data ?? res.data?.lead ?? res.data ?? null;
        setLead(data);
        setError(null);
      } catch (e2: any) {
        const msg = e2?.response?.data?.message || "Failed to load lead";
        setError(msg);
        setLead(null);
      } finally {
        setLoading(false);
      }
    },
    [leadId, headers],
  );

  const updateLead = React.useCallback(
    async (payload: Record<string, any>, id?: string) => {
      const resolvedId = id || leadId;
      if (!resolvedId) return null;
      try {
        setLoading(true);
        setError(null);
        let data = null;
        if (payload && typeof payload.status === "string") {
          const res = await axios.put(
            `/api/lead-ms/update-lead-status-agent`,
            { leadId: resolvedId, status: payload.status },
            { headers },
          );
          data = res.data?.lead ?? res.data?.data ?? null;
          await fetchLead(resolvedId);
        } else {
          return null;
        }
        return data;
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Failed to update lead";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [leadId, headers],
  );

  React.useEffect(() => {
    if (auto) fetchLead();
  }, [auto, fetchLead]);

  const state = { lead, loading, error };

  return {
    state,
    setLead,
    fetchLead,
    updateLead,
    setLoading,
    setError,
  };
};

export default useLead;
