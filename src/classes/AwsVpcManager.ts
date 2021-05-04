import { AWSError } from "aws-sdk";
import EC2Client from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client: EC2Client;

  private vpcs: EC2Client.Vpc[] = [];

  constructor(awsProfileName: string, awsRegionEndpoint: string) {
    this.client = new EC2Client({region: awsRegionEndpoint})
   }

  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    this.client.createVpc(
      { 
        CidrBlock: cidrBlock,
        TagSpecifications: [
          { 
            ResourceType: "vpc", 
            Tags: [{Key: "Name", Value: vpcTagName}] 
          }
        ]
      }, 
      (err: AWSError, data: EC2Client.CreateVpcResult) => {
        // TODO: Handle error
        console.log(err ?? data);
      }
    );
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
