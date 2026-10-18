"""AgentHQ's own bot, bridged through Telegram Chat Automation (a connected business bot).

Long-polls OUR bot only. Sends a task into the owner's allowlisted chat with a target bot via
business_connection_id. Logs IDs and states only, never message text.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

log = logging.getLogger("agenthq.bridge")
ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state.json"
# "message" carries the owner's commands in OUR bot's private chat (M2).
ALLOWED_UPDATES = ["message", "business_connection", "business_message"]


def load_env(path: Path = ROOT.parent / ".env") -> None:
    if path.exists():
        for line in path.read_text().splitlines():
            key, sep, value = line.partition("=")
            if sep and not key.strip().startswith("#"):
                os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def telegram(method: str, **params) -> dict:
    token = os.environ["AGENTHQ_BOT_TOKEN"]
    req = Request(f"https://api.telegram.org/bot{token}/{method}",
                  data=json.dumps(params).encode(), headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=params.get("timeout", 0) + 10) as res:
            body = json.load(res)
    except HTTPError as exc:
        try:
            body = json.load(exc)
        except ValueError:
            body = {"error_code": exc.code, "description": "non-JSON error body"}
    if not body.get("ok"):
        raise RuntimeError(f"{method} failed: {body.get('error_code')} {body.get('description')}")
    return body["result"]


def connection(bc: dict) -> dict:
    # Bot API 9.0+ moved can_reply into `rights`; older payloads had it at the top level.
    rights = bc.get("rights") or {}
    return {
        "id": bc["id"], "owner_id": bc["user"]["id"], "user_chat_id": bc["user_chat_id"],
        "can_reply": bool(rights.get("can_reply", bc.get("can_reply", False))),
        "is_enabled": bool(bc.get("is_enabled")),
    }


class Bridge:
    def __init__(self, target_chat_id: int, connections: dict | None = None, api=telegram):
        self.target_chat_id = target_chat_id
        self.connections: dict[str, dict] = connections or {}
        self.api = api
        # ponytail: in-memory dedup; getUpdates offsets already prevent redelivery except after a crash.
        self.seen: set[int] = set()

    def handle(self, update: dict) -> dict | None:
        """Route one update. Returns a target-bot reply event (IDs only), else None."""
        update_id = update.get("update_id")
        if update_id in self.seen:
            log.info("drop duplicate update_id=%s", update_id)
            return None
        self.seen.add(update_id)

        if bc := update.get("business_connection"):
            conn = connection(bc)
            self.connections[conn["id"]] = conn
            log.info("business_connection id=%s owner=%s can_reply=%s is_enabled=%s",
                     conn["id"], conn["owner_id"], conn["can_reply"], conn["is_enabled"])
            return None

        msg = update.get("business_message")
        if not msg:
            return None
        conn = self.connections.get(msg.get("business_connection_id"))
        chat_id = msg["chat"]["id"]
        from_id = (msg.get("from") or {}).get("id")
        ids = f"update_id={update_id} chat={chat_id} from={from_id} message_id={msg['message_id']}"
        if not conn:
            log.info("drop unknown connection %s", ids)
            return None
        if chat_id != self.target_chat_id:
            log.info("drop chat not allowlisted %s", ids)
            return None
        # The owner's own messages (and ours, sent as the owner) are never replies; nor is a sender-less one.
        if from_id is None or from_id == conn["owner_id"] or msg.get("sender_business_bot"):
            log.info("ignore owner message %s", ids)
            return None
        event = {"connection_id": conn["id"], "chat_id": chat_id, "from_id": from_id,
                 "message_id": msg["message_id"], "has_buttons": bool(msg.get("reply_markup"))}
        log.info("target reply %s has_buttons=%s", ids, event["has_buttons"])
        return event

    def send(self, text: str) -> int:
        """Send a task into the allowlisted target chat as the owner. Re-checks the connection live."""
        if not self.connections:
            raise PermissionError("No business connection yet. Connect the bot in Telegram first.")
        conn_id = next(reversed(self.connections))
        live = connection(self.api("getBusinessConnection", business_connection_id=conn_id))
        self.connections[conn_id] = live
        if not (live["is_enabled"] and live["can_reply"]):
            raise PermissionError(f"Connection {conn_id} is disabled or cannot reply; not sending.")
        sent = self.api("sendMessage", business_connection_id=conn_id,
                        chat_id=self.target_chat_id, text=text)
        log.info("sent connection=%s chat=%s message_id=%s", conn_id, self.target_chat_id, sent["message_id"])
        return sent["message_id"]

    def run(self, offset: int = 0) -> None:
        while True:
            try:
                updates = self.api("getUpdates", offset=offset, timeout=30, allowed_updates=ALLOWED_UPDATES)
            except (OSError, RuntimeError, ValueError) as exc:  # URLError, resets, timeouts, bad JSON
                log.warning("getUpdates error: %s", type(exc).__name__)
                time.sleep(3)
                continue
            for update in updates:
                self.handle(update)
                offset = update["update_id"] + 1
            save_state(offset=offset, connections=self.connections)


def save_state(**changes) -> None:
    """Merge into state.json atomically, so `send` never rewinds the poller's offset."""
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps({**state, **changes}))
    tmp.replace(STATE)


def main(argv: list[str] | None = None) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    load_env()
    args = sys.argv[1:] if argv is None else argv
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    bridge = Bridge(int(os.environ["AGENTHQ_TARGET_CHAT_ID"]), state.get("connections"))
    if args[:1] == ["send"] and len(args) == 2:
        print(f"sent message_id={bridge.send(args[1])}")
        save_state(connections=bridge.connections)
    elif args in ([], ["run"]):
        bridge.run(state.get("offset", 0))
    else:
        raise SystemExit('usage: python -m agenthq_live.bridge [run | send "<text>"]')


if __name__ == "__main__":
    main()
