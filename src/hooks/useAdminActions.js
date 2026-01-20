import { ethers } from 'ethers';

/**
 * useAdminActions - Hook de lógica para interacciones de Smart Contract y API de Admin
 */
export const useAdminActions = () => {

    // ABI simplificado para retiro de utilidades del contrato
    const CASINO_ABI = [
        "function withdrawHouseEarnings(address _to, uint256 _amount) public returns (bool)",
        "function getHouseEarnings() public view returns (uint256)"
    ];

    const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder

    /**
     * withdrawalEarnings - Ejecuta el retiro on-chain
     */
    const executeWithdrawal = async (destination, amount) => {
        if (!window.ethereum) throw new Error('MetaMask no detectado');

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CASINO_ABI, signer);

        const amountInWei = ethers.parseEther(amount.toString());

        // Validación local antes de enviar a la red
        const currentEarnings = await contract.getHouseEarnings();
        if (currentEarnings < amountInWei) {
            throw new Error('Saldo insuficiente en el Smart Contract');
        }

        const tx = await contract.withdrawHouseEarnings(destination, amountInWei);
        await tx.wait();

        return tx.hash;
    };

    /**
     * updateGlobalRTP - Actualiza el RTP en el backend
     */
    const updateGlobalRTP = async (newRtp) => {
        const response = await fetch('/api/admin/update-odds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ADMIN_TOKEN'
            },
            body: JSON.stringify({ rtp: newRtp / 100 })
        });

        if (!response.ok) throw new Error('Error al actualizar RTP');
        return await response.json();
    };

    return { executeWithdrawal, updateGlobalRTP };
};
