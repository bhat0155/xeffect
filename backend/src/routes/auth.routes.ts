import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/google", passport.authenticate("google", {scope:["profile","email"], session: false}))

router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/", session: false}), (req,res)=>{
    //passport puts user info in req.user
    const user = req.user as {userId: string};

    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
        return res.status(500).json({code: "SERVER_MISCONFIG", message:"JWT_SECRET not configured"})
    }

    const token = jwt.sign({userId: user.userId}, jwtSecret, {expiresIn: "7d"});

    // send the code as cookie
    res.cookie("xeffect_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
    });

    // redirect to frontend
    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
    res.redirect(frontendOrigin)
})

// logout, clears the auth cookie so subsequent requests give 401
router.post("/logout", (req, res)=>{
    res.clearCookie("xeffect_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV == "production",
        path: "/"
    })

    return res.status(200).json({loggedOut: true})
})

export default router;