import "dotenv/config";

export const config = {
  baseUrl: process.env.BASE_URL ?? "http://localhost:3100",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3100/api",
  qaUser: process.env.QA_USER ?? "",
  qaPassword: process.env.QA_PASSWORD ?? "",
} as const;

if (!config.qaUser || !config.qaPassword) {
  throw new Error("Faltan las credenciales QA_USER o QA_PASSWORD");
}
