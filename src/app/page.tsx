import { connection } from "next/server";

import { OwnerWorkspace } from "@/components/owner-workspace";
import { loadConfig } from "@/config";

export default async function Home() {
  await connection();
  const config = loadConfig();
  return <OwnerWorkspace mode={config.mode} />;
}
