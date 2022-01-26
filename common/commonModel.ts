export class ResponseModel {

    private static okResponse = {
        code: 20000,
        msg: 'ok'
    }

    private static requestDataNotFound = {
        code: 20001,
        msg: `request data not found`
    }

    public static ok(): any {
        return ResponseModel.okResponse;
    }

    public static of(data: any){
        return {
            'code': 20000,
            'msg': 'ok',
            'data': data
        }
    }

    public static error(code: number, msg: string){
        return {
            'code': code,
            'msg': msg
        }
    }

    public static dataNotFound(){
        return ResponseModel.requestDataNotFound;
    }

}