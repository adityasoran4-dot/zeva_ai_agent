import { getTokenByPath } from "@/lib/helper";
import { WorkflowAction } from "@/types/workflows";
import axios from "axios";
import React from "react";

const usePrevRestApiAction = ({
  workflowId,
  nodeId,
}: {
  workflowId: string;
  nodeId: string;
}) => {
  const [prevRestApiAction, setPrevRestApiAction] =
    React.useState<WorkflowAction | null>(null);

  const fetchPrevRestApiAction = React.useCallback(async () => {
    try {
      if (!nodeId) return;
      const token = getTokenByPath();
      const { data } = await axios.post(
        `/api/workflows/prevRestApiAction`,
        {
          workflowId,
          nodeId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data?.success && data?.data) {
        setPrevRestApiAction(data.data);
      }
    } catch (error) {
      console.error("Error fetching prev rest api action:", error);
    }
  }, [workflowId, nodeId]);

  React.useEffect(() => {
    fetchPrevRestApiAction();
  }, [fetchPrevRestApiAction]);
  return {
    prevRestApiAction,
    fetchPrevRestApiAction,
  };
};

export default usePrevRestApiAction;
