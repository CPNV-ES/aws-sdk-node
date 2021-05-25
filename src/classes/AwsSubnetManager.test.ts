import { AwsSubnetManager } from "./AwsSubnetManager";
import { config } from "../config";
import { AwsVpcManager } from "./AwsVpcManager";

const regionEndpint = config.AWS_REGION;
const vpcTagname = "VIR1NODE";
const subnetTagname = "VIR1NODE";
const cidrBlock = "10.0.0.0/16";

const vpcManager = new AwsVpcManager(regionEndpint);
const subnetManager = new AwsSubnetManager(regionEndpint, vpcManager);

beforeAll(async () => {
  if (!(await vpcManager.exists(vpcTagname))) {
    await vpcManager.createVpc(vpcTagname, cidrBlock);
  }

  if (await subnetManager.exists(subnetTagname)) {
    await subnetManager.deleteSubnet(subnetTagname);
  }
});

afterAll(async () => {
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
});

describe("AwsSubnetManager integration tests", () => {
  test("Scenari nominal case success", async () => {
    await subnetManager.createSubnet(subnetTagname, vpcTagname, cidrBlock);

    expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
  });
});
