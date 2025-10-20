import { Response } from 'express';

export class ResponseHandler {
  static success(res: Response, data: any, statusCode: number = 200) {
    return res.status(statusCode).json(data);
  }

  static created(res: Response, data: any) {
    return this.success(res, data, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode: number = 500) {
    return res.status(statusCode).json({ error: message });
  }

  static badRequest(res: Response, message: string) {
    return this.error(res, message, 400);
  }

  static notFound(res: Response, message: string) {
    return this.error(res, message, 404);
  }

  static unauthorized(res: Response, message: string = 'Não autorizado') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Acesso negado') {
    return this.error(res, message, 403);
  }

  static conflict(res: Response, message: string) {
    return this.error(res, message, 409);
  }
}
