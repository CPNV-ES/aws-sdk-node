import EC2Client from "aws-sdk/clients/ec2";
import { ISubnetManager } from "src/interfaces/ISubnetManager";
import { AwsVpcManager, VpcDoesNotExistError } from "./AwsVpcManager";

export class AwsSubnetManager implements ISubnetManager {
  private client: EC2Client;

  private awsVpcManager: AwsVpcManager;

  constructor(awsRegionEndpoint: string, awsVpcManager: AwsVpcManager) {
    this.client = new EC2Client({ region: awsRegionEndpoint });
    this.awsVpcManager = awsVpcManager;
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @param {string} vpcTagName e.g. VIR1NODE
   * @param {string} cidrBlock  e.g. 10.0.0.0/16
   * @return {*}  {Promise<void>}
   * @memberof AwsSubnetManager
   */
  async createSubnet(
    subnetTagName: string,
    vpcTagName: string,
    cidrBlock: string
  ): Promise<void> {
    const [subnetExists, vpcExists] = await Promise.all([
      this.exists(subnetTagName),
      this.awsVpcManager.exists(vpcTagName),
    ]);

    if (subnetExists) {
      throw new SubnetNameAlreadyExistsError(subnetTagName);
    }

    if (!vpcExists) {
      throw new VpcDoesNotExistError(vpcTagName);
    }

    const vpcId = await this.awsVpcManager.vpcId(vpcTagName);

    await this.client
      .createSubnet({
        VpcId: vpcId,
        CidrBlock: cidrBlock,
        TagSpecifications: [
          {
            ResourceType: "subnet",
            Tags: [{ Key: "Name", Value: subnetTagName }],
          },
        ],
      })
      .promise();
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {*}  {Promise<void>}
   * @memberof AwsSubnetManager
   */
  async deleteSubnet(subnetTagName: string): Promise<void> {
    const subnetId = await this.subnetId(subnetTagName);

    if (subnetId) {
      await this.client.deleteSubnet({ SubnetId: subnetId }).promise();
    }
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {*}  {Promise<boolean>}
   * @memberof AwsSubnetManager
   */
  async exists(subnetTagName: string): Promise<boolean> {
    const vpcId = await this.subnetId(subnetTagName);

    return !!vpcId;
  }

  /**
   * Get a SubnetId by the subnetTagName
   *
   * @private
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {Promise<string | null>}
   * @memberof AwsVpcManager
   */
  public async subnetId(subnetTagName: string): Promise<string | null> {
    const { Subnets }: EC2Client.DescribeSubnetsResult = await this.client
      .describeSubnets({
        Filters: [
          {
            Name: "tag:Name",
            Values: [subnetTagName],
          },
        ],
      })
      .promise();

    if (!Subnets || !Subnets[0] || !Subnets[0].SubnetId) {
      return null;
    }

    return Subnets[0].SubnetId;
  }
}

export class SubnetNameAlreadyExistsError extends Error {
  constructor(subnetTagName: string) {
    super(`The subnet with the tagName: ${subnetTagName} already exists`);
  }
}

export class SubnetDoesNotExistError extends Error {
  constructor(subnetTagName: string) {
    super(`The Subnet with the tagName: ${subnetTagName} does not exists`);
  }
}