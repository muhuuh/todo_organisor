import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await new Promise<string>((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    const parsed = JSON.parse(body);
    const { main_task, sub_task, category, importance, bucket, time_estimate } =
      parsed;

    const { error } = await supabase
      .from("tasks")
      .insert([
        { main_task, sub_task, category, importance, bucket, time_estimate },
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Task created successfully" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
