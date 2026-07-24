import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RahatToken", (m: any) => {
    console.log("Deploying RahatToken")
    const token = m.contract("RahatToken", ["RahatToken",
        "RTH",
        "0xcDEe632FB1Ba1B3156b36cc0bDabBfd821305e06",
        18]);

    return { token };
});