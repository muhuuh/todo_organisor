import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Keep this secret
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers["x-api-key"];

  if (!authHeader) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const { data: userData, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("token", authHeader)
    .single();

  if (error || !userData) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const data = JSON.parse(body);
  const { main_task, sub_task, category, importance, bucket, time_estimate } =
    data;

  const { error: insertError } = await supabase.from("tasks").insert([
    {
      user_id: userData.user_id,
      main_task,
      sub_task,
      category,
      importance,
      bucket,
      time_estimate,
    },
  ]);

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(200).json({ message: "Task created successfully" });
}
