export interface UploadResult {
  url: string;
  objectPath: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const response = await fetch("/api/objects/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  const data = await response.json();

  if (data.useMultipart) {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(data.uploadURL, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await uploadResponse.json();
    return {
      url: result.url || result.objectPath,
      objectPath: result.objectPath,
    };
  } else {
    const uploadResponse = await fetch(data.uploadURL, {
      method: "PUT",
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage");
    }

    const saveResponse = await fetch("/api/images/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ imageURL: data.uploadURL }),
    });

    if (!saveResponse.ok) {
      throw new Error("Failed to save image reference");
    }

    const result = await saveResponse.json();
    return {
      url: result.objectPath,
      objectPath: result.objectPath,
    };
  }
}
