import { apiClient } from "./apiClient";

export const uploadImageApi = async (imageUri: string): Promise<string> => {
  const formData = new FormData();

  const filename = imageUri.split("/").pop() || "image.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const res = await apiClient.post("/api/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (res.data?.data?.url) {
    return res.data.data.url;
  }

  throw new Error(res.data?.message || "Upload failed");
};
