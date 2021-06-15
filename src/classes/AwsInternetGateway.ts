import EC2Client from "aws-sdk/clients/ec2";
import { IInternetGateway } from "src/interfaces/IInternetGateway";
import { AwsVpcManager, VpcDoesNotExistError, VpcNameAlreadyExistsError } from "./AwsVpcManager";
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
            throw new InternetGatewayAlreadyExists(igwTagName);
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

    public async attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<boolean> {
        let InternetGatewayId: string;
        let vpcId: string | null;

        const aws = new AwsVpcManager(this.region);
        const exists = await aws.exists(vpcTagName);

        if (!exists) {
            throw new VpcNameAlreadyExistsError(vpcTagName);
        }

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            console.error(e);

            return false;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.attachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
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
            return false;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.detachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
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

        if (!InternetGateways || !InternetGateways[0] || !InternetGateways[0].InternetGatewayId) {
            throw new InternetGatewayDoesntExists(igwTagName);
        }

        return InternetGateways[0].InternetGatewayId;
    }
}

export class InternetGatewayAlreadyExists extends Error {
    constructor(igwTagName: string) {
        super(`The InternetGateway with the tagName: ${igwTagName} already exists`);
    }
}

export class InternetGatewayDoesntExists extends Error {
    constructor(igwTagName: string) {
        super(`The InternetGateway with the tagName: ${igwTagName} doesnt exists`);
    }
}