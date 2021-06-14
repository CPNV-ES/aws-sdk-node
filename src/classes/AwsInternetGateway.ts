import EC2Client from "aws-sdk/clients/ec2";
import { IInternetGateway } from "src/interfaces/IInternetGateway";
import { AwsVpcManager, VpcDoesNotExistError } from "./AwsVpcManager";
import { config } from "../config";

export class AwsInternetGateway implements IInternetGateway {
    private client: EC2Client;
    private region: string;

    constructor(awsRegionEndpoint: string) {
        this.client = new EC2Client({ region: awsRegionEndpoint });
        this.region = awsRegionEndpoint;
    }

    public async createInternetGateway(igwTagName: string): Promise<void> {
        const exists = await this.existInternetGateway(igwTagName);

        if (exists) {
            //TODO this error must be typed (extension of error class)
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
            await this.client.deleteInternetGateway({ InternetGatewayId: InternetGatewayId }).promise();
        } catch (e) {
            console.error(e);
            return;
        }
    }

    public async attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<boolean> {
        let InternetGatewayId: string;
        let vpcId: string | null;

        const aws = new AwsVpcManager(this.region);
        const exists = await aws.exists(vpcTagName);

        if (!exists) {
            //TODO type this error
            throw new Error(`There is already a Vpc with the tag Name ${vpcTagName}`);
        }

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            console.error(e);

            //TODO remove this boolean return
            return false;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.attachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
        //TODO remove this boolean return. Either it's ok, or we throw an exception
        return true;
    }

    public async detachInternetGateway(igwTagName: string, vpcTagName: string): Promise<boolean> {
        let InternetGatewayId: string;
        let vpcId: string | null;

        const aws = new AwsVpcManager(this.region);

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            console.error(e);
            //TODO remove this boolean return. Either it's ok, or we throw an exception
            return false;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.detachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
        //TODO remove this boolean return. Either it's ok, or we throw an exception
        return true;
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

    public async igwId(igwTagName: string): Promise<string> {
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

        if (!InternetGateways[0]) {
            throw new Error(`The Igw's index of ${igwTagName} is null`);
        }

        if (!InternetGateways[0].InternetGatewayId) {
            throw new Error(`The Igw with the tagName: ${igwTagName} does not have a IgwId`);
        }

        return InternetGateways[0].InternetGatewayId;
    }
}
