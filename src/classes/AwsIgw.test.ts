import { AwsInternetGateway } from "./AwsIgw";
import { config } from "../config";

const profileName = "";
const regionEndpint = config.AWS_REGION;
const igwTagName = "VIR1NODE";
//const cidrBlock = "10.0.0.0/16";

let internetGateway: AwsInternetGateway;

beforeEach(() => {
    internetGateway = new AwsInternetGateway(profileName, regionEndpint);

    jest.setTimeout(10000);
});

afterEach(async () => {
    if (await internetGateway.existInternetGateway(igwTagName)) {
        await internetGateway.deleteInternetGateway(igwTagName);
    }
});

describe("internetGateway unit tests", () => {
    test("Create Internet Gateway nominal case success", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeTruthy();
    });

    test("Create internet gatewy already existInternetGateway throws exception", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        // as described here : https://stackoverflow.com/a/47887098/10596952
        await expect(internetGateway.createInternetGateway(igwTagName)).rejects.toThrow();
    });

    test("Delete VPC nominal case success", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        await internetGateway.deleteInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeFalsy();
    });

    test("VPC existInternetGateway nominal case success", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeTruthy();
    });
});

describe("AwsinternetGateway integration tests", () => {
    test("Scenari nominal case success", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeTruthy();
    });
});
