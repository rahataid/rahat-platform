import { expect } from "chai";
import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { RahatToken, RahatAccessManager, RahatTreasury, RahatClaim, RahatToken__factory, ERC2771Forwarder, RahatPayrollProject, Vendor } from "../typechain-types/index.ts";
import { getFunctionId } from "./helpers.ts/index.ts";
import { ethers } from "ethers";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//lists of tests to do
//1. Deployment Verification - verify constructor arguments and Check initial states of the contract
//2. Test Public functions and monitor state changes
//3. Test Restrcited functions with access controls
//4. Test Getters
//5. Test Events triggers on state changes

interface Fixture {
    rahatAccessManager: RahatAccessManager;
    rahatTreasury: RahatTreasury;
    rahatClaim: RahatClaim;
    rahatForwarder: ERC2771Forwarder;
    rahatPayroll: RahatPayrollProject;
    vendorContract: Vendor;
    deployer: any;
    owner: any;
    manager: any;
    minter: any;
    beneficiary1: any;
    beneficiary2: any;
    vendor1: any;
    vendor2: any;
}

describe('------ Rahat Token Tests ------', function () {
    const deployRahatTokenFixture = async function (): Promise<Fixture> {
        //@ts-ignore
        const [deployer, owner, manager, minter, beneficiary1, beneficiary2, vendor1, vendor2] = await hre.ethers.getSigners();
        const rahatAccessManager: RahatAccessManager = await hre.ethers.deployContract("RahatAccessManager", [owner.address]);
        const rahatTreasury: RahatTreasury = await hre.ethers.deployContract("RahatTreasury", [rahatAccessManager.target]);
        const rahatClaim: RahatClaim = await hre.ethers.deployContract("RahatClaim");
        const rahatForwarder: ERC2771Forwarder = await hre.ethers.deployContract("ERC2771Forwarder", ["RahatForwarder"]);
        const rahatPayroll: RahatPayrollProject = await hre.ethers.deployContract("RahatPayrollProject", ["RahatPayroll", rahatAccessManager.target, rahatForwarder.target]);
        const vendorContract: Vendor = await hre.ethers.deployContract("Vendor", [rahatPayroll.target, rahatClaim.target, rahatForwarder.target, deployer.address]);

        return {
            rahatTreasury,
            rahatAccessManager,
            rahatClaim,
            rahatPayroll,
            rahatForwarder,
            deployer,
            owner,
            manager,
            minter,
            beneficiary1,
            beneficiary2,
            vendorContract,
            vendor1,
            vendor2
        };
    }

    describe("Deployment", function () {
        let rahatToken: RahatToken;
        let rahatTreasury: RahatTreasury;
        let rahatAccessManager: RahatAccessManager;
        let rahatClaim: RahatClaim;
        let rahatForwarder: ERC2771Forwarder;
        let vendorContract: Vendor;
        let rahatPayroll: RahatPayrollProject;
        let owner: any;
        let manager: any;
        let deployer: any;
        let beneficiary1: any;
        let beneficiary2: any;
        let vendor1: any;
        let vendor2: any;


        before(async function () {
            const fixtures = await loadFixture(deployRahatTokenFixture);
            rahatTreasury = fixtures.rahatTreasury;
            rahatAccessManager = fixtures.rahatAccessManager;
            owner = fixtures.owner;
            manager = fixtures.manager;
            deployer = fixtures.deployer;
            rahatClaim = fixtures.rahatClaim;
            rahatForwarder = fixtures.rahatForwarder;
            rahatPayroll = fixtures.rahatPayroll;
            beneficiary1 = fixtures.beneficiary1;
            beneficiary2 = fixtures.beneficiary2;
            vendor1 = fixtures.vendor1;
            vendor2 = fixtures.vendor2;
            vendorContract = fixtures.vendorContract;

            await rahatTreasury.connect(deployer).createToken("Rahat", "RTH", "RAHAT CVA TOKEN", 0n, 0, rahatPayroll.target, rahatAccessManager.target);
            const rahatTokenAddress = await rahatTreasury.getTokens();
            rahatToken = RahatToken__factory.connect(rahatTokenAddress[0], owner);

        });
        it("should deploy contracts with expected initial values", async function () {
            expect(await rahatToken.name()).to.equal('Rahat');
            expect(await rahatToken.symbol()).to.equal('RTH');
            expect(await rahatToken.decimals()).to.equal(0n);
            expect(await rahatToken.totalSupply()).to.equal(0n);
            expect(await rahatToken.authority()).to.equal(rahatAccessManager.target);

        });
        it('should set manager', async function () {
            const functionSignature = rahatToken.interface.getFunction('mint').format();
            const mintId = getFunctionId(functionSignature);

            //set mint function to require manager role
            await rahatAccessManager.connect(owner).setTargetFunctionRole(rahatToken.target, [mintId], 1);

            //grant manager role to manager
            await rahatAccessManager.connect(owner).grantRole(1, manager.address, 0);

            //check if manager has access to mint function
            const canCall = await rahatAccessManager.canCall(manager.address, rahatToken.target, mintId);

            //get target function role
            const targetFunctionRole = await rahatAccessManager.getTargetFunctionRole(rahatToken.target, mintId);

            //get target admin delay
            const targetAdminDelay = await rahatAccessManager.getTargetAdminDelay(rahatToken.target);
            //note: disable any acess if target is closed
            const isTargetClosed = await rahatAccessManager.isTargetClosed(rahatToken.target);
            console.log({ canCall });
            console.log({ targetFunctionRole });
            console.log({ isTargetClosed, targetAdminDelay });

        })
        it("should mint tokens", async function () {
            await rahatTreasury.connect(owner).mintToken(rahatToken.target, 100000n);
            //check if target is retricted with access management
            const isTargetClosedAfter = await rahatAccessManager.isTargetClosed(rahatToken.target);
            console.log({ isTargetClosedAfter })
            const treasuryBalance = await rahatToken.balanceOf(rahatTreasury.target);
            expect(treasuryBalance).to.equal(100000n);
        });
        it("should transfer tokens", async function () {
            await rahatTreasury.connect(owner).transferToken(rahatToken.target, manager.address, 100n);
            const managerBalance = await rahatToken.balanceOf(manager.address);
            expect(managerBalance).to.equal(100n);
        });

        it("should transfer token to payroll project", async function () {
            await rahatTreasury.connect(owner).transferToken(rahatToken.target, rahatPayroll.target, 1000n);
            const payrollBalance = await rahatToken.balanceOf(rahatPayroll.target);
            expect(payrollBalance).to.equal(1000n);
        });

        it("should allocate tokens to beneficiary", async function () {
            await rahatPayroll.connect(owner).allocateToken(rahatToken.target, beneficiary1.address, 100n);
            await rahatPayroll.connect(owner).allocateToken(rahatToken.target, beneficiary2.address, 100n);
            const beneficiary1Balance = await rahatPayroll.tokenAllocations(rahatToken.target, beneficiary1.address);
            const beneficiary2Balance = await rahatPayroll.tokenAllocations(rahatToken.target, beneficiary2.address);

            expect(beneficiary1Balance).to.equal(100n);
            expect(beneficiary2Balance).to.equal(100n);
        });

        // it("should add claimer", async function () {

        // });

        it("request token from beneficiary", async function () {
            const claim = await vendorContract.RahatClaim();
            console.log({ claim })
            await vendorContract.connect(vendor1).requestTokenFromBeneficiary(rahatToken.target, beneficiary1.address, 10n);
            //add hash from otp server
            const otpHash = ethers.id("1234");

            //get current timestamp
            const currentTimestamp = Math.floor(Date.now() / 1000);

            await rahatClaim.connect(deployer).addOtpToClaim(1, otpHash, currentTimestamp + 10000);

            await vendorContract.connect(vendor1).processTokenRequest(beneficiary1.address, "1234");

            const vendor1Balance = await rahatToken.balanceOf(vendor1.address);
            expect(vendor1Balance).to.equal(10n);
        }
        );
    });

});


