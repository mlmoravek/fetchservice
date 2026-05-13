import RequestService from "@/RequestService";
import AbortInterceptor from "@/interceptors/AbortInterceptor";
import MiddlewareController from "./MiddlewareController";

export default class CrudController<
  Entity extends Record<string, any> | string,
  DTO extends Record<string, any> | string = Entity,
> extends MiddlewareController<Entity, DTO> {
  protected readonly abortController: AbortInterceptor;
  protected readonly root: string;

  constructor(requestService: RequestService, root: string) {
    super(requestService);
    this.root = root;

    // add abort middleware
    this.abortController = this.enableAbortController(this.root);
  }

  /** Cancle all running requests with the root path of this controller. */
  public abort(): void {
    this.abortController.abort();
  }

  /**
   * Does a POST request to create a new object.
   * @param entity - The entity to create.
   * @returns The created entity object.
   */
  public create(entity: Entity): Promise<Entity> {
    return this.requestService
      .post<DTO>(this.root, this.onRequest(entity))
      .then(this.onResponse);
  }

  /**
   * Does a GET request to read a specific object by id.
   * @param id - The entity id.
   * @returns The entity object.
   */
  public read(id: number | string): Promise<Entity> {
    return this.requestService
      .get<DTO>(`${this.root}/${id}`)
      .then(this.onResponse);
  }

  /**
   * Does a PUT request to update an existing object by id.
   * @param id - The entity id.
   * @param entity - The entity to update.
   * @returns The updated entity object.
   */
  public update(id: number | string, entity: Entity): Promise<Entity> {
    return this.requestService
      .put<DTO>(`${this.root}/${id}`, this.onRequest(entity))
      .then(this.onResponse);
  }

  /**
   * Does a DELETE request to delete an existing object by id.
   * @param id - The entity id.
   * @returns `Promise<void>`
   */
  public delete(id: number | string): Promise<void> {
    return this.requestService.delete(`${this.root}/${id}`);
  }
}
