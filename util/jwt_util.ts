import { Base64 } from "https://deno.land/x/bb64/mod.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts"
import { redis, redisKey } from "./redis_util.ts";

const defaultHeader = JSON.stringify({
    "alg": "HS256",
    "typ": "JWT"
});

const b64Header = Base64.fromString(defaultHeader).toString();

const jwt = {
    verify: async (context: any, next: any) => {
        const jwtStr:string = context.request.headers.get('Authorization');
        if(jwtStr === undefined || jwtStr === ''){
            context.response.status = 401
            context.response.body = {
                code: 40100,
                msg: 'unauthorized'
            }
            console.log('token not found');
            return
        }

        const ary: Array<string> = jwtStr.split('.')
        const signature = hmac("sha256", config().JWT_SALT, ary[0] + '.' + ary[1], "utf8", "base64").toString().replace('=','').replace('=', '')
        if(ary.length != 3 || signature != ary[2]){
            context.response.status = 401
            context.response.body = {
                code: 40100,
                msg: 'unauthorized'
            }
            console.log('signature not match');
            return
        }

        const currentTS = Math.floor(Date.now() / 1000)
        const tokenPayload = JSON.parse(Base64.fromBase64String(ary[1]).toString());
        if (currentTS - tokenPayload > parseInt(config().TOKEN_EXPIRE_TIME)){
            context.response.status = 401
            context.response.body = {
                code: 40100,
                msg: 'unauthorized'
            }
            console.log('token expired');
            return
        }

        // console.log(`userId = ${tokenPayload.id}, name = ${tokenPayload.name}`);
        context.state.userId = tokenPayload.id
        context.state.name = tokenPayload.name

        const s = await redis.get(redisKey.loginUser(tokenPayload.id))
        if(s !== signature){
            const s2 = await redis.get(redisKey.tempAccessUser(tokenPayload.id))
            const isTempAccessUser = s2 === signature
            if(isTempAccessUser){
                await next();
                return
            }else{
                context.response.status = 401
                context.response.body = {
                    code: 40100,
                    msg: 'unauthorized'
                }
                console.log('token not found in redis');
                return
            }
        }

        
        if(currentTS - tokenPayload.produceTime  > parseInt(config().TOKEN_RENEW_TIME)){
            console.log('do renew token');
            const newToken = jwt.create(tokenPayload)
            const pl = redis.pipeline();
            pl.sendCommand('SET', redisKey.tempAccessUser(tokenPayload.id), jwtStr.split('.')[2], 'EX', 10)
            pl.sendCommand('SET', redisKey.loginUser(tokenPayload.id), newToken.split('.')[2], 'EX', parseInt(config().TOKEN_EXPIRE_TIME))

            // pl.executor.exec('SET', redisKey.tempAccessUser(tokenPayload.id), jwtStr.split('.')[2], 'EX', 10)
            // pl.executor.exec('SET', redisKey.loginUser(tokenPayload.id), newToken.split('.')[2], 'EX', parseInt(config().TOKEN_EXPIRE_TIME))
            const replies = await pl.flush();
            context.state.newToken = newToken
        }

        await next();
    },
    create: ({id, name}: {id:number, name: string}) => {
        const currentTS = Math.floor(Date.now() / 1000)
        const body: string = JSON.stringify({
            "id": id,
            "name": name,
            "produceTime" : currentTS
        })
                
        const b64Body = Base64.fromString(body).toString().replace('=', '').replace('=', '')
        const signature = hmac("sha256", config().JWT_SALT , b64Header + '.' + b64Body, "utf8", "base64").toString().replace('=','').replace('=', '')
        return b64Header + '.' + b64Body + '.' + signature;
    }
}

export default jwt 
