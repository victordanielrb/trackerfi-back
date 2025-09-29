import { Request } from 'express';
import mongo from "../../mongo";
import { UserType } from "../../interfaces/user";
import createHostUser from "./createHostUser";
import createCreatorUser from "./createCreatorUser";

export default async function createUser(req: Request) {
    // Route to appropriate user creation function based on user_type
    const userType = req.body.user_type;

    switch (userType) {
        case UserType.HOST:
            return await createHostUser(req);
        case UserType.CREATOR:
            return await createCreatorUser(req);
        default:
            return { 
                message: "Invalid user type. Must be HOST or CREATOR", 
                status: 400 
            };
    }
}
