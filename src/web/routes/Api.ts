import express from "express"
import client from "../../database"
import jwt from "jsonwebtoken"
const R = express.Router()


R.get('/', (req: express.Request, res: express.Response) => {
    res.json({ message: "Hello, world!" })
})

R.post('/', (req: express.Request, res: express.Response) => {
    const { password, username } = req.body
    if (password == "admin" && username == "admin"){
        const token = jwt.sign({ username, password }, "secret")
        res.cookie("token", token, { maxAge: 1000 * 60 * 60 * 24 })
        res.redirect('/dashboard', {
            layout: 'dashboard'
        })
    }
    else {
        res.cookie("error", "Username atau password salah", { maxAge: 1000 * 60 * 60 * 24 })
        res.redirect('/login')
    }
})

export default R