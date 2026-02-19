import z from "zod";
import { base } from "./base";

export const uploadFile = base
  .input(z.file())
  .handler(async ({ input, context }) => {
    try {
      const file = input;
      let filename = file.name || `file-${Date.now()}`;

      // Sanitize filename - bucket paths only allow alphanumeric, _, -, ., and /
      filename = filename.replace(/[^a-zA-Z0-9_.\-\/]/g, "_"); // Need to find a better way to do this

      console.log(`Uploading file: ${filename}, size: ${file.size} bytes`);

      const fileContent = await file.arrayBuffer();
      const buffer = Buffer.from(fileContent);

      const base64Content = buffer.toString("base64");

      const query = `f"pdf_bucket:/${filename}".put($content)`;
      await context.db.query(query, { content: base64Content }).collect();

      console.log(`Successfully uploaded file: ${filename}`);

      return {
        success: true,
        filename,
        size: file.size,
        bucket_path: `pdf_bucket:/${filename}`,
      };
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  });

export const getLastFile = base.handler(async ({ context }) => {
  try {
    // List all files in the bucket and extract filenames using file::key()
    const listQuery = `SELECT file::key(file) AS filename, size, updated FROM file::list("pdf_bucket")`;
    const listResult = await context.db.query<
      [Array<{ filename: string; size: number; updated: string }>]
    >(listQuery).collect();

    const files = listResult[0];
    if (!files || files.length === 0) {
      throw new Error("No files found in bucket");
    }

    // Sort by updated timestamp descending to get the most recent file
    const sortedFiles = files.sort(
      (a, b) =>
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );

    const lastFile = sortedFiles[0];
    const filename = lastFile.filename;

    console.log(`Retrieving last uploaded file: ${filename}`);

    // Get file content as base64
    const contentQuery = `<string>f"pdf_bucket:/${filename}".get()`;
    const contentResult = await context.db.query<[string]>(contentQuery).collect();

    return {
      filename,
      content: contentResult[0], // base64 string
      size: lastFile.size,
      updated: lastFile.updated,
    };
  } catch (error) {
    console.error("File retrieval error:", error);
    throw error;
  }
});
