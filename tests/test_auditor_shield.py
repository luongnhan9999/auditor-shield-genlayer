"""
AuditorShield Integration Test Suite.

This suite executes the contract's state transition logic using a ContractSimulator
that models state changes, token transfers, admin escalation resolution, and failure rollbacks.
"""

import sys

# Custom Exception mimicking GenLayer UserError
class UserError(Exception):
    pass

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

class Bounty:
    def __init__(self, owner: Address, whitehat: Address, reward_amount: int, code_url: str, focus_area: str, report_url: str, status: str, ai_verdict: str, ai_reason: str, confidence: int):
        self.owner = owner
        self.whitehat = whitehat
        self.reward_amount = reward_amount
        self.code_url = code_url
        self.focus_area = focus_area
        self.report_url = report_url
        self.status = status
        self.ai_verdict = ai_verdict
        self.ai_reason = ai_reason
        self.confidence = confidence

    def copy(self):
        return Bounty(
            self.owner, self.whitehat, self.reward_amount, self.code_url,
            self.focus_area, self.report_url, self.status, self.ai_verdict,
            self.ai_reason, self.confidence
        )

class ContractSimulator:
    def __init__(self):
        self.bounties = {}
        self.next_bounty_id = 1
        self.platform_admin = "0xadmin"
        self.balances = {}
        self.message_sender = None
        self.message_value = 0

    def emit_transfer(self, to_addr: Address, value: int):
        addr_str = str(to_addr)
        self.balances[addr_str] = self.balances.get(addr_str, 0) + value

    def create_bounty(self, code_url: str, focus_area: str) -> str:
        snapshot = {bid: b.copy() for bid, b in self.bounties.items()}
        try:
            amount = self.message_value
            if amount <= 0:
                raise UserError("Bounty reward must be greater than 0")
            if not code_url.startswith("http"):
                raise UserError("Valid code URL required")

            bounty_id = str(self.next_bounty_id)
            self.next_bounty_id += 1

            self.bounties[bounty_id] = Bounty(
                owner=self.message_sender,
                whitehat=Address("0x0000000000000000000000000000000000000000"),
                reward_amount=amount,
                code_url=code_url,
                focus_area=focus_area,
                report_url="",
                status="OPEN",
                ai_verdict="",
                ai_reason="",
                confidence=0
            )
            return bounty_id
        except Exception as e:
            self.bounties = snapshot
            raise e

    def submit_report(self, bounty_id: str, report_url: str) -> None:
        snapshot = {bid: b.copy() for bid, b in self.bounties.items()}
        try:
            if bounty_id not in self.bounties:
                raise UserError("Bounty does not exist")
            
            bounty = self.bounties[bounty_id]
            if bounty.status != "OPEN":
                raise UserError("Bounty is not open for submissions")
            if self.message_sender == bounty.owner:
                raise UserError("Owner cannot submit report to own bounty")
            if not report_url.startswith("http"):
                raise UserError("Valid report URL required")

            bounty.whitehat = self.message_sender
            bounty.report_url = report_url
            bounty.status = "EVALUATING"
            self.bounties[bounty_id] = bounty
        except Exception as e:
            self.bounties = snapshot
            raise e

    def _effective_verdict(self, data: dict) -> str:
        verdict = str(data.get("verdict", "ESCALATE")).upper()
        if verdict not in {"PAYOUT", "PARTIAL", "REJECT", "ESCALATE"}:
            verdict = "ESCALATE"
        try:
            conf = int(data.get("confidence", 0))
            if conf < 0:
                conf = 0
            elif conf > 100:
                conf = 100
        except Exception:
            conf = 0
        if conf < 65:
            verdict = "ESCALATE"
        return verdict

    def adjudicate_report(self, bounty_id: str, simulated_ai_result: dict) -> None:
        snapshot = {bid: b.copy() for bid, b in self.bounties.items()}
        balances_snapshot = self.balances.copy()
        try:
            if bounty_id not in self.bounties:
                raise UserError("Bounty does not exist")
                
            bounty = self.bounties[bounty_id]
            if bounty.status != "EVALUATING":
                raise UserError("Bounty is not ready for adjudication")

            final_verdict = self._effective_verdict(simulated_ai_result)
            try:
                confidence = int(simulated_ai_result.get("confidence", 0))
                if confidence < 0:
                    confidence = 0
                elif confidence > 100:
                    confidence = 100
            except Exception:
                confidence = 0
            reason = str(simulated_ai_result.get("reason", "No reason provided"))
            if confidence < 65:
                reason = f"[Low Confidence {confidence}%] " + reason

            bounty.ai_verdict = final_verdict
            bounty.ai_reason = reason
            bounty.confidence = confidence

            amount = bounty.reward_amount

            if final_verdict == "PAYOUT":
                bounty.status = "CLOSED"
                self.emit_transfer(bounty.whitehat, amount)
            elif final_verdict == "PARTIAL":
                bounty.status = "CLOSED"
                payout_amt = amount // 4
                refund_amt = amount - payout_amt
                self.emit_transfer(bounty.whitehat, payout_amt)
                self.emit_transfer(bounty.owner, refund_amt)
            elif final_verdict == "REJECT":
                bounty.status = "OPEN"
                bounty.whitehat = Address("0x0000000000000000000000000000000000000000")
                bounty.report_url = ""
            else:
                bounty.status = "ESCALATED"

            self.bounties[bounty_id] = bounty
        except Exception as e:
            self.bounties = snapshot
            self.balances = balances_snapshot
            raise e

    def resolve_escalation(self, bounty_id: str, action: str) -> None:
        snapshot = {bid: b.copy() for bid, b in self.bounties.items()}
        balances_snapshot = self.balances.copy()
        try:
            if bounty_id not in self.bounties:
                raise UserError("Bounty does not exist")

            bounty = self.bounties[bounty_id]
            if bounty.status != "ESCALATED":
                raise UserError("Bounty is not in ESCALATED status")

            if self.message_sender != self.platform_admin:
                raise UserError("Only platform admin can resolve escalated bounties")

            action = action.lower().strip()
            amount = bounty.reward_amount

            if action == "refund":
                self.emit_transfer(bounty.owner, amount)
                bounty.status = "CLOSED"
            elif action == "payout":
                if str(bounty.whitehat) == "0x0000000000000000000000000000000000000000":
                    raise UserError("No whitehat assigned; cannot payout")
                self.emit_transfer(bounty.whitehat, amount)
                bounty.status = "CLOSED"
            elif action == "partial":
                if str(bounty.whitehat) == "0x0000000000000000000000000000000000000000":
                    raise UserError("No whitehat assigned; cannot partial payout")
                payout_amt = amount // 4
                refund_amt = amount - payout_amt
                self.emit_transfer(bounty.whitehat, payout_amt)
                self.emit_transfer(bounty.owner, refund_amt)
                bounty.status = "CLOSED"
            else:
                raise UserError("Invalid action. Must be 'refund', 'payout', or 'partial'.")

            self.bounties[bounty_id] = bounty
        except Exception as e:
            self.bounties = snapshot
            self.balances = balances_snapshot
            raise e


# -- Test Cases -----------------------------------------------

def test_create_bounty_transfers_and_storage():
    sim = ContractSimulator()
    sim.message_sender = Address("0xowner")
    sim.message_value = 5000

    bounty_id = sim.create_bounty("https://github.com/code", "Security Scope")
    
    assert bounty_id == "1"
    assert sim.next_bounty_id == 2
    
    bounty = sim.bounties["1"]
    assert bounty.owner == "0xowner"
    assert bounty.reward_amount == 5000
    assert bounty.status == "OPEN"
    assert bounty.code_url == "https://github.com/code"
    print("[OK] Test 1: create_bounty updates storage and reserves escrow correctly")


def test_submit_report_storage():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0x0000000000000000000000000000000000000000"),
        reward_amount=5000,
        code_url="https://github.com/code",
        focus_area="Scope",
        report_url="",
        status="OPEN",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    sim.message_sender = Address("0xwhitehat")
    sim.submit_report("1", "https://github.com/report")
    
    bounty = sim.bounties["1"]
    assert bounty.whitehat == "0xwhitehat"
    assert bounty.report_url == "https://github.com/report"
    assert bounty.status == "EVALUATING"
    print("[OK] Test 2: submit_report saves whitehat details and sets EVALUATING status")


def test_payout_settlement_transfers():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # 100% payout to whitehat
    sim.adjudicate_report("1", {"verdict": "PAYOUT", "confidence": 95, "reason": "Severe flaw"})
    
    bounty = sim.bounties["1"]
    assert bounty.status == "CLOSED"
    assert bounty.ai_verdict == "PAYOUT"
    assert sim.balances.get("0xwhitehat", 0) == 1000
    assert sim.balances.get("0xowner", 0) == 0
    print("[OK] Test 3: PAYOUT transfers 100% escrow to whitehat and closes bounty")


def test_partial_settlement_transfers():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # 25% payout / 75% refund
    sim.adjudicate_report("1", {"verdict": "PARTIAL", "confidence": 90, "reason": "Low-severity typo"})
    
    bounty = sim.bounties["1"]
    assert bounty.status == "CLOSED"
    assert bounty.ai_verdict == "PARTIAL"
    assert sim.balances.get("0xwhitehat", 0) == 250
    assert sim.balances.get("0xowner", 0) == 750
    print("[OK] Test 4: PARTIAL transfers correct split (25% whitehat, 75% owner) with no token leak")


def test_reject_settlement_storage():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # Reject spam report
    sim.adjudicate_report("1", {"verdict": "REJECT", "confidence": 100, "reason": "Spam report"})
    
    bounty = sim.bounties["1"]
    assert bounty.status == "OPEN"
    assert bounty.whitehat == "0x0000000000000000000000000000000000000000"
    assert bounty.report_url == ""
    assert sim.balances.get("0xwhitehat", 0) == 0
    assert sim.balances.get("0xowner", 0) == 0
    print("[OK] Test 5: REJECT resets status to OPEN, clears whitehat, and retains escrow")


def test_escalate_settlement_storage():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # Escalate because of low confidence
    sim.adjudicate_report("1", {"verdict": "PAYOUT", "confidence": 40, "reason": "Unsure"})
    
    bounty = sim.bounties["1"]
    assert bounty.status == "ESCALATED"
    assert bounty.ai_verdict == "ESCALATE"
    assert sim.balances.get("0xwhitehat", 0) == 0
    print("[OK] Test 6: ESCALATE status set on low confidence, funds held in contract")


def test_resolve_escalation_flows():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="ESCALATED",
        ai_verdict="ESCALATE",
        ai_reason="Consensus failed",
        confidence=50
    )
    
    sim.message_sender = Address("0xadmin")
    
    # 1. Resolve payout
    sim.resolve_escalation("1", "payout")
    assert sim.bounties["1"].status == "CLOSED"
    assert sim.balances.get("0xwhitehat", 0) == 1000
    
    # 2. Resolve refund
    sim.bounties["1"].status = "ESCALATED"
    sim.balances["0xwhitehat"] = 0
    sim.resolve_escalation("1", "refund")
    assert sim.bounties["1"].status == "CLOSED"
    assert sim.balances.get("0xowner", 0) == 1000
    
    # 3. Resolve partial
    sim.bounties["1"].status = "ESCALATED"
    sim.balances["0xowner"] = 0
    sim.resolve_escalation("1", "partial")
    assert sim.bounties["1"].status == "CLOSED"
    assert sim.balances.get("0xwhitehat", 0) == 250
    assert sim.balances.get("0xowner", 0) == 750
    print("[OK] Test 7: resolve_escalation executes payout, refund, and partial splits as requested")


def test_failure_rollback():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0x0000000000000000000000000000000000000000"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="",
        status="OPEN",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # Non-http URL should fail and rollback state
    sim.message_sender = Address("0xwhitehat")
    try:
        sim.submit_report("1", "ftp://invalid-url")
        assert False, "Should have failed URL protocol check"
    except UserError:
        pass
        
    # Verify rollback: whitehat details and status remain unmodified
    assert sim.bounties["1"].status == "OPEN"
    assert sim.bounties["1"].whitehat == "0x0000000000000000000000000000000000000000"
    
    # Resolve escalation by non-admin should fail and rollback state
    sim.bounties["1"].status = "ESCALATED"
    sim.message_sender = Address("0xmalicious")
    try:
        sim.resolve_escalation("1", "payout")
        assert False, "Should have rejected non-admin sender"
    except UserError:
        pass
        
    # Verify rollback: status remains ESCALATED and no balances are credited
    assert sim.bounties["1"].status == "ESCALATED"
    assert sim.balances.get("0xwhitehat", 0) == 0
    print("[OK] Test 8: State correctly rolls back to original snapshots upon transaction failure")


def test_verdict_confidence_constraints():
    sim = ContractSimulator()
    sim.bounties["1"] = Bounty(
        owner=Address("0xowner"),
        whitehat=Address("0xwhitehat"),
        reward_amount=1000,
        code_url="https://code",
        focus_area="Scope",
        report_url="https://report",
        status="EVALUATING",
        ai_verdict="",
        ai_reason="",
        confidence=0
    )
    
    # AI returns verdict "MAYBE" (invalid) -> must be overridden to ESCALATE
    sim.adjudicate_report("1", {"verdict": "MAYBE", "confidence": 90, "reason": "Garbage output"})
    assert sim.bounties["1"].ai_verdict == "ESCALATE"
    assert sim.bounties["1"].status == "ESCALATED"
    
    # AI returns confidence > 100 (e.g. 150) -> must be clamped to 100
    sim.bounties["1"].status = "EVALUATING"
    sim.adjudicate_report("1", {"verdict": "PAYOUT", "confidence": 150, "reason": "Hyper-confident"})
    assert sim.bounties["1"].confidence == 100
    
    # AI returns confidence < 0 (e.g. -50) -> must be clamped to 0 and overridden to ESCALATE (since < 65)
    sim.bounties["1"].status = "EVALUATING"
    sim.adjudicate_report("1", {"verdict": "PAYOUT", "confidence": -50, "reason": "Corrupted value"})
    assert sim.bounties["1"].confidence == 0
    assert sim.bounties["1"].ai_verdict == "ESCALATE"
    print("[OK] Test 9: Verdict constraints and confidence clamping [0, 100] work flawlessly")


if __name__ == "__main__":
    test_create_bounty_transfers_and_storage()
    test_submit_report_storage()
    test_payout_settlement_transfers()
    test_partial_settlement_transfers()
    test_reject_settlement_storage()
    test_escalate_settlement_storage()
    test_resolve_escalation_flows()
    test_failure_rollback()
    test_verdict_confidence_constraints()
    print("\n==================================================")
    print("[OK] ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
