import { api } from "./api";

export type UploadKind = "barber-avatar" | "shop-logo" | "shop-cover" | "shop-gallery";

interface SignResponse {
  signature: string;
  timestamp: number;
  public_id: string;
  eager: string;
  overwrite: boolean;
  api_key: string;
  cloud_name: string;
}

interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadsService = {
  // Get a signed upload ticket from the backend (never exposes API secret to client)
  sign: async (kind: UploadKind, params?: Record<string, string>): Promise<SignResponse> => {
    const { data } = await api.post<SignResponse>("/uploads/sign", { kind, ...params });
    return data;
  },

  // Upload an image directly to Cloudinary using a local file URI (from camera/gallery)
  uploadFromUri: async (uri: string, kind: UploadKind, params?: Record<string, string>): Promise<UploadResult> => {
    const sign = await uploadsService.sign(kind, params);

    const form = new FormData();
    const filename = uri.split("/").pop() ?? "upload.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    // React Native FormData accepts { uri, type, name } for file fields
    form.append("file", { uri, type: mime, name: filename } as unknown as Blob);
    form.append("api_key", sign.api_key);
    form.append("signature", sign.signature);
    form.append("timestamp", String(sign.timestamp));
    form.append("public_id", sign.public_id);
    form.append("eager", sign.eager);
    form.append("overwrite", "true");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloud_name}/image/upload`,
      { method: "POST", body: form }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${text}`);
    }
    const json = await res.json() as { secure_url: string; public_id: string };
    return { url: json.secure_url, publicId: json.public_id };
  },
};
