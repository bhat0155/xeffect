import "dotenv/config";
import {prisma} from "../config/prisma"

async function main(){
    console.log("seed start");

    // quick db check
    await prisma.$queryRaw`SELECT 1`;
    console.log("seed db connected")
}

main().catch((err)=>{
    console.log("error during seed:", err);
    process.exitCode = 1
}).finally(async()=>{
    await prisma.$disconnect()
})