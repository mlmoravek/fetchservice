import { BaseController } from "@/controller";

export abstract class MiddlewareController<
  Entity = unknown,
  DTO = Entity,
> extends BaseController {
  /**
   * A middleware function to process data before it is passed to the network.
   * The function must be called before the request is made.
   * @param entity - A data entity object.
   * @returns A request entity object.
   */
  protected onRequest(entity: Entity): DTO {
    return entity as unknown as DTO;
  }

  /**
   * A middleware function to process response data after a successful request.
   * The function must be called after the response has been received.
   * @param dto - A response entity object.
   * @returns A data entity object.
   */
  protected onResponse(dto: DTO): Entity {
    return dto as unknown as Entity;
  }
}
