import { Application } from "https://deno.land/x/oak/mod.ts"
import { config } from "https://deno.land/x/dotenv/mod.ts"
import router from "./routers.ts"
import { oakCors } from "https://deno.land/x/cors/mod.ts";

// console.log(`env =${Deno.args[0]}`);

interface UserInfo {
    userId: number,
    name: string,
    newToken: string
}

const app = new Application<UserInfo>();

// Logger
app.use(async (context: any, next: any) => {
    console.log(`${context.request.method} ${context.request.url}`);
    try{
        await next();

        // console.log(`dfsdf = ${context.state.newToken}`)
        if(context.state.newToken !== undefined){
            console.log(`dfsdf = ${context.state.newToken}`)
            context.response.body.newToken = context.state.newToken
        }
    } catch (e) {
        console.log(`${e.name}: ${e.message}`)
        context.response.status = 500
        context.response.body = {
            code: 500,
            msg: 'internal server error'
        }
    }finally{
        delete context.state.userId
        delete context.state.name
        delete context.state.newToken
    }
});

app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());
console.log('server start');

await app.listen({port:parseInt(config().SERVER_PORT) });
