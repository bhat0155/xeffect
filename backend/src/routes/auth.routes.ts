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

    const isProd = process.env.NODE_ENV === "production";

    // send the code as cookie
    res.cookie("xeffect_token", token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
    });

    // redirect to frontend app
    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
    const redirectTo = process.env.FRONTEND_APP_REDIRECT || `${frontendOrigin}/app`;
    res.redirect(redirectTo)
})

// logout, clears the auth cookie so subsequent requests give 401
router.post("/logout", (req, res)=>{
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("xeffect_token", {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        path: "/"
    })

    return res.status(200).json({loggedOut: true})
})

export default router;
