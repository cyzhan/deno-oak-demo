import { helpers } from "https://deno.land/x/oak/mod.ts";
import { createHash } from "https://deno.land/std/hash/mod.ts"
import { isValidateParams, getPage, Constraint } from "../util/validator_util.ts";
import { ResponseModel } from "../common/commonModel.ts";
import userDao from "../dao/user_dao.ts";
import dateUtil from "../util/date_util.ts"
import { Page } from "../model/pageModel.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts"
import jwt from "../util/jwt_util.ts";
import { redis, redisKey } from "../util/redis_util.ts";

const userHandler = {
    test: async (context: any) => {
        jwt.create({
            id: 1,
            name: 'jeff'
        })
        context.response.body = ResponseModel.ok();
    },
    getUsers: async (context: any) => { 
        const param: Record<string, any> = helpers.getQuery(context, {mergeParams: true});
        const page: Page = getPage(param);
        const users: Array<any> = await userDao.getUsers(page);
        users.forEach((rs:any) => rs.createdTime = dateUtil.tsToDate(rs.createdTime));
        context.response.body = ResponseModel.of(users);
    },
    getUser: async (context: any) => {
        const param: Record<string, any> = helpers.getQuery(context, {mergeParams: true});
        const users: Array<any> = await userDao.getUserById(parseInt(param.id));
        if (users.length > 0){
            users.forEach((rs:any) => rs.createdTime = dateUtil.tsToDate(rs.createdTime));
            context.response.body = ResponseModel.of(users[0]);
        }else {
            context.response.body = ResponseModel.dataNotFound();
        }
    },
    register: async (context: any) => {
        const constraints: Array<Constraint> = []
        constraints.push(Constraint.create('name', true, 'string', (param: string) => {return param.length > 0 && param.length <= 20}))
        constraints.push(Constraint.create('email', true, 'string', (param: string) => {return param.length > 0 && param.length <= 40}))
        constraints.push(Constraint.create('password', true, 'string', (param: string) => {return param.length > 0 && param.length <= 30}))

        const requestBody = await context.request.body({type: "json"}).value;
        if(!isValidateParams(constraints, requestBody, context)){
            return;
        }
        
        const beforeMD5Str = `${requestBody.password}:${config().LOGIN_PASSWORD_SALT}`  
        requestBody.password = createHash("md5").update(beforeMD5Str).toString();
        const rs = await userDao.register(requestBody)
        console.log(`affectedRows = ${rs.affectedRows}, lastInsertId = ${rs.lastInsertId}`)
        context.response.body = rs.affectedRows == 1 ? ResponseModel.ok():ResponseModel.error(20003, 'register fail');
    },
    login: async (context:any) => {
        const requestBody = await context.request.body({type: "json"}).value;
        //Todo valid input process...
        const users = await userDao.getUserByName(requestBody.name); 
        if (users.length < 1){
            context.response.body = ResponseModel.error(20002, 'account not exist or password error');
            return
        }
        
        const user = users[0]
        const beforeMD5Str = `${requestBody.password}:${config().LOGIN_PASSWORD_SALT}`  
        const aferMD5Str =  createHash("md5").update(beforeMD5Str).toString();
        console.log(`rawPW = ${beforeMD5Str} / aferMD5Str = ${aferMD5Str}`);
        if(aferMD5Str != user.password){
            context.response.body = ResponseModel.error(20002, 'account not exist or password error');
            return
        }

        const token = jwt.create(user)
        redis.sendCommand('SET', redisKey.loginUser(user.id), token.split('.')[2], 'EX', config().TOKEN_EXPIRE_TIME)
        // redis.executor.exec('SET', redisKey.loginUser(user.id), token.split('.')[2], 'EX', config().TOKEN_EXPIRE_TIME)
        context.response.body = ResponseModel.of({token:token})
    },
    getUserBalance: async (context:any) => {
        const balanceAry = await userDao.getUserBalance(context.state.userId) 
        context.response.body = balanceAry.length == 0 ? ResponseModel.dataNotFound():balanceAry[0]
    },
    patchPassword: async (context: any) => {
        const constraints: Array<Constraint> = []
        constraints.push(Constraint.create('currentPassword', true, 'string', (param: string) => {return param.length > 0 && param.length <= 30}))
        constraints.push(Constraint.create('newPassword', true, 'string', (param: string) => {return param.length > 0 && param.length <= 30}))

        const requestBody = await context.request.body({type: "json"}).value;
        if(!isValidateParams(constraints, requestBody, context)){
            return;
        }

        const users: Array<any> = await userDao.getUserByName(context.state.name); 
        if (users.length < 1){
            context.response.body = ResponseModel.error(20002, 'account not exist');
            return
        }
        console.log(JSON.stringify(users));
        
        const user = users[0]
        let beforeMD5Str = `${requestBody.currentPassword}:${config().LOGIN_PASSWORD_SALT}`  
        let aferMD5Str = createHash("md5").update(beforeMD5Str).toString();
        if(aferMD5Str !== user.password){
            console.log(`pw hash in db = ${user.password}, input pw hash = ${aferMD5Str}`);
            context.response.body = ResponseModel.error(20002, 'account not exist or password error');
            return
        }

        beforeMD5Str = `${requestBody.newPassword}:${config().LOGIN_PASSWORD_SALT}`
        aferMD5Str = createHash("md5").update(beforeMD5Str).toString();
        console.log(`new password hash = ${aferMD5Str}`);
        const rs = await userDao.updateUserPassword(context.state.userId, aferMD5Str)
        console.log(`affectedRows = ${rs.affectedRows}`)
        context.response.body = rs.affectedRows == 1 ? ResponseModel.ok():ResponseModel.error(20003, 'register fail');
    },
    getVersion: async(context:any) => {
        context.response.body = {
            version: "v0.1.2"
        }
    }
}

export default userHandler
