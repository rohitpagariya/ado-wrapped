import axios, { AxiosInstance, AxiosError } from "axios";

export interface AzureDevOpsClientConfig {
  organization: string;
  pat: string;
  apiVersion?: string;
}

export class AzureDevOpsClient {
  private axiosInstance: AxiosInstance;
  private organization: string;
  private apiVersion: string;

  constructor(config: AzureDevOpsClientConfig) {
    this.organization = config.organization;
    this.apiVersion = config.apiVersion || "7.0";

    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: `https://dev.azure.com/${config.organization}`,
      headers: {
        "Content-Type": "application/json",
        // PAT authentication using Basic Auth (empty username, PAT as password)
        Authorization: `Basic ${Buffer.from(`:${config.pat}`).toString(
          "base64"
        )}`,
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Get method with automatic retry for rate limiting
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const fullParams = {
      "api-version": this.apiVersion,
      ...params,
    };

    const response = await this.axiosInstance.get<T>(url, {
      params: fullParams,
    });
    return response.data;
  }

  /**
   * Post method for WIQL queries and other POST operations
   */
  async post<T>(
    url: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const fullParams = {
      "api-version": this.apiVersion,
      ...params,
    };

    const response = await this.axiosInstance.post<T>(url, data, {
      params: fullParams,
    });
    return response.data;
  }

  /**
   * Handle API errors with user-friendly messages
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          throw new Error(
            "Authentication failed. Please check your Personal Access Token (PAT)."
          );
        case 403:
          throw new Error(
            "Access denied. Your PAT may not have the required permissions."
          );
        case 404:
          throw new Error(
            "Resource not found. Please verify your organization, project, and repository names."
          );
        case 429:
          // Rate limiting - could implement exponential backoff here
          const retryAfter = error.response.headers["retry-after"] || "60";
          throw new Error(
            `Rate limit exceeded. Please retry after ${retryAfter} seconds.`
          );
        case 500:
        case 502:
        case 503:
          throw new Error(
            "Azure DevOps service is temporarily unavailable. Please try again later."
          );
        default:
          const message =
            data?.message || error.message || "An unknown error occurred";
          throw new Error(`Azure DevOps API error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error(
        "No response from Azure DevOps. Please check your internet connection."
      );
    } else {
      // Error setting up the request
      throw new Error(`Request error: ${error.message}`);
    }
  }

  /**
   * Build organization URL for reference
   */
  getOrganizationUrl(): string {
    return `https://dev.azure.com/${this.organization}`;
  }

  /**
   * Build project URL for reference
   */
  getProjectUrl(project: string): string {
    return `${this.getOrganizationUrl()}/${project}`;
  }
}

/**
 * Create a new Azure DevOps client instance
 */
export function createClient(
  config: AzureDevOpsClientConfig
): AzureDevOpsClient {
  return new AzureDevOpsClient(config);
}
