import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Callback = (payload: unknown) => void;

export function useRealtimeSubmissions(onInsert: Callback) {
  useEffect(() => {
    const channel = supabase
      .channel("submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => onInsert(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert]);
}
