import { AbstractFetchInterceptor, InterceptorHookArgs } from "@/index";

/**
 * A FetchService interceptor which checks each request regarding the given url pattern for valid ETag headers
 * and inject an existing ETag header in every request.
 * @see https://medium.com/airasia-com-tech-blog/etag-101-tips-and-tricks-for-implementation-6072525b487b
 */
export class ETagCacheInterceptor extends AbstractFetchInterceptor {
  private eTagCache = new Map<string, { body: unknown; eTag: string }>();

  override onRequest({
    request,
    options,
  }: InterceptorHookArgs<"onRequest">): void {
    const url: string =
      typeof request === "object" && request.url
        ? request.url
        : (request as string);

    if (this.eTagCache.has(url)) {
      const eTag = this.eTagCache.get(url);
      options.headers = Object.assign(options.headers ?? {}, {
        // If-None-Match = ETag from the cache, if not present send empty string
        "If-None-Match": eTag?.eTag,
      });
    }
  }

  override onResponse({
    request,
    response,
  }: InterceptorHookArgs<"onResponse">): void {
    const url: string =
      typeof request === "object" && request.url
        ? request.url
        : (request as string);

    if (response.status === 200) {
      // invalidate the present cache
      this.eTagCache.delete(url);

      const etagHeader = response.headers.get("ETag");
      if (etagHeader)
        // update the cache with the response from the server
        this.eTagCache.set(url, {
          eTag: etagHeader,
          body: response.body,
        });
    } else if (response.status === 304) {
      // the cache should hold the data
      const eTag = this.eTagCache.get(url);
      if (eTag) {
        // @ts-expect-error status is normally readonly
        response.status = 200;
        // @ts-expect-error body is normally readonly
        response.body = eTag?.body;
      }
    }
  }
}
