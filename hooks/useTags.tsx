import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import React, { useCallback, useEffect } from "react";

const useTags = ({ leadId }: { leadId: string }) => {
  const [tags, setTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchTags = useCallback(async () => {
    const token = getTokenByPath();
    if (!token) return;
    if (!leadId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/tags/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data?.success) {
        setTags(data?.data || []);
      }
    } catch (error) {
      console.log("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    setTags,
    fetchTags,
  };
};

export default useTags;
