export default class ApiError extends Error {
  constructor(status, ...args) {
    super(...args);
    this.status = status;
  }
}
