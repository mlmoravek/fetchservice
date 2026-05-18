# FetchServices

<a href="https://www.npmjs.com/package/fetchservices"><img src="https://img.shields.io/npm/v/fetchservices.svg?logo=npm" /></a>

The name given `FetchService` is a lightweight HTTP client fetch service based on [`ofetch`](https://github.com/unjs/ofetch/).

The service provides a simple, type-safe fetch layer for consistent REST operation handling.
It has built-in support for request/response interceptors, as well as optional authentication token, logging, aborting, and ETag cache helpers.

## Overview

- [FetchService](#api)
- [Interceptors](#interceptors)
  - [Built-in interceptors](#built-in-interceptors)
  - [Custom interceptor](#custom-interceptor)
- [Authentication](#authentication)
  - [AuthService](#authservice)
  - [KeyCloakAuthService](#keycloakauthservice)
- [Controllers](#controllers)
  - [BaseController](#basecontroller)
  - [CrudController](#crudcontroller)
  - [Middleware support](#middleware-support)

## Installation

```bash
npm install fetchservices
```

> `fetchservices` is published as an ESM package only.

## Quick Start

```ts
import FetchService from "fetchservices";

const api = new FetchService({ baseURL: "https://api.example.com" });

// GET request
const users = await api.get<{ id: number; name: string }[]>("/users");

// POST request
const created = await api.post<{ id: number; name: string }>("/users", {
  name: "Alice",
});
```

## API

**`new FetchService(options?)`**

Create a new HTTP service instance. Pass any valid `ofetch` request options.

```ts
const api = new FetchService({ baseURL: "https://api.example.com" });
```

**`api.get<T>(url, params?, headers?)`**

Send a `GET` request.

**`api.post<T>(url, body?, params?, headers?)`**

Send a `POST` request.

**`api.put<T>(url, body?, params?, headers?)`**

Send a `PUT` request.

**`api.delete<T>(url, params?, headers?, body?)`**

Send a `DELETE` request.

**`api.upload<T>(url, data, params?, headers?)`**

Send a multipart file upload request.

**`api.download(url, params?, headers?)`**

Download a binary payload and return an `ArrayBuffer`.

**`api.fetch<T>(request, options?)`**

Make a low-level request with a raw `fetch`-style request or options.

### Singleton

The `FetchService` stores the last created instance as singleton.

```ts
import FetchService from "fetchservices";

// create a new FetchService
new FetchService({ baseURL: "https://api.example.com" });

const api = FetchService.getInstance();
```

## Interceptors

The `FetchService` supports request and response interceptors. You can add your own or use the built-in interceptors.

An interceptor can be added with `api.addInterceptor(interceptor)`.  
Interceptor keys are strings and can be used to remove registered interceptors with `removeInterceptor(key)`.

### Built-in interceptors

```ts
import FetchService from "fetchservices";
import {
  LoggingInterceptor,
  AbortInterceptor,
  BearerTokenInterceptor,
  ETagCacheInterceptor,
} from "fetchservices/interceptors";

// initialise a new FetchService
const api = new FetchService({ baseURL: "https://api.example.com" });

// add interceptors to the FetchService instance
const loggerId = api.addInterceptor(new LoggingInterceptor());
const abortId = api.addInterceptor(new AbortInterceptor());
const authId = api.addInterceptor(
  new BearerTokenInterceptor(() => localStorage.getItem("token") ?? undefined),
);
const cacheInterceptor = new ETagCacheInterceptor(".*\/users\/.*");
api.addInterceptor(cacheInterceptor);

// you can remove any interceptor later on
api.removeInterceptor(loggerId);
```

### Custom interceptor

You can create custom interceptors using a `class` approach or as a casual `object`.

```ts
// class style
import { AbstractFetchInterceptor } from "fetchservices";

class CustomInterceptor extends AbstractFetchInterceptor {
  onRequest({ request, options }) {
    console.debug("starting", request);
  }

  onResponse({ response }) {
    console.debug("response status", response.status);
  }
}

// add the interceptor to the FetchService instance
api.addInterceptor(new CustomInterceptor(".*\/api/path\/.*"));
```

```ts
// object style
import type { FetchInterceptor } from "fetchservices";

const customInterceptor: FetchInterceptor = {
  urlPattern: RegExp(".*\/api/path\/.*"),

  onRequest({ request, options }) {
    console.debug("starting", request);
  },

  onResponse({ response }) {
    console.debug("response status", response.status);
  },
};

// add the interceptor to the FetchService instance
api.addInterceptor(customInterceptor);
```

## Authentication

The package also includes an abstract `AuthService` class, which can be used to implement an authentication workflow with `FetchService` integration.

### `AuthService`

The `AuthService` is an abstract base class for authentication workflows and already integrates with `FetchService`.
Based on the abstract class, you can implement any authentication provider you like. For an example, look at [`KeyCloakAuthService`](https://github.com/mlmoravek/fetchservices/blob/main/src/auth/KeyCloakAuthService.ts).

```ts
import { AuthService } from "fetchservices/auth";

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

#### Singleton

The `AuthService` stores the last created instance as singleton.

```ts
import { AuthService } from "fetchservices/auth";

class MyAuthService extends AuthService { ... }

// initialise any AuthService
new MyAuthService();

const auth = AuthService.getInstance();
```

### `KeyCloakAuthService`

The `KeyCloakAuthService` implements the abstract `AuthService` for a [Keycloak](https://www.keycloak.org/) provider and requires [`keycloak-js`](https://github.com/keycloak/keycloak-js) as an additional dependency.

> Note: [`keycloak-js`](https://github.com/keycloak/keycloak-js) is an optional dependency. You need to install it only when you want to use this service.

```ts
import FetchService from "fetchservices";
import { KeyCloakAuthService } from "fetchservices/auth";

// initialise a new FetchService
const api = new FetchService({ baseURL: "https://api.example.com" });

// initialise Keycloak based AuthService with the FetchService
const auth = new KeyCloakAuthService(api, {
  url: "https://auth.example.com/auth",
  realm: "myrealm",
  clientId: "my-client",
  minValidity: 30,
});

await auth.connectClient({ redirectUri: window.location.origin }, true);
```

## Controllers

The package also exports controller base classes for structured request handling. A controller provides a way to organise and cluster API endpoints based on entities.

### `BaseController`

Extend the abstract `BaseController` class to create a structured class for api requests.

```ts
import FetchService from "fetchservices";
import { BaseController } from "fetchservices/controller";

class MyController extends BaseController {
  fetchSomething() {
    return this.api.get("/items");
  }
}
```

### `CrudController`

This is a simple CRUD controller for REST endpoints that already implement basic CRUD operations.

```ts
import FetchService from "fetchservices";
import { BaseController } from "fetchservices/controller";

class UserController extends CrudController<{ id: number; name: string }> {}

// initialise a new FetchService
const api = new FetchService({ baseURL: "https://api.example.com" });

// initialise UserController with the FetchService
const users = new UserController(api, "/users");

await users.create({ id: 0, name: "Alice" });
await users.read(1);
await users.update(1, { id: 1, name: "Bob" });
await users.delete(1);
```

### Middleware support

The `CrudController` and `MiddlewareController` classes provide hooks for request and response transformation.

```ts
import { CrudController } from "fetchservices/controller";

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

- `FetchService` – default HTTP client wrapper
- `FetchInterceptor` / `AbstractFetchInterceptor` – interceptor types and base class
- `LoggingInterceptor` – logs requests and responses
- `AbortInterceptor` – adds abort support via `AbortController`
- `BearerTokenInterceptor` – adds `Authorization: Bearer` headers
- `ETagCacheInterceptor` – supports ETag based caching
- `AuthService` – abstract auth service base class
- `KeyCloakAuthService` – Keycloak authentication adapter
- `BaseController` – controller base class with middleware helpers
- `CrudController` – REST-style create/read/update/delete controller
- `MiddlewareController` – response/request transformation helpers

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/mlmoravek/fetchservices/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
