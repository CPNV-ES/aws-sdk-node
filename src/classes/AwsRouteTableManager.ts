import { IRouteTableManager } from "src/interfaces/IRouteTableManager";
import EC2Client from "aws-sdk/clients/ec2";
import { AwsVpcManager, VpcDoesNotExistError } from "./AwsVpcManager";
import { AwsSubnetManager, SubnetDoesNotExistError } from './AwsSubnetManager';

export class AwsRouteTableManager implements IRouteTableManager {
    private client: EC2Client;
    private vpcManager: AwsVpcManager;
    private subnetManager: AwsSubnetManager;
    
    /**
    * @param {string} awsProfileName
    * @param {string} awsRegionEndpoint e.g. ap-southeast-2
    * @memberof AwsRouteTableManager
    */
    constructor(awsProfileName: string, awsRegionEndpoint: string, vpcManager: AwsVpcManager, subnetManager: AwsSubnetManager) {
       this.client = new EC2Client({ region: awsRegionEndpoint });
       this.vpcManager = vpcManager;
       this.subnetManager = subnetManager;
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

    /**
     * Deletes a routeTable by its TagName
     * 
     * @param routeTableTagName Th TagName of the RouteTable we want to delete
     * @throws {CannotDeleteMainRouteTableError} If the RouteTable we're trying to delete is a VPC's main RouteTable 
     */
    public async deleteRouteTable(routeTableTagName: string): Promise<void> {
        const routeTable = await this.getRouteTable(routeTableTagName);

        if(!routeTable)
            return;

        // We can't delete a RouteTable if it is a Main RouteTable
        if(routeTable.Associations && routeTable.Associations.find(ass => ass.Main)) {
            throw new CannotDeleteMainRouteTableError(routeTableTagName);
        }

        await this.dissociateFromAllSubnets(routeTableTagName);
    
        await this.client.deleteRouteTable({ RouteTableId: routeTable.RouteTableId! }).promise();
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

    /**
     * Associates a RouteTable with a Subnet
     * 
     * @param routeTableTagName The TagName of the RouteTable we want associated
     * @param subnetTagName The Tagname of the Subnet we want to form an association with
     */
    public async associateWithSubnet(routeTableTagName: string, subnetTagName: string): Promise<void> {
        const routeTableId = await this.routeTableId(routeTableTagName);
        const subnetId = await this.subnetManager.subnetId(subnetTagName);
        
        if(!routeTableId) {
            throw new RouteTableDoesNotExistError(routeTableTagName);
        }

        if(!subnetId) {
            throw new SubnetDoesNotExistError(subnetTagName);
        }

        await this.client.associateRouteTable({
            RouteTableId: routeTableId,
            SubnetId: subnetId
        }).promise();
    }

    /**
     * Dissociates the RouteTable from its association with a specified Subnet 
     * 
     * @param routeTableTagName The TagName of the RouteTable that has the association we want removed
     * @param subnetTagName The TagName of the Subnet to dissociate from the RouteTable, or null to dissociate from all Subnets
     */
    public async dissociateFromSubnet(routeTableTagName: string, subnetTagName: string | null = null): Promise<void> {
        let associations : EC2Client.RouteTableAssociationList 
            = (await this.getRouteTable(routeTableTagName))?.Associations ?? [];

        if(subnetTagName) {
            const subnetId = await this.subnetManager.subnetId(subnetTagName);
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
     * Dissociates the specified RouteTable from all of its associations with SubNets
     * 
     * @param routeTableTagName The TagName of the RouteTable the Subnet has the association we want removed
     */
         public async dissociateFromAllSubnets(routeTableTagName: string): Promise<void> {
            await this.dissociateFromSubnet(routeTableTagName)
    }

    /**
     * Checks if the specified RouteTable and Subnet have an active association
     * 
     * @param routeTableTagName 
     * @param subnetTagName 
     * @returns true if the RouteTable is associated with the Subnet
     */
    public async isAssociatedWithSubnet(routeTableTagName: string, subnetTagName: string) : Promise<boolean> {
        if(!await this.routeTableId(routeTableTagName)) 
            return false; 

        if(!await this.subnetManager.subnetId(subnetTagName)) 
            return false;

        let associations : EC2Client.RouteTableAssociationList 
            = (await this.getRouteTable(routeTableTagName))?.Associations ?? [];

        const subnetId = await this.subnetManager.subnetId(subnetTagName);
        associations = associations.filter(ass => ass.SubnetId == subnetId);

        return associations.length > 0;
    }

    /**
     * Get a RouteTable's Id by its TagName
     *
     * @param {string} routeTableTagName e.g. RTB-PUBLIC-SUBNET-EXAMPLE
     * @return {Promise<string>} A promise containing the RouteTable's id
     * @throws if no RouteTable with the specified routeTableTagName was found
     * @memberof AwsRouteTableManager
     */
    public async routeTableId(routeTableTagName: string): Promise<string | null> {
        const routeTable = await this.getRouteTable(routeTableTagName);

        if(!routeTable || !routeTable.RouteTableId){
            return null;
        }

        return routeTable.RouteTableId;
    }

    private async getRouteTable(routeTableTagName: string) : Promise<EC2Client.RouteTable | null> {
        const { RouteTables }: EC2Client.DescribeRouteTablesResult = await this.client.describeRouteTables({
            Filters: [{
                Name: "tag:Name",
                Values: [ routeTableTagName ],
            }]
        }).promise();

        if(!RouteTables || !RouteTables[0] || !RouteTables[0].RouteTableId) {
            return null;
        }

        return RouteTables[0];
    }
}

export class RouteTableNameAlreadyExistsError extends Error {
    constructor(routeTableTagName: string) {
        super(`The RouteTable with the tagName: ${routeTableTagName} already exists`);
    }
}
export class RouteTableDoesNotExistError extends Error {
    constructor(routeTableTagName: string) {
      super(`The RouteTable with the tagName: ${routeTableTagName} does not exists`);
    }
  }
export class CannotDeleteMainRouteTableError extends Error {
    constructor(routeTableTagName: string) {
        super(`Cannot delete the RouteTable with the tagName: ${routeTableTagName} because it is the main RouteTable of a Vpc`);
    }
}
export class RouteTableAssociationAlreadyExistsError extends Error {
    constructor(routeTableTagName: string, associateTagName: string) {
        super(`RouteTable ${routeTableTagName} is already associated with ${associateTagName}`);
    }
}