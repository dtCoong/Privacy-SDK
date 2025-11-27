// src/ringsig.d.ts

export class RingSignature {
    static generateKeyPair(): { 
        sk: string; 
        pk: string 
    };

    static createRingSignature(
        message: string, 
        publicKeysHex: string[], 
        signerSecretKeyHex: string, 
        signerIndex: number
    ): Promise<{ 
        keyImage: string; 
        c0: string; 
        s: string[] 
    }>;

    static verifyRingSignature(
        message: string, 
        signature: any, 
        publicKeysHex: string[]
    ): Promise<boolean>;
}