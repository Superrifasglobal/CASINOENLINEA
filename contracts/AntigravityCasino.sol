// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AntigravityCasino
 * @dev Contrato inteligente para casino descentralizado con retiros autorizados por firma.
 */
contract AntigravityCasino is ReentrancyGuard, Pausable, Ownable, EIP712 {
    using ECDSA for bytes32;

    // --- Variables de Estado ---
    uint256 public houseReserve; // Fondos destinados a pagar premios
    uint256 public minDeposit;    // Depósito mínimo en Wei
    address public signerAddress; // Dirección del backend que firma retiros

    // --- EIP-712 Typehashes ---
    bytes32 private constant WITHDRAW_TYPEHASH = keccak256(
        "Withdrawal(address user,uint256 amount,uint256 nonce)"
    );

    mapping(address => uint256) public nonces;

    // --- Eventos ---
    event DepositReceived(address indexed user, uint256 amount);
    event WithdrawalExecuted(address indexed user, uint256 amount, uint256 nonce);
    event HouseEarningsWithdrawn(address indexed to, uint256 amount);
    event SignerUpdated(address indexed newSigner);

    /**
     * @dev Constructor
     * @param _minDeposit Depósito mínimo inicial
     * @param _signer Dirección permitida para firmar retiros
     */
    constructor(uint256 _minDeposit, address _signer) EIP712("AntigravityCasino", "1") {
        minDeposit = _minDeposit;
        signerAddress = _signer;
    }

    // --- Funciones de Usuario ---

    /**
     * @notice Permite depositar ETH para acreditar en el juego.
     */
    function deposit() external payable whenNotPaused {
        require(msg.value >= minDeposit, "Deposito menor al minimo");
        
        houseReserve += msg.value;
        emit DepositReceived(msg.sender, msg.value);
    }

    /**
     * @notice Ejecuta un retiro autorizado por el backend.
     * @param amount Cantidad a retirar en Wei.
     * @param nonce Identificador único para evitar replay attacks.
     * @param signature Firma EIP-712 del servidor.
     */
    function requestWithdrawal(uint256 amount, uint256 nonce, bytes calldata signature) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(nonce == nonces[msg.sender], "Nonce invalido");
        require(address(this).balance >= amount, "Saldo insuficiente en boveda");

        // Verificar firma EIP-712
        bytes32 structHash = keccak256(abi.encode(WITHDRAW_TYPEHASH, msg.sender, amount, nonce));
        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = hash.recover(signature);

        require(recoveredSigner == signerAddress, "Firma invalida o no autorizada");

        // Actualizar estado antes de transferir (Checks-Effects-Interactions)
        nonces[msg.sender]++;
        if (amount <= houseReserve) {
            houseReserve -= amount;
        } else {
            houseReserve = 0; // Se usó parte de las utilidades acumuladas si la reserva no bastó
        }

        // Ejecutar transferencia
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Falla en la transferencia");

        emit WithdrawalExecuted(msg.sender, amount, nonce);
    }

    // --- Funciones de Administrador (Owner) ---

    /**
     * @notice Extrae las utilidades que exceden la reserva necesaria para premios.
     * @param _to Dirección de destino.
     * @param _amount Cantidad a extraer.
     */
    function withdrawHouseEarnings(address payable _to, uint256 _amount) external onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance >= houseReserve + _amount, "Utilidades insuficientes tras reserva");

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Error al extraer utilidades");

        emit HouseEarningsWithdrawn(_to, _amount);
    }

    function setMinDeposit(uint256 _newMin) external onlyOwner {
        minDeposit = _newMin;
    }

    function updateSigner(address _newSigner) external onlyOwner {
        signerAddress = _newSigner;
        emit SignerUpdated(_newSigner);
    }

    /**
     * @notice Detiene retiros en caso de emergencia.
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Función para recibir fondos directamente (opcional).
     */
    receive() external payable {
        houseReserve += msg.value;
    }
}
