import axios from "axios";
import { Segment } from "@/types/segment";
import { useEffect, useState } from "react";

const useSegment = ({ segmentId }: { segmentId: string }) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;
  const [loading, setLoading] = useState<boolean>(false);
  const [segment, setSegment] = useState<Segment | null>(null);

  const fetchSegment = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`/api/segments/${segmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data?.success) {
        setSegment(data?.segment || null);
      }
    } catch (error: any) {
      console.log("Error in get segment details: ", error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (segmentId && token) fetchSegment();
  }, [segmentId, token]);
  return {
    loading,
    segment,
  };
};

export default useSegment;
