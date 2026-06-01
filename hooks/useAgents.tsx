import { getTokenByPath } from "@/lib/helper";
import { User } from "@/types/users";
import React from "react";

type UserRole = "agent" | "doctorStaff";

const useAgents = ({ role }: { role: UserRole }) => {
  const [agents, setAgents] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchAgents = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = getTokenByPath();
      if (!token || !role) return;

      const response = await fetch(
        `/api/lead-ms/get-agents-options?role=${role}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  React.useEffect(() => {
    // This effect can be used to fetch agents when needed
    fetchAgents();
  }, [fetchAgents]);

  const state = {
    agents,
    loading,
  };
  return {
    state,
    setAgents,
    setLoading,
    fetchAgents,
  };
};

export default useAgents;
