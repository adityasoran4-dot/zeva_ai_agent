import { getTokenByPath } from "@/lib/helper";
import { WorkflowAction } from "@/types/workflows";
import axios from "axios";
import React from "react";

const usePrevAiComposerAction = ({
  workflowId,
  nodeId,
}: {
  workflowId: string;
  nodeId: string;
}) => {
  const [prevAiComposerAction, setPrevAiComposerAction] =
    React.useState<WorkflowAction | null>(null);

  const fetchPrevAiComposerAction = React.useCallback(async () => {
    try {
      if (!nodeId) return;
      const token = getTokenByPath();
      const { data } = await axios.post(
        `/api/workflows/prevAiComposerAction`,
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
        setPrevAiComposerAction(data.data);
      }
    } catch (error) {
      console.error("Error fetching prev ai composer action:", error);
    }
  }, [workflowId, nodeId]);

  React.useEffect(() => {
    fetchPrevAiComposerAction();
  }, [fetchPrevAiComposerAction]);

  return {
    prevAiComposerAction,
    fetchPrevAiComposerAction,
  };
};

export default usePrevAiComposerAction;
