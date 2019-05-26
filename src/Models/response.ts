export class UIResponse {
    isSuccess:boolean;
    responseBody: any;
    constructor(_isSuccess:boolean, _responseBody: any) {
        this.isSuccess = _isSuccess;
        this.responseBody = _responseBody;
    }
}