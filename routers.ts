import { Router } from "https://deno.land/x/oak/mod.ts"
import userHandler from "./handler/user_handler.ts"
import jwt from "./util/jwt_util.ts"


const router = new Router();

router.get("/rbmq-demo/users", userHandler.getUsers)
    .get("/rbmq-demo/user/balance", jwt.verify, userHandler.getUserBalance)
    .get("/rbmq-demo/user/info/:id", userHandler.getUser)
    .post("/rbmq-demo/user", userHandler.register)
    .post("/rbmq-demo/user/login", userHandler.login)
    .patch('/rbmq-demo/user/password', jwt.verify, userHandler.patchPassword)
    .get("/rbmq-demo/user/test/1", userHandler.test)
    .get("/rbmq-demo/system/version", userHandler.getVersion)
    

export default router;  



