import { AwsVpcManager } from "./classes/AwsVpcManager";
import * as dotenv from "dotenv";

dotenv.config();

let aws = new AwsVpcManager("", "ap-southeast-2");
aws.createVpc("test-vpc-coucou", "10.0.0.0/16");