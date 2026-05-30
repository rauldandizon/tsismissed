export async function uploadMedia(
  file: File,
  resourceType: "image" | "video",
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.secure_url as string, publicId: data.public_id as string });
        } catch {
          reject(new Error("Invalid response from Cloudinary."));
        }
      } else {
        let detail = "";
        try {
          const errData = JSON.parse(xhr.responseText);
          detail = errData?.error?.message ?? xhr.responseText;
        } catch {
          detail = xhr.responseText;
        }
        reject(new Error(`Upload failed (${xhr.status}): ${detail}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed due to a network error."));

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    xhr.send(formData);
  });
}

export function getCloudinaryResourceType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("image/") ? "image" : "video";
}

export async function uploadAvatar(
  file: File
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Avatar upload failed.");
  }

  const data = await res.json();
  return { url: data.secure_url as string, publicId: data.public_id as string };
}
