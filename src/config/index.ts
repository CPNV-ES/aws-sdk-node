import * as dotenv from "dotenv";

dotenv.config();

export const config = { 
    AWS_REGION: process.env.AWS_REGION ?? "",
};
