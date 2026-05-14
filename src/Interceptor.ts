import { FetchHooks, ResponseType } from "ofetch";

/** Helper type to unwrap potential arrays. */
type InnerArray<T> = T extends (infer U)[] ? U : T;

/** Definition of an interceptor for the `FetchService`. */
export type FetchInterceptor =
  | AbstractFetchInterceptor
  | (InterceptorHooks & { urlPattern?: RegExp });

/**
 * An object which defines several interceptor hooks.
 * @see https://github.com/unjs/ofetch#%EF%B8%8F-interceptors
 */
export type InterceptorHooks<R extends ResponseType = ResponseType> = {
  [K in keyof FetchHooks<unknown, R>]?: InnerArray<FetchHooks<unknown, R>[K]>;
};

export type InterceptorHookArgs<
  K extends keyof InterceptorHooks,
  R extends ResponseType = ResponseType,
> = Parameters<Required<InterceptorHooks<R>>[K]>[0];

/**
 * An abstract class which defines the FetchInterceptor hooks
 * and can be used to implement interceptors.
 */
export abstract class AbstractFetchInterceptor {
  /** URL pattern the interceptor apply to. */
  public urlPattern?: RegExp;

  /**
   * Create a new FetchInterceptor instance.
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
