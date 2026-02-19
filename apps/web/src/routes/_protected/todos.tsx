import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { client } from "@/orpc/client";

export const Route = createFileRoute("/_protected/todos")({
  component: Todos,
});

function Todos() {
  const [files, setFiles] = useState<File[] | undefined>();

  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      console.error("No file selected");
      return;
    }

    try {
      const file = files[0];
      const result = await client.file.upload(file);
      console.log("Upload successful:", result);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const result = await client.file.getLastFile();
      console.log("Retrieved file:", result.filename);

      // Convert base64 to blob
      const byteCharacters = atob(result.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Display PDF in browser
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Make sure you have uploaded a file first.");
    }
  };

  return (
    <div>
      <p>testing zone for Vincent</p>
      <Dropzone
        maxSize={1024 * 1024 * 100}
        onDrop={handleDrop}
        onError={console.error}
        src={files}
      >
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
      <Button type="button" onClick={handleSubmit}>
        Submit
      </Button>
      <Button type="button" onClick={handleDownload}>
        View Last Uploaded File
      </Button>
    </div>
  );
}
