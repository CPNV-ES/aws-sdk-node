import EC2Client from "aws-sdk/clients/ec2";
import { IInternetGateway } from "src/interfaces/IInternetGateway";
import { AwsVpcManager } from "./AwsVpcManager";
import { config } from "../config";

export class AwsInternetGateway implements IInternetGateway {
    private client: EC2Client;

    constructor(awsRegionEndpoint: string) {
        this.client = new EC2Client({ region: awsRegionEndpoint });
    }

    public async createInternetGateway(igwTagName: string): Promise<void> {
        const exists = await this.existInternetGateway(igwTagName);

        if (exists) {
            throw new Error(`There is already a Igw with the tag Name ${igwTagName}`);
        }

        await this.client.createInternetGateway({
            TagSpecifications: [
                {
                    ResourceType: "internet-gateway",
                    Tags: [{ Key: "Name", Value: igwTagName }]
                }
            ]
        }).promise();
    }

    public async deleteInternetGateway(igwTagName: string): Promise<void> {
        let InternetGatewayId: string;

        try {
            InternetGatewayId = await this.igwId(igwTagName);
        } catch (e) {
            console.error(e);

            return;
        }

        await this.client.deleteInternetGateway({ InternetGatewayId: InternetGatewayId }).promise();
    }

    public async attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void> {
        let InternetGatewayId: string;
        let vpcId: string;

        const aws = new AwsVpcManager("", config.AWS_REGION);

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            console.error(e);

            return;
        }
        await this.client.attachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
    }

    public async detachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void> {
        let InternetGatewayId: string;
        let vpcId: string;

        const aws = new AwsVpcManager("", config.AWS_REGION);

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            console.error(e);

            return;
        }
        await this.client.detachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
    }

    public async existInternetGateway(igwTagName: string): Promise<boolean> {
        try {
            await this.igwId(igwTagName);
        } catch (e) {
            // The igw doesn't exists
            return false;
        }

        return true;
    }

    private async igwId(igwTagName: string): Promise<string> {
        const { InternetGateways }: EC2Client.DescribeInternetGatewaysResult = await this.client.describeInternetGateways({
            Filters: [
                {

                    Name: "tag:Name",
                    Values: [igwTagName],
                }
            ]
        }).promise();

        if (!InternetGateways) {
            throw new Error(`The Igw with the tagName: ${igwTagName} does not exist`);
        }

        if (!InternetGateways[0].InternetGatewayId) {
            throw new Error(`The Igw with the tagName: ${igwTagName} does not have a IgwId`);
        }

        return InternetGateways[0].InternetGatewayId;
    }
}