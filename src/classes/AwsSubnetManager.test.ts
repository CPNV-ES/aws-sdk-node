import { AwsSubnetManager } from "./AwsSubnetManager";
import { config } from "../config";

const regionEndpint = config.AWS_REGION;
const subnetTagname = "VIR1NODE";
const cidrBlock = "10.0.0.0/16";

let subnetManager: AwsSubnetManager;

beforeEach(() => {
    subnetManager = new AwsSubnetManager(regionEndpint);

    jest.setTimeout(10000);
});

afterEach(async () => {
    if (await subnetManager.exists(subnetTagname)) {
        await subnetManager.deleteSubnet(subnetTagname);
    }
});

describe("AwsSubnetManager unit tests", () => {
    test("Create Subnet nominal case success", async () => {
        await subnetManager.createSubnet(subnetTagname, cidrBlock);

        expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
    });

    test("Create Subnet already exists throws exception", async () => {
        await subnetManager.createSubnet(subnetTagname, cidrBlock);

        // as described here : https://stackoverflow.com/a/47887098/10596952
        await expect(subnetManager.createSubnet(subnetTagname, cidrBlock)).rejects.toThrow();
    });

    test("Delete Subnet nominal case success", async () => {
        await subnetManager.createSubnet(subnetTagname, cidrBlock);

        await subnetManager.deleteSubnet(subnetTagname);

        expect(await subnetManager.exists(subnetTagname)).toBeFalsy();
    });

    test("Subnet Exists nominal case success", async () => {
        await subnetManager.createSubnet(subnetTagname, cidrBlock);

        expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
    });
});

describe("AwsSubnetManager integration tests", () => {
    test("Scenari nominal case success", async () => {
        await subnetManager.createSubnet(subnetTagname, cidrBlock);

        expect(await subnetManager.exists(subnetTagname)).toBeTruthy();
    });
});