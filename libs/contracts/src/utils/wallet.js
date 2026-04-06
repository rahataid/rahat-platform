const { ethers } = require("hardhat")

const getPkFromMnemonic = (mnemonic, index = 0) => {
  const hdPath = `m/44'/60'/0'/0/${index}`
  const wallet = new ethers.Wallet.fromMnemonic(mnemonic, hdPath)
  return wallet
}

module.exports = {
  getPkFromMnemonic,
}
