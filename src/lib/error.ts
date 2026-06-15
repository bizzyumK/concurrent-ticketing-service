export function createError(messsage: string, statusCode: number) {
    const err: any = new Error(messsage);
    err.statusCode = statusCode;
    return err;
}