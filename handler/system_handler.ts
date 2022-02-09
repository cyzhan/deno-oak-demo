import localCache from "../util/cache_util.ts";

const systemHandler = {
    getCache: (context:any) => {
        context.response.body = {
            code: 200,
            msg: "",
            data: localCache.a
        }
    },
    putCache:async (context:any) => {
        localCache.a = await context.request.body({type: "json"}).value;
        context.response.body = {
            code: 200,
            msg: "",
            data: localCache.a
        }
    }
}

export default systemHandler;