// api/new_tasks.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { main_task, sub_task, category, importance, bucket, time_estimate } =
    req.body;

  if (!main_task || !sub_task || !category || !importance || !bucket) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([
      { main_task, sub_task, category, importance, bucket, time_estimate },
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Task created", data });
}
