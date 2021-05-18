import { IRouteTableManager } from "src/interfaces/IRouteTableManager";
import EC2Client from "aws-sdk/clients/ec2";
import { AwsVpcManager, VpcDoesNotExistError } from "./AwsVpcManager";

export class AwsRouteTableManager implements IRouteTableManager {
    private client: EC2Client;
    private vpcManager: AwsVpcManager;
    
    /**
    * @param {string} awsProfileName
    * @param {string} awsRegionEndpoint e.g. ap-southeast-2
    * @memberof AwsRouteTableManager
    */
    constructor(awsProfileName: string, awsRegionEndpoint: string, vpcManager: AwsVpcManager) {
       this.client = new EC2Client({ region: awsRegionEndpoint });
       this.vpcManager = vpcManager;
    }

    /**
     * Creates a new RouteTable associated with a VPC
     * 
     * @param routeTableTagName 
     * @param vpcId 
     * @returns {Promise<string>} The newly created RouteTable's id
     * @throws when a RouteName with the same tagName already exists
     * @memberof AwsRouteTableManager
     */
    public async createRouteTable(routeTableTagName: string, vpcTagName: string): Promise<void> {
        const exists = await this.exists(routeTableTagName);

        if (exists) {
          throw new RouteTableNameAlreadyExistsError(routeTableTagName);
        }

        if(!this.vpcManager.exists(vpcTagName)) {
            throw new VpcDoesNotExistError(vpcTagName);
        }

        const vpcId = await this.vpcManager.vpcId(vpcTagName); 

        await this.client.createRouteTable({
            VpcId: vpcId,
            TagSpecifications: [{
                ResourceType: "route-table",
                Tags: [{ Key: "Name", "Value": routeTableTagName }]
            }],
        }).promise();
    }

    public async deleteRouteTable(routeTableTagName: string): Promise<void> {
        const routeTable = await this.getRouteTable(routeTableTagName);

        // We can't delete a RouteTable if it is a Main RouteTable
        if(routeTable.Associations && routeTable.Associations.find(ass => ass.Main)) {
            throw new CannotDeleteMainRouteTableError(routeTableTagName);
        }

        await this.dissociateFromAllSubnets(routeTableTagName);
    
        await this.client.deleteRouteTable({ RouteTableId: routeTable.RouteTableId! }).promise();
    }

    public async associateWithSubnet(routeTableTagName: string, subnetTagName: string): Promise<void> {
        const routeTableId = "";    // TODO: get routetable id from tagname
        const subnetId = "";    // TODO: get subnet id from tagname
        
        await this.client.associateRouteTable({
            RouteTableId: routeTableId,
            SubnetId: subnetId
        }).promise();
    }

    /**
     * 
     * @param routeTableTagName The TagName of the RouteTable the Subnet has the association we want removed
     * @param subnetTagName The TagName of the Subnet to dissociate from the RouteTable
     */
    public async dissociateFromSubnet(routeTableTagName: string, subnetTagName: string | null = null): Promise<void> {
        let associations : EC2Client.RouteTableAssociationList 
            = await (await this.getRouteTable(routeTableTagName)).Associations ?? [];

        if(subnetTagName) {
            const subnetId = "23123123123213";  // TODO: get subnet id from tagname
            associations = associations.filter(ass => ass.SubnetId == subnetId);
        }
        
        for(const assoc of associations) {
            if(assoc.Main)  
                continue;   // Skip this association because we can't dissociate a main RouteTable

            if(!assoc.RouteTableAssociationId)
                continue;

            await this.client.disassociateRouteTable({
                AssociationId: assoc.RouteTableAssociationId
            }).promise();
        }
    }

    /**
     * 
     * @param routeTableTagName The TagName of the RouteTable the Subnet has the association we want removed
     */
    public async dissociateFromAllSubnets(routeTableTagName: string): Promise<void> {
        await this.dissociateFromSubnet(routeTableTagName)
    }

    /**
     * Returns whether or not a RouteTable with the specified tagName exists
     * 
     * @param {string} routeTableTagName e.g. RTB-PUBLIC-SUBNET-EXAMPLE
     * @return {Promise<boolean>} true if a RouteTable with the specified tagName exists, false otherwise
     * @memberof AwsRouteTableManager
     */
    public async exists(routeTableTagName: string): Promise<boolean> {
        const routeTableId = await this.routeTableId(routeTableTagName);

        return !!routeTableId;
    }

        return true;
    }

    private async getRouteTable(routeTableTagName: string) : Promise<EC2Client.RouteTable> {
        const { RouteTables }: EC2Client.DescribeRouteTablesResult = await this.client.describeRouteTables({
            Filters: [{
                Name: "tag:Name",
                Values: [ routeTableTagName ],
            }]
        }).promise();

        return RouteTables![0];
    }

    /**
     * Get a RouteTable's Id by its TagName
     *
     * @param {string} routeTableTagName e.g. RTB-PUBLIC-SUBNET-EXAMPLE
     * @return {Promise<string>} A promise containing the RouteTable's id
     * @throws if no RouteTable with the specified routeTableTagName was found
     * @memberof AwsRouteTableManager
     */
    private async routeTableId(routeTableTagName: string): Promise<string | null> {
        const routeTable : EC2Client.RouteTable = await this.getRouteTable(routeTableTagName);

        if(!routeTable || !routeTable.RouteTableId){
            return null;
        }

        return routeTable.RouteTableId;
    }
}

export class RouteTableNameAlreadyExistsError extends Error {
    constructor(routeTableTagName: string) {
        super(`The RouteTable with the tagName: ${routeTableTagName} already exists`);
    }
}
export class CannotDeleteMainRouteTableError extends Error {
    constructor(routeTableTagName: string) {
        super(`Cannot delete the RouteTable with the tagName: ${routeTableTagName} because it is the main RouteTable of a Vpc`);
    }
}