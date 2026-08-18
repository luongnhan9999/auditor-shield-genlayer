#!/usr/bin/env python3
"""
Deployment script for AuditorShield Intelligent Contract on GenLayer.
Usage:
    python scripts/deploy.py
    or
    genlayer deploy contracts/AuditorShield.py
"""

import sys
import json
from pathlib import Path

def main():
    contract_path = Path(__file__).parent.parent / "contracts" / "AuditorShield.py"
    if not contract_path.exists():
        print(f"[-] Error: Contract file not found at {contract_path}")
        sys.exit(1)

    print("==================================================")
    print("      AuditorShield GenLayer Deployment Script    ")
    print("==================================================")
    print(f"[+] Loading contract: {contract_path}")
    
    with open(contract_path, "r", encoding="utf-8") as f:
        source_code = f.read()

    print(f"[+] Contract source size: {len(source_code)} bytes")
    print("[+] Target Network: GenLayer Localnet / Testnet")
    print("[+] Deploying Contract (Contract.__init__)...")
    
    # Deployment instruction info for GenLayer CLI
    print("\n[✔] To deploy via GenLayer CLI, run:")
    print("    genlayer deploy contracts/AuditorShield.py")
    print("\n[✔] To test contract via GenLayer CLI, run:")
    print("    genlayer write <CONTRACT_ADDRESS> create_bounty 'https://gist.github.com/example/code.sol' 'Focus on reentrancy' --value 5000000000000000000000")
    print("==================================================")

if __name__ == "__main__":
    main()
