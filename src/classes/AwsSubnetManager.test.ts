import { AwsSubnetManager } from "./AwsSubnetManager";
import { AwsVpcManager } from "./AwsVpcManager";

const regionEndpint = process.env.AWS_REGION ?? "";
const vpcTagname = process.env.VPC_TAG_NAME ?? "";
const subnetTagname = process.env.SUBNET_TAG_NAME ?? "";
const cidrBlock = process.env.SUBNET_CIDR_BLOCK ?? "";

const vpcManager = new AwsVpcManager(regionEndpint);
const subnetManager = new AwsSubnetManager(regionEndpint, vpcManager);

beforeAll(async () => {
  if (!(await vpcManager.exists(vpcTagname))) {
    await vpcManager.createVpc(vpcTagname, cidrBlock);
  }

  //TODO repetition with after each... who already delete the subnet if exist after each test
  if (await subnetManager.exists(subnetTagname)) {
    await subnetManager.deleteSubnet(subnetTagname);
  }
});

afterAll(async () => {
  //TODO repetition with beforeAll.... who already delete the vpc if exist
  if (await vpcManager.exists(vpcTagname)) {
    await vpcManager.deleteVpc(vpcTagname);
  }
});

afterEach(async () => {
  if (await subnetManager.exists(subnetTagname)) {
    await subnetManager.deleteSubnet(subnetTagname);
  }
});

describe("AwsSubnetManager unit tests", () => {
  test("Create Subnet nominal case success", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
  });

  test("Create Subnet already exists throws exception", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    // as described here : https://stackoverflow.com/a/47887098/10596952
    await expect(
      subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock)
    ).rejects.toThrow();
  });

  test("Delete Subnet nominal case success", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    await subnetManager.deleteSubnet(subnetTagname);

    expect(await subnetManager.exists(subnetTagname)).toBeFalsy();
  });

  test("Subnet Exists nominal case success", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
  });

  test("Cidr Block impossible", async () => {
    await expect(
      subnetManager.createSubnet(subnetTagname, vpcTagname, "10.0.0.0/16")
    ).rejects.toThrow();
  });
});

describe("AwsSubnetManager integration tests", () => {
  test("Scenari nominal case success", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
  });
});
