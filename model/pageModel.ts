export class Page {

    limit: number
    offset: number 

    constructor(pageIndex: number, pageSize: number){
        this.limit = pageSize;
        this.offset = (pageIndex - 1)*10
    }

}