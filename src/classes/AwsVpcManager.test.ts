import { AwsVpcManager } from "./AwsVpcManager";
import { config } from "../config";

const profileName = "";
const regionEndpint = config.AWS_REGION;
const vpcTagName = "VIR1NODE";
const cidrBlock = "10.0.0.0/16";

let vpcManager: AwsVpcManager;

beforeEach(() => {
  vpcManager = new AwsVpcManager(profileName, regionEndpint);
});

afterEach(async () => {
  if (await vpcManager.exists(vpcTagName)) {
    await vpcManager.deleteVpc(vpcTagName);
  }
});

describe("AwsVpcManager unit tests", () => {
  test("Create VPC nominal case success", async () => {
    await vpcManager.createVpc(vpcTagName, cidrBlock);

    expect(await vpcManager.exists(vpcTagName)).toBeTruthy();
  });

  test("Create VPC already exists throws exception", async () => {
    await vpcManager.createVpc(vpcTagName, cidrBlock);

    // as described here : https://stackoverflow.com/a/47887098/10596952
    await expect(vpcManager.createVpc(vpcTagName, cidrBlock)).rejects.toThrow();
  });

  test("Delete VPC nominal case success", async () => {
    await vpcManager.createVpc(vpcTagName, cidrBlock);

    await vpcManager.deleteVpc(vpcTagName);

    expect(await vpcManager.exists(vpcTagName)).toBeFalsy();
  });

  test("VPC Exists nominal case success", async () => {
    await vpcManager.createVpc(vpcTagName, cidrBlock);

    expect(await vpcManager.exists(vpcTagName)).toBeTruthy();
  });
});

describe("AwsVpcManager integration tests", () => {
  test("Scenari nominal case success", async () => {
    await vpcManager.createVpc(vpcTagName, cidrBlock);

    expect(await vpcManager.exists(vpcTagName)).toBeTruthy();
  });
});
