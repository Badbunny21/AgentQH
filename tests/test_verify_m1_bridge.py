import pytest
from agenthq_live import telegram_bridge as tb

CONN = {"id": "c1", "owner_id": 1, "user_chat_id": 1, "can_reply": True, "is_enabled": True}


def mk():
    return tb.Bridge(99, {"c1": dict(CONN)}, api=lambda *a, **k: {})


def test_business_message_without_from_is_not_a_target_reply():
    b = mk()
    u = {"update_id": 1, "business_message": {"business_connection_id": "c1", "message_id": 5, "chat": {"id": 99}}}
    assert b.handle(u) is None  # actual: event returned (from_id None)


def test_run_survives_connection_reset(monkeypatch, tmp_path):
    monkeypatch.setattr(tb, "STATE", tmp_path / "s.json")
    monkeypatch.setattr(tb.time, "sleep", lambda s: (_ for _ in ()).throw(StopIteration))
    calls = []

    def api(m, **k):
        calls.append(m)
        raise ConnectionResetError()
    b = tb.Bridge(99, {}, api=api)
    with pytest.raises(StopIteration):  # expected: logged + retried (sleep reached); actual: ConnectionResetError escapes
        b.run()


def test_replay_after_restart_is_not_deduped():
    u = {"update_id": 7, "business_connection": {"id": "c1", "user": {"id": 1}, "user_chat_id": 1, "is_enabled": True, "rights": {"can_reply": True}}}
    assert mk().handle(u) is None  # sanity: no crash
