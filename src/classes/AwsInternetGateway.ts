import EC2Client from "aws-sdk/clients/ec2";
import { IInternetGateway } from "src/interfaces/IInternetGateway";
import { AwsVpcManager, VpcDoesNotExistError, VpcNameAlreadyExistsError, VpcIsNotReadyError  } from "./AwsVpcManager";

export class AwsInternetGateway implements IInternetGateway {
    private client: EC2Client;

    constructor(client: EC2Client) {
        this.client = client;
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
            await this.client.deleteInternetGateway({ InternetGatewayId: InternetGatewayId }).promise();
        } catch (e) {
            return;
        }
    }

    public async attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void> {
        let InternetGatewayId: string;
        let vpcId: string | null;

        const aws = new AwsVpcManager(this.client);
        const exists = await aws.exists(vpcTagName);

        if (!exists) {
            throw new VpcNameAlreadyExistsError(vpcTagName);
        }

        if(!await aws.isVpcReady(vpcTagName)) {
            throw new VpcIsNotReadyError(vpcTagName);
        }

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            return;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.attachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
    }

    public async detachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void> {
        let InternetGatewayId: string;
        let vpcId: string | null;

        const aws = new AwsVpcManager(this.client);

        if(!await this.isInternetGatewayAttached(igwTagName, vpcTagName))
            return;

        try {
            InternetGatewayId = await this.igwId(igwTagName);
            vpcId = await aws.vpcId(vpcTagName);
        } catch (e) {
            return;
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        await this.client.detachInternetGateway({ InternetGatewayId: InternetGatewayId, VpcId: vpcId }).promise();
    }

    public async isInternetGatewayAttached(igwTagName: string, vpcTgName: string) : Promise<boolean> {
        const { InternetGateways }: EC2Client.DescribeInternetGatewaysResult = await this.client.describeInternetGateways({
            Filters: [
                {
                    Name: "tag:Name",
                    Values: [igwTagName],
                }
            ]
        }).promise();

        const aws = new AwsVpcManager(this.client);
        const vpcId = await aws.vpcId(vpcTgName);

        if(!InternetGateways || !InternetGateways[0]) {
            throw new InternetGatewayDoesntExists(igwTagName);
        }

        if(!vpcId) {
            throw new VpcDoesNotExistError(vpcTgName);
        }

        return InternetGateways[0].Attachments?.some(x => x.VpcId === vpcId) || false;
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