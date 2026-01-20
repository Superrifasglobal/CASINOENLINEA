import { ethers } from 'ethers';
import { Env } from '../[[path]]';

const CASINO_ABI = [
    "function withdrawHouseEarnings(address _to, uint256 _amount) public returns (bool)",
    "function houseReserve() public view returns (uint256)",
    "event DepositReceived(address indexed user, uint256 amount)",
    "event WithdrawalExecuted(address indexed user, uint256 amount, uint256 nonce)"
];

export class AdminContractService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;

    constructor(private env: Env) {
        this.provider = new ethers.JsonRpcProvider(env.ETH_RPC_URL);
        this.wallet = new ethers.Wallet(env.ADMIN_PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(
            env.CASINO_CONTRACT_ADDRESS,
            CASINO_ABI,
            this.wallet
        );
    }

    /**
     * getHouseVaultBalance - Returns actual ETH balance of the contract
     */
    async getHouseVaultBalance(): Promise<string> {
        const balance = await this.provider.getBalance(this.env.CASINO_CONTRACT_ADDRESS);
        return ethers.formatEther(balance);
    }

    /**
     * getPendingLiabilities - Sum of all user balances in D1
     */
    async getPendingLiabilities(): Promise<number> {
        const result = await this.env.DB.prepare(
            'SELECT SUM(balance) as total FROM users'
        ).first<{ total: number }>();
        return result?.total || 0;
    }

    /**
     * adminWithdraw - Executes house earnings extraction
     */
    async adminWithdraw(to: string, amount: string): Promise<string> {
        const amountWei = ethers.parseEther(amount);

        // Safety check: ensure we don't withdraw more than available profit
        const balance = await this.provider.getBalance(this.env.CASINO_CONTRACT_ADDRESS);
        const liabilities = await this.getPendingLiabilities();
        const liabilitiesWei = ethers.parseEther(liabilities.toString());

        if (balance < liabilitiesWei + amountWei) {
            throw new Error('Insufficient profit available. House reserve must be maintained.');
        }

        const tx = await this.contract.withdrawHouseEarnings(to, amountWei);
        const receipt = await tx.wait();

        return receipt.hash;
    }

    /**
     * getAuditReport - Returns a comparison of D1 vs Contract balance
     */
    async getAuditReport() {
        const contractBalance = await this.getHouseVaultBalance();
        const d1Liabilities = await this.getPendingLiabilities();

        return {
            contractBalance: parseFloat(contractBalance),
            d1Liabilities,
            discrepancy: parseFloat(contractBalance) - d1Liabilities,
            timestamp: new Date().toISOString()
        };
    }
}
