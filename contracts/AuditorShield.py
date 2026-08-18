# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json

@allow_storage
@dataclass
class Bounty:
    owner: Address
    whitehat: Address
    reward_amount: bigint
    code_url: str          # Link GitHub/Gist chứa code cần audit
    focus_area: str        # Ví dụ: "Focus on reentrancy and math overflows"
    report_url: str        # Link báo cáo lỗi của Hacker
    status: str            # OPEN, CLAIMED, EVALUATING, CLOSED, ESCALATED
    ai_verdict: str
    ai_reason: str
    confidence: bigint

class Contract(gl.Contract):
    bounties: TreeMap[str, Bounty]
    next_bounty_id: bigint
    platform_admin: str

    def __init__(self):
        # Không khởi tạo lại TreeMap ở đây (Rule #2)
        self.next_bounty_id = bigint(1)
        self.platform_admin = str(gl.message.sender_address).lower()

    def _parse_llm_json(self, text) -> dict:
        """Trình parse JSON chống lỗi markdown của LLM"""
        if isinstance(text, dict):
            return text
        if hasattr(text, '__dict__'):
            return text.__dict__
        text = str(text).strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        try:
            return json.loads(text.strip())
        except Exception as e:
            return {"verdict": "ESCALATE", "confidence": 0, "reason": f"Parse error: {str(e)}"}

    @gl.public.write.payable
    def create_bounty(self, code_url: str, focus_area: str) -> str:
        """Chủ dự án tạo Bug Bounty và khóa tiền thưởng"""
        amount = gl.message.value
        if amount <= bigint(0):
            raise UserError("Bounty reward must be greater than 0")
        if not code_url.startswith("http"):
            raise UserError("Valid code URL required")

        bounty_id = str(self.next_bounty_id)
        self.next_bounty_id += bigint(1)

        self.bounties[bounty_id] = Bounty(
            owner=gl.message.sender_address,
            whitehat=Address("0x0000000000000000000000000000000000000000"),
            reward_amount=amount,
            code_url=code_url,
            focus_area=focus_area,
            report_url="",
            status="OPEN",
            ai_verdict="",
            ai_reason="",
            confidence=bigint(0)
        )
        return bounty_id

    @gl.public.write
    def submit_report(self, bounty_id: str, report_url: str) -> None:
        """Hacker nộp báo cáo lỗi (Bất kỳ ai cũng có thể nộp)"""
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
        """AI tự động đánh giá báo cáo bảo mật và giải ngân"""
        if bounty_id not in self.bounties:
            raise UserError("Bounty does not exist")
            
        bounty = self.bounties[bounty_id]
        if bounty.status != "EVALUATING":
            raise UserError("Bounty is not ready for adjudication")

        code_str = str(bounty.code_url)
        report_str = str(bounty.report_url)
        focus_str = str(bounty.focus_area)

        def leader_fn():
            # 1. Bảo vệ chống thủ đoạn xóa code của Owner (Protect Whitehat)
            try:
                code_res = gl.nondet.web.render(code_str, mode="text")
                code_text = code_res.content if hasattr(code_res, "content") else str(code_res)
                if any(err in code_text[:400].lower() for err in ["404 not found", "error 404", "not found"]):
                    return {"verdict": "ESCALATE", "confidence": 100, "reason": "Target code URL is dead or 404. Escalate to protect Whitehat from rugpull."}
            except Exception as e:
                return {"verdict": "ESCALATE", "confidence": 100, "reason": f"Code fetch failed: {str(e)}"}

            # 2. Bảo vệ chống báo cáo rác/link ảo của Hacker (Protect Owner)
            try:
                report_res = gl.nondet.web.render(report_str, mode="text")
                report_text = report_res.content if hasattr(report_res, "content") else str(report_res)
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
            {{"verdict": "PAYOUT|PARTIAL|REJECT|ESCALATE", "confidence": 100, "reason": "Brief technical explanation"}}
            """
            
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, dict): return res
            if hasattr(res, 'calldata') and isinstance(res.calldata, dict): return res.calldata
            
            text = res.content if hasattr(res, "content") else str(res)
            return self._parse_llm_json(text)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            leader_data = leader_res.calldata if hasattr(leader_res, "calldata") else leader_res
            if not isinstance(leader_data, dict):
                leader_data = self._parse_llm_json(str(leader_data))
                
            mine_data = leader_fn()
            
            # ĐỒNG THUẬN CHUẨN MỰC: Chỉ so sánh ý nghĩa cốt lõi, phớt lờ lý do.
            return str(leader_data.get("verdict", "")).upper() == str(mine_data.get("verdict", "")).upper()

        result = gl.vm.run_nondet(leader_fn, validator_fn)
        if not isinstance(result, dict):
            result = self._parse_llm_json(str(result))

        final_verdict = str(result.get("verdict", "ESCALATE")).upper()
        try:
            confidence = int(result.get("confidence", 0))
        except Exception:
            confidence = 100
            
        reason = str(result.get("reason", "No reason provided"))

        # Ép Escalate nếu AI không chắc chắn
        if confidence < 65:
            final_verdict = "ESCALATE"
            reason = f"[Low Confidence {confidence}%] " + reason

        bounty.ai_verdict = final_verdict
        bounty.ai_reason = reason
        bounty.confidence = bigint(confidence)
        
        amount = bounty.reward_amount

        # Xử lý luồng tiền (Bắt buộc ép kiểu u256)
        if final_verdict == "PAYOUT":
            bounty.status = "CLOSED"
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=u256(amount))
        elif final_verdict == "REJECT":
            bounty.status = "OPEN" # Reset bounty lại cho người khác nộp
            bounty.whitehat = Address("0x0000000000000000000000000000000000000000")
            bounty.report_url = ""
        elif final_verdict == "PARTIAL":
            bounty.status = "CLOSED"
            payout_amt = amount // bigint(4)  # Thưởng an ủi 25% cho lỗi nhỏ
            refund_amt = amount - payout_amt
            gl.get_contract_at(Address(str(bounty.whitehat))).emit_transfer(value=u256(payout_amt))
            gl.get_contract_at(Address(str(bounty.owner))).emit_transfer(value=u256(refund_amt))
        else: # ESCALATE
            bounty.status = "ESCALATED"

        self.bounties[bounty_id] = bounty

    @gl.public.view
    def get_all_bounties(self) -> str:
        """API cho Frontend render dashboard"""
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
