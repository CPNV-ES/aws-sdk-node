import EC2Client from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client: EC2Client;

  private vpcs: EC2Client.Vpc[] = [];

  constructor(awsProfileName: string, awsRegionEndpoint: string) {
    this.client = new EC2Client({region: awsRegionEndpoint})
  }

  
  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    if(this.exists(vpcTagName)) {
      throw new Error(`There is already a Vpc with the tag Name ${vpcTagName}`);
    }

    await this.client.createVpc({ 
      CidrBlock: cidrBlock,
      TagSpecifications: [
        { 
          ResourceType: "vpc", 
          Tags: [{Key: "Name", Value: vpcTagName}] 
        }
      ]
    }).promise();
  }

  public async deleteVpc(vpcTagName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async exists(vpcTagName: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  private async describeVpcs(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private async vpcId(vpcTageName: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
