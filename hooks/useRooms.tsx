import { getTokenByPath } from "@/lib/helper";
import axios from "axios";
import React, { useCallback, useEffect } from "react";

export interface Room {
  _id: string;
  name: string;
  capacity: number;
  bookedFrom: string;
  fromTime: string;
  toTime: string;
}

const useRooms = () => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [rooms, setRooms] = React.useState<Room[]>([]);

  const fetchRooms = useCallback(async () => {
    const token = getTokenByPath();
    if (!token) {
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`/api/clinic/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data?.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    loading,
    rooms,
    setRooms,
    fetchRooms,
  };
};

export default useRooms;
