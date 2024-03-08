// moddleware check if user is authenticated

import type { Request, Response } from "express"

export default function authMiddleware(req: Request, res: Response, next: () => void) {
    if (req.cookies.token) {
        next()
    } else {
        res.redirect('/login')
    }
}