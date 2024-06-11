export default class ResponseFormatter {
  public static format (success: boolean, message: string, body?: any) {
    return { success, message, body }
  }
}
