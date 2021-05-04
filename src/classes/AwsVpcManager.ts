import { Vpc } from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client;

  private vpcs: Vpc[] = [];

  constructor(awsProfileName: string, awsRegionEndpoint: string) {}

  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    throw new Error("Method not implemented.");
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
