import type {
  APIRequestContext,
  APIResponse,
} from "@playwright/test";
import { config } from "../../config/env";
import type { DocumentInput } from "../../types/documents";

export class DocumentsClient {
  constructor(
    private readonly api: APIRequestContext,
    private readonly token: string,
    private readonly runId: string
  ) {
    if (!token || !runId) {
      throw new Error("JWT y runId son obligatorios");
    }
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "x-lab-run-id": this.runId,
    };
  }

  async list(filters?: Record<string, string | number>): Promise<APIResponse> {
    return this.api.get(`${config.apiBaseUrl}/documents`, {
      headers: this.headers,
      params: filters,
    });
  }

  async create(document: DocumentInput): Promise<APIResponse> {
    return this.api.post(`${config.apiBaseUrl}/documents`, {
      headers: this.headers,
      data: document,
    });
  }

  async getById(id: string): Promise<APIResponse> {
    return this.api.get(
      `${config.apiBaseUrl}/documents/${encodeURIComponent(id)}`,
      { headers: this.headers }
    );
  }

  async update(id: string, document: DocumentInput): Promise<APIResponse> {
    return this.api.put(
      `${config.apiBaseUrl}/documents/${encodeURIComponent(id)}`,
      {
        headers: this.headers,
        data: document,
      }
    );
  }

  async delete(id: string): Promise<APIResponse> {
    return this.api.delete(
      `${config.apiBaseUrl}/documents/${encodeURIComponent(id)}`,
      { headers: this.headers }
    );
  }
}
