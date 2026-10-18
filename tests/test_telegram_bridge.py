import pytest

from agenthq_live.telegram_bridge import Bridge

OWNER, TARGET, OTHER, CONN = 100, 200, 300, "conn-1"


def conn_update(update_id=1, enabled=True, can_reply=True):
    return {"update_id": update_id, "business_connection": {
        "id": CONN, "user": {"id": OWNER}, "user_chat_id": OWNER, "date": 0,
        "rights": {"can_reply": can_reply}, "is_enabled": enabled}}


def msg(update_id, from_id=TARGET, chat_id=TARGET, conn=CONN, **extra):
    return {"update_id": update_id, "business_message": {
        "message_id": update_id * 10, "business_connection_id": conn,
        "chat": {"id": chat_id}, "from": {"id": from_id}, "text": "secret words", **extra}}


class FakeApi:
    def __init__(self, enabled=True, can_reply=True):
        self.calls, self.enabled, self.can_reply = [], enabled, can_reply

    def __call__(self, method, **params):
        self.calls.append(method)
        if method == "getBusinessConnection":
            return conn_update(enabled=self.enabled, can_reply=self.can_reply)["business_connection"]
        if method == "sendMessage":
            assert params["business_connection_id"] == CONN and params["chat_id"] == TARGET
            return {"message_id": 999}
        raise AssertionError(method)


def bridge(api=None):
    b = Bridge(TARGET, api=api or FakeApi())
    b.handle(conn_update())
    return b


def test_target_reply_is_reported_with_ids_only():
    event = bridge().handle(msg(2, reply_markup={"inline_keyboard": []}))
    assert event == {"connection_id": CONN, "chat_id": TARGET, "from_id": TARGET,
                     "message_id": 20, "has_buttons": True}


def test_owner_message_ignored():
    assert bridge().handle(msg(2, from_id=OWNER)) is None


def test_our_own_send_as_owner_ignored():
    assert bridge().handle(msg(2, from_id=999, sender_business_bot={"id": 1})) is None


def test_duplicate_update_dropped():
    b = bridge()
    assert b.handle(msg(2)) is not None
    assert b.handle(msg(2)) is None


def test_unknown_chat_dropped():
    assert bridge().handle(msg(2, chat_id=OTHER, from_id=OTHER)) is None


def test_unknown_connection_dropped():
    assert bridge().handle(msg(2, conn="someone-else")) is None


def test_text_never_logged(caplog):
    caplog.set_level("INFO")
    b = bridge()
    b.handle(msg(2))
    b.handle(msg(3, from_id=OWNER))
    assert "secret words" not in caplog.text


def test_send_uses_business_connection():
    api = FakeApi()
    assert bridge(api).send("Summarize my inbox") == 999
    assert api.calls == ["getBusinessConnection", "sendMessage"]


@pytest.mark.parametrize("enabled,can_reply", [(False, True), (True, False)])
def test_disabled_connection_blocks_send(enabled, can_reply):
    api = FakeApi(enabled=enabled, can_reply=can_reply)
    with pytest.raises(PermissionError):
        bridge(api).send("x")
    assert "sendMessage" not in api.calls


def test_no_connection_blocks_send():
    with pytest.raises(PermissionError):
        Bridge(TARGET, api=FakeApi()).send("x")


def test_legacy_can_reply_field():
    b = Bridge(TARGET, api=FakeApi())
    b.handle({"update_id": 1, "business_connection": {
        "id": CONN, "user": {"id": OWNER}, "user_chat_id": OWNER, "can_reply": True, "is_enabled": True}})
    assert b.connections[CONN]["can_reply"] is True
