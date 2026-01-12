import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

type jwtPayload = {userId: string};

export function requireAuth(req: Request, res: Response, next: NextFunction){
    const token = req.cookies?.xeffect_token;
    if(!token){
        return res.status(401).json({ok: false, message: "Authentication required"});
    };

    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
        return res.status(500).json({ok: false, message: "JWT_SECRET not configured"});
    }

    try{
        const payload = jwt.verify(token, jwtSecret) as jwtPayload;
        if(!payload.userId){
            return res.status(401).json({ok: false, message: "Invalid token payload"})
        }
        // attach userId to req object for further use
        req.userId = payload.userId;
        return next();
    }catch(err){
        return res.status(401).json({ok: false, message: "Invalid or expired token"})
    }
}