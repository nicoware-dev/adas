import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";

/**
 * Base error class for Merkle Trade errors
 */
export class MerkleBaseError extends Error {
    readonly code: string;
    readonly status: string;

    constructor(status: string, code: string, message: string) {
        super(message);
        this.code = code;
        this.status = status;

        Object.setPrototypeOf(this, MerkleBaseError.prototype);
        this.name = "MerkleBaseError";
    }
}

/**
 * Error thrown when a position is not found
 */
export class PositionNotFoundError extends MerkleBaseError {
    readonly pair: string;
    readonly isLong: boolean;

    constructor(pair: string, isLong: boolean, message: string) {
        super("error", "POSITION_NOT_FOUND", message);
        this.pair = pair;
        this.isLong = isLong;
        this.name = "PositionNotFoundError";
    }
}

/**
 * Error thrown when a transaction fails
 */
export class FailedSendTransactionError extends MerkleBaseError {
    readonly tx: UserTransactionResponse;

    constructor(message: string, tx: UserTransactionResponse) {
        super("error", "FAILED_SEND_TRANSACTION", message);
        this.tx = tx;
        this.name = "FailedSendTransactionError";
    }
}
