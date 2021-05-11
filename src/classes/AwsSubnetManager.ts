import EC2Client from "aws-sdk/clients/ec2";
import { ISubnetManager } from "src/interfaces/ISubnetManager";

export class AwsSubnetManager implements ISubnetManager {

    private client: EC2Client;

    constructor(awsRegionEndpoint: string) {
        this.client = new EC2Client({ region: awsRegionEndpoint });
    }

    createSubnet(subnetTagName: string, cidrBlock: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteSubnet(subnetTagName: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    exists(subnetTagName: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

}