import EC2Client from "aws-sdk/clients/ec2";
import { ISubnetManager } from "src/interfaces/ISubnetManager";
import { AwsVpcManager } from "./AwsVpcManager";

export class AwsSubnetManager implements ISubnetManager {

    private client: EC2Client;

    private awsVpcManager: AwsVpcManager;

    constructor(awsRegionEndpoint: string, awsVpcManager: AwsVpcManager) {
        this.client = new EC2Client({ region: awsRegionEndpoint });
        this.awsVpcManager = awsVpcManager;
    }

    async createSubnet(subnetTagName: string, vpcId: string, cidrBlock: string): Promise<void> {
        const exists = await this.exists(subnetTagName);

        if (exists) {
            throw new Error(`There is already a Vpc with the tag Name ${subnetTagName}`);
        }

        await this.client.createSubnet({
            VpcId: vpcId,
            CidrBlock: cidrBlock,
            TagSpecifications: [
                {
                    ResourceType: "subnet",
                    Tags: [{ Key: "Name", Value: subnetTagName }]
                }
            ]
        }).promise();
    }

    async deleteSubnet(subnetTagName: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async exists(subnetTagName: string): Promise<boolean> {
        return false;
    }

}