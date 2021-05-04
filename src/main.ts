import { AwsVpcManager } from "./classes/AwsVpcManager";
import { config } from "./config";

const aws = new AwsVpcManager("", config.AWS_REGION);
aws.createVpc("test-vpc-coucou", "10.0.0.0/16");