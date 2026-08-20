# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

@allow_storage
@dataclass
class Bounty:
    owner: Address
    whitehat: Address
    reward_amount: u256
    code_url: str
    focus_area: str
    report_url: str
    status: str            # OPEN, EVALUATING, CLOSED, ESCALATED
    ai_verdict: str        # PAYOUT, PARTIAL, REJECT, ESCALATE
    ai_reason: str
    confidence: u256

class Contract(gl.Contract):
    bounties: TreeMap[str, Bounty]
    next_bounty_id: u256
    platform_admin: str

    def __init__(self):
        self.next_bounty_id = u256(1)
        self.platform_admin = str(gl.message.sender_address).lower()

    # ── Helpers ──────────────────────────────────────────────

    def _parse_json(self, text: str) -> dict:
        """Robustly parse LLM JSON responses, stripping markdown fences."""
        text_str = str(text).strip()
        if text_str.startswith("```json"):
            text_str = text_str[7:]
        elif text_str.startswith("```"):
            text_str = text_str[3:]
        if text_str.endswith("```"):
            text_str = text_str[:-3]
        try:
            return json.loads(text_str.strip())
        except Exception as e:
            return {"verdict": "ESCALATE", "confidence": 0, "reason": f"Parse error: {str(e)}"}

    def _effective_verdict(self, data: dict) -> str:
        """Derive the final verdict after applying constraints and low-confidence override.
        This must be identical in leader_fn and validator_fn so that the
        validator agrees on every field that can change settlement."""
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

    # ── Public Write Methods ─────────────────────────────────

    @gl.public.write.payable
    def create_bounty(self, code_url: str, focus_area: str) -> str:
        """Project Owner creates a Bug Bounty and locks reward escrow tokens."""
        amount = gl.message.value
        if amount <= u256(0):
            raise UserError("Bounty reward must be greater than 0")
        if not code_url.startswith("http"):
            raise UserError("Valid code URL required")

        bounty_id = str(self.next_bounty_id)
        self.next_bounty_id += u256(1)

        self.bounties[bounty_id] = Bounty(
            owner=gl.message.sender_address,
            whitehat=Address(ZERO_ADDRESS),
            reward_amount=amount,
            code_url=code_url,
            focus_area=focus_area,
            report_url="",
            status="OPEN",
            ai_verdict="",
            ai_reason="",
            confidence=u256(0)
        )
        return bounty_id

    @gl.public.write
    def submit_report(self, bounty_id: str, report_url: str) -> None:
        """Whitehat hacker submits a vulnerability report URL."""
        if bounty_id not in self.bounties:
            raise UserError("Bounty does not exist")

        bounty = self.bounties[bounty_id]
        if bounty.status != "OPEN":
            raise UserError("Bounty is not open for submissions")
        if gl.message.sender_address == bounty.owner:
            raise UserError("Owner cannot submit report to own bounty")
        if not report_url.startswith("http"):
            raise UserError("Valid report URL required")

        bounty.whitehat = gl.message.sender_address
        bounty.report_url = report_url
        bounty.status = "EVALUATING"
        self.bounties[bounty_id] = bounty

    @gl.public.write
    def adjudicate_report(self, bounty_id: str) -> None:
        """GenVM AI evaluates the security report, then settles the escrow.

        Settlement matrix (all paths accounted for):
          PAYOUT  → 100 % to whitehat
          PARTIAL → 25 % to whitehat, 75 % refund to owner
          REJECT  → bounty reset to OPEN, full escrow retained
          ESCALATE→ funds held; resolved later via resolve_escalation
        """
        if bounty_id not in self.bounties:
            raise UserError("Bounty does not exist")

        bounty = self.bounties[bounty_id]
        if bounty.status != "EVALUATING":
            raise UserError("Bounty is not ready for adjudication")

        code_str = str(bounty.code_url)
        report_str = str(bounty.report_url)
        focus_str = str(bounty.focus_area)
        parse_json = self._parse_json
        effective_verdict = self._effective_verdict

        def _evaluate():
            """Shared evaluation logic used by both leader and validator."""
            # 1. Anti-Rugpull Guard — protect Whitehat if Owner deleted code
            try:
                code_res = gl.nondet.web.render(code_str, mode="text")
                code_text = str(code_res)
                if any(err in code_text[:400].lower() for err in ["404 not found", "error 404", "not found"]):
                    return {"verdict": "ESCALATE", "confidence": 100, "reason": "Target code URL is dead or 404. Escalate to protect Whitehat from rugpull."}
            except Exception as e:
                return {"verdict": "ESCALATE", "confidence": 100, "reason": f"Code fetch failed: {str(e)}"}

            # 2. Anti-Spam Guard — protect Owner if report link is dead
            try:
                report_res = gl.nondet.web.render(report_str, mode="text")
                report_text = str(report_res)
                if any(err in report_text[:400].lower() for err in ["404 not found", "error 404", "not found"]):
                    return {"verdict": "REJECT", "confidence": 100, "reason": "Report URL is dead or 404. Rejecting spam submission."}
            except Exception as e:
                return {"verdict": "REJECT", "confidence": 100, "reason": f"Report fetch failed: {str(e)}"}

            prompt = f"""
You are a Senior Smart Contract Auditor & Security Judge for a Web3 Bug Bounty Platform.
Your job is to read a submitted vulnerability report and verify if it is valid for the provided target code.

TARGET CODE:
{code_text[:2500]}

BOUNTY FOCUS AREA:
{focus_str}

SUBMITTED VULNERABILITY REPORT:
{report_text[:2500]}

Evaluate the report strictly:
- PAYOUT: The report clearly identifies a valid vulnerability or major flaw that exists in the TARGET CODE.
- PARTIAL: The report finds minor issues, typos, or best-practice optimizations (Informational/Low severity).
- REJECT: The report is spam, hallucinated (describes bugs not in the code), purely AI-generated nonsense, or entirely irrelevant.
- ESCALATE: The code is too complex to verify, or the report requires human technical arbitration.

Respond ONLY with a JSON object:
{{"verdict": "PAYOUT|PARTIAL|REJECT|ESCALATE", "confidence": 0-100, "reason": "Brief technical explanation"}}
"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, dict):
                return res
            return parse_json(str(res))

        def leader_fn():
            return _evaluate()

        def validator_fn(leader_res) -> bool:
            """Validator consensus: compare the *effective* verdict (after
            applying the low-confidence override) so that both nodes agree
            on the exact settlement path that will execute."""
            leader_data = leader_res
            if not isinstance(leader_data, dict):
                leader_data = parse_json(str(leader_data))

            mine_data = _evaluate()

            leader_final = effective_verdict(leader_data)
            mine_final = effective_verdict(mine_data)
            return leader_final == mine_final

        result = gl.vm.run_nondet(leader_fn, validator_fn)
        if not isinstance(result, dict):
            result = self._parse_json(str(result))

        final_verdict = self._effective_verdict(result)
        try:
            confidence = int(result.get("confidence", 0))
            if confidence < 0:
                confidence = 0
            elif confidence > 100:
                confidence = 100
        except Exception:
            confidence = 0
        reason = str(result.get("reason", "No reason provided"))
        if confidence < 65:
            reason = f"[Low Confidence {confidence}%] " + reason

        # ── Record AI result ─────────────────────────────────
        bounty.ai_verdict = final_verdict
        bounty.ai_reason = reason
        bounty.confidence = u256(confidence)

        amount = bounty.reward_amount

        # ── Settlement ───────────────────────────────────────
        if final_verdict == "PAYOUT":
            # 100 % escrow → whitehat
            bounty.status = "CLOSED"
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=amount)

        elif final_verdict == "PARTIAL":
            # 25 % → whitehat consolation, 75 % → owner refund
            bounty.status = "CLOSED"
            payout_amt = amount // u256(4)           # 25 %
            refund_amt = amount - payout_amt          # 75 %
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=payout_amt)
            gl.get_contract_at(Address(str(bounty.owner))).emit_transfer(value=refund_amt)

        elif final_verdict == "REJECT":
            # Reset bounty to OPEN so another whitehat can try; escrow stays locked
            bounty.status = "OPEN"
            bounty.whitehat = Address(ZERO_ADDRESS)
            bounty.report_url = ""

        else:
            # ESCALATE — funds held until resolve_escalation is called
            bounty.status = "ESCALATED"

        self.bounties[bounty_id] = bounty

    # ── Escalation Resolution ────────────────────────────────

    @gl.public.write
    def resolve_escalation(self, bounty_id: str, action: str) -> None:
        """Platform admin resolves an ESCALATED bounty.

        action must be one of:
          "refund"  → 100 % escrow returned to owner
          "payout"  → 100 % escrow sent to whitehat
          "partial" → 25 % whitehat / 75 % owner (same as PARTIAL verdict)
        """
        if bounty_id not in self.bounties:
            raise UserError("Bounty does not exist")

        bounty = self.bounties[bounty_id]
        if bounty.status != "ESCALATED":
            raise UserError("Bounty is not in ESCALATED status")

        caller = str(gl.message.sender_address).lower()
        if caller != self.platform_admin:
            raise UserError("Only platform admin can resolve escalated bounties")

        action = action.lower().strip()
        amount = bounty.reward_amount

        if action == "refund":
            gl.get_contract_at(Address(str(bounty.owner))).emit_transfer(value=amount)
            bounty.status = "CLOSED"
            bounty.ai_reason = bounty.ai_reason + " | Admin resolved: full refund to owner."

        elif action == "payout":
            if str(bounty.whitehat) == ZERO_ADDRESS:
                raise UserError("No whitehat assigned; cannot payout")
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=amount)
            bounty.status = "CLOSED"
            bounty.ai_reason = bounty.ai_reason + " | Admin resolved: full payout to whitehat."

        elif action == "partial":
            if str(bounty.whitehat) == ZERO_ADDRESS:
                raise UserError("No whitehat assigned; cannot partial payout")
            payout_amt = amount // u256(4)
            refund_amt = amount - payout_amt
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=payout_amt)
            gl.get_contract_at(Address(str(bounty.owner))).emit_transfer(value=refund_amt)
            bounty.status = "CLOSED"
            bounty.ai_reason = bounty.ai_reason + " | Admin resolved: 25% whitehat / 75% owner."

        else:
            raise UserError("Invalid action. Must be 'refund', 'payout', or 'partial'.")

        self.bounties[bounty_id] = bounty

    # ── View Method ──────────────────────────────────────────

    @gl.public.view
    def get_all_bounties(self) -> str:
        """API for Frontend dashboard rendering."""
        result = []
        max_id = int(str(self.next_bounty_id))
        for i in range(1, max_id):
            bid = str(i)
            if bid in self.bounties:
                b = self.bounties[bid]
                result.append({
                    "id": bid,
                    "owner": str(b.owner),
                    "whitehat": str(b.whitehat),
                    "reward_amount": str(b.reward_amount),
                    "code_url": b.code_url,
                    "focus_area": b.focus_area,
                    "report_url": b.report_url,
                    "status": b.status,
                    "ai_verdict": b.ai_verdict,
                    "ai_reason": b.ai_reason,
                    "confidence": str(b.confidence)
                })
        return json.dumps(result)
