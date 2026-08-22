"""
Comprehensive Test Suite for AuditorShield GenLayer Intelligent Contract.

This test suite executes the ACTUAL contract code (`contracts/AuditorShield.py`)
directly by mocking the `genlayer` module. It verifies:
  1. create_bounty: escrow locks and storage updates.
  2. submit_report: whitehat submission and validation guards.
  3. adjudicate_report: PAYOUT, PARTIAL, REJECT, and ESCALATE settlement paths.
  4. resolve_escalation: admin resolution (refund, payout, partial) on escalated status.
  5. State Rollback: verifies storage remains unmodified on failed transactions.
  6. Confidence Clamping and Verdict Constraints: whitelisting and range validation.
"""

import sys
import types
import pytest

# ── 1. Create Mock GenLayer Module ──────────────────────────────────

genlayer_mock = types.ModuleType("genlayer")

class Address:
    def __init__(self, val: str):
        self.val = str(val).lower()
    def __str__(self):
        return self.val
    def __eq__(self, other):
        if isinstance(other, Address):
            return self.val == other.val
        return self.val == str(other).lower()
    def __hash__(self):
        return hash(self.val)

class u256(int):
    pass

class UserError(Exception):
    pass

class TreeMap:
    def __class_getitem__(cls, item):
        return cls
    def __init__(self):
        self.store = {}
    def __setitem__(self, key, value):
        self.store[key] = value
    def __getitem__(self, key):
        return self.store[key]
    def __contains__(self, key):
        return key in self.store
    def items(self):
        return self.store.items()
    def __len__(self):
        return len(self.store)

def allow_storage(cls):
    return cls

# Mock gl global object
class MockMessage:
    def __init__(self):
        self.sender_address = Address("0xdefault")
        self.value = u256(0)

class MockWeb:
    def __init__(self):
        self.render_result = "OK"
    def render(self, url, mode="text"):
        return self.render_result

class MockNondet:
    def __init__(self):
        self.web = MockWeb()
        self.prompt_result = {}
    def exec_prompt(self, prompt, response_format="json"):
        return self.prompt_result

class MockContractInstance:
    def __init__(self, address):
        self.address = address
        self.transfers = []
    def emit_transfer(self, value):
        self.transfers.append(value)

def mock_decorator(fn):
    return fn

class MockWrite:
    def __call__(self, fn):
        return fn
    def payable(self, fn):
        return fn

class MockPublic:
    def __init__(self):
        self.write = MockWrite()
        self.view = mock_decorator

class ContractBase:
    def __new__(cls, *args, **kwargs):
        instance = super().__new__(cls)
        # Automatically initialize any annotated state variables of type TreeMap
        annotations = getattr(cls, "__annotations__", {})
        for name, type_hint in annotations.items():
            # Check if type_hint is TreeMap or mock class with getitem support
            if type_hint is TreeMap or (isinstance(type_hint, type) and type_hint.__name__ == "TreeMap"):
                setattr(instance, name, TreeMap())
        return instance

class MockGL:
    def __init__(self):
        self.Contract = ContractBase
        self.public = MockPublic()
        self.message = MockMessage()
        self.nondet = MockNondet()
        self.vm = self
        self.contracts = {}

    def get_contract_at(self, address):
        addr_str = str(address).lower()
        if addr_str not in self.contracts:
            self.contracts[addr_str] = MockContractInstance(address)
        return self.contracts[addr_str]

    def run_nondet(self, leader_fn, validator_fn):
        # Simply run leader_fn for testing contract logic
        return leader_fn()

gl_inst = MockGL()

# Populate the mock module
genlayer_mock.gl = gl_inst
genlayer_mock.Address = Address
genlayer_mock.u256 = u256
genlayer_mock.UserError = UserError
genlayer_mock.TreeMap = TreeMap
genlayer_mock.allow_storage = allow_storage

# Register in sys.modules so the contract file imports the mocked module
sys.modules["genlayer"] = genlayer_mock

# ── 2. Load the Actual Contract Code ────────────────────────────────

with open("contracts/AuditorShield.py", "r", encoding="utf-8") as f:
    contract_code = f.read()

# Execute code in custom namespace to extract Contract class
contract_ns = {
    "gl": gl_inst,
    "Address": Address,
    "u256": u256,
    "UserError": UserError,
    "TreeMap": TreeMap,
    "allow_storage": allow_storage,
    "__name__": "contracts.AuditorShield"
}
exec(contract_code, contract_ns)

ContractClass = contract_ns["Contract"]
BountyClass = contract_ns["Bounty"]

# Helper to deep copy TreeMap for state rollback verification
def clone_tree_map(tm: TreeMap) -> TreeMap:
    new_tm = TreeMap()
    for k, v in tm.store.items():
        new_tm[k] = BountyClass(
            owner=v.owner,
            whitehat=v.whitehat,
            reward_amount=v.reward_amount,
            code_url=v.code_url,
            focus_area=v.focus_area,
            report_url=v.report_url,
            status=v.status,
            ai_verdict=v.ai_verdict,
            ai_reason=v.ai_reason,
            confidence=v.confidence
        )
    return new_tm

# ── 3. Test Cases ───────────────────────────────────────────────────

def test_create_bounty_execution():
    """Verify create_bounty updates storage and locks reward escrow correctly."""
    contract = ContractClass()
    gl_inst.message.sender_address = Address("0xowner")
    gl_inst.message.value = u256(5000)

    bounty_id = contract.create_bounty("https://github.com/scope", "Focus Areas")
    
    assert bounty_id == "1"
    assert contract.next_bounty_id == 2
    
    bounty = contract.bounties["1"]
    assert bounty.owner == Address("0xowner")
    assert bounty.reward_amount == 5000
    assert bounty.status == "OPEN"
    assert bounty.code_url == "https://github.com/scope"
    print("[OK] Test 1: create_bounty updates storage and locks escrow correctly")


def test_submit_report_execution():
    """Verify submit_report validates inputs and updates whitehat details."""
    contract = ContractClass()
    
    # Setup open bounty
    contract.next_bounty_id = u256(2)
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0x0000000000000000000000000000000000000000"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="",
        status="OPEN",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    gl_inst.message.sender_address = Address("0xwhitehat")
    contract.submit_report("1", "https://github.com/report")
    
    bounty = contract.bounties["1"]
    assert bounty.whitehat == Address("0xwhitehat")
    assert bounty.report_url == "https://github.com/report"
    assert bounty.status == "EVALUATING"
    print("[OK] Test 2: submit_report saves report details and sets status to EVALUATING")


def test_payout_settlement_transfers():
    """Verify PAYOUT transfers 100% of escrow reward to whitehat and closes bounty."""
    contract = ContractClass()
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    # Mock success payload
    gl_inst.nondet.prompt_result = {"verdict": "PAYOUT", "confidence": 95, "reason": "Valid severe issue"}
    gl_inst.contracts.clear()

    contract.adjudicate_report("1")
    
    bounty = contract.bounties["1"]
    assert bounty.status == "CLOSED"
    assert bounty.ai_verdict == "PAYOUT"
    
    # Verify balance transfer to whitehat contract address
    whitehat_contract = gl_inst.get_contract_at(Address("0xwhitehat"))
    assert 1000 in whitehat_contract.transfers
    print("[OK] Test 3: PAYOUT transfers 100% escrow to whitehat and closes bounty")


def test_partial_settlement_transfers():
    """Verify PARTIAL transfers 25% to whitehat and 75% back to owner with no leak."""
    contract = ContractClass()
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    gl_inst.nondet.prompt_result = {"verdict": "PARTIAL", "confidence": 90, "reason": "Informational issue"}
    gl_inst.contracts.clear()

    contract.adjudicate_report("1")
    
    bounty = contract.bounties["1"]
    assert bounty.status == "CLOSED"
    assert bounty.ai_verdict == "PARTIAL"
    
    whitehat_contract = gl_inst.get_contract_at(Address("0xwhitehat"))
    owner_contract = gl_inst.get_contract_at(Address("0xowner"))
    
    assert 250 in whitehat_contract.transfers  # 25% of 1000
    assert 750 in owner_contract.transfers     # 75% of 1000
    print("[OK] Test 4: PARTIAL transfers correct split (25% whitehat, 75% owner)")


def test_reject_settlement_storage():
    """Verify REJECT resets status to OPEN, clears whitehat, and retains escrow."""
    contract = ContractClass()
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    gl_inst.nondet.prompt_result = {"verdict": "REJECT", "confidence": 100, "reason": "Hallucinated report"}
    gl_inst.contracts.clear()

    contract.adjudicate_report("1")
    
    bounty = contract.bounties["1"]
    assert bounty.status == "OPEN"
    assert bounty.whitehat == Address("0x0000000000000000000000000000000000000000")
    assert bounty.report_url == ""
    print("[OK] Test 5: REJECT resets bounty to OPEN and clears whitehat details")


def test_resolve_escalation_flows():
    """Verify resolve_escalation executes refund, payout, and partial actions correctly."""
    contract = ContractClass()
    contract.platform_admin = "0xadmin"
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="https://report",
        status="ESCALATED",
        ai_verdict="ESCALATE",
        ai_reason="Consensus failed",
        confidence=u256(50)
    )

    gl_inst.message.sender_address = Address("0xAdmin")
    
    # Case A: Admin resolves via Refund to Owner
    gl_inst.contracts.clear()
    contract.resolve_escalation("1", "refund")
    assert contract.bounties["1"].status == "CLOSED"
    assert 1000 in gl_inst.get_contract_at(Address("0xowner")).transfers
    
    # Case B: Admin resolves via Payout to Whitehat
    contract.bounties["1"].status = "ESCALATED"
    gl_inst.contracts.clear()
    contract.resolve_escalation("1", "payout")
    assert contract.bounties["1"].status == "CLOSED"
    assert 1000 in gl_inst.get_contract_at(Address("0xwhitehat")).transfers

    # Case C: Admin resolves via Partial Split (25% / 75%)
    contract.bounties["1"].status = "ESCALATED"
    gl_inst.contracts.clear()
    contract.resolve_escalation("1", "partial")
    assert contract.bounties["1"].status == "CLOSED"
    assert 250 in gl_inst.get_contract_at(Address("0xwhitehat")).transfers
    assert 750 in gl_inst.get_contract_at(Address("0xowner")).transfers
    print("[OK] Test 6: resolve_escalation correctly executes admin resolution splits")


def test_failure_rollback():
    """Verify that storage changes are rolled back or uncommitted if a transaction fails."""
    gl_inst.contracts.clear()
    contract = ContractClass()
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0x0000000000000000000000000000000000000000"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="",
        status="OPEN",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    # Action: Hacker tries to submit a dead link (should raise UserError)
    gl_inst.message.sender_address = Address("0xwhitehat")
    
    # Take storage snapshot before the call
    storage_snapshot = clone_tree_map(contract.bounties)
    
    try:
        contract.submit_report("1", "not-a-valid-http-url")
        assert False, "Should raise UserError for bad URL"
    except UserError:
        # Revert/Rollback verification: assert current state matches snapshot
        assert len(contract.bounties) == len(storage_snapshot)
        assert contract.bounties["1"].status == "OPEN"
        assert contract.bounties["1"].whitehat == Address("0x0000000000000000000000000000000000000000")

    # Action: Non-admin tries to resolve escalation
    contract.bounties["1"].status = "ESCALATED"
    gl_inst.message.sender_address = Address("0xhacker")
    try:
        contract.resolve_escalation("1", "payout")
        assert False, "Should raise UserError for non-admin"
    except UserError:
        # Revert verification
        assert contract.bounties["1"].status == "ESCALATED"
        assert len(gl_inst.get_contract_at(Address("0xwhitehat")).transfers) == 0
    print("[OK] Test 7: State remains unchanged (rolled back) on failed transaction paths")


def test_verdict_confidence_constraints():
    """Verify whitelisting of verdicts and clamping of confidence to [0, 100]."""
    contract = ContractClass()
    contract.bounties["1"] = BountyClass(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=u256(1000),
        code_url="https://code",
        focus_area="Focus",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=u256(0)
    )

    # 1. AI returns invalid verdict -> defaults to ESCALATE
    gl_inst.nondet.prompt_result = {"verdict": "ATTACK_SUCCESSFUL", "confidence": 95, "reason": "Invalid verdict string"}
    contract.adjudicate_report("1")
    assert contract.bounties["1"].ai_verdict == "ESCALATE"
    assert contract.bounties["1"].status == "ESCALATED"

    # 2. AI returns confidence > 100 -> clamped to 100
    contract.bounties["1"].status = "EVALUATING"
    gl_inst.nondet.prompt_result = {"verdict": "PAYOUT", "confidence": 180, "reason": "Hyper confidence"}
    contract.adjudicate_report("1")
    assert contract.bounties["1"].confidence == 100

    # 3. AI returns confidence < 0 -> clamped to 0
    contract.bounties["1"].status = "EVALUATING"
    gl_inst.nondet.prompt_result = {"verdict": "PAYOUT", "confidence": -20, "reason": "Negative confidence"}
    contract.adjudicate_report("1")
    assert contract.bounties["1"].confidence == 0
    assert contract.bounties["1"].ai_verdict == "ESCALATE" # overridden due to conf < 65
    print("[OK] Test 8: Verdict whitelisting and confidence clamping verified successfully")


if __name__ == "__main__":
    test_create_bounty_execution()
    test_submit_report_execution()
    test_payout_settlement_transfers()
    test_partial_settlement_transfers()
    test_reject_settlement_storage()
    test_resolve_escalation_flows()
    test_failure_rollback()
    test_verdict_confidence_constraints()
    print("\n==================================================")
    print("[OK] ALL CONTRACT-LEVEL TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")
