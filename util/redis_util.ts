import { connect } from "https://deno.land/x/redis/mod.ts"
import { config } from "https://deno.land/x/dotenv/mod.ts"

export const redis = await connect({
    hostname: config().REDIS_HOST,
    port: parseInt(config().REDIS_PORT),
  });

export const redisKey = {
    loginUser:(userId:number):string => {
      return `loginUser:${userId}`
    },
    tempAccessUser:(userId:number):string => {
      return `tempAccessUser:${userId}`
    },
    requestCount:(userId:number):string => {
      return `requestCount:${userId}`
    },
    loginFailCount:(userId:number) => {
      return `loginFailCount:${userId}`
    }
}
