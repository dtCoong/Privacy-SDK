import math

try:
    import seal
except ImportError:
    raise SystemExit("The 'seal' package is required. Install microsoft-seal for Python before running this demo.")

def demo_sum_three_numbers():
    parms = seal.EncryptionParameters(seal.scheme_type.bfv)
    poly_modulus_degree = 4096
    parms.set_poly_modulus_degree(poly_modulus_degree)
    parms.set_coeff_modulus(seal.CoeffModulus.BFVDefault(poly_modulus_degree))
    parms.set_plain_modulus(1024)
    context = seal.SEALContext(parms)
    keygen = seal.KeyGenerator(context)
    public_key = keygen.public_key()
    secret_key = keygen.secret_key()
    encryptor = seal.Encryptor(context, public_key)
    evaluator = seal.Evaluator(context)
    decryptor = seal.Decryptor(context, secret_key)
    encoder = seal.BatchEncoder(context)
    values = [5, 7, 9]
    slots = encoder.slot_count()
    plain_vec = [0] * slots
    for i, v in enumerate(values):
        plain_vec[i] = v
    plain = seal.Plaintext()
    encoder.encode(plain_vec, plain)
    cipher = seal.Ciphertext()
    encryptor.encrypt(plain, cipher)
    cipher_sum = seal.Ciphertext(cipher)
    decrypted = seal.Plaintext()
    decryptor.decrypt(cipher_sum, decrypted)
    result = []
    encoder.decode(decrypted, result)
    s = sum(result[:3])
    print("Input values:", values)
    print("Decrypted components:", result[:3])
    print("Sum:", s)

if __name__ == "__main__":
    demo_sum_three_numbers()