import { AbstractFetchInterceptor, InterceptorHookArgs } from "@/Interceptor";

/**
 * Cancels all running requests related to the last created `AbortInterceptor` instance.
 * @param timeout - Optional timeout after a new request will not be canceled anymore.
 */
export function abortRequests(timeout?: number): void {
  if (!AbortInterceptor.instance) {
    throw new Error("No AbortInterceptor was initialised yet.");
  }

  AbortInterceptor.instance.abort(timeout);
}

/**
 * A FetchService interceptor which adds an `AbortController` signal to every request.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController}
 */
export default class AbortInterceptor extends AbstractFetchInterceptor {
  static instance?: AbortInterceptor;

  /**
   * Controller for request cancellation.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController}
   */
  abortController: AbortController = new AbortController();

  /**
   * Create a new AbortControllerInterceptor instance.
   * @param urlPattern - A URL pattern the interceptor will apply to.
   */
  constructor(urlPattern?: RegExp | string) {
    super(urlPattern);
    AbortInterceptor.instance = this;
  }

  override onRequest({ options }: InterceptorHookArgs<"onRequest">): void {
    // inject Abortcontroller signal
    options.signal = this.abortController.signal;
  }

  /**
   * Get the current AbortController.
   * A new AbortController will be created whenever the last one get aborted.
   * @returns The current AbortController.
   */
  public getAbortController(): AbortController {
    return this.abortController;
  }

  /**
   * Cancels all running requests.
   * @param timeout - The timeout after a new request will not be canceled anymore.
   */
  public abort(timeout = 500): void {
    // cancel all existing requests
    this.abortController.abort();
    // create new abortController for all new request
    setTimeout(() => {
      this.abortController = new AbortController();
    }, timeout);
  }
}
