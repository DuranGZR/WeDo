"""Configure an ignored local env from an Apple .p8 file without printing secrets."""

import argparse
import re
from pathlib import Path

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key-file", type=Path, required=True)
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--team-id", required=True)
    args = parser.parse_args()
    if not all(
        re.fullmatch(r"[A-Z0-9]{10}", value) for value in (args.key_id, args.team_id)
    ):
        parser.error(
            "Key ID and Team ID must each contain 10 uppercase letters/digits."
        )
    pem = args.key_file.read_bytes()
    key = serialization.load_pem_private_key(pem, password=None)
    if not isinstance(key, ec.EllipticCurvePrivateKey) or not isinstance(
        key.curve, ec.SECP256R1
    ):
        parser.error("Expected an Apple Sign in with Apple P-256 private key.")
    env = Path(__file__).resolve().parents[1] / ".env"
    original = env.read_bytes().decode("utf-8-sig") if env.exists() else ""
    lines = original.splitlines()
    existing = dict(
        line.split("=", 1)
        for line in lines
        if "=" in line and not line.lstrip().startswith("#")
    )
    encryption_key = existing.get("APPLE_TOKEN_ENCRYPTION_KEY", "").strip().strip("\"'")
    if encryption_key:
        Fernet(encryption_key.encode())  # Never replace a key used by existing grants.
    else:
        encryption_key = Fernet.generate_key().decode()
    values = {
        "APPLE_BUNDLE_ID": "com.durangezer.wedo",
        "APPLE_TEAM_ID": args.team_id,
        "APPLE_KEY_ID": args.key_id,
        "APPLE_PRIVATE_KEY": pem.decode()
        .strip()
        .replace("\r\n", "\n")
        .replace("\n", "\\n"),
        "APPLE_TOKEN_ENCRYPTION_KEY": encryption_key,
    }
    for name, value in values.items():
        matches = [
            index for index, line in enumerate(lines) if line.startswith(name + "=")
        ]
        if matches:
            for index in matches:
                lines[index] = name + "=" + value
        else:
            lines.append(name + "=" + value)
    newline = "\r\n" if "\r\n" in original else "\n"
    env.write_bytes((newline.join(lines) + newline).encode())
    print("Apple settings saved to ignored backend/.env. No secret values printed.")


if __name__ == "__main__":
    main()
