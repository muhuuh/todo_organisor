import { IncomingMessage, ServerResponse } from "http";
// import { createClient } from "@supabase/supabase-js"; // Temporarily commented out

// Helper function to parse JSON body
async function parseJSONBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}")); // Handle empty body case
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

// const supabase = createClient( // Temporarily commented out
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await parseJSONBody(req);

    // Basic validation (can keep this)
    const { main_task, sub_task, category, importance, bucket } = body;
    if (!main_task || !sub_task || !category || !importance || !bucket) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing required fields" }));
      return;
    }

    // --- Supabase code removed --- //

    // Just return success if body is parsed and fields are present
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Task received (Supabase skipped)",
        received_body: body,
      })
    );
  } catch (error: any) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message }));
  }
}
