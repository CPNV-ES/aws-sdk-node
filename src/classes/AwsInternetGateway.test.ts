import { AwsInternetGateway } from "./AwsInternetGateway";
import { AwsVpcManager } from "./AwsVpcManager";
import { config } from "../config";
const regionEndpint = config.AWS_REGION;
const igwTagName = "IGW_test";
const vpcTagName = "VPC_test";
const profileName = "";
const cidrBlock = "10.0.0.0/16";

let internetGateway: AwsInternetGateway;
let vpcManager: AwsVpcManager;

beforeEach(() => {
    internetGateway = new AwsInternetGateway(regionEndpint);
    vpcManager = new AwsVpcManager(profileName, regionEndpint);


    await vpcManager.createVpc(vpcTagName, cidrBlock);

    jest.setTimeout(10000);
});

afterEach(async () => {
    if (await internetGateway.existInternetGateway(igwTagName)) {
        await internetGateway.deleteInternetGateway(igwTagName);
    }
});

describe("InternetGateway unit tests", () => {
    test("Create Internet Gateway and verify if it exists", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeTruthy();
    });

    test("Create two IGWs and throws an exception when the second one is created", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        // as described here : https://stackoverflow.com/a/47887098/10596952
        await expect(internetGateway.createInternetGateway(igwTagName)).rejects.toThrow();
    });

    test("Delete the IGW", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        await internetGateway.deleteInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeFalsy();
    });
});

describe("InternetGateWay integration tests", () => {
    test("Attach a VPC to an IGW", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        await internetGateway.attachInternetGateway(igwTagName, vpcTagName);

        expect(true).toBeTruthy();
    });

    //test("Detach a VPC to an IGW", async () => {
    //     await internetGateway.detach(myVPC);
    //
    //     expect(await internetGateway.has(myVPC)).toBeFalsy();
    //  });
});
