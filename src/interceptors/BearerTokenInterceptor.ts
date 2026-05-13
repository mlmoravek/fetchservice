import { AbstractRequestInterceptor, InterceptorHookArgs } from "@/Interceptor";

/**
 * A RequstService interceptor which adds an `Authorization` header to every request.
 */
export default class BearerTokenInterceptor extends AbstractRequestInterceptor {
  private getToken: () => string | undefined;

  /**
   * Create a new BearerTokenInterceptor instance.
   * @param getToken - A getter function for the bearer token.
   */
  constructor(getToken: () => string | undefined);

  /**
   * Create a new BearerTokenInterceptor instance.
   * @param urlPattern - A URL pattern the interceptor will apply to.
   * @param getToken - A getter function for the bearer token.
   */
  constructor(urlPattern: string, getToken: () => string | undefined);
  constructor(
    arg1: string | (() => string | undefined),
    arg2?: () => string | undefined,
  ) {
    super(typeof arg1 === "string" ? arg1 : undefined);
    this.getToken =
      typeof arg2 === "function" ? arg2 : (arg1 as typeof this.getToken);
  }

  override onRequest({ options }: InterceptorHookArgs<"onRequest">): void {
    const token = this.getToken();
    if (token) {
      // inject baerer token header
      options.headers = Object.assign(options.headers ?? {}, {
        Authorization: `Bearer ${token}`,
      });
    }
  }
}
