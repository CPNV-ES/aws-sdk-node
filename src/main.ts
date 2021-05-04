import EC2Client from "aws-sdk/clients/ec2";
import * as dotenv from "dotenv";

dotenv.config();

const ec2client = new EC2Client({ region: process.env.REGION });

ec2client.createVpc((err, data) => {
    console.log(err);
    console.log(data);
});