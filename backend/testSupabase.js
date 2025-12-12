import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    console.log("Testing Supabase connection...");

    // List buckets to check connection
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    console.log(
      "Buckets:",
      buckets.map((b) => b.name)
    );

    const bucketName = "post-images";
    const bucketExists = buckets.some((b) => b.name === bucketName);

    if (!bucketExists) {
      console.error(`Bucket '${bucketName}' does not exist!`);
      console.log(`Attempting to create bucket '${bucketName}'...`);
      const { data: bucketData, error: createError } =
        await supabase.storage.createBucket(bucketName, {
          public: true,
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return;
      }
      console.log("Bucket created successfully.");
    } else {
      console.log(`Bucket '${bucketName}' exists.`);
    }

    // Try to upload a small test file
    const fileName = `test_${Date.now()}.txt`;
    const fileContent = "This is a test file";

    console.log(`Attempting to upload ${fileName}...`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileContent, {
        contentType: "text/plain",
      });

    if (error) {
      console.error("Upload error:", error);
    } else {
      console.log("Upload successful:", data);

      // Clean up
      await supabase.storage.from(bucketName).remove([fileName]);
      console.log("Test file cleaned up.");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testUpload();
