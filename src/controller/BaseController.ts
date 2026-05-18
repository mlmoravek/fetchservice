import { FetchService } from "@/index";
import {
  AbortInterceptor,
  ETagCacheInterceptor,
  LoggingInterceptor,
} from "@/interceptors";

export abstract class BaseController {
  protected readonly api: FetchService;

  constructor(api: FetchService) {
    this.api = api;
  }

  /**
   * Gets the `FetchService` instance related to this controller.
   * @returns The `FetchService` instance of this controller.
   */
  public getFetchService(): FetchService {
    return this.api;
  }

  /**
   * Adds ETag cache middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `ETagCacheInterceptor` instance.
   */
  public enableCache(root: string): ETagCacheInterceptor {
    const interceptor = new ETagCacheInterceptor(`.*${root}/.*`);
    this.api.addInterceptor(interceptor);
    return interceptor;
  }

  /**
   * Adds AbortController middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `AbortInterceptor` instance.
   */
  public enableAbortController(root: string): AbortInterceptor {
    const interceptor = new AbortInterceptor(`.*${root}/.*`);
    this.api.addInterceptor(interceptor);
    return interceptor;
  }

  /**
   * Adds logging middleware interceptor.
   * @param root - The root URL pattern the interceptor apply to.
   * @returns The created `LoggingInterceptor` instance.
   */
  public enableLogging(root: string): LoggingInterceptor {
    const interceptor = new LoggingInterceptor(`.*${root}/.*`);
    this.api.addInterceptor(interceptor);
    return interceptor;
  }
}
