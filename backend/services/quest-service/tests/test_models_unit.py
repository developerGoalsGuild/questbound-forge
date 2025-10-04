import pytest
from app.models import TaskInput, TaskUpdateInput, GoalCreatePayload, GoalUpdatePayload, AnswerInput


def test_task_input_valid():
    ti = TaskInput(goalId="g1", title="Task", dueAt=1700000000, tags=["x", "y"]) 
    assert ti.goalId == "g1"


def test_task_input_invalid_tags():
    with pytest.raises(Exception):
        TaskInput(goalId="g1", title="Task", dueAt=1700000000, tags=[])
    with pytest.raises(Exception):
        TaskInput(goalId="g1", title="Task", dueAt=1700000000, tags=[""])


def test_task_update_status_validator():
    tu = TaskUpdateInput(status="active")
    assert tu.status == "active"
    with pytest.raises(Exception):
        TaskUpdateInput(status="nope")


def test_goal_create_payload_valid():
    gp = GoalCreatePayload(title="Title", deadline="2025-01-01", answers=[AnswerInput(key="k", answer="a")])
    assert gp.title == "Title"


def test_goal_update_payload_fields():
    gu = GoalUpdatePayload(title="T2", description="D", category="C", deadline="2025-01-02", tags=["x"], status="active")
    assert gu.title == "T2"

