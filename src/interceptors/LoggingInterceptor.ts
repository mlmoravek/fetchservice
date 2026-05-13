import { AbstractRequestInterceptor, InterceptorHookArgs } from "@/Interceptor";

/**
 * A RequstService interceptor which adds an `console.debug` output to every request.
 */
export default class LoggingInterceptor extends AbstractRequestInterceptor {
  // log request
  override onRequest({
    request,
    options,
  }: InterceptorHookArgs<"onRequest">): void {
    console.debug("[fetch request]", request, options);
  }

  // log error
  override onRequestError({
    request,
    error,
  }: InterceptorHookArgs<"onRequestError">): void {
    console.debug("[fetch request error]", request, error);
  }

  // log response
  override onResponse({
    request,
    response,
  }: InterceptorHookArgs<"onResponse">): void {
    console.debug("[fetch response]", request, response.status, response.body);
  }

  // log error
  override onResponseError({
    request,
    response,
  }: InterceptorHookArgs<"onResponseError">): void {
    console.debug(
      "[fetch response error]",
      request,
      response.status,
      response.body,
    );
  }
}
