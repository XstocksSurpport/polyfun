import { Contract, type ContractRunner, type InterfaceAbi } from "ethers";

export function getContract(
  address: string,
  abi: InterfaceAbi,
  runner: ContractRunner
) {
  return new Contract(address, abi, runner);
}
