import EC2 from "aws-sdk/clients/ec2";
import EC2Client from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client: EC2Client;

  /**
   * @param {string} awsRegionEndpoint e.g. ap-southeast-2
   * @memberof AwsVpcManager
   */
  constructor(awsRegionEndpoint: string) {
    this.client = new EC2Client({ region: awsRegionEndpoint });
  }

  /**
   * @param {string} vpcTagName e.g. VIR1NODE
   * @param {string} cidrBlock e.g. 10.0.0.0/16
   * @throws if a VPC with the same vpcTagName already exists
   * @return {Promise<void>}
   * @memberof AwsVpcManager
   */
  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    const exists = await this.exists(vpcTagName);

    if (exists) {
      throw new VpcNameAlreadyExistsError(vpcTagName);
    }

    await this.client
      .createVpc({
        CidrBlock: cidrBlock,
        TagSpecifications: [
          {
            ResourceType: "vpc",
            Tags: [{ Key: "Name", Value: vpcTagName }],
          },
        ],
      })
      .promise();
  }

  /**
   * @param {string} vpcTagName e.g. VIR1NODE
   * @return {Promise<void>}
   * @memberof AwsVpcManager
   */
  public async deleteVpc(vpcTagName: string): Promise<void> {
    const vpcId = await this.vpcId(vpcTagName);

    if (vpcId) {
      await this.client.deleteVpc({ VpcId: vpcId }).promise();
    }
  }

  /**
   * @param {string} vpcTagName e.g. VIR1NODE
   * @return {Promise<boolean>}
   * @memberof AwsVpcManager
   */
  public async exists(vpcTagName: string): Promise<boolean> {
    const vpcId = await this.vpcId(vpcTagName);

    return !!vpcId;
  }

  public async isVpcReady(vpcTagName: string) : Promise<boolean> {
    const { Vpcs }: EC2Client.DescribeVpcsResult = await this.client
      .describeVpcs({
        Filters: [
          {
            Name: "tag:Name",
            Values: [vpcTagName],
          },
        ],
      })
      .promise();

    if (!Vpcs || !Vpcs[0] || !Vpcs[0].VpcId) {
      return false;
    }

    return Vpcs[0].State === "available";
  }

  /**
   * Get a VPCId by the vpcTagName
   *
   * @public
   * @param {string} vpcTagName e.g. VIR1NODE
   * @return {Promise<string | null>}
   * @memberof AwsVpcManager
   */

  public async vpcId(vpcTagName: string): Promise<string | null> {
    const { Vpcs }: EC2Client.DescribeVpcsResult = await this.client
      .describeVpcs({
        Filters: [
          {
            Name: "tag:Name",
            Values: [vpcTagName],
          },
        ],
      })
      .promise();

    if (!Vpcs || !Vpcs[0] || !Vpcs[0].VpcId) {
      return null;
    }

    return Vpcs[0].VpcId;
  }
}

export class VpcNameAlreadyExistsError extends Error {
  constructor(vpcTagName: string) {
    super(`The Vpc with the tagName: ${vpcTagName} already exists`);
  }
}

export class VpcDoesNotExistError extends Error {
  constructor(vpcTagName: string) {
    super(`The Vpc with the tagName: ${vpcTagName} does not exists`);
  }
}

export class VpcIsNotReadyError extends Error {
  constructor(vpcTagName: string) {
    super(`The Vpc with the tagName: ${vpcTagName} is not ready`);
  }
}