import type RequestService from "@/RequestService";
import AbortInterceptor from "@/interceptors/AbortInterceptor";
import ETagCacheInterceptor from "@/interceptors/ETagCacheInterceptor";
import LoggingInterceptor from "@/interceptors/LoggingInterceptor";

export default abstract class BaseController {
  protected readonly requestService: RequestService;

  constructor(requestService: RequestService) {
    this.requestService = requestService;
  }

  /**
   * Gets the `RequestService` instance related to this controller.
   * @returns The `RequestService` instance of this controller.
   */
  public getRequestService(): RequestService {
    return this.requestService;
  }

  /**
   * Adds ETag cache middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `ETagCacheInterceptor` instance.
   */
  public enableCache(root: string): ETagCacheInterceptor {
    const interceptor = new ETagCacheInterceptor(`.*${root}/.*`);
    this.requestService.addInterceptor(interceptor);
    return interceptor;
  }

  /**
   * Adds AbortController middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `AbortInterceptor` instance.
   */
  public enableAbortController(root: string): AbortInterceptor {
    const interceptor = new AbortInterceptor(`.*${root}/.*`);
    this.requestService.addInterceptor(interceptor);
    return interceptor;
  }

  /**
   * Adds logging middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `LoggingInterceptor` instance.
   */
  public enableLogging(root: string): LoggingInterceptor {
    const interceptor = new LoggingInterceptor(`.*${root}/.*`);
    this.requestService.addInterceptor(interceptor);
    return interceptor;
  }
}
