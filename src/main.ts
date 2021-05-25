//import { AwsVpcManager } from "./classes/AwsVpcManager";
import { AwsInternetGateway } from "./classes/AwsInternetGateway";
import { config } from "./config";

const aws = new AwsInternetGateway(config.AWS_REGION);
aws.createInternetGateway("test");

