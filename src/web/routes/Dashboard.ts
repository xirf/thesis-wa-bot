import express from "express"
const R = express.Router()


R.get('/', (_req: express.Request, res: express.Response) => {
    res.render('index', {
        layout: "dashboard"
    })
})


export default R