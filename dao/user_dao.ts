import { Page } from "../model/pageModel.ts";
import dbClient from "../util/mysql_util.ts"

 const userDao = {
    getUsers: async (page: Page) => {
        const sql = `select id, name, email, balance, UNIX_TIMESTAMP(created_time) AS createdTime 
        FROM rbmq.user limit ?, ?`;
        return await dbClient.query(sql, [page.offset, page.limit]);
    },
    getUserById: async (id: number) => {
        const sql = `
        select id, name, email, balance, UNIX_TIMESTAMP(created_time) AS createdTime 
        FROM rbmq.user WHERE id = ?
        ` 
        return await dbClient.query(sql, [id]);
    },
    register: async (requestBody: any) => {
        const sql = `
        INSERT INTO 
        rbmq.user (name, email, password, balance, created_time, updated_time)
        VALUES(?, ?, ?, 0.00, current_timestamp(), current_timestamp())
        `
        return await dbClient.transaction(async (conn:any) => {
            return await conn.execute(sql, [requestBody.name, requestBody.email, requestBody.password])
        })
    
    },
    getUserByName: async(name: string) => {
        const sql = `SELECT id, name, password, email, balance FROM rbmq.user WHERE name = ?`
        return await dbClient.query(sql, [name])
    },
    getUserBalance: async(userId: number) => {
        const sql = `SELECT balance from rbmq.user WHERE id = ?`
        return await dbClient.query(sql, [userId])
    },
    updateUserPassword: async(userId: number, newPassword: string) => {
        const sql = `UPDATE rbmq.user AS a SET a.password = ? WHERE a.id = ?`
        return await dbClient.execute(sql, [newPassword, userId])
    }
}

export default userDao