# RequestService

RequestService is a small, extendable fetch service based on [`ofetch`](https://github.com/unjs/ofetch/) for consistent request handling, support for interceptors, helpers for authentication, and additional controller abstractions.

## Installation

```bash
npm install requestservice
```

> `requestservice` is published as an ESM package.

## Quick Start

```ts
import RequestService from "requestservice";

const api = new RequestService({ baseURL: "https://api.example.com" });

// GET request
const users = await api.get<{ id: number; name: string }[]>("/users");

// POST request
const created = await api.post<{ id: number; name: string }>("/users", {
  name: "Alice",
});
```

## API

### `new RequestService(options?)`

Create a new HTTP service instance. Pass any valid `ofetch` request options.

```ts
const api = new RequestService({ baseURL: "https://api.example.com" });
```

### `api.get<T>(url, params?, headers?)`

Send a `GET` request.

### `api.post<T>(url, body?, params?, headers?)`

Send a `POST` request.

### `api.put<T>(url, body?, params?, headers?)`

Send a `PUT` request.

### `api.delete<T>(url, params?, headers?, body?)`

Send a `DELETE` request.

### `api.upload<T>(url, data, params?, headers?)`

Send a multipart file upload request.

### `api.download(url, params?, headers?)`

Download a binary payload and return an `ArrayBuffer`.

### `api.doRequest<T>(request, options?)`

Make a low-level request with a raw `fetch`-style request or options.

### Singleton

The `RequestService` stores a static singleton instance when created.

```ts
import RequestService from "requestservice";

// initialise RequestService
new RequestService({ baseURL: "https://api.example.com" });

const api = RequestService.getInstance();
```

## Interceptors

`RequestService` supports request and response interceptors. You can add your own or use the built-in interceptors.

An interceptor can be addes with `api.addInterceptor(interceptor)`.  
Interceptor keys are strings and can be used to removed registered interceptors with `removeInterceptor(key)`.

### Built-in interceptor helpers

```ts
import RequestService from "requestservice";
import {
  LoggingInterceptor,
  AbortInterceptor,
  BearerTokenInterceptor,
  ETagCacheInterceptor,
} from "requestservice";

// initialise RequestService
const api = new RequestService({ baseURL: "https://api.example.com" });

// add interceptors
const loggerId = api.addInterceptor(new LoggingInterceptor());
const abortId = api.addInterceptor(new AbortInterceptor());
const authId = api.addInterceptor(
  new BearerTokenInterceptor(() => localStorage.getItem("token") ?? undefined),
);
const cacheInterceptor = new ETagCacheInterceptor(".*\/users\/.*");
api.addInterceptor(cacheInterceptor);

// remove interceptor later
api.removeInterceptor(loggerId);
```

### Custom interceptor

```ts
// class style
import { AbstractRequestInterceptor } from "requestservice";

class CustomInterceptor extends AbstractRequestInterceptor {
  onRequest({ request, options }) {
    console.debug("starting", request);
  }

  onResponse({ response }) {
    console.debug("response status", response.status);
  }
}

api.addInterceptor(new CustomInterceptor(".*\/protected\/.*"));
```

```ts
// object style
import type { RequestInterceptor } from "requestservice";

const customInterceptor: RequestInterceptor = {
  urlPattern: RegExp(".*\/protected\/.*"),

  onRequest({ request, options }) {
    console.debug("starting", request);
  },

  onResponse({ response }) {
    console.debug("response status", response.status);
  },
};

api.addInterceptor(customInterceptor);
```

## Authentication helpers

The package also includes an `AuthService` and a Keycloak adapter via `KeyCloakAuthService`.

> Note: [`keycloak-js`](https://github.com/keycloak/keycloak-js) is an optional dependency. You need to install it only when you need Keycloak support.

### `AuthService`

`AuthService` is an abstract base class for authentication workflows and already integrates with `RequestService`.

```ts
import { AuthService } from "requestservice";

class MyAuthService extends AuthService {
  isAuthenticated() {
    return false;
  }
  login() {
    return Promise.resolve(undefined);
  }
  logout() {
    return Promise.resolve(undefined);
  }
  refreshToken() {
    return Promise.resolve(undefined);
  }
  tokenExpired() {
    return true;
  }
  getToken() {
    return "";
  }
  getProfile() {
    return null;
  }
}
```

#### Authorization header injection

The `AuthService` can automatically add bearer tokens to outgoing requests.

```ts
auth.addAuthorizationHeader(() => auth.getToken());
```

#### Unauthorized handling

```ts
auth.setUnauthorizedHandler((context) => {
  console.warn("user is unauthorized", context.response.status);
});
```

### `KeyCloakAuthService`

`KeyCloakAuthService` requires [`keycloak-js`](https://github.com/keycloak/keycloak-js) as an additional dependency. You need to install it when you want to use the `KeyCloakAuthService` . 

```ts
import RequestService, { KeyCloakAuthService } from "requestservice";

// initialise RequestService
const api = new RequestService({ baseURL: "https://api.example.com" });

// initialise AuthService with the RequestService
const auth = new KeyCloakAuthService(api, {
  url: "https://auth.example.com/auth",
  realm: "myrealm",
  clientId: "my-client",
  minValidity: 30,
});

await auth.authenticateClient({ redirectUri: window.location.origin }, true);
```

## Controllers

The package also exports controller base classes for structured request handling.

### `BaseController`

Extend the abstract `BaseController` class to create a structured cluster of api request services.

```ts
import RequestService, { BaseController } from "requestservice";

class MyController extends BaseController {
  fetchSomething() {
    return this.requestService.get("/items");
  }
}
```

### `CrudController`

A simple CRUD controller for REST endpoints.

```ts
import RequestService, { CrudController } from "requestservice";

class UserController extends CrudController<{ id: number; name: string }> {}

// initialise RequestService
const api = new RequestService({ baseURL: "https://api.example.com" });

// initialise UserController with the RequestService
const users = new UserController(api, "/users");

await users.create({ id: 0, name: "Alice" });
await users.read(1);
await users.update(1, { id: 1, name: "Bob" });
await users.delete(1);
```

### Middleware support

`CrudController` and `MiddlewareController` expose hooks for request and response transformation.

```ts
class MyController extends CrudController<MyEntity> {
  protected onRequest(entity: MyEntity) {
    return { ...entity, timestamp: Date.now() };
  }

  protected onResponse(dto: any) {
    return dto as MyEntity;
  }
}
```

## Exported modules

- `RequestService` – default HTTP client wrapper
- `RequestInterceptor` / `AbstractRequestInterceptor` – interceptor types and base class
- `LoggingInterceptor` – logs requests and responses
- `AbortInterceptor` – adds abort support via `AbortController`
- `BearerTokenInterceptor` – adds `Authorization: Bearer` headers
- `ETagCacheInterceptor` – supports ETag based caching
- `AuthService` – abstract auth service base class
- `KeyCloakAuthService` – Keycloak authentication adapter
- `BaseController` – controller base class with middleware helpers
- `CrudController` – REST-style create/read/update/delete controller
- `MiddlewareController` – response/request transformation helpers
