import { getTokenByPath } from "@/lib/helper";
import { WorkflowTrigger } from "@/types/workflows";
import axios from "axios";
import React from "react";

const useTriggerByWorkflowId = ({ workflowId }: { workflowId: string }) => {
  const [trigger, setTrigger] = React.useState<WorkflowTrigger | null>(null);

  const fetchTrigger = React.useCallback(
    async (workflowId: string) => {
      try {
        if (!workflowId) return;
        const token = getTokenByPath();
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const { data } = await axios.get(
          `/api/workflows/triggers/getTriggerByWorkflowId/${workflowId}`,
        );
        if (data?.success && data?.data) {
          setTrigger(data.data);
        }
      } catch (error) {
        console.error("Error fetching trigger:", error);
      }
    },
    [workflowId],
  );

  React.useEffect(() => {
    fetchTrigger(workflowId);
  }, [fetchTrigger]);
  return {
    trigger,
    setTrigger,
    fetchTrigger,
  };
};

export default useTriggerByWorkflowId;
