import { Client } from "https://deno.land/x/mysql/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts"

const dbClient = await new Client().connect({
  hostname: config().MYSQL_HOST,
  username: config().MYSQL_USERNAME,
  db: config().MYSQL_DB,
  password: config().MYSQL_PASSWORD
});


export default dbClient;