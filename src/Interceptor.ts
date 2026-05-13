import { FetchError, FetchHooks, ResponseType } from "ofetch";

type InnerArray<T> = T extends (infer U)[] ? U : T;

export type RequestError = FetchError;

/** Definition of an interceptor for the RequestService. */
export type RequestInterceptor =
  | AbstractRequestInterceptor
  | (RequestInterceptorHooks & { urlPattern?: RegExp });

/**
 * An object which defines several interceptor hooks.
 * @see https://github.com/unjs/ofetch#%EF%B8%8F-interceptors
 */
export type RequestInterceptorHooks<R extends ResponseType = ResponseType> = {
  [K in keyof FetchHooks<unknown, R>]?: InnerArray<FetchHooks<unknown, R>[K]>;
};

export type InterceptorHookArgs<
  K extends keyof RequestInterceptorHooks,
  R extends ResponseType = ResponseType,
> = Parameters<Required<RequestInterceptorHooks<R>>[K]>[0];

/**
 * An abstract class which defines the RequestInterceptor hooks
 * and can be used to implement interceptors.
 */
export abstract class AbstractRequestInterceptor {
  /** URL pattern the interceptor apply to. */
  public urlPattern?: RegExp;

  /**
   * Create a new RequestInterceptor instance.
   * @param urlPattern - A URL pattern the interceptor will apply to.
   */
  constructor(urlPattern?: RegExp | string) {
    this.urlPattern =
      typeof urlPattern === "string" ? new RegExp(urlPattern) : urlPattern;
  }

  onRequest?(context: InterceptorHookArgs<"onRequest">): void;
  onRequestError?(context: InterceptorHookArgs<"onRequestError">): void;
  onResponse?(context: InterceptorHookArgs<"onResponse">): void;
  onResponseError?(context: InterceptorHookArgs<"onResponseError">): void;
}
