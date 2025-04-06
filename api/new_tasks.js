const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const data = JSON.parse(body);
  const { main_task, sub_task, category, importance, bucket, time_estimate } =
    data;

  const { error } = await supabase
    .from("tasks")
    .insert([
      { main_task, sub_task, category, importance, bucket, time_estimate },
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Task created successfully" });
};
