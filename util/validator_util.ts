import { ResponseModel } from "../common/commonModel.ts";
import { Page } from "../model/pageModel.ts";

export class Constraint{
    #name: string
    #required: boolean
    #type: string
    #validator: (target:any) => boolean

    constructor(name:string, required: boolean, type: string, validator: (target:any) => boolean){
        this.#name = name
        this.#required = required
        this.#type = type
        this.#validator = validator
    }

    getName(){
        return this.#name
    }

    isRequired(){
        return this.#required
    }

    getType(){
        return this.#type
    }

    valid(target:any):boolean{
        return this.#validator(target)
    }

    public static create(name:string, required: boolean, type: string, validator: (target:any) => boolean): Constraint{
        return new Constraint(name, required, type, validator)
    } 

    public static ofString(name:string, required: boolean, minLength: number, maxLength: number): Constraint{
        return new Constraint(name, required, 'string', (param: string) => {return param.length >= minLength && param.length <= maxLength})
    }

    public static ofNumber(name:string, required: boolean, min: number, max: number): Constraint{
        return new Constraint(name, required, 'number', (param: number) => {return param >= min && param <= max})
    }

}

export function isValidateParams(constraints: Array<Constraint>, target: any, {response}: {response: any}): boolean {
    for (let constraint of constraints) {
        let param = target[constraint.getName()];
        
        if (param === undefined && constraint.isRequired()){
            response.status = BAD_REQUEST;
            response.body = ResponseModel.error(40000, `Missing Parameter ${constraint.getName()}`);
            return false;
        }
        
        if(typeof param !== constraint.getType()){
            response.status = 400;
            response.body = ResponseModel.error(40000, `${constraint.getName()} is of type ` +`${typeof param} but should be ${constraint.getType()}`);
            return false;
        }
        
        if(!constraint.valid(param)){
            response.status = 400;
            response.body = ResponseModel.error(40000, `Validation failed for ${constraint.getName()}`);
            return false;
        }

    }   
    
    return true;
}

export function getPage(param: Record<string, string>): Page{

    // if (typeof pageIndex !== 'number' || typeof pageSize !== 'number'){
    //     return new Page(1, 10);
    // }
    // const a = pageIndex > 0 ? pageIndex : 1
    // const b = pageSize > 0 ? pageSize : 10
    const a = parseInt(param.pageIndex, 10)
    const b = parseInt(param.pageSize, 10)
    return new Page(a > 0 ? a : 1,  b > 0 ? b : 10)
}