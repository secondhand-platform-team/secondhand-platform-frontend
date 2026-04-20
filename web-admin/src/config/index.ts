import { z } from "zod";

const configSchema = z.object({
  // Có thể để trống → dùng Vite proxy (relative URL)
  API_ENDPOINT: z.string().default(""),
});

const configProject = configSchema.safeParse({
  API_ENDPOINT: import.meta.env.VITE_PUBLIC_API_ENDPOINT ?? "",
});

if (!configProject.success) {
  console.error("ENV ERROR:", configProject.error.issues);
  throw new Error("Env config không hợp lệ");
}

const envConfig = configProject.data;
export default envConfig;
