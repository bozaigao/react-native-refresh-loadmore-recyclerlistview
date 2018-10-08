export default class CustomError extends Error {
    constructor(exception) {
        super(exception.message);
        this.name = exception.type;
    }
}
//# sourceMappingURL=CustomError.js.map