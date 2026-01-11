import {prisma} from "../config/prisma";

async function main(){
    const users = await prisma.user.count();
    console.log(`Number of users in the database: ${users}`);
}

main().catch((e)=> {
    console.error(e)
    process.exit(1)}).finally(async()=>{
        await prisma.$disconnect();
    })