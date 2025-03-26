import type { SS58String } from "polkadot-api";

export type Course = {
  id: number;
  teacher: SS58String;
  title: string;
  description: string;
  max_students: number;
  enrolled_count: number;
  start_time: bigint;
  end_time: bigint;
  price: bigint;
  active: boolean;
  metadata_hash: string;
  created_at: bigint;
};
