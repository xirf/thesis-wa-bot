import Express, { Request, Response, Next } from 'express';

export default function (req: Request, res: Response, next: Next) {
    if (req.cookies.auth) {
        next();
    } else {
        res.redirect('/login');
    }
}