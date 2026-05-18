// This services is a auth adapter which wrapps keycloak-js.
// It provides functions for automatic keycloak token refresh.
import Keycloak, {
  type KeycloakServerConfig,
  type KeycloakProfile,
  type KeycloakInitOptions,
} from "keycloak-js";
import { AuthService } from "@/auth";
import type { FetchService } from "@/index";

export type TokenRefreshHandler = (newToken: string) => void;

export interface KeyCloakAuthServiceOptions extends KeycloakServerConfig {
  minValidity: number;
}

/**
 * The `KeyCloakAuthService` implements an `AuthService` and uses KeyCloak as authentication provider.
 * An access token will be stored and injected in every request, made by the related `FetchService` instance.
 * The access token will be updated automaticaly.
 */
export class KeyCloakAuthService extends AuthService {
  private readonly keycloak: Keycloak;
  private tokenRefreshHandler?: TokenRefreshHandler;
  private tokenInterceptorId;

  /**
   * Creates a new KeyCloak instance with the given properties.
   * @param api - The related `FetchService` instance.
   * @param options - Keycloak instance options.
   */
  constructor(api: FetchService, options: KeyCloakAuthServiceOptions) {
    super(api);

    // create the internal Keycloak instance
    this.keycloak = new Keycloak(options);

    // set an tokenExpired Handler
    // which is called when the access token has expired
    // the token will get silently refreshed, resulting in a seamless user experience after login
    this.keycloak.onTokenExpired = (): void => {
      this.refreshToken(options.minValidity);
    };

    // set Authorization Bearer token as header
    this.addAuthorizationHeader(this.getToken);

    // adds a request interceptor
    this.tokenInterceptorId = api.addInterceptor({
      onRequest: () => {
        // refreshes the token every time a request is made.
        this.refreshToken(options.minValidity);
      },
    });
  }

  /**
   * Performs the initial client authentication against Keycloak.
   * If the `silentSSO` is `false`, initialisation with login is required.
   * Otherwise, it will be checked whether automatic authentication via SSO is possible.
   * @param options - `Keycloak` init options.
   * @param silentSSO - `Boolean` which decides instantiation mode for `Keycloak`. e.g. login-required or check-sso.
   * Login-required mode redirects user to login screen if not logged in already. Check-sso only checks if already
   * logged in without redirecting to login screen if not logged in.
   * @returns `Promise<Boolean>` which defined if an user is authenticated.
   */
  public connectClient(
    options: KeycloakInitOptions = {},
    silentSSO = true,
  ): Promise<boolean> {
    return this.keycloak
      .init({
        checkLoginIframe: false,
        onLoad: silentSSO ? "check-sso" : "login-required",
        pkceMethod: "S256",
        ...options,
      })
      .then((authenticated: boolean) => {
        if (!authenticated && !silentSSO) {
          return this.keycloak.login().then(() => this.isAuthenticated());
        }
        return authenticated;
      });
  }

  /**
   * Gets the internal Keycloak instance.
   * @returns A `Keycloak` instance.
   */
  public getKeyCloak(): Keycloak {
    return this.keycloak;
  }

  /**
   * Gets the Keycloak user profile for the current active user session.
   * @returns The Keycloak profile of the current authenticated user if authenticated.
   */
  public getProfile(): Promise<KeycloakProfile> {
    return this.keycloak.loadUserProfile();
  }

  /**
   * Gets the Keycloak base64 encoded token that can be sent in the Authorization header in requests to services.
   * @returns The Keycloak auth token if authenticated.
   */
  public getToken(): string {
    return this.keycloak.token || "";
  }

  /**
   * Checks if an user is authenticated.
   * @returns `true` if user is authenticated, `false` otherwise.
   */
  public isAuthenticated(): boolean {
    return this.keycloak.authenticated || false;
  }

  /**
   * Checks if an user has a specific realm or resource role.
   * @param role - The realm or resource role.
   * @returns `true` when the user has a realm or resource role, otherwise `false`.
   */
  public hasRole = (role: string): boolean => {
    return (
      this.keycloak.hasRealmRole(role) || this.keycloak.hasResourceRole(role)
    );
  };

  /**
   * Checks if the current auth token is expired.
   * @returns `true` when the token is expired, otherwise `false`.
   */
  public tokenExpired(): boolean {
    return this.keycloak.isTokenExpired();
  }

  /**
   * Opens a Keycloak login window.
   * @param redirectUri - Uri for redirect after login.
   * @returns `Promise<Keycloak>`
   */
  public login(redirectUri?: string): Promise<Keycloak> {
    return this.keycloak.login({ redirectUri }).then(() => this.keycloak);
  }

  /**
   * Opens a Keycloak logout window.
   * @param redirectUri - Uri for redirect after logout.
   * @returns `Promise<Keycloak>`
   */
  public logout(redirectUri?: string): Promise<Keycloak> {
    // remove old token interceptors
    if (this.tokenInterceptorId) {
      this.api.removeInterceptor(this.tokenInterceptorId);
    }

    return this.keycloak.logout({ redirectUri }).then(() => this.keycloak);
  }

  /**
   * Sets an handler function which get called when the access token expires.
   * @param handler - The handler function.
   */
  public setTokenRefreshHandler(handler: TokenRefreshHandler): void {
    this.tokenRefreshHandler = handler;
  }

  /**
   * If a refresh token is available the token will be refreshed
   * and the authorization token will be updated.
   * The tokenRefreshHandler will be called when set.
   * @param minValidity - If the token expires within `minValidity` seconds, the token is refreshed.
   * @returns `Promise<void>`
   */
  public refreshToken(minValidity = 30): Promise<void> {
    return this.keycloak
      .updateToken(minValidity) // If the token expires within `minValidity` seconds, the token is refreshed.
      .then((refreshed: boolean) => {
        if (refreshed && typeof this.tokenRefreshHandler === "function") {
          // call specific tokenRefreshHandler if set
          this.tokenRefreshHandler(this.getToken());
        }
      })
      .catch((error: unknown) => {
        console.error(
          "Failed to refresh the KeyCloak token, or the session has expired.",
          error,
        );
      });
  }
}
