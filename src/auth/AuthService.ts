import RequestService from "@/RequestService";
import { InterceptorHookArgs } from "@/Interceptor";
import BearerTokenInterceptor from "@/interceptors/BearerTokenInterceptor";

type UnauthorizedHandler = (
  context: InterceptorHookArgs<"onResponseError">,
) => void;

/**
 * An Authentication and Authorization service template.
 */
export default abstract class AuthService {
  static instance?: AuthService;
  protected readonly requestService: RequestService;
  private bearerTokenInterceptorId?: string;
  private unauthorizedHandler?: UnauthorizedHandler;

  /**
   * Get the last created `AuthService` instance.
   * @returns A `AuthService` instance or `undefined` if none is created yet.
   */
  public static getInstance(): AuthService | undefined {
    return AuthService.instance;
  }

  constructor(requestService: RequestService = new RequestService()) {
    this.requestService = requestService;
    // add custom error interceptor
    this.requestService.addInterceptor({
      onResponseError: this.errorHandler,
    });

    // set static singleton instance
    AuthService.instance = this;
  }

  /**
   * Get the `RequestService` instance related to this service.
   * @returns The `RequestService` instance of this setvice.
   */
  public getRequestService(): RequestService {
    return this.requestService;
  }

  /**
   * Check if there is an active user sesssion.
   * @returns `true` if user is authenticated, `false` otherwise.
   */
  public abstract isAuthenticated(): boolean;

  /**
   * Logs in to an specific service.
   * @param config - Specific service configuration.
   * @returns `Promise<unknown>`
   */
  public abstract login(config?: any): Promise<unknown>;

  /**
   * Logs out from a specific service.
   * @param config - Specific service configuration.
   * @returns `Promise<unknown>`
   */
  public abstract logout(config?: any): Promise<unknown>;

  /**
   * Refreshes a auth token.
   * @returns `Promise<unknown>`
   */
  public abstract refreshToken(): Promise<unknown>;

  /**
   * Checks if the current auth token is expired.
   * @returns `true` when the token is expired, otherwise `false`.
   */
  public abstract tokenExpired(): boolean;

  /**
   * Gets the current auth token.
   * @returns An auth token if authenticated.
   */
  public abstract getToken(): string;

  /**
   * Gets the user profile for the current active user session.
   * @returns A profile of the current authenticated user if authenticated.
   */
  public abstract getProfile(): any;

  /**
   * Adds an authorization header interceptor which adds a baerer token in every requests.
   * @param getToken - A getter function to get the current auth token.
   */
  public addAuthorizationHeader(getToken: () => string | undefined): void {
    // remove old BearerTokenInterceptor
    if (this.bearerTokenInterceptorId) {
      this.requestService.removeInterceptor(this.bearerTokenInterceptorId);
    }

    // add a new BearerTokenInterceptor which adds an authorization header in every requests
    this.bearerTokenInterceptorId = this.requestService.addInterceptor(
      new BearerTokenInterceptor(getToken),
    );
  }

  /**
   * Sets an unauthorized error handler which get called when a response has the status code 401.
   * @param handler - The handler function.
   */
  public setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.unauthorizedHandler = handler;
  }

  /**
   * Validates the repsonse for different status codes.
   * @param context - The hook context.
   */
  private errorHandler(context: InterceptorHookArgs<"onResponseError">): void {
    switch (context.response.status) {
      case 401: {
        // unauthorized
        if (typeof this.unauthorizedHandler === "function") {
          this.unauthorizedHandler(context);
        }
        break;
      }
    }
  }
}
