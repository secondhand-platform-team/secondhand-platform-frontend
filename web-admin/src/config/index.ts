import { z } from "zod";

const configSchema = z.object({
  // Có thể để trống → dùng Vite proxy (relative URL)
  API_ENDPOINT: z.string().default(""),
  WEB_CLIENT_URL: z.string().default("http://localhost:3000"),
});

const configProject = configSchema.safeParse({
  API_ENDPOINT: import.meta.env.VITE_PUBLIC_API_ENDPOINT ?? "",
  WEB_CLIENT_URL: import.meta.env.VITE_PUBLIC_WEB_CLIENT_URL ?? "http://localhost:3000",
});

if (!configProject.success) {
  console.error("ENV ERROR:", configProject.error.issues);
  throw new Error("Env config không hợp lệ");
}

const envConfig = configProject.data;
export default envConfig;
