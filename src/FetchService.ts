import {
  ofetch,
  type $Fetch,
  type FetchOptions,
  type FetchRequest,
  type MappedResponseType,
  type ResponseType,
} from "ofetch";
import {
  InterceptorHookArgs,
  FetchInterceptor,
  InterceptorHooks,
} from "./Interceptor";

type FetchServiceOptions = Omit<
  FetchOptions,
  "onRequest" | "onRequestError" | "onResponse" | "onResponseError"
>;

/**
 * A lightweight HTTP client fetch service built on [`ofetch`](https://github.com/unjs/ofetch/).
 *
 * The service provides a simple, type-safe fetch layer for consistent REST operation handling.
 * It also supports interceptors which can be used to modify request options, do logging or handle errors globally.
 */
export default class FetchService {
  /** static singleton instance */
  private static instance: FetchService | undefined;
  /** The created ofetch instance. */
  private readonly api: $Fetch;
  /** A list of interceptors. */
  private readonly interceptors: Map<string, FetchInterceptor> = new Map();

  /**
   * Get the last created `FetchService` instance.
   * @returns A `FetchService` instance or `undefined` if none is created yet.
   */
  public static getInstance(): FetchService | undefined {
    return FetchService.instance;
  }

  /**
   * Creates a new `FetchService` instance.
   * @param options - Valid `ofetch` options which will be applied to any request on this instance.
   */
  constructor(options: FetchServiceOptions = {}) {
    // create ofetch api instance
    this.api = ofetch.create({
      ...options,
      // onRequest is called as soon as ofetch is called, allowing you to modify options or do simple logging.
      onRequest: (args): void => {
        this.callInterceptors("onRequest", args);
      },
      // onRequestError will be called when the fetch request fails.
      onRequestError: (args): void => {
        this.callInterceptors("onRequestError", args);
      },
      // onResponse will be called after fetch call and parsing body.
      onResponse: (args): void => {
        this.callInterceptors("onResponse", args);
      },
      // onResponseError is the same as onResponse but will be called when fetch happens but response.ok is not true.
      onResponseError: (args): void => {
        this.callInterceptors("onResponseError", args);
      },
    });

    // set static singleton instance
    FetchService.instance = this;
  }

  /**
   * Gets the `ofetch` client api instance.
   * @returns An `ofetch` instance.
   */
  public getAPI(): $Fetch {
    return this.api;
  }

  /**
   * Adds an fetch interceptor.
   * @param interceptor - The `FetchInterceptor` object.
   * @returns The interceptor key which can be used to remove the interceptor by the `removeInterceptor` function.
   */
  public addInterceptor(interceptor: FetchInterceptor): string {
    const key = Math.random().toString(16);
    this.interceptors.set(key, interceptor);
    return key;
  }

  /**
   * Gets an fetch interceptor by its key.
   * @param key - The interceptor key received by `addInterceptor` function.
   * @returns Returns the interceptor associated with the specified key or `undefined` if no interceptor is associated with the specified key.
   */
  public getInterceptor(key: string): FetchInterceptor | undefined {
    return this.interceptors.get(key);
  }

  /**
   * Removes an fetch interceptor.
   * @param key - The interceptor key received by the `addInterceptor` function.
   */
  public removeInterceptor(key: string): void {
    this.interceptors.delete(key);
  }

  /**
   * Does a low-level fetch request with a raw fetch-style request or options.
   * @param request - The resource that you wish to fetch.
   * @param options - An object containing any custom settings that you want to apply to the request.
   * @returns An ofetch response object.
   */
  public fetch<T, R extends ResponseType = "json">(
    request: FetchRequest,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> {
    return this.api<T, R>(request, options);
  }

  /**
   * Makes a GET request.
   * @param url - The server URL that will be used for the request.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<T>`
   */
  public get<T>(
    url: string,
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<T> {
    const config: FetchOptions<"json"> = {
      headers,
      params,
      method: "GET",
    };
    return this.fetch<T>(url, config);
  }

  /**
   * Makes a POST request.
   * @param url - The server URL that will be used for the request.
   * @param body - The data to be sent as the request in the body.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<T>`
   */
  public post<T>(
    url: string,
    body: Record<string, any> | string = {},
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<T> {
    const config: FetchOptions<"json"> = {
      headers,
      params,
      body,
      method: "POST",
    };
    return this.fetch<T>(url, config);
  }

  /**
   * Makes a PUT request.
   * @param url - The server URL that will be used for the request.
   * @param body - The data to be sent as the request in the body.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<T>`
   */
  public put<T>(
    url: string,
    body: Record<string, any> | string = {},
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<T> {
    const config: FetchOptions<"json"> = {
      headers,
      params,
      body,
      method: "PUT",
    };
    return this.fetch<T>(url, config);
  }

  /**
   * Makes a DELETE request.
   * @param url - The server URL that will be used for the request.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @param body - The data to be sent as the request in the body.
   * @returns `Promise<T>`
   */
  public delete<T>(
    url: string,
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
    body: Record<string, any> | string = {},
  ): Promise<T> {
    const config: FetchOptions<"json"> = {
      params,
      headers,
      body,
      method: "DELETE",
    };
    return this.fetch<T>(url, config);
  }

  /**
   * Makes a POST request to upload a multipart file.
   * @param url - The server URL that will be used for the request.
   * @param data - The data to be sent as the request in the body.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<T>`
   */
  public upload<T>(
    url: string,
    data: FormData,
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<T> {
    const config: FetchOptions<"json"> = {
      headers: Object.assign(
        { "Content-Type": "multipart/form-data" },
        headers,
      ),
      params,
      body: data,
      method: "POST",
    };
    return this.fetch<T>(url, config);
  }

  /**
   * Makes a GET request to download a binary payload and return an ArrayBuffer.
   * @param url - The server URL that will be used for the request.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<ArrayBuffer>`
   */
  public download(
    url: string,
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<ArrayBuffer> {
    const config: FetchOptions<"arrayBuffer"> = {
      headers,
      params,
      responseType: "arrayBuffer",
      method: "GET",
    };
    return this.fetch<ArrayBuffer, "arrayBuffer">(url, config);
  }

  /**
   * Makes a POST request to download a binary payload and return an ArrayBuffer.
   * @param url - The server URL that will be used for the request.
   * @param body - The data to be sent as the request in the body.
   * @param params - The URL parameters to be sent with the request.
   * @param headers - Custom headers to be sent.
   * @returns `Promise<ArrayBuffer>`
   */
  public postDownload(
    url: string,
    body: Record<string, any> | string = {},
    params: Record<string, any> = {},
    headers: Record<string, any> = {},
  ): Promise<ArrayBuffer> {
    const config: FetchOptions<"arrayBuffer"> = {
      headers: {
        "Content-Disposition": "attachment;",
        ...headers,
      },
      params,
      body,
      responseType: "arrayBuffer",
      method: "POST",
    };
    return this.fetch<ArrayBuffer, "arrayBuffer">(url, config);
  }

  /**
   * Call a specific hook in every current registered interceptor.
   * @param key - The hook key.
   * @param options - The hook options.
   */
  private callInterceptors<
    K extends keyof InterceptorHooks,
    R extends ResponseType,
  >(key: K, options: InterceptorHookArgs<K, R>): void {
    this.interceptors.forEach((interceptor) => {
      const handler = interceptor[key];
      if (
        typeof handler === "function" &&
        // check if interceptor matches request URL
        matchesRegex(options.request, interceptor.urlPattern)
      ) {
        // @ts-expect-error idk whats going on here
        handler(options);
      }
    });
  }
}

/**
 * Checks whether a RequestInfo (string or Request object) matches a regular expression.
 * @param request - The URL or the request object.
 * @param regex - The regular expression for testing
 * @returns `true`, if there is a match.
 */
function matchesRegex(request: FetchRequest, regex?: RegExp): boolean {
  if (!regex) return true;

  const url: string =
    typeof request === "object" && request.url
      ? request.url
      : (request as string);

  return regex.test(url);
}
